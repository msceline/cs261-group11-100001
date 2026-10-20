document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-task-form');
    const modal = document.getElementById('submissionModal');
    const closeBtn = document.getElementById('closePopupBtn');

    if (form && modal) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); 

            modal.classList.add('active');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
});