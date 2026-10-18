const mainContainer = document.querySelector('.main-container');
const sidebar = mainContainer?.querySelector('aside');
const contentBox = document.querySelector('#contentBox');
const pageButtons = document.querySelectorAll('.sidebar-link[data-page]');
const projectContextLinks = sidebar?.querySelectorAll('[data-project-context]') || [];
const scriptUrl = document.currentScript?.src || window.location.href;
const pageUrls = {
	project: new URL('../pages/project.html', scriptUrl),
	creategroup: new URL('../pages/creategroup.html', scriptUrl),
	dashboard: new URL('../pages/dashboard.html', scriptUrl),
	members: new URL('../pages/members.html', scriptUrl),
};
const pageScriptUrls = {
	project: new URL('../js/project.js', scriptUrl),
	dashboard: new URL('../js/dashboard.js', scriptUrl),
	creategroup: new URL('../js/creategroup.js', scriptUrl),
	members: new URL('../js/members.js', scriptUrl),
};
const pageScriptPromises = {};
let selectedProject = null;

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
		if (page === 'project' || page === 'creategroup') {
			selectedProject = null;
		} else if (pageData) {
			selectedProject = pageData;
		}
		setProjectContextLinksVisible(Boolean(selectedProject) && page !== 'project' && page !== 'creategroup');

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
			document.dispatchEvent(new Event('creategroup:loaded'));
		} else if (page === 'members') {
			await loadPageScript('members');
			document.dispatchEvent(new CustomEvent('member:loaded', {
				detail: pageData || selectedProject || {},
			}));
		}
	} catch {
		contentBox.textContent = `ไม่สามารถโหลดหน้า ${page} ได้`;
	}
}

pageButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const pageData = button.hasAttribute('data-project-context') ? selectedProject : null;
		loadPage(button.dataset.page, pageData);
	});
});

contentBox?.addEventListener('click', (event) => {
	if (event.target.closest('#createGroupIcon')) {
		loadPage('creategroup');
		return;
	}

	const projectCard = event.target.closest('.project-card');
	if (projectCard) {
		loadPage('dashboard', {
			groupName: projectCard.dataset.projectName,
			subject: projectCard.dataset.subjectCode,
			progress: projectCard.dataset.progress,
		});
	}
});

contentBox?.addEventListener('keydown', (event) => {
	const projectCard = event.target.closest('.project-card');
	if (!projectCard || (event.key !== 'Enter' && event.key !== ' ')) return;
	event.preventDefault();
	loadPage('dashboard', {
		groupName: projectCard.dataset.projectName,
		subject: projectCard.dataset.subjectCode,
		progress: projectCard.dataset.progress,
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
		}, 2000);
	});
}


