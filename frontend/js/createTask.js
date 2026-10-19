const dueDateDisplay = document.getElementById('due-date-input');
const dueDatePicker = document.getElementById('due-date-picker');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescriptionInput = document.getElementById('description-input');
const assignmentToggle = document.getElementById('assignment-toggle');
const assignmentList = document.getElementById('assignment-list');
const createTaskForm = document.getElementById('create-task-form');
const submitButton = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');

let projectPromise;
let selectedAssigneeId = null;

function formatDueDate(dateValue) {
  if (!dateValue) return '';

  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function showFormMessage(message, isError = true) {
  formMessage.textContent = message;
  formMessage.classList.toggle('is-error', isError);
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
  radio.value = member.userId;
  radio.checked = member.userId === selectedAssigneeId;

  const displayName = document.createElement('span');
  displayName.textContent = member.displayName || member.studentId || `User ${member.userId}`;

  radio.addEventListener('change', () => {
    selectedAssigneeId = member.userId;
    assignmentToggle.textContent = displayName.textContent;
    assignmentToggle.setAttribute('aria-expanded', 'false');
    assignmentList.hidden = true;
  });

  label.append(radio, displayName);
  return label;
}

async function loadMembers() {
  assignmentList.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'assignment-message';
  loading.textContent = 'Loading members...';
  assignmentList.append(loading);
  assignmentList.hidden = false;

  try {
    const project = await getCourseProject();
    const members = await taskApi.getProjectMembers(project.projectId);
    assignmentList.replaceChildren();

    if (!members.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'assignment-message';
      emptyMessage.textContent = 'No members found.';
      assignmentList.append(emptyMessage);
      return;
    }

    members.forEach((member) => assignmentList.append(createMemberOption(member)));
  } catch (error) {
    assignmentList.replaceChildren();
    const errorMessage = document.createElement('p');
    errorMessage.className = 'assignment-message is-error';
    errorMessage.textContent = error.message;
    assignmentList.append(errorMessage);
  }
}

dueDateDisplay.addEventListener('click', () => {
  if (typeof dueDatePicker.showPicker === 'function') {
    dueDatePicker.showPicker();
    return;
  }

  dueDatePicker.click();
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
  const opening = assignmentList.hidden;
  assignmentToggle.setAttribute('aria-expanded', String(opening));
  assignmentList.hidden = !opening;

  if (opening) await loadMembers();
});

createTaskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showFormMessage('');

  const taskTitle = taskTitleInput.textContent.trim();
  const taskDescription = taskDescriptionInput.value.trim();
  const dueDate = dueDatePicker.value;

  if (!taskTitle || taskTitle === 'Task name') {
    showFormMessage('Enter a task name.');
    taskTitleInput.focus();
    return;
  }

  if (!dueDate) {
    showFormMessage('Choose a due date.');
    dueDateDisplay.focus();
    return;
  }

  if (!taskDescription) {
    showFormMessage('Enter a description.');
    taskDescriptionInput.focus();
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
    showFormMessage(error.message);
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
});
