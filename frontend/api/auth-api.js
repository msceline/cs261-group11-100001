const API_BASE_URL = '/api';

async function login(studentId, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
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
      : responseBody?.error || responseBody?.message;
    throw new Error(detail || `เข้าสู่ระบบไม่สำเร็จ (${response.status})`);
  }

  if (!responseBody?.token || !responseBody?.user) {
    throw new Error('ข้อมูลตอบกลับจากระบบเข้าสู่ระบบไม่ถูกต้อง');
  }

  return responseBody;
}

const authApi = { login };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = authApi;
}

if (typeof window !== 'undefined') {
  window.authApi = authApi;
}
