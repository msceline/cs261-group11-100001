// Small red dot on the bell icon while the signed-in user has unread notifications.
(function notificationBadge() {
  const badge = document.getElementById('countNoti');
  if (!badge || !window.notificationApi) return;

  const REFRESH_MS = 30000;

  function currentUserId() {
    try {
      const stored = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
      const userId = Number(JSON.parse(stored || 'null')?.userId);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }

  function showDot(visible) {
    badge.hidden = !visible;
  }

  async function refresh() {
    const userId = currentUserId();
    if (!userId) {
      showDot(false);
      return;
    }
    try {
      const items = await window.notificationApi.getNotificationsByUserId(userId);
      showDot(Array.isArray(items) && items.some((item) => !item.isRead));
    } catch {
      // Keep the previous state; the next refresh will try again.
    }
  }

  // The notification list lives in an iframe; it reports its unread count whenever it reloads.
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== 'notifications:unread') return;
    showDot(Number(event.data.count) > 0);
  });

  showDot(false);
  refresh();
  setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
}());
