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

  // The UI works with { meetingId, topic, dateTime, location, description } where dateTime is a local
  // "YYYY-MM-DDTHH:mm:ss" string; the backend uses meetingTopic, meetingDate (ISO-8601 with offset),
  // meetingLink (https URL) and meetingDescription. These two helpers translate between them.
  const PAGE_SIZE = 100;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toLocalDateTime(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return isoValue || '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function toIsoInstant(localValue) {
    const date = new Date(localValue);
    return Number.isNaN(date.getTime()) ? localValue : date.toISOString();
  }

  function fromBackend(meeting) {
    return {
      meetingId: meeting.meetingId,
      projectId: meeting.projectId,
      topic: meeting.meetingTopic,
      description: meeting.meetingDescription || '',
      dateTime: toLocalDateTime(meeting.meetingDate),
      location: meeting.meetingLink || '',
      status: meeting.status,
      createdBy: meeting.createdBy,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
      cancelledAt: meeting.cancelledAt,
    };
  }

  // Empty text is omitted on create; on update "" tells the backend to clear the field.
  function toCreateBody(projectId, meeting) {
    const body = {
      projectId: Number(projectId),
      meetingTopic: meeting.topic,
      meetingDate: toIsoInstant(meeting.dateTime),
    };
    if (meeting.description) body.meetingDescription = meeting.description;
    if (meeting.location) body.meetingLink = meeting.location;
    return body;
  }

  function toUpdateBody(meeting) {
    return {
      meetingTopic: meeting.topic,
      meetingDescription: meeting.description ?? '',
      meetingDate: toIsoInstant(meeting.dateTime),
      meetingLink: meeting.location ?? '',
    };
  }

  // All scheduled (not cancelled) meetings of a project, earliest first.
  async function getMeetings(projectId) {
    const all = [];
    for (let page = 1; ; page += 1) {
      const query = new URLSearchParams({
        projectId: String(projectId),
        status: 'SCHEDULED',
        page: String(page),
        size: String(PAGE_SIZE),
      });
      const batch = await request(`/meetings?${query}`);
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return all.map(fromBackend);
  }

  async function createMeeting(projectId, meeting) {
    const created = await request('/meetings', {
      method: 'POST',
      body: JSON.stringify(toCreateBody(projectId, meeting)),
    });
    return fromBackend(created);
  }

  async function updateMeeting(projectId, meetingId, meeting) {
    const updated = await request(`/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'PATCH',
      body: JSON.stringify(toUpdateBody(meeting)),
    });
    return fromBackend(updated);
  }

  // Cancels the meeting (soft delete); the backend keeps the row with status CANCELLED.
  async function deleteMeeting(projectId, meetingId) {
    const cancelled = await request(`/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'DELETE',
    });
    return fromBackend(cancelled);
  }

  const meetingApi = { getMeetings, createMeeting, updateMeeting, deleteMeeting };
  if (typeof module !== 'undefined' && module.exports) module.exports = meetingApi;
  window.meetingApi = meetingApi;
}());
