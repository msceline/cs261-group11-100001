const sampleUpcomingTasks = [
	{
		taskTitle: 'สรุปขอบเขตโครงงาน',
		taskDescription: 'ทบทวน requirement และแบ่ง deliverables ของทีม',
		dueDate: '22 ต.ค. 2026',
		status: 'todo',
	},
	{
		taskTitle: 'ตรวจสอบแบบร่างหน้าจอ',
		taskDescription: 'รวบรวมข้อเสนอแนะก่อนเริ่มพัฒนา',
		dueDate: '24 ต.ค. 2026',
		status: 'in_progress',
	},
];

const sampleTodayTasks = [
	{
		taskTitle: 'ประชุมติดตามงาน',
		taskDescription: 'อัปเดตความคืบหน้าและสิ่งที่ติดขัด',
		dueDate: 'วันนี้',
		status: 'in_progress',
	},
	{
		taskTitle: 'ทบทวนหน้า Dashboard',
		taskDescription: 'ตรวจ layout และรายการงานบนมือถือ',
		dueDate: 'วันนี้',
		status: 'todo',
	},
];

const taskStatusLabels = {
	todo: 'To do',
	in_progress: 'In progress',
	completed: 'Completed',
	done: 'Completed',
};

function createDashboardTaskCard(task) {
	const card = document.createElement('article');
	const status = String(task.status || 'todo').toLowerCase();
	card.className = 'dashboard-task-card';
	card.dataset.status = status.replaceAll(' ', '_');

	const title = document.createElement('h3');
	title.className = 'dashboard-task-card__title';
	title.textContent = task.taskTitle || task.title || 'Untitled task';
	card.append(title);

	const descriptionText = task.taskDescription || task.description;
	if (descriptionText) {
		const description = document.createElement('p');
		description.className = 'dashboard-task-card__description';
		description.textContent = descriptionText;
		card.append(description);
	}

	const details = document.createElement('div');
	details.className = 'dashboard-task-card__details';

	const dueDate = document.createElement('span');
	dueDate.className = 'dashboard-task-card__due-date';
	dueDate.textContent = task.dueDate || 'No due date';

	const statusLabel = document.createElement('span');
	statusLabel.className = 'dashboard-task-card__status';
	statusLabel.textContent = taskStatusLabels[status] || task.status || 'To do';

	details.append(dueDate, statusLabel);
	card.append(details);
	return card;
}

function renderDashboardTaskCards(container, tasks, fallbackTasks) {
	if (!container) return;
	const items = Array.isArray(tasks) ? tasks : fallbackTasks;
	container.replaceChildren(...items.map(createDashboardTaskCard));
}

document.addEventListener('dashboard:loaded', (event) => {
	const dashboard = document.querySelector('#contentBox .dashBoardpage');
	if (!dashboard) return;

	const project = event.detail || {};
	const groupName = dashboard.querySelector('#groupNameDashboard');
	const subject = dashboard.querySelector('#subjectGroupDashboard');
	const progressPercentage = dashboard.querySelector('#progressBarPercentageDashboard');
	const progressBar = dashboard.querySelector('#progressBardashboard');
	const upcomingList = dashboard.querySelector('#upcomingListDashboard');
	const todayList = dashboard.querySelector('#yourTaskListDashboard');
	const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

	if (groupName) groupName.textContent = project.groupName || '';
	if (subject) subject.textContent = project.subject || '';
	if (progressPercentage) progressPercentage.textContent = `${progress}%`;
	if (progressBar) {
		progressBar.style.width = '0%';
		progressBar.setAttribute('aria-valuenow', String(progress));
		progressBar.dataset.progressBand = progress < 25
			? 'red'
			: progress < 50
				? 'orange'
				: progress < 75
					? 'yellow'
					: 'green';

		progressBar.getBoundingClientRect();
		requestAnimationFrame(() => {
			if (progressBar.isConnected) {
				progressBar.style.width = `${progress}%`;
			}
		});
	}

		renderDashboardTaskCards(upcomingList, project.upcomingTasks, sampleUpcomingTasks);
		renderDashboardTaskCards(todayList, project.todayTasks, sampleTodayTasks);
});
