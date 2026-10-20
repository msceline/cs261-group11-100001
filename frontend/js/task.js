let taskList = null;
let taskMessage = null;
let taskRows = [];
let projectMembers = new Map();

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
  select.addEventListener('click', (event) => event.stopPropagation());
  select.addEventListener('change', () => updateStatus(task, select));
  return select;
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

  const statusSelect = createStatusSelect(task);
  const deadline = document.createElement('time');
  deadline.className = 'task-deadline';
  deadline.textContent = formatDueDate(task.dueDate);
  if (task.dueDate) deadline.dateTime = task.dueDate;

  nameButton.append(title);
  row.append(nameButton, statusSelect, deadline);

  const details = document.createElement('div');
  details.className = 'task-details';
  details.hidden = true;

  const description = document.createElement('p');
  description.className = 'task-description';
  description.textContent = task.taskDescription || 'No description';

  const assignee = document.createElement('p');
  assignee.className = 'task-assignee';
  const member = projectMembers.get(task.assigneeId);
  assignee.textContent = `Assigned member: ${member ? member.displayName : task.assigneeId ? `User ${task.assigneeId}` : 'Unassigned'}`;

  details.append(description, assignee);
  article.append(row, details);

  nameButton.addEventListener('click', () => {
    const isExpanded = !details.hidden;
    details.hidden = isExpanded;
    nameButton.setAttribute('aria-expanded', String(!isExpanded));
    article.classList.toggle('is-expanded', !isExpanded);
  });

  taskRows.push({ article, task, statusSelect });
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

async function updateStatus(task, select) {
  const previousStatus = task.status || 'todo';
  const nextStatus = select.value;
  select.disabled = true;
  setTaskMessage('');

  try {
    const updatedTask = await taskApi.updateTaskStatus(task.taskId, nextStatus);
    task.status = updatedTask?.status || nextStatus;

    if (task.status === 'done') {
      const row = taskRows.find((item) => item.task === task);
      row?.article.remove();
      if (!taskRows.some((item) => item.task.status !== 'done' && item.article.isConnected)) {
        setTaskMessage('No tasks yet.');
      }
      return;
    }

    select.value = task.status;
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
