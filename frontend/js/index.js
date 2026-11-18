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
	calendar: new URL('../pages/calender.html', scriptUrl),
	meeting: new URL('../pages/meeting.html', scriptUrl),
	createtask: new URL('../pages/createTask.html', scriptUrl),
	resources: new URL('../pages/resource.html', scriptUrl),
};
const pageScriptUrls = {
	project: new URL('../js/project.js', scriptUrl),
	dashboard: new URL('../js/dashboard.js', scriptUrl),
	creategroup: new URL('../js/creategroup.js', scriptUrl),
	addmember: new URL('../js/addmember.js', scriptUrl),
	members: new URL('../js/members.js', scriptUrl),
	task: new URL('../js/task.js', scriptUrl),
	calendar: new URL('../js/calendar.js', scriptUrl),
	meeting: new URL('../js/meeting.js', scriptUrl),
	createtask: new URL('../js/createTask.js', scriptUrl),
	resources: new URL('../js/resource.js', scriptUrl),
};
const pageApiScriptUrls = {
	project: new URL('../api/project-api.js', scriptUrl),
	members: new URL('../api/member-api.js', scriptUrl),
	resources: new URL('../api/resource-api.js', scriptUrl),
};
const pageTitles = {
	project: 'Projects',
	creategroup: 'Create Group',
	addmember: 'Add Members',
	dashboard: 'Dashboard',
	members: 'Members',
	task: 'Tasks',
	calendar: 'Calendar',
	meeting: 'Create Meeting',
	createtask: 'Task',
	resources: 'Resource',
};
const pageScriptPromises = {};
const pageApiScriptPromises = {};
let selectedProject = null;
let projectDraft = null;
let activeDropdown = null;

document.title = pageTitles.project;

function hasStoredAuthToken() {
	try {
		return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
	} catch {
		return false;
	}
}

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
	if (activeDropdown === 'profile') {
		profileDropdown.hidden = true;
		userProfile?.setAttribute('aria-expanded', 'false');
	} else if (activeDropdown === 'notification') {
		notificationDropdown.hidden = true;
		notificationTrigger?.setAttribute('aria-expanded', 'false');
	}
	activeDropdown = null;
}

function toggleDropdown(name) {
	if (activeDropdown === name) {
		closeDropdown();
		return;
	}
	closeDropdown();
	activeDropdown = name;

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
}

notificationTrigger?.addEventListener('click', () => toggleDropdown('notification'));
userProfile?.addEventListener('click', () => toggleDropdown('profile'));
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

function getProjectPageData(element) {
	return {
		projectId: element.dataset.projectId,
		groupName: element.dataset.projectName,
		subject: element.dataset.subjectCode,
		subjectCode: element.dataset.subjectCode,
		progress: element.dataset.progress,
		dueDate: element.dataset.dueDate,
		members: JSON.parse(element.dataset.members || '[]'),
	};
}

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

function loadPageApiScript(page) {
	const scriptUrl = pageApiScriptUrls[page];
	if (!scriptUrl) return Promise.resolve();
	if (page === 'project' && window.projectApi) return Promise.resolve();

	if (!pageApiScriptPromises[page]) {
		pageApiScriptPromises[page] = new Promise((resolve, reject) => {
			const pageScript = document.createElement('script');
			pageScript.src = scriptUrl.href;
			pageScript.onload = resolve;
			pageScript.onerror = () => {
				pageApiScriptPromises[page] = null;
				reject(new Error(`Unable to load ${page} API`));
			};
			document.body.append(pageScript);
		});
	}

	return pageApiScriptPromises[page];
}

