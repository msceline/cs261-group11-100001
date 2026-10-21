function getNotificationApiBaseUrl() {
  if (typeof window === 'undefined') return '/api';
  return (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
    ? 'http://localhost:8080/api'
    : '/api';
}

function getNotificationToken() {
  try {
    return localStorage.getItem('authToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('authToken')
      || sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

async function requestNotification(path, options = {}) {
  const { token: suppliedToken, ...requestOptions } = options;
  const token = suppliedToken || getNotificationToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getNotificationApiBaseUrl()}${path}`, {
    ...requestOptions,
    headers,
  });
  const responseText = await response.text();
  let responseBody = null;

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!response.ok) {
    const detail = typeof responseBody === 'string'
      ? responseBody
      : responseBody?.error || responseBody?.message || response.statusText;
    const error = new Error(
      `Notification API request failed (${response.status})${detail ? `: ${detail}` : ''}`,
    );
    error.status = response.status;
    throw error;
  }

  return responseBody;
}

function requireId(id, name) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

async function getNotificationsByUserId(userId, token) {
  requireId(userId, 'userId');
  return requestNotification(`/notifications/user/${encodeURIComponent(userId)}`, { token });
}

async function getNotificationById(notificationId, token) {
  requireId(notificationId, 'notificationId');
  return requestNotification(`/notifications/${encodeURIComponent(notificationId)}`, { token });
}

async function createNotification(payload = {}, token) {
  const {
    userId,
    notificationTitle,
    notificationMessage,
    type = 'INFO',
  } = payload;

  requireId(userId, 'userId');
  if (typeof notificationTitle !== 'string' || !notificationTitle.trim() || notificationTitle.trim().length > 150) {
    throw new Error('notificationTitle must contain 1-150 characters');
  }
  if (typeof notificationMessage !== 'string' || !notificationMessage.trim() || notificationMessage.trim().length > 500) {
    throw new Error('notificationMessage must contain 1-500 characters');
  }
  if (typeof type !== 'string' || !type.trim() || type.trim().length > 50) {
    throw new Error('type must contain 1-50 characters');
  }

  return requestNotification('/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: Number(userId),
      notificationTitle: notificationTitle.trim(),
      notificationMessage: notificationMessage.trim(),
      type: type.trim(),
    }),
    token,
  });
}

async function markAsRead(notificationId, token) {
  requireId(notificationId, 'notificationId');
  return requestNotification(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    token,
  });
}

const notificationApi = {
  getNotificationsByUserId,
  getNotificationById,
  createNotification,
  markAsRead,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = notificationApi;
}

if (typeof window !== 'undefined') {
  window.notificationApi = notificationApi;
}
