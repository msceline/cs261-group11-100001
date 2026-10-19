const dueDateDisplay = document.getElementById('due-date-input');
const dueDatePicker = document.getElementById('due-date-picker');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescriptionInput = document.getElementById('description-input');
const assignmentToggle = document.getElementById('assignment-toggle');
const assignmentLabel = document.getElementById('assigned-member');
const assignmentMenu = document.getElementById('assignment-menu');
const createTaskForm = document.getElementById('create-task-form');
const submitButton = document.getElementById('submit-btn');
const submitMessage = document.getElementById('submit-message');

let projectPromise;
let membersLoaded = false;
let selectedAssigneeId = null;

function formatDueDate(dateValue) {
  if (!dateValue) return '';

  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function showSubmitMessage(message) {
  submitMessage.textContent = message;
  submitMessage.hidden = !message;
}

function getCourseProject() {
  if (!projectPromise) {
    projectPromise = taskApi.getProjects().then((projects) => {
      const project = projects.find((item) => item.subjectCode === 'CS261');
      if (!project) throw new Error('No CS261 project is available for this account.');
      return project;
    }).catch((error) => {
      projectPromise = null;
      throw error;
    });
  }
  return projectPromise;
}

function createMemberOption(member) {
  const label = document.createElement('label');
  label.className = 'assignment-option';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'assigneeId';
  radio.value = String(member.userId);

  const name = document.createElement('span');
  name.textContent = member.displayName || member.studentId || `User ${member.userId}`;

  radio.addEventListener('change', () => {
    selectedAssigneeId = member.userId;
    assignmentLabel.textContent = name.textContent;
    assignmentMenu.hidden = true;
    assignmentToggle.setAttribute('aria-expanded', 'false');
  });

  label.append(radio, name);
  return label;
}

async function loadMembers() {
  assignmentMenu.replaceChildren();
  const loadingMessage = document.createElement('p');
  loadingMessage.className = 'assignment-message';
  loadingMessage.textContent = 'Loading members...';
  assignmentMenu.append(loadingMessage);

  try {
    const project = await getCourseProject();
    const members = await taskApi.getProjectMembers(project.projectId);
    assignmentMenu.replaceChildren();

    if (members.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'assignment-message';
      emptyMessage.textContent = 'No members found.';
      assignmentMenu.append(emptyMessage);
      return;
    }

    members.forEach((member) => assignmentMenu.append(createMemberOption(member)));
    membersLoaded = true;
  } catch (error) {
    const errorMessage = document.createElement('p');
    errorMessage.className = 'assignment-message';
    errorMessage.textContent = error.message;
    assignmentMenu.replaceChildren(errorMessage);
  }
}

dueDatePicker.required = true;
taskDescriptionInput.required = true;

dueDateDisplay.addEventListener('click', () => {
  if (typeof dueDatePicker.showPicker === 'function') {
    dueDatePicker.showPicker();
  } else {
    dueDatePicker.click();
  }
});

dueDatePicker.addEventListener('change', () => {
  dueDateDisplay.value = formatDueDate(dueDatePicker.value);
});

taskTitleInput.addEventListener('focus', () => {
  if (taskTitleInput.textContent.trim() === 'Task name') {
    taskTitleInput.textContent = '';
  }
});

assignmentToggle.addEventListener('click', async () => {
  const opening = assignmentMenu.hidden;
  assignmentMenu.hidden = !opening;
  assignmentToggle.setAttribute('aria-expanded', String(opening));

  if (opening && !membersLoaded) await loadMembers();
});

createTaskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showSubmitMessage('');

  const taskTitle = taskTitleInput.textContent.trim();
  const taskDescription = taskDescriptionInput.value.trim();
  const dueDate = dueDatePicker.value;

  if (!taskTitle || taskTitle === 'Task name') {
    showSubmitMessage('Enter a task name.');
    taskTitleInput.focus();
    return;
  }

  if (!dueDate || !taskDescription) {
    createTaskForm.reportValidity();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    const project = await getCourseProject();
    await taskApi.createTask({
      projectId: project.projectId,
      taskTitle,
      taskDescription,
      assigneeId: selectedAssigneeId,
      status: 'todo',
      dueDate: `${dueDate}T23:59:00`,
    });
    window.location.assign('task.html');
  } catch (error) {
    showSubmitMessage(error.message);
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
});
