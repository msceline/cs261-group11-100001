// Behind the Express server (:3000) /api is proxied; on Live Server (:5500) or file:// call the backend directly.
const PROFILE_API_BASE_URL = (['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:')
  ? 'http://localhost:8080/api'
  : '/api';

function getProfileToken() {
  try {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  } catch {
    return null;
  }
}

/** GET /api/auth/me: the logged-in user ({ userId, studentId, displayName, email, createdAt, role }). */
async function getMe(token = getProfileToken()) {
  if (!token) {
    const error = new Error('กรุณาเข้าสู่ระบบ');
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${PROFILE_API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
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
      : responseBody?.error || responseBody?.message || response.statusText;
    const error = new Error(`โหลดข้อมูลโปรไฟล์ไม่สำเร็จ (${response.status})${detail ? `: ${detail}` : ''}`);
    error.status = response.status;
    throw error;
  }

  return responseBody;
}

const profileApi = { getMe };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = profileApi;
}

if (typeof window !== 'undefined') {
  window.profileApi = profileApi;
}
