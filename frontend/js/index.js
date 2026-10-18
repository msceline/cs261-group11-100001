const mainContainer = document.querySelector('.main-container');
const sidebar = mainContainer?.querySelector('aside');
const contentBox = document.querySelector('#contentBox');
const pageButtons = document.querySelectorAll('.sidebar-link[data-page]');
const scriptUrl = document.currentScript?.src || window.location.href;
const pageUrls = {
	project: new URL('../pages/project.html', scriptUrl),
	creategroup: new URL('../pages/creategroup.html', scriptUrl),
};
const projectScriptUrl = new URL('../js/project.js', scriptUrl);
let projectScriptPromise = null;

function loadProjectScript() {
	if (!projectScriptPromise) {
		projectScriptPromise = new Promise((resolve, reject) => {
			const projectScript = document.createElement('script');
			projectScript.src = projectScriptUrl.href;
			projectScript.onload = resolve;
			projectScript.onerror = () => {
				projectScriptPromise = null;
				reject(new Error('Unable to load project script'));
			};
			document.body.append(projectScript);
		});
	}

	return projectScriptPromise;
}

async function loadPage(page) {
	if (!contentBox) return;
	const pageUrl = pageUrls[page];
	if (!pageUrl) return;

	try {
		const response = await fetch(pageUrl);
		if (!response.ok) {
			throw new Error(`Unable to load ${page} page (${response.status})`);
		}

		contentBox.innerHTML = await response.text();
		if (page === 'creategroup') {
			const dueDateInput = contentBox.querySelector('#dueDate');
			if (dueDateInput) {
				const today = new Date();
				const year = today.getFullYear();
				const month = String(today.getMonth() + 1).padStart(2, '0');
				const day = String(today.getDate()).padStart(2, '0');
				dueDateInput.value = `${year}-${month}-${day}`;
			}
		}

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
			await loadProjectScript();
			document.dispatchEvent(new Event('project:loaded'));
		}
	} catch {
		contentBox.textContent = `ไม่สามารถโหลดหน้า ${page} ได้`;
	}
}

pageButtons.forEach((button) => {
	button.addEventListener('click', () => loadPage(button.dataset.page));
});

contentBox?.addEventListener('click', (event) => {
	if (event.target.closest('#createGroupIcon')) {
		loadPage('creategroup');
	}
});

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


