// Sign out: forget the token and user before the link goes to login.html.
document.addEventListener('click', (event) => {
    if (!event.target.closest('.sign-out-button')) return;
    ['authToken', 'token', 'authUser'].forEach((key) => {
        try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
        try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
    });
});

const profileName = document.getElementById('profileName');
const profileStudentId = document.getElementById('profileStudentId');
const sidebarProfileName = document.querySelector('[data-profile-name]');
const sidebarProfileStudentId = document.querySelector('[data-profile-student-id]');

let profileRequest = null;

function setProfile(name, studentId) {
    if (profileName) {
        profileName.textContent = name;
        profileName.title = name;
    }
    if (profileStudentId) profileStudentId.textContent = studentId;
    if (sidebarProfileName) sidebarProfileName.textContent = name;
    if (sidebarProfileStudentId) sidebarProfileStudentId.textContent = studentId;
}

function loadStoredProfile() {
    try {
        const storedUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
        const user = JSON.parse(storedUser || 'null');
        if (user) {
            setProfile(user.displayName || '-', user.tu_id || user.tuId || user.studentId || '-');
        }
    } catch (error) {
        console.error('Could not read the signed-in user:', error);
    }
}

// Asks the backend (GET /auth/me) who is logged in and shows their name and student id.
async function loadProfile() {
    if (!window.profileApi || profileRequest) return;

    try {
        if (!localStorage.getItem('authToken') && !localStorage.getItem('token')) {
            loadStoredProfile();
            return;
        }
    } catch {
        loadStoredProfile();
        return;
    }

    profileRequest = window.profileApi.getMe();
    try {
        const user = await profileRequest;
        setProfile(user.displayName || '-', user.tu_id || user.tuId || user.studentId || '-');
    } catch (error) {
        setProfile('-', '-');
        if (profileStudentId) profileStudentId.textContent = error.message;
    } finally {
        profileRequest = null;
    }
}

// index.html: fetch every time the profile menu is opened; profile.html: fetch when the page loads.
document.addEventListener('profile:opened', loadProfile);
if (!document.querySelector('#profileDropdown')) loadProfile();
loadStoredProfile();
if (sidebarProfileName) loadProfile();
