const profileCard = document.querySelector('.profile-card');
const themeButton = document.getElementById('theme-button');

themeButton.addEventListener('click', () => {
    const isDark = profileCard.classList.toggle('is-dark');
    themeButton.setAttribute('aria-pressed', String(isDark));
});