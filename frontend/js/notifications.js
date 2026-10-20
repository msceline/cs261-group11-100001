// ข้อมูลจำลอง (Mock Data) สอดคล้องกับภาพแบบเป๊ะๆ
const mockNotifications = [
  {
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
