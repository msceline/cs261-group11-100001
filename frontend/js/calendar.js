function calendarDateKey(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function calendarStatusLabel(status) {
  const labels = {
    todo: 'To do',
    doing: 'In progress',
    done: 'Done',
  };
  return labels[status] || status || 'To do';
}

function calendarHttpUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const hasHttpScheme = /^https?:\/\//i.test(text);
  const isBareDomain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i
    .test(text);
  if (!hasHttpScheme && !isBareDomain) return '';

  const candidate = hasHttpScheme ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function calendarSignedInUser() {
  try {
    const storedUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return JSON.parse(storedUser || 'null');
  } catch (error) {
    console.error('Could not read the signed-in user for calendar permissions:', error);
    return null;
  }
}

function calendarPopupDateLabel(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function calendarPopupDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Date and time not set';
  return `${calendarPopupDateLabel(date)} ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function renderCalendarDays(container, year, month, tasks, meetings, projectDueDate, projectName, message, onDaySelect) {
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;
  const tasksByDate = new Map();

  tasks.forEach((task) => {
    const key = calendarDateKey(task.dueDate);
    if (!key) return;
    const dayTasks = tasksByDate.get(key) || [];
    dayTasks.push(task);
    tasksByDate.set(key, dayTasks);
  });

  const meetingsByDate = new Map();
  meetings.forEach((meeting) => {
    const key = calendarDateKey(meeting.dateTime);
    if (!key) return;
    const dayMeetings = meetingsByDate.get(key) || [];
    dayMeetings.push(meeting);
    meetingsByDate.set(key, dayMeetings);
  });

  const today = new Date();
  const todayKey = calendarDateKey([
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-'));
  const projectDueDateKey = calendarDateKey(projectDueDate);

  const days = [];
  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const key = calendarDateKey([
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-'));
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }));
    cell.tabIndex = 0;
    cell.setAttribute('aria-haspopup', 'dialog');

    if (date.getMonth() !== month) cell.classList.add('is-outside-month');
    if (key === todayKey) cell.classList.add('is-today');
    if (key === projectDueDateKey) cell.classList.add('has-project-due-date');

    const number = document.createElement('span');
    number.className = 'calendar-day-number';
    number.textContent = String(date.getDate());
    if (key === projectDueDateKey) {
      number.classList.add('is-project-due-date');
      number.title = 'Project due date';
    }

    const dayTasks = tasksByDate.get(key) || [];
    const dayMeetings = meetingsByDate.get(key) || [];
    cell.addEventListener('click', (clickEvent) => {
      if (clickEvent.target.closest('a, button, select, input, textarea')) return;
      onDaySelect(date, dayTasks, dayMeetings);
    });
    cell.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.target !== cell) return;
      if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return;
      keyEvent.preventDefault();
      onDaySelect(date, dayTasks, dayMeetings);
    });
    const eventSummary = document.createElement('div');
    eventSummary.className = 'calendar-day-summary';
    if (key === projectDueDateKey) {
      const dueDateItem = document.createElement('div');
      dueDateItem.className = 'calendar-project-due-item';
      const dueProjectName = document.createElement('span');
      dueProjectName.className = 'calendar-project-due-name';
      dueProjectName.textContent = projectName || 'Project';
      const dueDateLabel = document.createElement('span');
      dueDateLabel.className = 'calendar-project-due-label';
      dueDateLabel.textContent = 'Due date';
      dueDateItem.append(dueProjectName, dueDateLabel);
      eventSummary.append(dueDateItem);
    }

    if (dayTasks.length || dayMeetings.length) {
      if (dayTasks.length) {
        const taskCount = document.createElement('p');
        taskCount.className = 'calendar-task-count';
        taskCount.textContent = `${dayTasks.length} Task${dayTasks.length === 1 ? '' : 's'}`;
        eventSummary.append(taskCount);
      }
      if (dayMeetings.length) {
        const meetingCount = document.createElement('p');
        meetingCount.className = 'calendar-meeting-count';
        meetingCount.textContent = `${dayMeetings.length} Meeting${dayMeetings.length === 1 ? '' : 's'}`;
        eventSummary.append(meetingCount);
      }

      const eventNames = document.createElement('div');
      eventNames.className = 'calendar-task-names';
      const entries = [
        ...dayTasks.map((task) => ({
          type: 'task',
          title: task.taskTitle || 'Untitled task',
          description: calendarStatusLabel(task.status),
        })),
        ...dayMeetings.map((meeting) => ({
          type: 'meeting',
          title: meeting.topic || 'Untitled meeting',
        })),
      ];

      entries.slice(0, 2).forEach((entry) => {
        const item = document.createElement('div');
        item.className = `calendar-event-item is-${entry.type}`;

        const title = document.createElement('span');
        title.className = 'calendar-task-name';
        title.textContent = entry.title;
        if (entry.description) title.title = `${entry.title} · ${entry.description}`;
        item.append(title);
        eventNames.append(item);
      });

      if (entries.length > 2) {
        const more = document.createElement('span');
        more.className = 'calendar-task-more';
        more.textContent = '…';
        eventNames.append(more);
      }
      eventSummary.append(eventNames);
    }

    cell.append(number, eventSummary);
    days.push(cell);
  }

  container.replaceChildren(...days);
  const hasEvents = tasksByDate.size > 0 || meetingsByDate.size > 0;
  message.hidden = hasEvents;
  message.textContent = hasEvents
    ? ''
    : 'No tasks or meetings to show for this project.';
}

document.addEventListener('calendar:loaded', async (event) => {
  const calendar = document.querySelector('.calendar-page');
  if (!calendar) return;

  const daysContainer = calendar.querySelector('#calendar-days');
  const monthLabel = calendar.querySelector('#calendar-month-label');
  const message = calendar.querySelector('#calendar-message');
  const detailBackdrop = calendar.querySelector('#calendar-detail-backdrop');
  const detailDate = calendar.querySelector('#calendar-detail-date');
  const detailClose = calendar.querySelector('#calendar-detail-close');
  const detailList = calendar.querySelector('#calendar-detail-list');
  const detailMessage = calendar.querySelector('#calendar-detail-message');
  const createMeetingButton = calendar.querySelector('.calendar-create-meeting');
  const project = event.detail || {};
  const currentDate = new Date();
  const savedCalendarYear = Number(project.calendarYear);
  const savedCalendarMonth = Number(project.calendarMonth);
  let visibleYear = Number.isInteger(savedCalendarYear) ? savedCalendarYear : currentDate.getFullYear();
  let visibleMonth = Number.isInteger(savedCalendarMonth) && savedCalendarMonth >= 0 && savedCalendarMonth <= 11
    ? savedCalendarMonth
    : currentDate.getMonth();
  let calendarProject = project;
  let projectDueDate = null;
  let tasks = [];
  let meetings = [];
  let memberNames = new Map();
  let memberWarning = '';
  let previousFocus = null;
  const currentUser = calendarSignedInUser();
  const currentUserId = Number(currentUser?.userId);

  createMeetingButton.hidden = true;
  calendar.querySelector('#calendar-course-code').textContent = project.subjectCode || project.subject || '';
  calendar.querySelector('#calendar-course-name').textContent = project.projectName || project.groupName || '';

  function updateCreateMeetingVisibility() {
    const hostId = Number(calendarProject.hostId);
    createMeetingButton.hidden = !Number.isInteger(currentUserId)
      || currentUserId <= 0
      || !Number.isInteger(hostId)
      || hostId <= 0
      || hostId !== currentUserId;
  }

  updateCreateMeetingVisibility();

  function showDetailMessage(text, isError = false) {
    detailMessage.textContent = text;
    detailMessage.hidden = !text;
    detailMessage.classList.toggle('is-error', isError);
  }

  function closeDetails() {
    detailBackdrop.hidden = true;
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function createDetailText(className, text) {
    if (!text) return null;
    const element = document.createElement('p');
    element.className = className;
    element.textContent = text;
    return element;
  }

  function createMeetingCard(meeting, date) {
    const card = document.createElement('article');
    card.className = 'calendar-detail-card is-meeting';

    const header = document.createElement('div');
    header.className = 'calendar-detail-card-header';
    const title = document.createElement('h3');
    title.textContent = meeting.topic || 'Untitled meeting';
    const kind = document.createElement('span');
    kind.className = 'calendar-detail-kind';
    kind.textContent = 'Meeting';
    header.append(title, kind);
    card.append(header);

    const hostId = String(calendarProject.hostId || '');
    const hostMember = memberNames.get(hostId);
    const hostName = hostMember?.displayName
      || (Number(hostId) === currentUserId ? currentUser?.displayName : '')
      || 'Project host';
    const assigned = createDetailText('calendar-detail-assignee', `Assigned ${hostName}`);
    if (assigned) card.append(assigned);

    const description = createDetailText('calendar-detail-description', meeting.description);
    if (description) card.append(description);

    const meta = document.createElement('div');
    meta.className = 'calendar-meeting-meta';
    const dateTime = document.createElement('time');
    dateTime.dateTime = meeting.dateTime || '';
    dateTime.textContent = calendarPopupDateTime(meeting.dateTime);
    meta.append(dateTime);
    if (meeting.location) {
      const href = calendarHttpUrl(meeting.location);
      const location = document.createElement(href ? 'a' : 'span');
      location.className = 'calendar-meeting-location';
      location.textContent = meeting.location;
      if (href) {
        location.href = href;
        location.target = '_blank';
        location.rel = 'noopener noreferrer';
      }
      meta.append(location);
    }
    card.append(meta);

    const isHost = Number.isInteger(currentUserId)
      && currentUserId > 0
      && Number(hostId) === currentUserId;
    if (isHost) {
      const actions = document.createElement('div');
      actions.className = 'calendar-detail-actions';

      const editButton = document.createElement('button');
      editButton.className = 'calendar-detail-action is-edit';
      editButton.type = 'button';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        detailBackdrop.hidden = true;
        document.dispatchEvent(new CustomEvent('calendar:edit-meeting', {
          detail: {
            project: calendarProject,
            meeting,
            calendarYear: visibleYear,
            calendarMonth: visibleMonth,
          },
        }));
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'calendar-detail-action is-delete';
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', async () => {
        if (!window.confirm(`Delete "${meeting.topic || 'this meeting'}"?`)) return;
        deleteButton.disabled = true;
        editButton.disabled = true;
        showDetailMessage('');
        try {
          await window.meetingApi.deleteMeeting(calendarProject.projectId, meeting.meetingId);
          meetings = meetings.filter((item) => item.meetingId !== meeting.meetingId);
          render();
          const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
          ].join('-');
          openDayDetails(
            date,
            tasks.filter((task) => calendarDateKey(task.dueDate) === dateKey),
            meetings.filter((item) => calendarDateKey(item.dateTime) === dateKey),
          );
        } catch (error) {
          showDetailMessage(error.message || 'Could not delete meeting.', true);
          deleteButton.disabled = false;
          editButton.disabled = false;
        }
      });

      actions.append(editButton, deleteButton);
      card.append(actions);
    }
    return card;
  }

  function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'calendar-detail-card is-task';

    const header = document.createElement('div');
    header.className = 'calendar-detail-card-header';
    const title = document.createElement('h3');
    title.textContent = task.taskTitle || 'Untitled task';

    const statusControl = document.createElement('div');
    statusControl.className = 'calendar-task-status-control';
    const status = document.createElement('select');
    status.className = 'calendar-task-status';
    status.setAttribute('aria-label', `Status for ${task.taskTitle || 'task'}`);
    [
      ['todo', 'To do'],
      ['doing', 'In progress'],
      ['done', 'Done'],
    ].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      status.append(option);
    });
    status.value = task.status || 'todo';
    const updateStatusStyle = (value) => {
      statusControl.classList.remove('is-todo', 'is-doing', 'is-done');
      statusControl.classList.add(`is-${value}`);
    };
    updateStatusStyle(status.value);
    const isAssignee = Number(task.assigneeId) === currentUserId;
    const isTaskHost = Number(calendarProject.hostId) === currentUserId;
    const canUpdateStatus = Number.isInteger(currentUserId)
      && currentUserId > 0
      && (isAssignee || isTaskHost);
    status.disabled = !canUpdateStatus;
    const chevron = document.createElement('span');
    chevron.className = 'calendar-task-status-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    statusControl.append(status, chevron);
    header.append(title, statusControl);
    card.append(header);

    const assignee = task.assigneeId == null
      ? 'Unassigned'
      : memberNames.get(String(task.assigneeId))?.displayName || `User ${task.assigneeId}`;
    const assigned = createDetailText('calendar-detail-assignee', `Assigned ${assignee}`);
    if (assigned) card.append(assigned);
    const description = createDetailText('calendar-detail-description', task.taskDescription);
    if (description) card.append(description);

    status.addEventListener('change', async () => {
      const previousStatus = task.status || 'todo';
      const nextStatus = status.value;
      updateStatusStyle(nextStatus);
      status.disabled = true;
      showDetailMessage('');
      try {
        const updatedTask = await window.taskApi.updateTaskStatus(task.taskId, nextStatus);
        task.status = updatedTask?.status || nextStatus;
        status.value = task.status;
        updateStatusStyle(status.value);
        showDetailMessage(memberWarning);
      } catch (error) {
        task.status = previousStatus;
        status.value = previousStatus;
        updateStatusStyle(previousStatus);
        showDetailMessage(error.message || 'Could not update task status.', true);
      } finally {
        status.disabled = !canUpdateStatus;
      }
    });
    return card;
  }

  function openDayDetails(date, dayTasks, dayMeetings) {
    previousFocus = document.activeElement;
    detailDate.textContent = calendarPopupDateLabel(date);
    detailList.replaceChildren();
    showDetailMessage(memberWarning);

    dayMeetings.forEach((meeting) => detailList.append(createMeetingCard(meeting, date)));
    dayTasks.forEach((task) => detailList.append(createTaskCard(task)));
    if (!dayMeetings.length && !dayTasks.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-detail-empty';
      empty.textContent = 'No tasks or meetings for this day.';
      detailList.append(empty);
    }

    detailBackdrop.hidden = false;
    detailClose.focus();
  }

  detailClose.addEventListener('click', closeDetails);
  detailBackdrop.addEventListener('click', (clickEvent) => {
    if (clickEvent.target === detailBackdrop) closeDetails();
  });
  detailBackdrop.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key === 'Escape') closeDetails();
  });

  function render() {
    monthLabel.textContent = new Date(visibleYear, visibleMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    renderCalendarDays(
      daysContainer,
      visibleYear,
      visibleMonth,
      tasks,
      meetings,
      projectDueDate,
      calendarProject.projectName || calendarProject.groupName || '',
      message,
      openDayDetails,
    );
  }

  calendar.querySelector('#calendar-previous-month').addEventListener('click', () => {
    visibleMonth -= 1;
    if (visibleMonth < 0) {
      visibleMonth = 11;
      visibleYear -= 1;
    }
    render();
  });

  calendar.querySelector('#calendar-next-month').addEventListener('click', () => {
    visibleMonth += 1;
    if (visibleMonth > 11) {
      visibleMonth = 0;
      visibleYear += 1;
    }
    render();
  });

  render();
  message.hidden = false;
  message.textContent = 'Loading calendar events...';

  try {
    const [allTasks, projectMeetings, projects] = await Promise.all([
      window.taskApi.getTasks(),
      window.meetingApi.getMeetings(project.projectId),
      window.taskApi.getProjects(),
    ]);
    const savedProject = projects.find((item) => String(item.projectId) === String(project.projectId));
    if (!savedProject) throw new Error('Project not found for this account.');

    calendarProject = { ...project, ...savedProject };
    updateCreateMeetingVisibility();
    projectDueDate = savedProject.dueDate || null;
    tasks = allTasks.filter((task) => String(task.projectId) === String(project.projectId));
    meetings = projectMeetings;
    try {
      const members = await window.taskApi.getProjectMembers(savedProject.projectId);
      memberNames = new Map(members.map((member) => [String(member.userId), member]));
    } catch (error) {
      memberWarning = `Could not load member names: ${error.message}`;
    }
    render();
  } catch (error) {
    message.hidden = false;
    message.textContent = `Could not load calendar events: ${error.message}`;
  }
});
