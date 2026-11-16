const profileCard = document.querySelector('.profile-card');
const themeButton = document.getElementById('theme-button');
const profileName = document.getElementById('profileName');
const profileStudentId = document.getElementById('profileStudentId');
const profileNames = document.querySelectorAll('[data-profile-name]');
const profileStudentIds = document.querySelectorAll('[data-profile-student-id]');

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
        const name = user.displayName || '-';
        const studentId = user.tu_id || user.studentId || '-';
        profileName.textContent = name;
        profileName.title = name;
        profileStudentId.textContent = studentId;
        profileNames.forEach((element) => {
            element.textContent = name;
            element.title = name;
        });
        profileStudentIds.forEach((element) => {
            element.textContent = studentId;
            element.title = studentId;
        });
    } catch (error) {
        profileName.textContent = '-';
        profileStudentId.textContent = error.message;
        profileNames.forEach((element) => {
            element.textContent = '-';
        });
        profileStudentIds.forEach((element) => {
            element.textContent = error.message;
        });
    } finally {
        profileRequest = null;
    }
}

// Refresh the profile when its menu opens, and load it once for the sidebar profile.
document.addEventListener('profile:opened', loadProfile);
loadProfile();

document.addEventListener('click', (event) => {
    if (!event.target.closest('.sign-out-button, .sidebar-user__sign-out')) return;
    ['authToken', 'token', 'authUser'].forEach((key) => {
        try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
        try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
    });
});
