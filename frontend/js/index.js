const mainContainer = document.querySelector('.main-container');
const sidebar = mainContainer?.querySelector('aside');
const contentBox = document.querySelector('#contentBox');
const logo = document.querySelector('.logo');
const notificationTrigger = document.querySelector('#notificationTrigger');
const notificationDropdown = document.querySelector('#notificationDropdown');
const userProfile = document.querySelector('.user-profile');
const profileDropdown = document.querySelector('#profileDropdown');
const pageButtons = document.querySelectorAll('.sidebar-link[data-page]');
const projectContextLinks = sidebar?.querySelectorAll('[data-project-context]') || [];
const scriptUrl = document.currentScript?.src || window.location.href;

// Page URL html & js
const pageUrls = {
	project: new URL('../pages/project.html', scriptUrl),
	creategroup: new URL('../pages/creategroup.html', scriptUrl),
	addmember: new URL('../pages/addmember.html', scriptUrl),
	dashboard: new URL('../pages/dashboard.html', scriptUrl),
	members: new URL('../pages/members.html', scriptUrl),
	task: new URL('../pages/task.html', scriptUrl),
	createtask: new URL('../pages/createTask.html', scriptUrl),
};
const pageScriptUrls = {
	project: new URL('../js/project.js', scriptUrl),
	dashboard: new URL('../js/dashboard.js', scriptUrl),
	creategroup: new URL('../js/creategroup.js', scriptUrl),
	addmember: new URL('../js/addmember.js', scriptUrl),
	members: new URL('../js/members.js', scriptUrl),
	task: new URL('../js/task.js', scriptUrl),
	createtask: new URL('../js/createTask.js', scriptUrl),
};
const pageTitles = {
	project: 'Projects',
	creategroup: 'Create Group',
	addmember: 'Add Members',
	dashboard: 'Dashboard',
	members: 'Members',
	task: 'Tasks',
};
const pageScriptPromises = {};
let selectedProject = null;
let projectDraft = null;
let dropdownCloseTimer = null;
let activeDropdown = null;

document.title = pageTitles.project;

function positionDropdown(trigger, dropdown) {
	if (!trigger || !dropdown || dropdown.hidden) return;

	const triggerRect = trigger.getBoundingClientRect();
	const dropdownRect = dropdown.getBoundingClientRect();
	const padding = 8;
	const gap = 8;
	const left = Math.max(padding, Math.min(
		triggerRect.right - dropdownRect.width,
		window.innerWidth - dropdownRect.width - padding,
	));
	const below = triggerRect.bottom + gap;
	const top = below + dropdownRect.height <= window.innerHeight - padding
		? below
		: Math.max(padding, triggerRect.top - dropdownRect.height - gap);

	dropdown.style.left = `${left}px`;
	dropdown.style.top = `${top}px`;
}

function closeDropdown() {
	if (dropdownCloseTimer !== null) {
		window.clearTimeout(dropdownCloseTimer);
		dropdownCloseTimer = null;
	}

	if (activeDropdown === 'profile') {
		profileDropdown.hidden = true;
		userProfile?.setAttribute('aria-expanded', 'false');
	} else if (activeDropdown === 'notification') {
		notificationDropdown.hidden = true;
		notificationTrigger?.setAttribute('aria-expanded', 'false');
	}
	activeDropdown = null;
}

function clearDropdownCloseTimer() {
	if (dropdownCloseTimer === null) return;

	window.clearTimeout(dropdownCloseTimer);
	dropdownCloseTimer = null;
}

function scheduleDropdownClose(name) {
	clearDropdownCloseTimer();
	if (activeDropdown !== name) return;
	const trigger = name === 'profile' ? userProfile : notificationTrigger;
	const dropdown = name === 'profile' ? profileDropdown : notificationDropdown;
	if (trigger?.matches(':hover') || dropdown?.matches(':hover')) return;

	dropdownCloseTimer = window.setTimeout(() => {
		if (activeDropdown === name) closeDropdown();
	}, 2000);
}

