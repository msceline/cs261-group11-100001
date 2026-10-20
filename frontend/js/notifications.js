// ข้อมูลจำลอง (Mock Data) สอดคล้องกับภาพแบบเป๊ะๆ
const mockNotifications = [
  {
<<<<<<< HEAD
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    message: 'Tariq has sent you a message!',
    time: '04 days ago.',
    unread: true
  },
  {
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    message: 'Johan just joined your platform!',
    time: '20 minutes ago.',
    unread: true
  },
  {
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    message: 'Johan just joined your platform!',
    time: '20 minutes ago.',
    unread: true
  },
  {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    message: 'You have a new message from Cate!',
    time: '35 minutes ago.',
    unread: true
  },
  {
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    message: 'Stefan Jones has reached out to you!',
    time: '01 days ago.',
    unread: true
  },
  {
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    message: 'Need to approve',
    time: '1 days ago.',
    unread: true
  }
];

// ฟังก์ชันนำข้อมูลไปเรนเดอร์ในการ์ด
function renderNotifications() {
  const notiList = document.getElementById('notiList');
  if (!notiList) return;

  notiList.innerHTML = mockNotifications.map(item => `
    <div class="noti-item">
      <img src="${item.avatar}" alt="Avatar" class="noti-avatar">
      <div class="noti-text-container">
        <p class="noti-message">${item.message}</p>
        <span class="noti-time">${item.time}</span>
      </div>
      ${item.unread ? '<span class="noti-unread-dot"></span>' : ''}
    </div>
  `).join('');
}

// ผูก Event การคลิกเปิด/ปิด กล่องแจ้งเตือน
function initNotificationDropdown() {
  const notiIcon = document.querySelector('.noti-icon');
  const notiDropdown = document.getElementById('notiDropdown');

  if (!notiIcon || !notiDropdown) return;

  // วาดรายการข้อมูลจำลอง
  renderNotifications();

  // เมื่อคลิกที่ไอคอนกระดิ่งของเพื่อน -> สลับเปิด/ปิด
  notiIcon.addEventListener('click', (event) => {
    // ป้องกันไม่ให้การคลิกเนื้อหาข้างในการ์ดเผลอไปปิดตัวเอง
    if (notiDropdown.contains(event.target)) return;
    
    notiDropdown.classList.toggle('hidden');
  });

  // เมื่อคลิกที่พื้นที่อื่นนอกกล่อง -> ปิดการ์ด
  document.addEventListener('click', (event) => {
    if (!notiIcon.contains(event.target)) {
      notiDropdown.classList.add('hidden');
    }
  });

  // ปุ่ม Show all notification
  const showAllBtn = document.getElementById('showAllNotiBtn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      alert('เปิดหน้าดูการแจ้งเตือนทั้งหมด');
    });
  }
}

// สั่งทำงานทันทีเมื่อโหลดหน้าเว็บเสร็จ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationDropdown);
} else {
  initNotificationDropdown();
}
=======
    id: 1,
    title: 'Message',
    message: 'Nawamintra has sent you a message!',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Welcome',
    message: 'Siwadol just joined your platform!',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'Inbox',
    message: 'You have a new message',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'Project',
    message: 'Papangkorn has reached out to you!',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: 'Approval',
    message: 'Need to approve',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

function getCurrentUserId() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser && storedUser.userId) {
      return Number(storedUser.userId);
    }
  } catch (error) {
    console.warn('Could not parse stored user:', error);
  }

  const numericUserId = Number(localStorage.getItem('userId') || sessionStorage.getItem('userId'));
  return Number.isFinite(numericUserId) ? numericUserId : null;
}

function getAvatarText(value) {
  const source = (value || 'N').trim();
  if (!source) return 'N';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRelativeTime(value) {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
}

function createNotificationItem(item, index) {
  const itemEl = document.createElement('div');
  itemEl.className = 'notification-item';
  itemEl.dataset.id = item.id;

  const avatar = document.createElement('div');
  avatar.className = 'notification-avatar';
  avatar.dataset.tone = String(index % 5);
  avatar.textContent = getAvatarText(item.title || item.message);

  const content = document.createElement('div');
  content.className = 'notification-content';

  const message = document.createElement('span');
  message.className = 'notification-message';
  const displayMessage = item.message || item.notificationMessage || 'No message';
  message.textContent = item.title && item.title !== displayMessage
    ? `${item.title}: ${displayMessage}`
    : displayMessage;

  const time = document.createElement('span');
  time.className = 'notification-time';
  time.textContent = formatRelativeTime(item.createdAt || item.created_at);

  content.append(message, time);
  itemEl.append(avatar, content);

  return itemEl;
}

function renderNotifications(items) {
  const container = document.getElementById('notification-list');
  if (!container) return;

  const notifications = Array.isArray(items) && items.length ? items : sampleNotifications;
  container.replaceChildren(...notifications.map(createNotificationItem));
}

async function loadNotifications() {
  const userId = getCurrentUserId();
  const token = getStoredToken();

  if (!userId || !token) {
    renderNotifications(sampleNotifications);
    return;
  }

  try {
    const notifications = await window.notificationApi.getNotificationsByUserId(userId, token);
    renderNotifications(notifications);
  } catch (error) {
    console.error('Failed to load notifications from backend:', error);
    renderNotifications(sampleNotifications);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.notificationApi) {
    await loadNotifications();
    return;
  }

  renderNotifications(sampleNotifications);
});
>>>>>>> setup-notification-component
