let taskList = null;
let taskMessage = null;
let taskRows = [];
let projectMembers = new Map();
let currentProjectId = null;
let currentProjectHostId = null;
let selectedTaskStatuses = new Set(['todo', 'doing', 'done']);
let taskStatusFilterCleanup = null;
const sampleTasks = [
  {
    taskId: 'sample-task-1',
    taskTitle: 'สรุปความต้องการของโครงงาน',
    taskDescription: 'รวบรวม requirement จากสมาชิกและจัดทำรายการฟังก์ชันหลัก',
    dueDate: '2026-11-18',
    status: 'todo',
    assigneeId: 1,
  },
  {
    taskId: 'sample-task-2',
    taskTitle: 'ออกแบบหน้า Dashboard',
    taskDescription: 'จัดวางข้อมูลความคืบหน้า รายการงาน และกำหนดส่งให้เหมาะกับหน้าจอมือถือ',
    dueDate: '2026-11-20',
    status: 'doing',
    assigneeId: 2,
  },
  {
    taskId: 'sample-task-3',
    taskTitle: 'ตั้งค่าโครงสร้างฐานข้อมูล',
    taskDescription: 'สร้างตารางและตรวจสอบความสัมพันธ์ระหว่างโปรเจกต์ สมาชิก และงาน',
    dueDate: '2026-11-12',
    status: 'done',
    assigneeId: 1,
  },
];
const sampleTaskMembers = [
  { userId: 1, displayName: 'สมาชิกตัวอย่าง 1' },
  { userId: 2, displayName: 'สมาชิกตัวอย่าง 2' },
];

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
    doing: 'In progress',
    done: 'Done',
  };
  return labels[status] || status || 'To do';
}

