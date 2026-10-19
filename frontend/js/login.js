JavaScript
const submitBtn = document.querySelector('.btn-signin');
const signInForm = document.querySelector('#sign-in-form');

function showLoadingAndRedirect() {
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังเข้าสู่ระบบ...';
  submitBtn.style.opacity = '0.85';

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

signInForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  showLoadingAndRedirect();
});