document.addEventListener('dashboard:loaded', (event) => {
	const dashboard = document.querySelector('#contentBox .dashBoardpage');
	if (!dashboard) return;

	const project = event.detail || {};
	const groupName = dashboard.querySelector('#groupNameDashboard');
	const subject = dashboard.querySelector('#subjectGroupDashboard');
	const progressPercentage = dashboard.querySelector('#progressBarPercentageDashboard');
	const progressBar = dashboard.querySelector('#progressBardashboard');
	const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

	if (groupName) groupName.textContent = project.groupName || '';
	if (subject) subject.textContent = project.subject || '';
	if (progressPercentage) progressPercentage.textContent = `${progress}%`;
	if (progressBar) {
		progressBar.style.width = `${progress}%`;
		progressBar.setAttribute('aria-valuenow', String(progress));
		progressBar.dataset.progressBand = progress < 25
			? 'red'
			: progress < 50
				? 'orange'
				: progress < 75
					? 'yellow'
					: 'green';
	}
});
