const API_BASE_URL = '/api';

async function requestMembers(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Member API request failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    );
  }

  return response.json();
}

function authorizationHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getProjectMembers(projectId, token) {
  const url = `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/members`;
  return requestMembers(url, {
    headers: authorizationHeaders(token),
  });
}

async function addProjectMember(projectId, tu_id, token) {
  const url = `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/members`;
  return requestMembers(url, {
    method: 'POST',
    headers: {
      ...authorizationHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tu_id }),
  });
}

const memberApi = {
  getProjectMembers,
  addProjectMember,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = memberApi;
}

if (typeof window !== 'undefined') {
  window.memberApi = memberApi;
}