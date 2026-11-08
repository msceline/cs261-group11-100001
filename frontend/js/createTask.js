// Runs every time the create-task page is shown (its HTML is replaced on each visit).
document.addEventListener('createtask:loaded', (event) => {
  const form = document.getElementById('create-task-form');
  if (!form) return;

  const selected = event.detail || {};
  const dueDateDisplay = document.getElementById('due-date-input');
  const dueDatePicker = document.getElementById('due-date-picker');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskDescriptionInput = document.getElementById('description-input');
  const assignmentToggle = document.getElementById('assignment-toggle');
  const assignmentLabel = document.getElementById('assigned-member');
  const assignmentMenu = document.getElementById('assignment-menu');
  const submitButton = document.getElementById('submit-btn');
  const submitMessage = document.getElementById('submit-message');

  let projectPromise = null;
  let membersLoaded = false;
  let selectedAssigneeId = null;

  function formatDueDate(dateValue) {
    if (!dateValue) return '';

    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  // The Back button is handled by index.js (it reopens the task list of the selected project); clicking it does the same.
  function goBackToTasks() {
    document.getElementById('back-to-tasks')?.click();
  }

  function showSubmitMessage(message) {
    submitMessage.textContent = message;
    submitMessage.hidden = !message;
  }

  function getProject() {
    if (!projectPromise) {
      projectPromise = taskApi.getProjects().then((projects) => {
        const project = projects.find((item) => String(item.projectId) === String(selected.projectId))
          || projects.find((item) => item.subjectCode === selected.subject
            && item.projectName === selected.groupName);
        if (!project) throw new Error('Project not found for this account.');
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

  function showMenuMessage(text) {
    const message = document.createElement('p');
    message.className = 'assignment-message';
    message.textContent = text;
    assignmentMenu.replaceChildren(message);
  }

  async function loadMembers() {
    showMenuMessage('Loading members...');

    try {
      const project = await getProject();
      const members = await taskApi.getProjectMembers(project.projectId);

      if (members.length === 0) {
        showMenuMessage('No members found.');
        return;
      }

      assignmentMenu.replaceChildren(...members.map(createMemberOption));
      membersLoaded = true;
    } catch (error) {
      showMenuMessage(error.message);
    }
  }

  getProject()
    .then((project) => {
      document.getElementById('course-code').textContent = project.subjectCode || '';
      document.getElementById('course-name').textContent = project.projectName || '';
    })
    .catch((error) => showSubmitMessage(error.message));

  dueDatePicker.required = true;

  // The due date starts as today (local date, yyyy-MM-dd).
  const now = new Date();
  dueDatePicker.value = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  dueDateDisplay.value = formatDueDate(dueDatePicker.value);
  taskDescriptionInput.required = true;

  // The whole bordered box opens the calendar, not just the text.
  dueDateDisplay.closest('.date-picker').addEventListener('click', (clickEvent) => {
    if (clickEvent.target === dueDatePicker) return; // the fallback below clicks it, which would bubble back here
    if (typeof dueDatePicker.showPicker === 'function') {
      dueDatePicker.showPicker();
    } else {
      dueDatePicker.click();
    }
  });

  dueDatePicker.addEventListener('change', () => {
    dueDateDisplay.value = formatDueDate(dueDatePicker.value);
  });

  assignmentToggle.addEventListener('click', async () => {
    const opening = assignmentMenu.hidden;
    assignmentMenu.hidden = !opening;
    assignmentToggle.setAttribute('aria-expanded', String(opening));

    if (opening && !membersLoaded) await loadMembers();
  });

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    showSubmitMessage('');

    const taskTitle = taskTitleInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();
    const dueDate = dueDatePicker.value;

    if (!taskTitle) {
      showSubmitMessage('Enter a task name.');
      taskTitleInput.focus();
      return;
    }

    if (!dueDate || !taskDescription) {
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      const project = await getProject();
      await taskApi.createTask({
        projectId: project.projectId,
        taskTitle,
        taskDescription,
        assigneeId: selectedAssigneeId,
        status: 'todo',
        dueDate: `${dueDate}T23:59:00`,
      });

      goBackToTasks();
    } catch (error) {
      showSubmitMessage(error.message);
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  });
});
