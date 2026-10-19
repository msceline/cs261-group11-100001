const sampleNotifications = [
  {
    id: 1,
    avatarText: 'NW',
    message: 'Nawamintra has sent you a message!',
    time: '4 days ago.'
  },
  {
    id: 2,
    avatarText: 'SA',
    message: 'Siwadol just joined your platform!',
    time: '20 minutes ago.'
  },
  {
    id: 3,
    avatarText: 'TC',
    message: 'You have a new message',
    time: '35 minutes ago.'
  },
  {
    id: 4,
    avatarText: 'PR',
    message: 'Papangkorn has reached out to you!',
    time: '1 day ago.'
  },
  {
    id: 5,
    avatarText: 'NB',
    message: 'Need to approve',
    time: '1 days ago.'
  }
];


function createNotificationItem(item, index) {
  const itemEl = document.createElement('div');
  itemEl.className = 'notification-item';
  itemEl.dataset.id = item.id;


  const avatar = document.createElement('div');
  avatar.className = 'notification-avatar';
  avatar.dataset.tone = String(index % 5); 
  avatar.textContent = item.avatarText;


  const content = document.createElement('div');
  content.className = 'notification-content';

  const message = document.createElement('span');
  message.className = 'notification-message';
  message.textContent = item.message;

  const time = document.createElement('span');
  time.className = 'notification-time';
  time.textContent = item.time;

  content.append(message, time);
  itemEl.append(avatar, content);

  return itemEl;
}

function renderNotifications() {
  const container = document.getElementById('notification-list');
  if (!container) return;

  container.replaceChildren(...sampleNotifications.map(createNotificationItem));
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotifications();
});