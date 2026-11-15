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
	done: 'Done',
};

// The backend uses todo / doing / done; the card styles use in_progress for "doing".
function normalizeTaskStatus(status) {
	const value = String(status || 'todo').toLowerCase().replaceAll(' ', '_');
	if (value === 'doing' || value === 'inprogress') return 'in_progress';
	if (value === 'completed') return 'done';
	return taskStatusLabels[value] ? value : 'todo';
}

function createDashboardTaskStatus(task, card, onStatusUpdated) {
	const labels = [
		['todo', 'To Do'],
		['in_progress', 'In progress'],
		['done', 'Done'],
	];
	const control = document.createElement('div');
	control.className = 'dashboard-task-status-control';

	const trigger = document.createElement('button');
	trigger.className = 'dashboard-task-card__status';
	trigger.type = 'button';
	trigger.setAttribute('aria-haspopup', 'menu');
	trigger.setAttribute('aria-expanded', 'false');

	const selectedLabel = document.createElement('span');
	selectedLabel.className = 'dashboard-task-status-label';
	const chevron = document.createElement('span');
	chevron.className = 'dashboard-task-status-chevron';
	chevron.setAttribute('aria-hidden', 'true');
	chevron.textContent = '▾';
	trigger.append(selectedLabel, chevron);

	const menu = document.createElement('div');
	menu.className = 'dashboard-task-status-menu';
	menu.setAttribute('role', 'menu');
	menu.setAttribute('aria-label', `Status options for ${task.taskTitle || task.title || 'task'}`);
	menu.hidden = true;

	const options = labels.map(([value, label]) => {
		const option = document.createElement('button');
		option.className = 'dashboard-task-status-option';
		option.type = 'button';
		option.setAttribute('role', 'menuitemradio');
		option.dataset.value = value;
		option.textContent = label;
		option.addEventListener('click', async () => {
			const previousStatus = normalizeTaskStatus(task.status);
			const nextStatus = option.dataset.value;
			closeMenu();
			trigger.disabled = true;
			card.querySelector('.dashboard-task-card__status-error')?.remove();

			try {
				if (hasStoredAuthToken()) {
					if (!window.taskApi) throw new Error('Task service is unavailable');
					if (!task.taskId) throw new Error('Task ID is missing');
					const backendStatus = nextStatus === 'in_progress' ? 'doing' : nextStatus;
					const updatedTask = await window.taskApi.updateTaskStatus(task.taskId, backendStatus);
					task.status = updatedTask?.status || backendStatus;
				} else {
					task.status = nextStatus;
				}

				card.dataset.status = normalizeTaskStatus(task.status);
				if (hasStoredAuthToken()) {
					const dashboard = card.closest('.dashBoardpage');
					const projectId = task.projectId || dashboard?.dataset.projectId;
					await refreshDashboardProgress(dashboard, projectId, card);
				}
			} catch (error) {
				task.status = previousStatus;
				const errorMessage = document.createElement('span');
				errorMessage.className = 'dashboard-task-card__status-error';
				errorMessage.setAttribute('role', 'status');
				errorMessage.textContent = error.message;
				card.querySelector('.dashboard-task-card__details')?.append(errorMessage);
			} finally {
				trigger.disabled = false;
				syncControl();
				trigger.focus();
			}
		});
		menu.append(option);
		return option;
	});

	function syncControl() {
		const status = normalizeTaskStatus(task.status);
		const label = labels.find(([value]) => value === status)?.[1] || labels[0][1];
		selectedLabel.textContent = label;
		trigger.setAttribute('aria-label', `${task.taskTitle || task.title || 'Task'}: ${label}`);
		options.forEach((option) => {
			const selected = option.dataset.value === status;
			option.setAttribute('aria-checked', String(selected));
			option.tabIndex = selected ? 0 : -1;
		});
	}

	function closeMenu(restoreFocus = false) {
		menu.hidden = true;
		trigger.setAttribute('aria-expanded', 'false');
		card.classList.remove('has-open-status-menu');
		document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
		if (restoreFocus) trigger.focus();
	}

	function handleOutsidePointerDown(event) {
		if (!control.contains(event.target)) closeMenu();
	}

	function openMenu(focusSelected = false) {
		if (trigger.disabled) return;
		menu.hidden = false;
		trigger.setAttribute('aria-expanded', 'true');
		card.classList.add('has-open-status-menu');
		document.addEventListener('pointerdown', handleOutsidePointerDown, true);
		if (focusSelected) {
			options.find((option) => option.getAttribute('aria-checked') === 'true')?.focus();
		}
	}

	trigger.addEventListener('click', () => {
		if (menu.hidden) openMenu();
		else closeMenu();
	});

	trigger.addEventListener('keydown', (event) => {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		openMenu(true);
	});

	menu.addEventListener('keydown', (event) => {
		const currentIndex = options.indexOf(document.activeElement);
		let nextIndex = currentIndex;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeMenu(true);
			return;
		}
		if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
		else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
		else if (event.key === 'Home') nextIndex = 0;
		else if (event.key === 'End') nextIndex = options.length - 1;
		else return;

		event.preventDefault();
		options[nextIndex].focus();
	});

	control.addEventListener('click', (event) => event.stopPropagation());
	control.append(trigger, menu);
	syncControl();
	return control;
}