async function loadPage(page, pageData = null) {
	if (!contentBox) return;
	const requiresProject = Array.from(projectContextLinks).some((link) => link.dataset.page === page
		|| (page === 'meeting' && link.dataset.page === 'calendar'));
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
			const isActive = button.dataset.page === page
				|| (page === 'meeting' && button.dataset.page === 'calendar');
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
			await Promise.all([loadPageScript('members'), loadPageApiScript('members')]);
			document.dispatchEvent(new CustomEvent('member:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'task') {
			await loadPageScript('task');
			document.dispatchEvent(new CustomEvent('task:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'calendar') {
			await loadPageScript('calendar');
			document.dispatchEvent(new CustomEvent('calendar:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'meeting') {
			await loadPageScript('meeting');
			document.dispatchEvent(new CustomEvent('meeting:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'createtask') {
			await loadPageScript('createtask');
			document.dispatchEvent(new CustomEvent('createtask:loaded', {
				detail: pageData || selectedProject || {},
			}));
		} else if (page === 'resources') {
            await loadPageScript('resources');
            await loadPageApiScript('resources');
            document.dispatchEvent(new CustomEvent('resources:loaded', {
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

document.addEventListener('addmember:back-existing', () => {
	loadPage('members', selectedProject);
});

document.addEventListener('project:created', (event) => {
	const project = event.detail || {};
	loadPage('dashboard', {
		projectId: project.projectId,
		groupName: project.projectName || '',
		subject: project.subjectCode || '',
		subjectCode: project.subjectCode || '',
		progress: project.progress || 0,
		dueDate: project.dueDate || '',
		members: project.members || [],
		creationWarning: project.creationWarning || '',
	});
});

document.addEventListener('project:create-failed', (event) => {
	document.dispatchEvent(new CustomEvent('addmember:error', {
		detail: { message: event.detail?.message || 'ไม่สามารถสร้างโปรเจกต์ได้' },
	}));
});

document.addEventListener('createtask:done', (event) => {
	loadPage('task', event.detail || selectedProject);
});

document.addEventListener('dashboard:create-task', () => {
	loadPage('createtask', selectedProject);
});

document.addEventListener('task:edit', (event) => {
	loadPage('createtask', {
		...(selectedProject || {}),
		taskToEdit: event.detail,
	});
});

document.addEventListener('meeting:created', (event) => {
	loadPage('calendar', event.detail || selectedProject);
});

document.addEventListener('meeting:back', (event) => {
	loadPage('calendar', event.detail || selectedProject);
});

document.addEventListener('calendar:edit-meeting', (event) => {
	const detail = event.detail || {};
	const project = detail.project || selectedProject || {};
	loadPage('meeting', {
		...project,
		meeting: detail.meeting,
		calendarYear: detail.calendarYear,
		calendarMonth: detail.calendarMonth,
	});
});

document.addEventListener('meeting:updated', (event) => {
	loadPage('calendar', event.detail || selectedProject);
});

document.addEventListener('addmember:create', async (event) => {
	const detail = event.detail || {};
	if (detail.projectId) {
		if (!hasStoredAuthToken()) {
			if (selectedProject && String(selectedProject.projectId) === String(detail.projectId)) {
				const members = selectedProject.members || [];
				const memberIds = new Set(members.map((member) => String(member.studentId || member.userId)));
				selectedProject.members = members.concat((detail.members || []).filter((member) => {
					const memberId = String(member.studentId || member.userId);
					if (memberIds.has(memberId)) return false;
					memberIds.add(memberId);
					return true;
				}));
			}
			document.dispatchEvent(new CustomEvent('project:members-added', { detail }));
			await loadPage('members', selectedProject);
			return;
		}

		try {
			await loadPageApiScript('project');
			const existingMembers = await window.projectApi.getProjectMembers(detail.projectId);
			const existingIds = new Set(existingMembers.map((member) => String(
				member.tu_id || member.tuId || member.studentId || '',
			)));
			const failures = [];
			for (const memberId of detail.invitedMemberIds || []) {
				if (existingIds.has(String(memberId))) continue;
				try {
					await window.projectApi.addProjectMember(detail.projectId, memberId);
				} catch (error) {
					failures.push(`${memberId}: ${error.message}`);
				}
			}
			if (failures.length) throw new Error(`เพิ่มสมาชิกไม่สำเร็จ - ${failures.join(' / ')}`);
			await loadPage('members', selectedProject);
		} catch (error) {
			document.dispatchEvent(new CustomEvent('addmember:error', {
				detail: { message: error.message },
			}));
		}
		return;
	}

	const project = {
		projectName: detail.groupName,
		subjectCode: detail.subject,
		dueDate: detail.dueDate,
		members: detail.members || [],
		progress: 0,
	};

	try {
		await loadPageScript('project');
		document.dispatchEvent(new CustomEvent('project:create', { detail: project }));
	} catch (error) {
		document.dispatchEvent(new CustomEvent('addmember:error', {
			detail: { message: error.message || 'ไม่สามารถสร้างโปรเจกต์ได้' },
		}));
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
	if (event.target.closest('.calendar-create-meeting')) {
		loadPage('meeting', selectedProject);
		return;
	}

	if (event.target.closest('#createGroupIcon')) {
		loadPage('creategroup');
		return;
	}

	if (event.target.closest('#createTaskIcon')) {
		loadPage('createtask', selectedProject);
		return;
	}

	if (event.target.closest('.addMember-btn')) {
		loadPage('addmember', {
			...(selectedProject || {}),
			groupName: selectedProject?.groupName || selectedProject?.projectName || '',
			subject: selectedProject?.subject || selectedProject?.subjectCode || '',
		});
		return;
	}

	if (event.target.closest('#back-to-tasks')) {
		loadPage('task', selectedProject);
		return;
	}

	const projectCard = event.target.closest('.project-card');
	if (projectCard) {
		loadPage('dashboard', getProjectPageData(projectCard));
	}
});

contentBox?.addEventListener('keydown', (event) => {
	const projectCard = event.target.closest('.project-card');
	if (!projectCard || (event.key !== 'Enter' && event.key !== ' ')) return;
	event.preventDefault();
	loadPage('dashboard', getProjectPageData(projectCard));
});

setProjectContextLinksVisible(false);
loadPage('project');

if (mainContainer && sidebar) {
	sidebar.addEventListener('click', (event) => {
		const projectLink = event.target.closest('.sidebar-project-link');
		if (projectLink) {
			loadPage('dashboard', getProjectPageData(projectLink));
			if (window.matchMedia('(max-width: 850px)').matches) {
				mainContainer.classList.remove('is-expanded');
			}
			return;
		}

		// The "Projects" heading is only a label for the list below; it does not navigate.
		if (event.target.closest('.sidebar-projects__header')) return;

		if (event.target.closest('.sidebar-link')) {
			if (window.matchMedia('(max-width: 850px)').matches) {
				mainContainer.classList.remove('is-expanded');
			}
			return;
		}
		mainContainer.classList.toggle('is-expanded');
	});
}
