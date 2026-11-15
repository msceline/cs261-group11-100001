function getCurrentUserId() {
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

function hasStoredToken() {
  try {
    return Boolean(
      localStorage.getItem('authToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('authToken')
      || sessionStorage.getItem('token'),
    );
  } catch (error) {
    console.error('Could not read the authentication token:', error);
    return false;
  }
}

function formatRelativeTime(value) {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function getListElement() {
  return document.getElementById('notification-list') || document.getElementById('notiList');
}

function createNotificationElement(item, index, compact) {
  const row = document.createElement('div');
  row.className = compact ? 'noti-item' : 'notification-item';
  row.dataset.id = String(item.id);

  if (!item.isRead) {
    row.classList.add('is-unread');
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', `${item.title}: ${item.message}. Mark as read`);
  }

  const title = item.title || item.type || 'Notification';
  const messageText = item.message || 'No message';
  const displayMessage = `${title}: ${messageText}`;
  const timeText = formatRelativeTime(item.createdAt);

  if (compact) {
    const avatar = document.createElement('div');
    avatar.className = 'noti-avatar';
    avatar.textContent = title.trim().slice(0, 2).toUpperCase();

    const content = document.createElement('div');
    content.className = 'noti-text-container';

    const message = document.createElement('p');
    message.className = 'noti-message';
    message.textContent = displayMessage;

    const time = document.createElement('span');
    time.className = 'noti-time';
    time.textContent = timeText;

    content.append(message, time);
    row.append(avatar, content);
  } else {
    const avatar = document.createElement('div');
    avatar.className = 'notification-avatar';
    avatar.dataset.tone = String(index % 5);
    avatar.textContent = title.trim().slice(0, 2).toUpperCase();

    const content = document.createElement('div');
    content.className = 'notification-content';

    const message = document.createElement('span');
    message.className = 'notification-message';
    message.textContent = displayMessage;

    const time = document.createElement('span');
    time.className = 'notification-time';
    time.textContent = timeText;

    content.append(message, time);
    row.append(avatar, content);
  }

  if (!item.isRead) {
    const unreadDot = document.createElement('span');
    unreadDot.className = compact ? 'noti-unread-dot' : 'notification-unread-dot';
    unreadDot.setAttribute('aria-hidden', 'true');
    row.append(unreadDot);
  }

  return row;
}

function renderNotifications(items, messageText = '') {
  const list = getListElement();
  if (!list) return;

  list.replaceChildren();

  if (messageText) {
    const status = document.createElement('p');
    status.className = 'notification-status';
    status.setAttribute('role', 'status');
    status.textContent = messageText;
    list.append(status);
    return;
  }

  if (!items.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'notification-status';
    emptyMessage.textContent = 'No notifications yet.';
    list.append(emptyMessage);
    return;
  }

  const compact = list.id === 'notiList';
  list.replaceChildren(...items.map((item, index) => createNotificationElement(item, index, compact)));
}

async function loadNotifications() {
  const userId = getCurrentUserId();

  if (!hasStoredToken() || !userId) {
    renderNotifications([], 'Please sign in to view your notifications.');
    return;
  }

  try {
    const items = await window.notificationApi.getNotificationsByUserId(userId);
    if (!Array.isArray(items)) {
      throw new Error('The notification service returned an invalid response.');
    }
    renderNotifications(items);
  } catch (error) {
    console.error('Failed to load notifications:', error);
    renderNotifications([], error.message || 'Could not load notifications.');
  }
}

async function handleNotificationActivation(event) {
  const row = event.target.closest('[data-id].is-unread');
  if (!row || !getListElement()?.contains(row)) return;
  if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;

  if (event.type === 'keydown') {
    event.preventDefault();
  }

  try {
    await window.notificationApi.markAsRead(row.dataset.id);
    await loadNotifications();
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    const list = getListElement();
    if (list) {
      const status = document.createElement('p');
      status.className = 'notification-status';
      status.setAttribute('role', 'alert');
      status.textContent = error.message || 'Could not mark notification as read.';
      list.prepend(status);
    }
  }
}

function initNotificationDropdown() {
  const icon = document.querySelector('.noti-icon');
  const dropdown = document.getElementById('notiDropdown');
  const showAllButton = document.getElementById('showAllNotiBtn');

  if (icon && dropdown) {
    icon.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.toggle('hidden');
      }
    });

    document.addEventListener('click', (event) => {
      if (!icon.contains(event.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  showAllButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    window.location.assign('/pages/notification.html');
  });

  if (window.notificationApi) {
    loadNotifications();
  } else {
    renderNotifications([], 'Notification service is unavailable.');
  }

  document.addEventListener('click', handleNotificationActivation);
  document.addEventListener('keydown', handleNotificationActivation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationDropdown);
} else {
  initNotificationDropdown();
}
