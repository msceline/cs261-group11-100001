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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const studentId = studentIdInput.value.trim();
    const password = passwordInput.value;
    if (!studentId || !password) {
      if (!studentId) triggerError(studentIdInput);
      if (!password) triggerError(passwordInput);
      message.textContent = 'กรุณากรอกรหัสนักศึกษาและรหัสผ่าน';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Signing in...';

    try {
      if (!window.authApi) {
        throw new Error('ไม่สามารถโหลดบริการเข้าสู่ระบบได้');
      }

      const result = await window.authApi.login(studentId, password);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('authUser', JSON.stringify(result.user));
      window.location.assign('/pages/index.html');
    } catch (error) {
      message.textContent = error instanceof TypeError
        ? 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง'
        : error.message || 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ';
      triggerError(studentIdInput);
      triggerError(passwordInput);
      submitBtn.disabled = false;
      submitBtn.textContent = defaultButtonText;
    }
  });

  [studentIdInput, passwordInput].forEach((input) => {
    input.addEventListener('input', () => {
      message.textContent = '';
      input.closest('.input-field')?.classList.remove('shake-error');
    });
  });
});
