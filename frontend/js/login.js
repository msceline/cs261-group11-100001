document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#sign-in-form');
  const submitBtn = document.querySelector('.btn-signin');
  const studentIdInput = document.querySelector('#studentId');
  const passwordInput = document.querySelector('#password');
  const message = document.querySelector('#login-message');
  const defaultButtonText = submitBtn?.textContent;

  function triggerError(inputElement) {
    const parentField = inputElement.closest('.input-field') || inputElement;
    parentField.classList.remove('shake-error');
    void parentField.offsetWidth;
    parentField.classList.add('shake-error');

    setTimeout(() => {
      parentField.classList.remove('shake-error');
    }, 400);
  }

  if (!form || !submitBtn || !studentIdInput || !passwordInput || !message) return;

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
