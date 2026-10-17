const mainContainer = document.querySelector('.main-container');
const sidebar = mainContainer?.querySelector('aside');
const contentBox = document.querySelector('#contentBox');
const homeButton = document.querySelector('.sidebar-link[aria-current="page"]');
const scriptUrl = document.currentScript?.src || window.location.href;
const projectPageUrl = new URL('../pages/project.html', scriptUrl);
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

async function loadProjectPage() {
	if (!contentBox) return;

	try {
		const response = await fetch(projectPageUrl);
		if (!response.ok) {
			throw new Error(`Unable to load project page (${response.status})`);
		}

		contentBox.innerHTML = await response.text();
		await loadProjectScript();
		document.dispatchEvent(new Event('project:loaded'));
	} catch {
		contentBox.textContent = 'ไม่สามารถโหลดหน้า project ได้';
	}
}

homeButton?.addEventListener('click', loadProjectPage);
loadProjectPage();

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


