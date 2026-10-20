let taskList = null;
let taskMessage = null;
let taskRows = [];
let projectMembers = new Map();
let currentProjectId = null;

function findSelectedProject(projects, selected) {
  const byId = projects.find((project) => String(project.projectId) === String(selected.projectId));
  if (byId) return byId;
  return projects.find((project) => project.projectName === selected.groupName
    && project.subjectCode === selected.subject);
}

function formatDueDate(value) {
  if (!value) return 'No due date';

  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function getStatusLabel(status) {
  const labels = {
    todo: 'To do',
    doing: 'Doing',
    done: 'Done',
  };
  return labels[status] || status || 'To do';
}

function setTaskMessage(message, isError = false) {
  taskMessage.textContent = message;
  taskMessage.hidden = !message;
  taskMessage.classList.toggle('is-error', isError);
}

function createStatusSelect(task) {
  const select = document.createElement('select');
  select.className = 'task-status';
  select.setAttribute('aria-label', `Status for ${task.taskTitle}`);
  select.hidden = true;

  [
    ['todo', 'To do'],
    ['doing', 'Doing'],
    ['done', 'Done'],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  });

  select.value = task.status || 'todo';

  const control = document.createElement('div');
  control.className = 'task-status-control';

  const trigger = document.createElement('button');
  trigger.className = 'task-status-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-label', `Status for ${task.taskTitle}`);
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');

  const selectedLabel = document.createElement('span');
  selectedLabel.className = 'task-status-label';
  const chevron = document.createElement('span');
  chevron.className = 'task-status-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';
  trigger.append(selectedLabel, chevron);

  const menu = document.createElement('div');
  menu.className = 'task-status-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', `Status options for ${task.taskTitle}`);
  menu.hidden = true;

  const options = Array.from(select.options).map((option) => {
    const menuOption = document.createElement('button');
    menuOption.className = 'task-status-option';
    menuOption.type = 'button';
    menuOption.setAttribute('role', 'menuitemradio');
    menuOption.dataset.value = option.value;
    menuOption.textContent = option.textContent;
    menuOption.addEventListener('click', () => {
      select.value = option.value;
      closeMenu();
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    menu.append(menuOption);
    return menuOption;
  });

  function syncControl() {
    const selectedOption = select.selectedOptions[0];
    selectedLabel.textContent = selectedOption?.textContent || '';
    trigger.disabled = select.disabled;
    trigger.setAttribute('aria-label', `${task.taskTitle}: ${selectedLabel.textContent}`);
    options.forEach((option) => {
      const selected = option.dataset.value === select.value;
      option.setAttribute('aria-checked', String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
  }

  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    control.closest('.task-item')?.classList.remove('has-open-status-menu');
    document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    if (restoreFocus) trigger.focus();
  }

  function handleOutsidePointerDown(event) {
    if (!control.contains(event.target)) closeMenu();
  }

  function openMenu(focusSelected = false) {
    if (trigger.disabled) return;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    control.closest('.task-item')?.classList.add('has-open-status-menu');
    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    if (focusSelected) {
      options.find((option) => option.dataset.value === select.value)?.focus();
    }
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openMenu(true);
  });

  menu.addEventListener('keydown', (event) => {
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;

    event.preventDefault();
    options[nextIndex].focus();
  });

  select.addEventListener('click', (event) => event.stopPropagation());
  select.addEventListener('change', async () => {
    syncControl();
    const updatePromise = updateStatus(task, select);
    syncControl();
    await updatePromise;
    syncControl();
    if (trigger.isConnected) trigger.focus();
  });
  control.addEventListener('click', (event) => event.stopPropagation());

  control.append(trigger, menu, select);
  syncControl();
  return { control, select };
}

function createTaskRow(task) {
  const article = document.createElement('article');
  article.className = 'task-item';

  const row = document.createElement('div');
  row.className = 'task-row';

  const nameButton = document.createElement('button');
  nameButton.className = 'task-title-button';
  nameButton.type = 'button';
  nameButton.setAttribute('aria-expanded', 'false');

  const title = document.createElement('span');
  title.className = 'task-title-text';
  title.textContent = task.taskTitle;

  const statusControl = createStatusSelect(task);
  const deadline = document.createElement('time');
  deadline.className = 'task-deadline';
  deadline.textContent = formatDueDate(task.dueDate);
  if (task.dueDate) deadline.dateTime = task.dueDate;

  nameButton.append(title);
  row.append(nameButton, statusControl.control, deadline);

  const details = document.createElement('div');
  details.className = 'task-details';
  details.setAttribute('aria-hidden', 'true');
  details.inert = true;

  const detailsContent = document.createElement('div');
  detailsContent.className = 'task-details-content';
  const description = document.createElement('p');
  description.className = 'task-description';
  description.textContent = task.taskDescription || 'No description';

  const assignee = document.createElement('p');
  assignee.className = 'task-assignee';
  const member = projectMembers.get(task.assigneeId);
  assignee.textContent = `Assigned member: ${member ? member.displayName : task.assigneeId ? `User ${task.assigneeId}` : 'Unassigned'}`;

  detailsContent.append(description, assignee);
  details.append(detailsContent);
  article.append(row, details);

  article.addEventListener('click', (event) => {
    if (event.target.closest('.task-status-control')) return;

    const isExpanded = article.classList.toggle('is-expanded');
    details.setAttribute('aria-hidden', String(!isExpanded));
    details.inert = !isExpanded;
    nameButton.setAttribute('aria-expanded', String(isExpanded));
  });

  taskRows.push({ article, task, statusSelect: statusControl.select });
  return article;
}

function renderTasks(tasks) {
  taskList.replaceChildren();
  taskRows.length = 0;

  const visibleTasks = tasks.filter((task) => task.status !== 'done');
  if (!visibleTasks.length) {
    setTaskMessage('No tasks yet.');
    return;
  }

  setTaskMessage('');
  visibleTasks.forEach((task) => taskList.append(createTaskRow(task)));
}

// The backend recalculates the project's progress (done tasks / all tasks * 100) on every status change; show the new value.
async function showProjectProgress(listEmpty) {
  let text = listEmpty ? 'No tasks yet.' : '';
  try {
    const projects = await taskApi.getProjects();
    const project = projects.find((item) => item.projectId === currentProjectId);
    if (project) text = `ความคืบหน้าโปรเจกต์ ${project.progress}%${listEmpty ? ' · No tasks yet.' : ''}`;
  } catch {
    // the status change itself succeeded; just skip the progress line
  }
  if (taskMessage?.isConnected) setTaskMessage(text);
}

async function updateStatus(task, select) {
  const previousStatus = task.status || 'todo';
  const nextStatus = select.value;
  select.disabled = true;
  setTaskMessage('');

  try {
    const updatedTask = await taskApi.updateTaskStatus(task.taskId, nextStatus);
    task.status = updatedTask?.status || nextStatus;

    let listEmpty = false;
    if (task.status === 'done') {
      const row = taskRows.find((item) => item.task === task);
      row?.article.remove();
      listEmpty = !taskRows.some((item) => item.task.status !== 'done' && item.article.isConnected);
    } else {
      select.value = task.status;
    }

    await showProjectProgress(listEmpty);
  } catch (error) {
    select.value = previousStatus;
    setTaskMessage(error.message, true);
  } finally {
    select.disabled = false;
  }
}

async function loadTasks(selected) {
  setTaskMessage('Loading tasks...');

  try {
    const [tasks, projects] = await Promise.all([
      taskApi.getTasks(),
      taskApi.getProjects(),
    ]);
    const project = findSelectedProject(projects, selected);

    if (!project) {
      setTaskMessage('Project not found for this account.', true);
      return;
    }

    currentProjectId = project.projectId;
    document.getElementById('course-code').textContent = project.subjectCode || '';
    document.getElementById('course-name').textContent = project.projectName || '';

    const projectTasks = tasks.filter((task) => task.projectId === project.projectId);
    let memberWarning = '';
    try {
      const members = await taskApi.getProjectMembers(project.projectId);
      projectMembers = new Map(members.map((member) => [member.userId, member]));
    } catch (error) {
      memberWarning = `Could not load project members: ${error.message}`;
    }

    renderTasks(projectTasks);
    if (memberWarning) setTaskMessage(memberWarning, true);
  } catch (error) {
    setTaskMessage(error.message, true);
  }
}

document.addEventListener('task:loaded', (event) => {
  taskList = document.getElementById('task-list');
  taskMessage = document.getElementById('task-message');
  if (!taskList || !taskMessage) return;

  taskRows = [];
  projectMembers = new Map();
  loadTasks(event.detail || {});
});
