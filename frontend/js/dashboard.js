const dashboardScriptUrl = document.currentScript?.src || window.location.href;

// Shown only while nobody is logged in (no auth token), so the page can still be previewed without the backend.
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

// The backend uses todo / doing / done; the card styles use in_progress for "doing".
function normalizeTaskStatus(status) {
	const value = String(status || 'todo').toLowerCase().replaceAll(' ', '_');
	return value === 'doing' ? 'in_progress' : value;
}

function createDashboardTaskCard(task) {
	const card = document.createElement('article');
	const status = normalizeTaskStatus(task.status);
	card.className = 'dashboard-task-card';
	card.dataset.status = status;

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

function renderDashboardTaskCards(container, tasks, emptyMessage = '') {
	if (!container) return;
	if (!tasks.length && emptyMessage) {
		const message = document.createElement('p');
		message.textContent = emptyMessage;
		container.replaceChildren(message);
		return;
	}
	container.replaceChildren(...tasks.map(createDashboardTaskCard));
}

function showDashboardMessage(container, text) {
	if (!container) return;
	const message = document.createElement('p');
	message.textContent = text;
	container.replaceChildren(message);
}

function loadProjectApi() {
	if (window.projectApi) return Promise.resolve(window.projectApi);

	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = new URL('../api/project-api.js', dashboardScriptUrl).href;
		script.onload = () => resolve(window.projectApi);
		script.onerror = () => reject(new Error('โหลดบริการข้อมูลโปรเจกต์ไม่สำเร็จ'));
		document.head.append(script);
	});
}

function startOfDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
	return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatTaskDueDate(value, today) {
	if (!value) return 'No due date';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	if (isSameDay(date, today)) return 'วันนี้';
	return date.toLocaleDateString('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric' });
}

function hasStoredAuthToken() {
	try {
		return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
	} catch {
		return false;
	}
}

function renderProgress(dashboard, progressValue) {
	const progressPercentage = dashboard.querySelector('#progressBarPercentageDashboard');
	const progressBar = dashboard.querySelector('#progressBardashboard');
	const progress = Math.min(100, Math.max(0, Number(progressValue) || 0));

	if (progressPercentage) progressPercentage.textContent = `${progress}%`;
	if (!progressBar) return;

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

// Loads the project, its tasks and the current user from the backend and fills the dashboard.
async function loadDashboardData(dashboard, selected) {
	const groupName = dashboard.querySelector('#groupNameDashboard');
	const subject = dashboard.querySelector('#subjectGroupDashboard');
	const upcomingList = dashboard.querySelector('#upcomingListDashboard');
	const todayList = dashboard.querySelector('#yourTaskListDashboard');

	showDashboardMessage(upcomingList, 'Loading...');
	showDashboardMessage(todayList, 'Loading...');

	try {
		const api = await loadProjectApi();
		const project = await api.findProject(selected);
		if (!project) throw new Error('ไม่พบโปรเจกต์นี้ในบัญชีของคุณ');

		const tasks = await api.getProjectTasks(project.projectId);
		if (!dashboard.isConnected) return;

		const today = new Date();
		const openTasks = tasks.filter((task) => task.status !== 'done');
		const byDueDate = (a, b) => new Date(a.dueDate || 8.64e15) - new Date(b.dueDate || 8.64e15);

		// Task Today: every unfinished task of this project that is due today.
		const dueToday = openTasks
			.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), today))
			.sort(byDueDate);
		// Upcoming: unfinished tasks due after today, soonest first.
		const upcoming = openTasks
			.filter((task) => task.dueDate && startOfDay(new Date(task.dueDate)) > startOfDay(today))
			.sort(byDueDate);

		const format = (task) => ({ ...task, dueDate: formatTaskDueDate(task.dueDate, today) });

		if (groupName) groupName.textContent = project.projectName || '';
		if (subject) subject.textContent = project.subjectCode || '';
		renderProgress(dashboard, project.progress);
		renderDashboardTaskCards(upcomingList, upcoming.map(format), 'ไม่มีงานที่ใกล้ถึงกำหนด');
		renderDashboardTaskCards(todayList, dueToday.map(format), 'วันนี้ไม่มีงานที่ครบกำหนด');
	} catch (error) {
		if (!dashboard.isConnected) return;
		showDashboardMessage(upcomingList, error.message);
		showDashboardMessage(todayList, error.message);
	}
}

document.addEventListener('dashboard:loaded', (event) => {
	const dashboard = document.querySelector('#contentBox .dashBoardpage');
	if (!dashboard) return;

	const project = event.detail || {};
	const groupName = dashboard.querySelector('#groupNameDashboard');
	const subject = dashboard.querySelector('#subjectGroupDashboard');

	// Show what the project card already knows straight away; the backend data replaces it when it arrives.
	if (groupName) groupName.textContent = project.groupName || '';
	if (subject) subject.textContent = project.subject || '';
	renderProgress(dashboard, project.progress);

	if (hasStoredAuthToken()) {
		loadDashboardData(dashboard, project);
		return;
	}

	renderDashboardTaskCards(dashboard.querySelector('#upcomingListDashboard'), project.upcomingTasks || sampleUpcomingTasks);
	renderDashboardTaskCards(dashboard.querySelector('#yourTaskListDashboard'), project.todayTasks || sampleTodayTasks);
});
