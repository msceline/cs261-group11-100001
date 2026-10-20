const API_BASE_URL = '/api';

async function requestMembers(url, options = {}) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  let responseBody;

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
      : responseBody?.detail || responseBody?.message || responseBody?.error;
    throw new Error(
      `คำขอไม่สำเร็จ (${response.status})${detail ? `: ${detail}` : ''}`,
    );
  }

  return responseBody;
}

function authorizationHeaders(token) {
  return token ? { Authorization: ['Bearer', token].join(' ') } : {};
}

function projectMembersUrl(projectId) {
  if (!Number.isInteger(Number(projectId)) || Number(projectId) < 1) {
    throw new Error('Project ID ต้องเป็นจำนวนเต็มบวก');
  }

  return `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/members`;
}

async function getProjectMembers(projectId, token) {
  return requestMembers(projectMembersUrl(projectId), {
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
