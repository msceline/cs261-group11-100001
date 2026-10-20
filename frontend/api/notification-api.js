const API_BASE_URL = '/api';

async function requestNotification(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch (error) {
      detail = '';
    }

    throw new Error(
      `Notification API request failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    );
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function authorizationHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getNotificationsByUserId(userId, token) {
  const url = `${API_BASE_URL}/notifications/user/${encodeURIComponent(userId)}`;
  return requestNotification(url, {
    headers: authorizationHeaders(token),
  });
}

async function getNotificationById(notificationId, token) {
  const url = `${API_BASE_URL}/notifications/${encodeURIComponent(notificationId)}`;
  return requestNotification(url, {
    headers: authorizationHeaders(token),
  });
}

async function createNotification(payload = {}, token) {
  const {
    userId,
    notificationTitle,
    notificationMessage,
    type = 'INFO',
  } = payload;

  if (!userId) {
    throw new Error('userId is required');
  }

  if (!notificationTitle || !notificationMessage) {
    throw new Error('notificationTitle and notificationMessage are required');
  }

  const url = `${API_BASE_URL}/notifications`;
  return requestNotification(url, {
    method: 'POST',
    headers: {
      ...authorizationHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, notificationTitle, notificationMessage, type }),
  });
}

const notificationApi = {
  getNotificationsByUserId,
  getNotificationById,
  createNotification,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = notificationApi;
}

if (typeof window !== 'undefined') {
  window.notificationApi = notificationApi;
}