function createDashboardTaskCard(task, onStatusUpdated) {
	const card = document.createElement('article');
	const status = normalizeTaskStatus(task.status);
	card.className = 'dashboard-task-card';
	card.dataset.status = status;
	card.dataset.taskId = task.taskId ?? '';

	const header = document.createElement('div');
	header.className = 'dashboard-task-card__header';

	const titleButton = document.createElement('button');
	titleButton.className = 'dashboard-task-card__title-button';
	titleButton.type = 'button';
	titleButton.setAttribute('aria-expanded', 'false');

	const title = document.createElement('h3');
	title.className = 'dashboard-task-card__title';
	titleButton.textContent = task.taskTitle || task.title || 'Untitled task';
	title.append(titleButton);

	const titleDate = document.createElement('div');
	titleDate.className = 'dashboard-task-card__title-date';
	const dueDate = document.createElement('span');
	dueDate.className = 'dashboard-task-card__due-date';
	dueDate.textContent = task.dueDate || 'No due date';
	titleDate.append(title, dueDate);

	const descriptionPanel = document.createElement('div');
	descriptionPanel.className = 'dashboard-task-card__description-panel';
	descriptionPanel.setAttribute('aria-hidden', 'true');
	descriptionPanel.inert = true;

	const descriptionContent = document.createElement('div');
	descriptionContent.className = 'dashboard-task-card__description-content';
	const description = document.createElement('p');
	description.className = 'dashboard-task-card__description';
	description.textContent = task.taskDescription || task.description || 'No description';
	descriptionContent.append(description);
	descriptionPanel.append(descriptionContent);

	const details = document.createElement('div');
	details.className = 'dashboard-task-card__details';
	const statusControl = createDashboardTaskStatus(task, card, onStatusUpdated);
	details.append(statusControl);
	header.append(titleDate, details);
	card.append(header, descriptionPanel);

	card.addEventListener('click', (event) => {
		if (event.target.closest('.dashboard-task-status-control')) return;

		const isExpanded = card.classList.toggle('is-expanded');
		descriptionPanel.setAttribute('aria-hidden', String(!isExpanded));
		descriptionPanel.inert = !isExpanded;
		titleButton.setAttribute('aria-expanded', String(isExpanded));
	});
	return card;
}

