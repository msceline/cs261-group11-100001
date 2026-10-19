const signInForm = document.getElementById('sign-in-form');
const signInButton = signInForm.querySelector('.btn-signin');
const loginMessage = document.getElementById('login-message');

signInForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  signInButton.disabled = true;
  signInButton.textContent = 'Signing in...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
      }),
    });
    const responseText = await response.text();
    let result = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { error: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(result.message || result.error || `Sign in failed (${response.status}).`);
    }
    if (!result.token) {
      throw new Error('The sign-in response did not include an authentication token.');
    }

    localStorage.setItem('token', result.token);
    window.location.assign('index.html');
  } catch (error) {
    loginMessage.textContent = error.message;
    signInButton.disabled = false;
    signInButton.textContent = 'Sign In';
  }
});
