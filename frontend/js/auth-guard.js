(() => {
  const SESSION_KEYS = ['authToken', 'token', 'authUser', 'activeResourceProject'];

  function readStorage(key) {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function hasToken() {
    return Boolean(readStorage('authToken') || readStorage('token'));
  }

  function clearSession() {
    SESSION_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
      try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
    });
  }

  function redirectToLogin(loginUrl = 'login.html') {
    document.documentElement.style.visibility = 'hidden';
    window.location.replace(loginUrl);
  }

  function signOut(loginUrl = 'login.html') {
    clearSession();
    redirectToLogin(loginUrl);
  }

  function guardProtectedPage() {
    if (!hasToken()) {
      redirectToLogin('login.html');
      return false;
    }
    return true;
  }

  window.authGuard = {
    hasToken,
    clearSession,
    redirectToLogin,
    signOut,
  };

  // Run synchronously in <head> before protected DOM paints.
  guardProtectedPage();

  // Defend against browser Back-Forward Cache (bfcache) restoring a logged-out or prior-user page.
  window.addEventListener('pageshow', (event) => {
    if (!guardProtectedPage()) return;
    if (event.persisted) {
      document.documentElement.style.visibility = 'hidden';
      window.location.reload();
    }
  });

  // If signed out in another tab, leave the protected page immediately.
  window.addEventListener('storage', (event) => {
    if ((event.key === null || SESSION_KEYS.includes(event.key)) && !hasToken()) {
      redirectToLogin('login.html');
    }
  });
})();
