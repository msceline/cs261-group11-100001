const sampleNotifications = [
  {
    id: 1,
    title: 'Message',
    message: 'Nawamintra has sent you a message!',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Welcome',
    message: 'Siwadol just joined your platform!',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'Inbox',
    message: 'You have a new message',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'Project',
    message: 'Papangkorn has reached out to you!',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: 'Approval',
    message: 'Need to approve',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

function getCurrentUserId() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser && storedUser.userId) {
      return Number(storedUser.userId);
    }
  } catch (error) {
    console.warn('Could not parse stored user:', error);
  }

  const numericUserId = Number(localStorage.getItem('userId') || sessionStorage.getItem('userId'));
  return Number.isFinite(numericUserId) ? numericUserId : null;
}

function getAvatarText(value) {
  const source = (value || 'N').trim();
  if (!source) return 'N';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRelativeTime(value) {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
}

function createNotificationItem(item, index) {
  const itemEl = document.createElement('div');
  itemEl.className = 'notification-item';
  itemEl.dataset.id = item.id;

  const avatar = document.createElement('div');
  avatar.className = 'notification-avatar';
  avatar.dataset.tone = String(index % 5);
  avatar.textContent = getAvatarText(item.title || item.message);

  const content = document.createElement('div');
  content.className = 'notification-content';

  const message = document.createElement('span');
  message.className = 'notification-message';
  const displayMessage = item.message || item.notificationMessage || 'No message';
  message.textContent = item.title && item.title !== displayMessage
    ? `${item.title}: ${displayMessage}`
    : displayMessage;

  const time = document.createElement('span');
  time.className = 'notification-time';
  time.textContent = formatRelativeTime(item.createdAt || item.created_at);

  content.append(message, time);
  itemEl.append(avatar, content);

  return itemEl;
}

function renderNotifications(items) {
  const container = document.getElementById('notification-list');
  if (!container) return;

  const notifications = Array.isArray(items) && items.length ? items : sampleNotifications;
  container.replaceChildren(...notifications.map(createNotificationItem));
}

async function loadNotifications() {
  const userId = getCurrentUserId();
  const token = getStoredToken();

  if (!userId || !token) {
    renderNotifications(sampleNotifications);
    return;
  }

  try {
    const notifications = await window.notificationApi.getNotificationsByUserId(userId, token);
    renderNotifications(notifications);
  } catch (error) {
    console.error('Failed to load notifications from backend:', error);
    renderNotifications(sampleNotifications);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.notificationApi) {
    await loadNotifications();
    return;
  }

  renderNotifications(sampleNotifications);
});