// Project / task / user requests used by the dashboard. Everything lives inside this function so it cannot clash
// with the globals of the other api files (task-api.js declares getProjects, getTasks ... on the page).
(function projectApiModule() {
  // Behind the Express server (:3000) /api is proxied; on Live Server (:5500) or file:// call the backend directly.
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

  async function request(path, token = storedToken(), options = {}) {
    if (!token) {
      const error = new Error('กรุณาเข้าสู่ระบบ');
      error.status = 401;
      throw error;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await response.text();
    let body = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const detail = typeof body === 'string' ? body : body?.error || body?.message || response.statusText;
      const error = new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})${detail ? `: ${detail}` : ''}`);
      error.status = response.status;
      throw error;
    }

    return body;
  }

  /** GET /api/projects: projects the user belongs to ({ projectId, projectName, subjectCode, hostId, progress, createdAt }). */
  function getProjects(token) {
    return request('/projects', token);
  }

  /** POST /api/projects: the caller becomes the host. createdAt (yyyy-MM-dd) is optional. */
  function createProject({ projectName, subjectCode, createdAt }, token) {
    return request('/projects', token, {
      method: 'POST',
      body: JSON.stringify({ projectName, subjectCode, createdAt }),
    });
  }

  /** GET /api/projects/{id} */
  function getProject(projectId, token) {
    return request(`/projects/${encodeURIComponent(projectId)}`, token);
  }

  /** GET /api/tasks (every task of the user's projects), filtered to one project. */
  async function getProjectTasks(projectId, token) {
    const tasks = await request('/tasks', token);
    return tasks.filter((task) => String(task.projectId) === String(projectId));
  }

  /** GET /api/auth/me: the logged-in user ({ userId, displayName, ... }). */
  function getCurrentUser(token) {
    return request('/auth/me', token);
  }

  /** Finds the project a dashboard card stands for: by id when the card has one, otherwise by subject and name. */
  async function findProject(selected, token) {
    if (selected.projectId !== undefined && selected.projectId !== null && selected.projectId !== '') {
      try {
        return await getProject(selected.projectId, token);
      } catch (error) {
        if (error.status !== 404 && error.status !== 403) throw error;
      }
    }

    const projects = await getProjects(token);
    return projects.find((project) => project.subjectCode === selected.subject
      && project.projectName === selected.groupName) || null;
  }

  const projectApi = { getProjects, createProject, getProject, getProjectTasks, getCurrentUser, findProject };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectApi;
  }

  window.projectApi = projectApi;
}());