function toggleDropdown(name) {
	if (activeDropdown === name) {
		closeDropdown();
		return;
	}

	closeDropdown();
	activeDropdown = name;
	clearDropdownCloseTimer();

	if (name === 'profile') {
		profileDropdown.hidden = false;
		userProfile?.setAttribute('aria-expanded', 'true');
		positionDropdown(userProfile, profileDropdown);
		document.dispatchEvent(new Event('profile:opened'));
	} else {
		notificationDropdown.hidden = false;
		notificationTrigger?.setAttribute('aria-expanded', 'true');
		positionDropdown(notificationTrigger, notificationDropdown);
	}

	scheduleDropdownClose(name);
}

notificationTrigger?.addEventListener('click', () => toggleDropdown('notification'));
userProfile?.addEventListener('click', () => toggleDropdown('profile'));
[
	['notification', notificationTrigger],
	['notification', notificationDropdown],
	['profile', userProfile],
	['profile', profileDropdown],
].forEach(([name, element]) => {
	element?.addEventListener('mouseenter', () => clearDropdownCloseTimer());
	element?.addEventListener('mouseleave', () => scheduleDropdownClose(name));
});
notificationTrigger?.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	toggleDropdown('notification');
});
userProfile?.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	toggleDropdown('profile');
});

document.addEventListener('click', (event) => {
	if (
		notificationTrigger?.contains(event.target)
		|| notificationDropdown?.contains(event.target)
		|| userProfile?.contains(event.target)
		|| profileDropdown?.contains(event.target)
	) return;
	closeDropdown();
});

document.addEventListener('keydown', (event) => {
	if (event.key !== 'Escape' || activeDropdown === null) return;
	const lastTrigger = activeDropdown === 'profile' ? userProfile : notificationTrigger;
	closeDropdown();
	lastTrigger?.focus();
});

window.addEventListener('resize', () => {
	if (activeDropdown === 'profile') positionDropdown(userProfile, profileDropdown);
	if (activeDropdown === 'notification') positionDropdown(notificationTrigger, notificationDropdown);
});
window.addEventListener('scroll', () => {
	if (activeDropdown === 'profile') positionDropdown(userProfile, profileDropdown);
	if (activeDropdown === 'notification') positionDropdown(notificationTrigger, notificationDropdown);
}, true);

function setProjectContextLinksVisible(visible) {
	projectContextLinks.forEach((link) => {
		link.hidden = !visible;
	});
}

function loadPageScript(page) {
	if (!pageScriptPromises[page]) {
		pageScriptPromises[page] = new Promise((resolve, reject) => {
			const pageScript = document.createElement('script');
			pageScript.src = pageScriptUrls[page].href;
			pageScript.onload = resolve;
			pageScript.onerror = () => {
				pageScriptPromises[page] = null;
				reject(new Error(`Unable to load ${page} script`));
			};
			document.body.append(pageScript);
		});
	}

	return pageScriptPromises[page];
}

