function getShowMemberApiBaseUrl() {
  if (typeof window === 'undefined') return '/api';
  return (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
    ? 'http://localhost:8080/api'
    : '/api';
}

function getShowMemberToken() {
  try {
    return localStorage.getItem('authToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('authToken')
      || sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

function validateProjectId(projectId) {
  if (!Number.isInteger(Number(projectId)) || Number(projectId) <= 0) {
    throw new Error('projectId must be a positive integer');
  }
}

async function requestShowMember(path, token) {
  const headers = new Headers();
  const authToken = token || getShowMemberToken();

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${getShowMemberApiBaseUrl()}${path}`, { headers });
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
      `Member API request failed (${response.status})${detail ? `: ${detail}` : ''}`,
    );
    error.status = response.status;
    throw error;
  }

  return responseBody;
}

async function getProjectMembers(projectId, token) {
  validateProjectId(projectId);
  const members = await requestShowMember(
    `/projects/${encodeURIComponent(projectId)}/members`,
    token,
  );

  if (!Array.isArray(members)) {
    throw new Error('Member API returned an invalid members list');
  }

  return members;
}

async function getProjectDetails(projectId, token) {
  validateProjectId(projectId);
  return requestShowMember(`/projects/${encodeURIComponent(projectId)}`, token);
}

const showMemberApi = {
  getProjectMembers,
  getProjectDetails,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = showMemberApi;
}

if (typeof window !== 'undefined') {
  window.showMemberApi = showMemberApi;
}