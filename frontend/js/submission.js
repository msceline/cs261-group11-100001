document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('submissionModal');
  const closeBtn = document.getElementById('closePopupBtn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) {
        modal.classList.remove('active');
      }


      if (typeof loadPage === 'function') {
        loadPage('task');
      } else {

        const taskSidebarBtn = document.querySelector('[data-page="task"]');
        if (taskSidebarBtn) {
          taskSidebarBtn.click();
        }
      }
    });
  }
});