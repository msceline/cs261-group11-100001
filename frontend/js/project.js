
const projectScriptUrl = document.currentScript?.src || window.location.href;

// Shown only while nobody is logged in (no auth token), so the page can still be previewed without the backend.
const projects = [
	{ projectId: 26001, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS261', progress: 25 },
    { projectId: 26002, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS213', progress: 55 },
    { projectId: 26003, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS221', progress: 75 },
    { projectId: 26004, projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'TU109', progress: 85 },
	{ projectId: 26005, projectName: 'เว็บไซต์จองห้องเรียน', subjectCode: 'CS331', progress: 100 },
];

function createProjectCard(project) {
	const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
	const card = document.createElement('article');
	card.className = 'project-card';
	card.dataset.projectId = project.projectId ?? '';
	card.dataset.projectName = project.projectName || '';
	card.dataset.subjectCode = project.subjectCode || '';
	card.dataset.progress = String(progress);
	card.dataset.dueDate = project.dueDate || '';
	card.dataset.members = JSON.stringify(project.members || []);
	card.tabIndex = 0;
	card.setAttribute('role', 'button');
	card.setAttribute('aria-label', `เปิด dashboard ของ ${project.projectName || 'โปรเจกต์'}`);

	const details = document.createElement('div');
	details.className = 'project-card__details';

	const subject = document.createElement('h4');
	subject.className = 'project-card__subject';
	subject.textContent = project.subjectCode || 'ไม่ระบุวิชา';

	const name = document.createElement('p');
	name.className = 'project-card__name';
	name.textContent = project.projectName || 'ไม่ระบุชื่อโปรเจกต์';

	details.append(subject, name);

	if (project.dueDate || project.members?.length) {
		const metadata = document.createElement('p');
		metadata.className = 'project-card__meta';
		const metadataItems = [];
		if (project.dueDate) metadataItems.push(`กำหนดส่ง ${project.dueDate.slice(0, 10)}`);
		if (project.members?.length) metadataItems.push(`${project.members.length} สมาชิก`);
		metadata.textContent = metadataItems.join(' · ');
		details.append(metadata);
	}

	const progressSection = document.createElement('div');
	progressSection.className = 'project-card__progress';

	const progressLabel = document.createElement('span');
	progressLabel.className = 'project-card__progress-label';
	progressLabel.textContent = `${progress}%`;
    
	const progressTrack = document.createElement('div');
	progressTrack.className = 'project-card__progress-track';
	progressTrack.setAttribute('role', 'progressbar');
	progressTrack.setAttribute('aria-label', `ความคืบหน้า ${project.projectName || 'โปรเจกต์'}`);
	progressTrack.setAttribute('aria-valuemin', '0');
	progressTrack.setAttribute('aria-valuemax', '100');
	progressTrack.setAttribute('aria-valuenow', String(progress));
    
	const progressFill = document.createElement('div');
	progressFill.className = 'project-card__progress-fill';
	progressFill.dataset.progressBand = progress < 25
		? 'red'
		: progress < 50
			? 'orange'
			: progress < 75
				? 'yellow'
				: 'green';
	progressFill.style.width = `${progress}%`;
	progressTrack.append(progressFill);
	progressSection.append(progressTrack, progressLabel);
	card.append(details, progressSection);

	return card;
}

function renderProjectCards(projectItems) {
	renderSidebarProjects(projectItems);

	const processingList = document.getElementById('processTaskList');
	const completeList = document.getElementById('completeTaskList');
	if (!processingList || !completeList) return;

	processingList.replaceChildren();
	completeList.replaceChildren();

	projectItems.forEach((project) => {
		const list = Number(project.progress) >= 100 ? completeList : processingList;
		list.append(createProjectCard(project));
	});
}

function renderSidebarProjects(projectItems) {
	const sidebarList = document.getElementById('sidebarProjectList');
	if (!sidebarList) return;

	const processingProjects = projectItems.filter((project) => Number(project.progress) < 100);
	if (!processingProjects.length) {
		const emptyMessage = document.createElement('span');
		emptyMessage.className = 'sidebar-projects__empty';
		emptyMessage.textContent = 'No projects in progress';
		sidebarList.replaceChildren(emptyMessage);
		return;
	}

	sidebarList.replaceChildren(...processingProjects.map((project) => {
		const link = document.createElement('button');
		link.type = 'button';
		link.className = 'sidebar-project-link';
		link.dataset.projectId = project.projectId ?? '';
		link.dataset.projectName = project.projectName || '';
		link.dataset.subjectCode = project.subjectCode || '';
		link.dataset.progress = String(Number(project.progress) || 0);
		link.dataset.dueDate = project.dueDate || '';
		link.dataset.members = JSON.stringify(project.members || []);
		link.textContent = [project.subjectCode, project.projectName].filter(Boolean).join(' · ');
		link.title = link.textContent;
		return link;
	}));
}

function hasStoredAuthToken() {
	try {
		return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
	} catch {
		return false;
	}
}

function loadProjectApi() {
	if (window.projectApi) return Promise.resolve(window.projectApi);

	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = new URL('../api/project-api.js', projectScriptUrl).href;
		script.onload = () => resolve(window.projectApi);
		script.onerror = () => reject(new Error('โหลดบริการข้อมูลโปรเจกต์ไม่สำเร็จ'));
		document.head.append(script);
	});
}

function showProjectMessage(text) {
	const processingList = document.getElementById('processTaskList');
	const completeList = document.getElementById('completeTaskList');
	if (!processingList || !completeList) return;

	const message = document.createElement('p');
	message.textContent = text;
	processingList.replaceChildren(message);
	completeList.replaceChildren();
}

// A project created while logged in is saved through the backend; the project list waits for that to finish.
let pendingCreate = Promise.resolve();

// Every project the logged-in user belongs to (GET /api/projects), or the sample list without a login.
async function loadProjects() {
	if (!hasStoredAuthToken()) {
		renderProjectCards(projects);
		return;
	}

	showProjectMessage('Loading...');
	try {
		await pendingCreate;
		const api = await loadProjectApi();
		const items = await api.getProjects();
		if (!document.getElementById('processTaskList')) return;

		if (!items.length) {
			showProjectMessage('ยังไม่มีโปรเจกต์');
		} else {
			renderProjectCards(items);
		}

	} catch (error) {
		if (document.getElementById('processTaskList')) showProjectMessage(error.message);
	}
}

// Creates the project, then invites every chosen member (POST /api/projects/{id}/members, host only).
async function createProjectWithMembers(project) {
	const api = await loadProjectApi();
	const created = await api.createProject({
		projectName: project.projectName,
		subjectCode: project.subjectCode,
		dueDate: project.dueDate,
	});
	if (created?.projectId == null) throw new Error('Project was created without an ID.');

	let creationWarning = '';
	const invitedIds = [...new Set((project.members || [])
		.map((member) => member.studentId)
		.filter(Boolean))];
	if (invitedIds.length) {
		try {
			const me = await api.getCurrentUser();
			const ownIds = new Set([me.tu_id, me.studentId].filter(Boolean).map(String));
			const failures = [];
			for (const id of invitedIds.filter((memberId) => !ownIds.has(String(memberId)))) {
				try {
					await api.addProjectMember(created.projectId, id);
				} catch (error) {
					failures.push(`${id}: ${error.message}`);
				}
			}
			if (failures.length) {
				creationWarning = `สร้างโปรเจกต์แล้ว แต่เพิ่มสมาชิกบางคนไม่สำเร็จ: ${failures.join(' / ')}`;
			}
		} catch (error) {
			creationWarning = `สร้างโปรเจกต์แล้ว แต่ไม่สามารถเพิ่มสมาชิกได้: ${error.message}`;
		}
	}

	return {
		...created,
		projectName: created.projectName || project.projectName,
		subjectCode: created.subjectCode || project.subjectCode,
		dueDate: created.dueDate || project.dueDate,
		progress: Number(created.progress) || 0,
		members: project.members || [],
		creationWarning,
	};
}

document.addEventListener('project:loaded', loadProjects);

document.addEventListener('project:create', (event) => {
	const project = event.detail || {};
	if (!project.projectName || !project.subjectCode) {
		document.dispatchEvent(new CustomEvent('project:create-failed', {
			detail: { message: 'กรุณาระบุชื่อโปรเจกต์และรหัสวิชา' },
		}));
		return;
	}

	if (hasStoredAuthToken()) {
		pendingCreate = createProjectWithMembers(project).then((createdProject) => {
			document.dispatchEvent(new CustomEvent('project:created', { detail: createdProject }));
		}).catch((error) => {
			document.dispatchEvent(new CustomEvent('project:create-failed', {
				detail: { message: error.message },
			}));
		});
		return;
	}

	const createdProject = {
		...project,
		projectId: Date.now(),
		progress: Number(project.progress) || 0,
	};
	projects.push(createdProject);
	document.dispatchEvent(new CustomEvent('project:created', { detail: createdProject }));
});

document.addEventListener('project:members-added', (event) => {
	const detail = event.detail || {};
	const project = projects.find((item) => String(item.projectId) === String(detail.projectId));
	if (!project) return;

	const members = project.members || [];
	const addedIds = new Set(members.map((member) => String(member.studentId || member.userId)));
	for (const member of detail.members || []) {
		if (!addedIds.has(String(member.studentId || member.userId))) members.push(member);
	}
	project.members = members;
	renderProjectCards(projects);
});

document.addEventListener('projects:updated', (event) => {
	if (Array.isArray(event.detail)) renderProjectCards(event.detail);
	else loadProjects();
});
