
// Object Project
const projects = [
	{ projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS261', progress: 20 },
    { projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS213', progress: 55 },
    { projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'CS221', progress: 75 },
    { projectName: 'ระบบจัดการงานกลุ่ม', subjectCode: 'TU109', progress: 85 },
	{ projectName: 'เว็บไซต์จองห้องเรียน', subjectCode: 'CS331', progress: 100 },
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

document.addEventListener('project:loaded', () => renderProjectCards(projects));

document.addEventListener('project:create', (event) => {
	const project = event.detail || {};
	if (!project.projectName || !project.subjectCode) return;

	projects.push({
		...project,
		projectId: Date.now(),
		progress: Number(project.progress) || 0,
	});
});