async function loadPage(page, pageData = null) {
	if (!contentBox) return;
	const requiresProject = Array.from(projectContextLinks).some((link) => link.dataset.page === page);
	if (requiresProject && !pageData && !selectedProject) return;

	const pageUrl = pageUrls[page];
	if (!pageUrl) return;

	try {
		const response = await fetch(pageUrl);
		if (!response.ok) {
			throw new Error(`Unable to load ${page} page (${response.status})`);
		}

		contentBox.innerHTML = await response.text();
		document.title = pageTitles[page] || 'App';

		if (page === 'project') {
			selectedProject = null;
			projectDraft = null;
		} else if (page === 'creategroup') {
			selectedProject = null;
			projectDraft = pageData || null;
		} else if (page === 'dashboard' && pageData) {
			selectedProject = pageData;
		} else if (page === 'members' && pageData) {
			selectedProject = pageData;
		} else if (page === 'addmember') {
			projectDraft = pageData || projectDraft;
		}
		setProjectContextLinksVisible(Boolean(selectedProject) && page !== 'project' && page !== 'creategroup' && page !== 'addmember');

		pageButtons.forEach((button) => {
			const isActive = button.dataset.page === page;
			button.classList.toggle('sidebar-link-active', isActive);
			if (isActive) {
				button.setAttribute('aria-current', 'page');
			} else {
				button.removeAttribute('aria-current');
			}
		});

		if (page === 'project') {
			await loadPageScript('project');
			document.dispatchEvent(new Event('project:loaded'));
		} else if (page === 'dashboard') {
			await loadPageScript('dashboard');
			document.dispatchEvent(new CustomEvent('dashboard:loaded', {
				detail: pageData || {},
			}));
		} else if (page === 'creategroup') {
			await loadPageScript('creategroup');
			document.dispatchEvent(new CustomEvent('creategroup:loaded', {
				detail: projectDraft || {},
			}));
		} else if (page === 'addmember') {
			await loadPageScript('addmember');
			document.dispatchEvent(new CustomEvent('addmember:loaded', {
				detail: projectDraft || {},
			}));
		} else if (page === 'members') {
			await loadPageScript('members');
			document.dispatchEvent(new CustomEvent('member:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'task') {
			await loadPageScript('task');
			document.dispatchEvent(new CustomEvent('task:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'createtask') {
			await loadPageScript('createtask');
			document.dispatchEvent(new CustomEvent('createtask:loaded', {
				detail: pageData || selectedProject || {},
			}));
		}
	} catch {
		contentBox.textContent = `ไม่สามารถโหลดหน้า ${page} ได้`;
	}
}

document.addEventListener('creategroup:next', (event) => {
	projectDraft = event.detail;
	loadPage('addmember', projectDraft);
});

document.addEventListener('addmember:back', () => {
	loadPage('creategroup', projectDraft);
});

document.addEventListener('addmember:create', async (event) => {
	const project = {
		projectName: event.detail.groupName,
		subjectCode: event.detail.subject,
		dueDate: event.detail.dueDate,
		members: event.detail.members || [],
		progress: 0,
	};

	try {
		await loadPageScript('project');
		document.dispatchEvent(new CustomEvent('project:create', { detail: project }));
		await loadPage('project');
	} catch {
		contentBox.textContent = 'ไม่สามารถสร้าง project ได้';
	}
});

pageButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const pageData = button.hasAttribute('data-project-context') ? selectedProject : null;
		loadPage(button.dataset.page, pageData);
	});
});

logo?.addEventListener('click', () => loadPage('project'));

logo?.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	loadPage('project');
});

contentBox?.addEventListener('click', (event) => {
	if (event.target.closest('#createGroupIcon')) {
		loadPage('creategroup');
		return;
	}

	if (event.target.closest('#createTaskIcon')) {
		loadPage('createtask', selectedProject);
		return;
	}

	if (event.target.closest('#back-to-tasks')) {
		loadPage('task', selectedProject);
		return;
	}

	const projectCard = event.target.closest('.project-card');
	if (projectCard) {
		loadPage('dashboard', {
			projectId: projectCard.dataset.projectId,
			groupName: projectCard.dataset.projectName,
			subject: projectCard.dataset.subjectCode,
			subjectCode: projectCard.dataset.subjectCode,
			progress: projectCard.dataset.progress,
			dueDate: projectCard.dataset.dueDate,
			members: JSON.parse(projectCard.dataset.members || '[]'),
		});
	}
});

contentBox?.addEventListener('keydown', (event) => {
	const projectCard = event.target.closest('.project-card');
	if (!projectCard || (event.key !== 'Enter' && event.key !== ' ')) return;
	event.preventDefault();
	loadPage('dashboard', {
		projectId: projectCard.dataset.projectId,
		groupName: projectCard.dataset.projectName,
		subject: projectCard.dataset.subjectCode,
		subjectCode: projectCard.dataset.subjectCode,
		progress: projectCard.dataset.progress,
		dueDate: projectCard.dataset.dueDate,
		members: JSON.parse(projectCard.dataset.members || '[]'),
	});
});

setProjectContextLinksVisible(false);
loadPage('project');

if (mainContainer && sidebar) {
	let collapseTimer = null;

	sidebar.addEventListener('mouseenter', () => {
		if (collapseTimer !== null) return;
		mainContainer.classList.add('is-expanded');
	});

	sidebar.addEventListener('mouseleave', () => {
		if (collapseTimer !== null) return;

		collapseTimer = window.setTimeout(() => {
			mainContainer.classList.remove('is-expanded');
			collapseTimer = null;
		}, 1000);
	});
}
