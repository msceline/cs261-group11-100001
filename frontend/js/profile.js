// Sign out: forget the token and user before the link goes to login.html.
document.addEventListener('click', (event) => {
    if (!event.target.closest('.sign-out-button')) return;
    ['authToken', 'token', 'authUser'].forEach((key) => {
        try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
        try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
    });
});

const profileCard = document.querySelector('.profile-card');
const themeButton = document.getElementById('theme-button');
const profileName = document.getElementById('profileName');
const profileStudentId = document.getElementById('profileStudentId');

themeButton.addEventListener('click', () => {
    const isDark = profileCard.classList.toggle('is-dark');
    themeButton.setAttribute('aria-pressed', String(isDark));
});

let profileRequest = null;

// Asks the backend (GET /auth/me) who is logged in and shows their name and student id.
async function loadProfile() {
    if (!profileName || !profileStudentId || !window.profileApi || profileRequest) return;

    profileRequest = window.profileApi.getMe();
    try {
        const user = await profileRequest;
        profileName.textContent = user.displayName || '-';
        profileName.title = profileName.textContent;
        profileStudentId.textContent = user.tu_id || user.studentId || '-';
    } catch (error) {
        profileName.textContent = '-';
        profileStudentId.textContent = error.message;
    } finally {
        profileRequest = null;
    }
}

// index.html: fetch every time the profile menu is opened; profile.html: fetch when the page loads.
document.addEventListener('profile:opened', loadProfile);
if (!document.querySelector('#profileDropdown')) loadProfile();
