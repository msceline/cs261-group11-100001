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

// ---- Mock data: used while nobody is logged in (no auth token), so the task pages can be viewed without the backend.
// Changes (new tasks, status updates) are kept in localStorage under MOCK_STORAGE_KEY.
const MOCK_STORAGE_KEY = 'mockTaskData';
const MOCK_PROJECTS = [
  { projectId: 1, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS261', hostId: 1, progress: 20, createdAt: '2026-02-01T10:00:00' },
  { projectId: 2, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS213', hostId: 1, progress: 55, createdAt: '2026-02-01T10:00:00' },
  { projectId: 3, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS221', hostId: 1, progress: 75, createdAt: '2026-02-01T10:00:00' },
  { projectId: 4, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'TU109', hostId: 1, progress: 85, createdAt: '2026-02-01T10:00:00' },
  { projectId: 5, projectName: 'เว็บไซต์จองห้องเรียน', subjectCode: 'CS331', hostId: 1, progress: 100, createdAt: '2026-02-05T13:30:00' },
];
const MOCK_MEMBERS = [
  { userId: 1, studentId: '6609650001', displayName: 'สมชาย ใจดี' },
  { userId: 2, studentId: '6609650002', displayName: 'สมหญิง รักเรียน' },
  { userId: 3, studentId: '6609650003', displayName: 'ธนากร มั่นคง' },
  { userId: 4, studentId: '6609650004', displayName: 'พิมพ์ใจ สุขสม' },
];
const MOCK_SEED_TASKS = [
  { taskId: 1, projectId: 1, taskTitle: 'ออกแบบ ER Diagram และ Schema', taskDescription: 'กำหนดตาราง users, projects, project_members, tasks, notifications', assigneeId: 1, status: 'doing', dueDate: '2026-11-15T23:59:00' },
  { taskId: 2, projectId: 1, taskTitle: 'พัฒนาระบบ Authentication และ JWT', taskDescription: 'เชื่อมต่อระบบ Login และสร้าง Token สำหรับตรวจสอบสิทธิ์', assigneeId: 2, status: 'todo', dueDate: '2026-11-20T23:59:00' },
  { taskId: 3, projectId: 1, taskTitle: 'สร้างหน้า Dashboard แสดงรายการงาน', taskDescription: 'ทำหน้า UI สำหรับดู Kanban Board ของแต่ละโปรเจกต์', assigneeId: 3, status: 'todo', dueDate: '2026-11-28T23:59:00' },
  { taskId: 4, projectId: 1, taskTitle: 'เตรียมสไลด์นำเสนอ Sprint 1', taskDescription: null, assigneeId: null, status: 'done', dueDate: '2026-12-01T12:00:00' },
  { taskId: 5, projectId: 2, taskTitle: 'เขียนรายงานบทที่ 1', taskDescription: 'บทนำและวัตถุประสงค์', assigneeId: 4, status: 'todo', dueDate: '2026-11-30T23:59:00' },
];

function useMockApi(token) {
  return !token && !getStoredAuthToken();
}

function mockLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks)) return saved;
  } catch {
    // fall through to the seed data
  }
  return { nextTaskId: MOCK_SEED_TASKS.length + 1, tasks: MOCK_SEED_TASKS.map((task) => ({ ...task })) };
}

function mockSave(data) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable: changes just last until reload
  }
}

function mockCall(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(JSON.parse(JSON.stringify(fn())));
      } catch (error) {
        reject(error);
      }
    }, 150);
  });
}

function findMockTask(taskId) {
  const task = mockLoad().tasks.find((item) => item.taskId === Number(taskId));
  if (!task) throw new Error('Task API request failed (404): Task not found');
  return task;
}

function patchMockTask(taskId, changes) {
  const data = mockLoad();
  const task = data.tasks.find((item) => item.taskId === Number(taskId));
  if (!task) throw new Error('Task API request failed (404): Task not found');
  Object.entries(changes).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key in task) task[key] = value;
  });
  mockSave(data);
  return task;
}

function getTasks(token) {
  if (useMockApi(token)) return mockCall(() => mockLoad().tasks);
  return taskApiRequest('/tasks', { token });
}

function getTask(taskId, token) {
  if (useMockApi(token)) return mockCall(() => findMockTask(taskId));
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, { token });
}

function createTask(task, token) {
  if (useMockApi(token)) {
    return mockCall(() => {
      const data = mockLoad();
      const created = {
        taskId: data.nextTaskId,
        projectId: task.projectId,
        taskTitle: task.taskTitle,
        taskDescription: task.taskDescription ?? null,
        assigneeId: task.assigneeId ?? null,
        status: task.status || 'todo',
        dueDate: task.dueDate ?? null,
      };
      data.nextTaskId += 1;
      data.tasks.push(created);
      mockSave(data);
      return created;
    });
  }
  return taskApiRequest('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify(task),
  });
}

function updateTask(taskId, task, token) {
  if (useMockApi(token)) return mockCall(() => patchMockTask(taskId, task));
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(task),
  });
}

function updateTaskStatus(taskId, status, token) {
  if (useMockApi(token)) return mockCall(() => patchMockTask(taskId, { status }));
  return taskApiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

function getProjects(token) {
  if (useMockApi(token)) return mockCall(() => MOCK_PROJECTS);
  return taskApiRequest('/projects', { token });
}

function getProjectMembers(projectId, token) {
  if (useMockApi(token)) {
    return mockCall(() => MOCK_MEMBERS.map((member, index) => ({
      id: index + 1,
      projectId: Number(projectId),
      roleInProject: index === 0 ? 'host' : 'member',
      ...member,
    })));
  }
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