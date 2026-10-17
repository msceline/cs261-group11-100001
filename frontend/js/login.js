JavaScript
const submitBtn = document.querySelector('.btn-signin');

function showLoadingAndRedirect() {
  // เปลี่ยนปุ่มเป็นสถานะโหลด
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังเข้าสู่ระบบ...';
  submitBtn.style.opacity = '0.85';

  // จำลองเวลาหน่วง 1 วินาทีแล้วค่อยเปลี่ยนหน้า
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}