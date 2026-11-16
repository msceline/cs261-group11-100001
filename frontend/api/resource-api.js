(() => {
  const baseUrl = (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
    ? 'http://localhost:8080/api'
    : '/api';

  function storedToken() {
    try {
      return localStorage.getItem('authToken') || localStorage.getItem('token')
        || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const token = storedToken();
    if (!token) {
      const error = new Error('กรุณาเข้าสู่ระบบ');
      error.status = 401;
      throw error;
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (options.body) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
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
      const detail = typeof body === 'string'
        ? body
        : body?.message || body?.error || response.statusText;
      const error = new Error(`Resource API request failed (${response.status})${detail ? `: ${detail}` : ''}`);
      error.status = response.status;
      throw error;
    }

    return body;
  }

  function projectLinkFilesPath(projectId) {
    const id = Number(projectId);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error('Project ID ต้องเป็นจำนวนเต็มบวก');
    }
    return `/projects/${id}/linkfiles`;
  }

  function toPageItem(linkFile, memberNames, currentUserId) {
    return {
      id: linkFile.linkFileId,
      projectId: linkFile.projectId,
      title: linkFile.linkName,
      url: linkFile.linkUrl,
      description: linkFile.description || '',
      uploadedAt: linkFile.createdAt || '',
      uploadedBy: memberNames.get(Number(linkFile.uploaderId)) || `Member #${linkFile.uploaderId}`,
      canEdit: linkFile.uploaderId != null
        && currentUserId != null
        && Number(linkFile.uploaderId) === Number(currentUserId),
    };
  }

  async function getResources(projectId) {
    const linkFilesPath = projectLinkFilesPath(projectId);
    const projectPath = `/projects/${Number(projectId)}`;
    const [linkFiles, members, currentUser] = await Promise.all([
      request(linkFilesPath),
      request(`${projectPath}/members`),
      request('/auth/me'),
    ]);

    if (!Array.isArray(linkFiles) || !Array.isArray(members)) {
      throw new Error('รูปแบบข้อมูล LinkFile จาก backend ไม่ถูกต้อง');
    }
    if (!currentUser || currentUser.userId == null) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ปัจจุบัน');
    }

    const memberNames = new Map(members.map((member) => [Number(member.userId), member.displayName]));
    return linkFiles.map((linkFile) => toPageItem(linkFile, memberNames, currentUser.userId));
  }

  async function createResource(projectId, resource) {
    const linkFile = await request(projectLinkFilesPath(projectId), {
      method: 'POST',
      body: JSON.stringify({
        linkName: resource.title,
        linkUrl: resource.url,
        description: resource.description || null,
      }),
    });
    return linkFile;
  }

  async function updateResource(projectId, linkFileId, resource) {
    return request(`${projectLinkFilesPath(projectId)}/${encodeURIComponent(linkFileId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        linkName: resource.title,
        linkUrl: resource.url,
        description: resource.description ?? '',
      }),
    });
  }

  function deleteResource(projectId, linkFileId) {
    return request(`${projectLinkFilesPath(projectId)}/${encodeURIComponent(linkFileId)}`, {
      method: 'DELETE',
    });
  }

  const resourceApi = { getResources, createResource, updateResource, deleteResource };
  if (typeof module !== 'undefined' && module.exports) module.exports = resourceApi;
  window.ResourceAPI = resourceApi;
})();