function renderDashboardTaskCards(container, tasks, emptyMessage = '', onStatusUpdated) {
	if (!container) return;
	if (!tasks.length && emptyMessage) {
		const message = document.createElement('p');
		message.textContent = emptyMessage;
		container.replaceChildren(message);
		return;
	}
	container.replaceChildren(...tasks.map((task) => createDashboardTaskCard(task, onStatusUpdated)));
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

async function refreshDashboardProgress(dashboard, projectId, card) {
	try {
		if (!projectId) throw new Error('Project ID is missing');
		const api = await loadProjectApi();
		const progress = await api.getProjectProgress(projectId);
		if (!dashboard?.isConnected || String(dashboard.dataset.projectId) !== String(projectId)) return;
		renderProgress(dashboard, progress.projectProgress);
	} catch (error) {
		console.error('Task status was saved, but dashboard progress could not be refreshed:', error);
		const errorMessage = document.createElement('span');
		errorMessage.className = 'dashboard-task-card__status-error';
		errorMessage.setAttribute('role', 'status');
		errorMessage.textContent = `บันทึกสถานะแล้ว แต่โหลดความคืบหน้าใหม่ไม่สำเร็จ: ${error.message}`;
		card.querySelector('.dashboard-task-card__details')?.append(errorMessage);
	}
}

// Loads the project, the current user's tasks, and project progress for the dashboard.
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
		dashboard.dataset.projectId = String(project.projectId);

		const [tasks, progress, currentUser] = await Promise.all([
			api.getProjectTasks(project.projectId),
			api.getProjectProgress(project.projectId),
			api.getCurrentUser(),
		]);
		if (!dashboard.isConnected) return;
		if (currentUser?.userId == null) throw new Error('ไม่สามารถระบุผู้ใช้ปัจจุบันได้');

		const today = new Date();
		const openTasks = tasks
			.filter((task) => task.assigneeId != null && String(task.assigneeId) === String(currentUser.userId))
			.filter((task) => task.status !== 'done');
		const byDueDate = (a, b) => new Date(a.dueDate || 8.64e15) - new Date(b.dueDate || 8.64e15);

		// Task Today: the current user's unfinished tasks due today.
		const dueToday = openTasks
			.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), today))
			.sort(byDueDate);
		// Upcoming: the current user's unfinished tasks due after today, soonest first.
		const upcoming = openTasks
			.filter((task) => task.dueDate && startOfDay(new Date(task.dueDate)) > startOfDay(today))
			.sort(byDueDate);

		const format = (task) => ({ ...task, dueDate: formatTaskDueDate(task.dueDate, today) });
		const refreshProgress = async (card) => {
			try {
				const updatedProject = await api.getProject(project.projectId);
				if (dashboard.isConnected) renderProgress(dashboard, updatedProject.progress);
			} catch (error) {
				if (!dashboard.isConnected) return;
				const errorMessage = document.createElement('span');
				errorMessage.className = 'dashboard-task-card__status-error';
				errorMessage.setAttribute('role', 'status');
				errorMessage.textContent = `Task status updated, but project progress could not be refreshed: ${error.message}`;
				card.querySelector('.dashboard-task-card__details')?.append(errorMessage);
			}
		};

		if (groupName) groupName.textContent = project.projectName || '';
		if (subject) subject.textContent = project.subjectCode || '';
		renderProgress(dashboard, progress.projectProgress);
		renderDashboardTaskCards(upcomingList, upcoming.map(format), 'ไม่มีงานที่ใกล้ถึงกำหนด');
		renderDashboardTaskCards(todayList, dueToday.map(format), 'วันนี้ไม่มีงานที่ครบกำหนด');
	} catch (error) {
		if (!dashboard.isConnected) return;
		showDashboardMessage(upcomingList, error.message);
		showDashboardMessage(todayList, error.message);
	}
}

document.addEventListener('click', (event) => {
	if (!event.target.closest('.dashBoardpage .addNewTask-btn')) return;
	document.dispatchEvent(new Event('dashboard:create-task'));
});

document.addEventListener('dashboard:loaded', (event) => {
	const dashboard = document.querySelector('#contentBox .dashBoardpage');
	if (!dashboard) return;

	const project = event.detail || {};
	const groupName = dashboard.querySelector('#groupNameDashboard');
	const subject = dashboard.querySelector('#subjectGroupDashboard');
	dashboard.dataset.projectId = project.projectId == null ? '' : String(project.projectId);

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