function getCurrentTaskUserId() {
  try {
    const storedUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const user = JSON.parse(storedUser || 'null');
    const userId = Number(user?.userId);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch (error) {
    console.error('Could not read the signed-in user:', error);
    return null;
  }
}

function getTaskDueDateTimestamp(task) {
  if (!task.dueDate) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(task.dueDate);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function sortTasks(tasks, currentUserId = getCurrentTaskUserId()) {
  return [...tasks].sort((first, second) => {
    const firstIsMine = currentUserId !== null
      && String(first.assigneeId) === String(currentUserId);
    const secondIsMine = currentUserId !== null
      && String(second.assigneeId) === String(currentUserId);

    if (firstIsMine !== secondIsMine) return firstIsMine ? -1 : 1;

    const firstDueDate = getTaskDueDateTimestamp(first);
    const secondDueDate = getTaskDueDateTimestamp(second);
    if (firstDueDate === secondDueDate) return 0;
    return firstDueDate < secondDueDate ? -1 : 1;
  });
}

function hasTaskAuthToken() {
  try {
    return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function isCurrentUserProjectHost(userId) {
  if (userId === null) return false;

  const member = Array.from(projectMembers.values()).find(
    (projectMember) => String(projectMember.userId) === String(userId),
  );
  if (member?.roleInProject) {
    return String(member.roleInProject).toLowerCase() === 'host';
  }

  return currentProjectHostId !== null
    && String(currentProjectHostId) === String(userId);
}

function setTaskMessage(message, isError = false) {
  taskMessage.textContent = message;
  taskMessage.hidden = !message;
  taskMessage.classList.toggle('is-error', isError);
}

function normalizeTaskFilterStatus(status) {
  const value = String(status || 'todo').toLowerCase().replaceAll(' ', '_');
  if (value === 'doing' || value === 'in_progress' || value === 'inprogress') return 'doing';
  if (value === 'completed') return 'done';
  return value;
}

function applyTaskStatusFilter() {
  if (!taskList) return;

  let visibleCount = 0;
  taskRows.forEach(({ article, task }) => {
    const isVisible = selectedTaskStatuses.has(normalizeTaskFilterStatus(task.status));
    article.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  let emptyMessage = taskList.querySelector('.task-filter-empty');
  if (taskRows.length && !visibleCount) {
    if (!emptyMessage) {
      emptyMessage = document.createElement('p');
      emptyMessage.className = 'task-filter-empty';
      emptyMessage.textContent = 'No tasks match the selected statuses.';
      taskList.append(emptyMessage);
    }
  } else {
    emptyMessage?.remove();
  }
}

function initializeTaskStatusFilter() {
  const container = document.querySelector('.tasks-page .checkboxDropdownFilter');
  if (!container) return;

  taskStatusFilterCleanup?.();
  taskStatusFilterCleanup = null;
  selectedTaskStatuses = new Set(['todo', 'doing', 'done']);
  container.replaceChildren();

  const trigger = document.createElement('button');
  trigger.className = 'task-status-filter__trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'task-status-filter-menu');

  const triggerLabel = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'task-status-filter__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';
  trigger.append(triggerLabel, chevron);

  const menu = document.createElement('div');
  menu.className = 'task-status-filter__menu';
  menu.id = 'task-status-filter-menu';
  menu.setAttribute('role', 'group');
  menu.setAttribute('aria-label', 'Filter tasks by status');
  menu.hidden = true;

  const options = [
    ['todo', 'To Do'],
    ['doing', 'In progress'],
    ['done', 'Done'],
  ].map(([value, label]) => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'task-status-filter__option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = value;
    checkbox.checked = true;

    const optionText = document.createElement('span');
    optionText.textContent = label;
    optionLabel.append(checkbox, optionText);
    menu.append(optionLabel);
    return { checkbox, value };
  });

  function syncTrigger() {
    const count = selectedTaskStatuses.size;
    triggerLabel.textContent = count === options.length ? 'Status' : `Status (${count})`;
    trigger.setAttribute('aria-label', `Filter tasks by status, ${count} selected`);
  }

  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', handleOutsideClick);
    if (restoreFocus) trigger.focus();
  }

  function handleOutsideClick(event) {
    if (!container.contains(event.target)) closeMenu();
  }

  trigger.addEventListener('click', () => {
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    trigger.setAttribute('aria-expanded', String(!isOpen));
    if (isOpen) document.removeEventListener('click', handleOutsideClick);
    else document.addEventListener('click', handleOutsideClick);
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menu.hidden) return;
    event.preventDefault();
    closeMenu(true);
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeMenu(true);
  });

  options.forEach(({ checkbox }) => {
    checkbox.addEventListener('change', () => {
      selectedTaskStatuses = new Set(
        options.filter((option) => option.checkbox.checked).map((option) => option.value),
      );
      syncTrigger();
      applyTaskStatusFilter();
    });
  });

  container.append(trigger, menu);
  syncTrigger();
  taskStatusFilterCleanup = () => closeMenu();
}

function createStatusSelect(task) {
  const select = document.createElement('select');
  select.className = 'task-status';
  select.setAttribute('aria-label', `Status for ${task.taskTitle}`);
  select.hidden = true;

  [
    ['todo', 'To Do'],
    ['doing', 'In progress'],
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
    trigger.dataset.status = select.value;
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

function createReadonlyTaskStatus(task) {
  const control = document.createElement('div');
  control.className = 'task-status-control';

  const status = document.createElement('span');
  const normalizedStatus = normalizeTaskFilterStatus(task.status);
  status.className = 'task-status-readonly';
  status.dataset.status = normalizedStatus;
  status.textContent = getStatusLabel(normalizedStatus);
  status.setAttribute('role', 'status');

  control.append(status);
  return control;
}

function createTaskRow(task, currentUserId) {
  const article = document.createElement('article');
  article.className = 'task-item';
  const isProjectHost = isCurrentUserProjectHost(currentUserId);
  const isAssignedToCurrentUser = currentUserId !== null
    && task.assigneeId != null
    && String(task.assigneeId) === String(currentUserId);
  const canUpdateStatus = isProjectHost || isAssignedToCurrentUser;
  const canManageTask = isProjectHost;
  if (isAssignedToCurrentUser) {
    article.classList.add('task-item--assigned-to-me');
  }

  const row = document.createElement('div');
  row.className = 'task-row';

  const nameButton = document.createElement('button');
  nameButton.className = 'task-title-button';
  nameButton.type = 'button';
  nameButton.setAttribute('aria-expanded', 'false');

  const title = document.createElement('span');
  title.className = 'task-title-text';
  title.textContent = task.taskTitle;

  const statusControl = canUpdateStatus
    ? createStatusSelect(task).control
    : createReadonlyTaskStatus(task);
  const deadline = document.createElement('time');
  deadline.className = 'task-deadline';
  deadline.textContent = formatDueDate(task.dueDate);
  if (task.dueDate) deadline.dateTime = task.dueDate;

  nameButton.append(title);
  row.append(nameButton, statusControl, deadline);

  const more = document.createElement('div');
  more.className = 'task-item-more';
  more.hidden = !canManageTask;
  const moreLabel = document.createElement('span');
  moreLabel.className = 'task-item-more__label';
  moreLabel.textContent = 'more';

  const actions = document.createElement('div');
  actions.className = 'task-item-actions';
  const editButton = createTaskActionButton(
    'edit',
    'Edit task',
    'M16.862 4.487l1.651 1.65a2.1 2.1 0 0 1 0 2.97L8.25 19.37 4 20l.63-4.25L15.21 5.138a1.17 1.17 0 0 1 1.652-.651Z M14.5 6.5l3 3',
  );
  editButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const assignedMember = Array.from(projectMembers.values()).find(
      (member) => String(member.userId) === String(task.assigneeId),
    );
    document.dispatchEvent(new CustomEvent('task:edit', {
      detail: { ...task, assigneeName: assignedMember?.displayName || '' },
    }));
  });

  const deleteButton = createTaskActionButton(
    'delete',
    'Delete task',
    'M4 7h16 M10 11v6 M14 11v6 M5 7l1 14h12l1-14 M9 7V4h6v3',
  );
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    deleteTask(task, article, deleteButton);
  });
  actions.append(editButton, deleteButton);
  more.append(moreLabel, actions);

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
  const assigneeLabel = document.createElement('span');
  assigneeLabel.className = 'task-assignee-label';
  assigneeLabel.textContent = 'Assign Member';
  const assigneeName = document.createElement('span');
  assigneeName.className = 'task-assignee-name';
  assigneeName.textContent = member ? member.displayName : task.assigneeId ? `User ${task.assigneeId}` : 'Unassigned';
  assignee.append(assigneeLabel, assigneeName);

  detailsContent.append(description, assignee);
  details.append(detailsContent);
  article.append(row, more, details);

  article.addEventListener('click', (event) => {
    if (event.target.closest('.task-status-control, .task-item-actions')) return;

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

  if (!tasks.length) {
    setTaskMessage('No tasks yet.');
    return;
  }

  setTaskMessage('');
  const currentUserId = getCurrentTaskUserId();
  sortTasks(tasks, currentUserId).forEach((task) => taskList.append(createTaskRow(task, currentUserId)));
  applyTaskStatusFilter();
}

function createTaskActionButton(action, label, pathData) {
  const button = document.createElement('button');
  button.className = `task-action-button task-action-button--${action}`;
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.title = label;

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '1.8');
  icon.append(path);
  button.append(icon);
  return button;
}

async function deleteTask(task, article, button) {
  if (!window.confirm(`Delete "${task.taskTitle}"?`)) return;

  button.disabled = true;
  try {
    if (hasTaskAuthToken()) {
      await taskApi.deleteTask(task.taskId);
    } else {
      const sampleIndex = sampleTasks.findIndex((sampleTask) => sampleTask.taskId === task.taskId);
      if (sampleIndex >= 0) sampleTasks.splice(sampleIndex, 1);
    }

    taskRows = taskRows.filter((row) => row.article !== article);
    article.remove();
    applyTaskStatusFilter();

    if (hasTaskAuthToken()) await showProjectProgress();
    if (!taskRows.length) setTaskMessage('No tasks yet.');
  } catch (error) {
    setTaskMessage(error.message, true);
    button.disabled = false;
  }
}

// The backend recalculates the project's progress (done tasks / all tasks * 100) on every status change; show the new value.
async function showProjectProgress() {
  try {
    const projects = await taskApi.getProjects();
    document.dispatchEvent(new CustomEvent('projects:updated', { detail: projects }));
    const project = projects.find((item) => item.projectId === currentProjectId);
    if (project && taskMessage?.isConnected) {
      setTaskMessage(`ความคืบหน้าโปรเจกต์ ${project.progress}%`);
    }
  } catch (error) {
    console.error('Task status was saved, but project progress could not be refreshed:', error);
    if (taskMessage?.isConnected) {
      setTaskMessage(`บันทึกสถานะแล้ว แต่โหลดความคืบหน้าไม่สำเร็จ: ${error.message}`, true);
    }
  }
}

async function updateStatus(task, select) {
  const previousStatus = task.status || 'todo';
  const nextStatus = select.value;
  select.disabled = true;
  setTaskMessage('');

  if (!hasTaskAuthToken()) {
    task.status = nextStatus;
    select.disabled = false;
    applyTaskStatusFilter();
    return;
  }

  try {
    const updatedTask = await taskApi.updateTaskStatus(task.taskId, nextStatus);
    task.status = updatedTask?.status || nextStatus;

    select.value = task.status;
    applyTaskStatusFilter();
    await showProjectProgress();
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
    currentProjectHostId = project.hostId == null ? null : Number(project.hostId);
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

    const addTaskButton = document.getElementById('createTaskIcon');
    if (addTaskButton) {
      addTaskButton.hidden = !isCurrentUserProjectHost(getCurrentTaskUserId());
    }

    renderTasks(projectTasks);
    if (memberWarning) setTaskMessage(memberWarning, true);
  } catch (error) {
    setTaskMessage(error.message, true);
  }
}

document.addEventListener('createtask:preview-saved', (event) => {
  const updatedTask = event.detail;
  if (!updatedTask?.taskId) return;
  const existingIndex = sampleTasks.findIndex((task) => task.taskId === updatedTask.taskId);
  if (existingIndex < 0) sampleTasks.push(updatedTask);
  else sampleTasks[existingIndex] = updatedTask;
});

document.addEventListener('task:loaded', (event) => {
  taskList = document.getElementById('task-list');
  taskMessage = document.getElementById('task-message');
  if (!taskList || !taskMessage) return;

  taskRows = [];
  projectMembers = new Map();
  initializeTaskStatusFilter();

  const selected = event.detail || {};
  if (!hasTaskAuthToken()) {
    currentProjectId = selected.projectId || null;
    currentProjectHostId = null;
    const addTaskButton = document.getElementById('createTaskIcon');
    if (addTaskButton) addTaskButton.hidden = true;
    document.getElementById('course-code').textContent = selected.subjectCode || selected.subject || '';
    document.getElementById('course-name').textContent = selected.projectName || selected.groupName || '';
    projectMembers = new Map(sampleTaskMembers.map((member) => [member.userId, member]));
    renderTasks(sampleTasks);
    return;
  }

  const addTaskButton = document.getElementById('createTaskIcon');
  if (addTaskButton) addTaskButton.hidden = true;
  loadTasks(selected);
});
