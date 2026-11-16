// Behind the Express server (:3000) /api is proxied; on Live Server (:5500) or file:// call the backend directly.
const TASK_API_BASE_URL = (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
  ? 'http://localhost:8080/api'
  : '/api';

function getStoredAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (!token) {
    return null;
  }
  return token;
}

async function taskApiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  const authToken = token || getStoredAuthToken();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${TASK_API_BASE_URL}${path}`, {
    ...options,
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
      : responseBody?.message || responseBody?.error || response.statusText;
    const error = new Error(`Task API request failed (${response.status}): ${detail}`);
    error.status = response.status;
    throw error;
  }

  return responseBody;
}

function getTasks(token) {
  return taskApiRequest('/tasks', { token });
}

function getTask(taskId, token) {
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, { token });
}

function createTask(task, token) {
  return taskApiRequest('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify(task),
  });
}

function updateTask(taskId, task, token) {
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(task),
  });
}

function updateTaskStatus(taskId, status, token) {
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    // PUT, not PATCH: the backend's CORS config does not allow PATCH, so the browser's request (it sends an Origin header) gets 403.
    // The backend only updates the fields that are sent, so { status } alone is enough.
    method: 'PUT',
    token,
    body: JSON.stringify({ status }),
  });
}

function getProjects(token) {
  return taskApiRequest('/projects', { token });
}

function getProjectMembers(projectId, token) {
  return taskApiRequest(`/projects/${encodeURIComponent(projectId)}/members`, { token });
}

const taskApi = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  getProjects,
  getProjectMembers,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = taskApi;
}

if (typeof window !== 'undefined') {
  window.taskApi = taskApi;
}