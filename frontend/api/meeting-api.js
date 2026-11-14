(function meetingApiModule() {
  const baseUrl = (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
    ? 'http://localhost:8080/api'
    : '/api';

  function storedToken() {
    try {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const token = storedToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${baseUrl}${path}`, {
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
      const error = new Error(`Meeting API request failed (${response.status}): ${detail}`);
      error.status = response.status;
      throw error;
    }

    return responseBody;
  }

  function getMeetings(projectId) {
    return request(`/projects/${encodeURIComponent(projectId)}/meetings`);
  }

  function createMeeting(projectId, meeting) {
    return request(`/projects/${encodeURIComponent(projectId)}/meetings`, {
      method: 'POST',
      body: JSON.stringify(meeting),
    });
  }

  const meetingApi = { getMeetings, createMeeting };
  if (typeof module !== 'undefined' && module.exports) module.exports = meetingApi;
  window.meetingApi = meetingApi;
}());
