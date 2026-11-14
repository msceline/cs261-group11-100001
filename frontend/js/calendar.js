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

function renderCalendarDays(container, year, month, tasks, meetings, projectDueDate, message) {
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
    const eventSummary = document.createElement('div');
    eventSummary.className = 'calendar-day-summary';
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
          location: meeting.location || '',
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

        if (entry.type === 'meeting' && entry.location) {
          const href = calendarHttpUrl(entry.location);
          const location = document.createElement(href ? 'a' : 'span');
          location.className = 'calendar-meeting-location';
          location.textContent = entry.location;
          if (href) {
            location.href = href;
            location.target = '_blank';
            location.rel = 'noopener noreferrer';
          }
          item.append(location);
        }
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
  const project = event.detail || {};
  const currentDate = new Date();
  let visibleYear = currentDate.getFullYear();
  let visibleMonth = currentDate.getMonth();
  let tasks = [];
  let meetings = [];

  calendar.querySelector('#calendar-course-code').textContent = project.subjectCode || project.subject || '';
  calendar.querySelector('#calendar-course-name').textContent = project.projectName || project.groupName || '';

  function render() {
    monthLabel.textContent = new Date(visibleYear, visibleMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    renderCalendarDays(daysContainer, visibleYear, visibleMonth, tasks, meetings, project.dueDate, message);
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
    const [allTasks, projectMeetings] = await Promise.all([
      window.taskApi.getTasks(),
      window.meetingApi.getMeetings(project.projectId),
    ]);
    tasks = allTasks.filter((task) => String(task.projectId) === String(project.projectId));
    meetings = projectMeetings;
    render();
  } catch (error) {
    message.hidden = false;
    message.textContent = `Could not load calendar events: ${error.message}`;
  }
});
