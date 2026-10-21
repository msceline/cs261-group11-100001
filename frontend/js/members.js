const membersScriptUrl = document.currentScript?.src || window.location.href;

const courseData = {
    code: 'CS261',
    groupName: 'SoftWhere?',
};

function createMemberItem(member) {
    const item = document.createElement('div');
    item.className = 'member-item';

    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.textContent = getMemberInitials(member.displayName);

    const details = document.createElement('div');
    details.className = 'member-details';

    const name = document.createElement('span');
    name.className = 'member-name';
    name.textContent = member.displayName || 'Unknown member';

    const studentId = document.createElement('span');
    studentId.className = 'member-id';
    studentId.textContent = member.tu_id || member.tuId || member.studentId || '-';

    details.append(name, studentId);

    const role = document.createElement('span');
    role.className = 'member-role';
    const roleName = member.roleInProject || 'member';
    role.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);

    item.append(avatar, details, role);
    return item;
}

function hasStoredAuthToken() {
    try {
        return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
    } catch {
        return false;
    }
}

function loadProjectApiForMembers() {
    if (window.projectApi) return Promise.resolve(window.projectApi);

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('../api/project-api.js', membersScriptUrl).href;
        script.onload = () => resolve(window.projectApi);
        script.onerror = () => reject(new Error('โหลดบริการข้อมูลโปรเจกต์ไม่สำเร็จ'));
        document.head.append(script);
    });
}

const roleLabels = { host: 'Host', member: 'Member' };

function showMembersMessage(container, text) {
    const message = document.createElement('p');
    message.className = 'members-empty-message';
    message.textContent = text;
    container.replaceChildren(message);
}

// The members of the opened project from the backend (GET /api/projects/{id}/members).
async function loadMembersFromBackend(memberPage, data) {
    const container = memberPage.querySelector('#members-list');
    if (!container) return;

    showMembersMessage(container, 'Loading...');
    try {
        const api = await loadProjectApiForMembers();
        const members = await api.getProjectMembers(data.projectId);
        if (!container.isConnected) return;

        if (!members.length) {
            showMembersMessage(container, 'No members have been added to this project yet.');
            return;
        }
        container.replaceChildren(...members.map((member) => createMemberItem({
            name: member.displayName,
            tu_id: member.tu_id,
            role: roleLabels[member.roleInProject] || member.roleInProject,
        })));
    } catch (error) {
        if (container.isConnected) showMembersMessage(container, error.message);
    }
}

function renderMembers(data = {}) {
    const memberPage = document.querySelector('#contentBox .course-container');
    if (!memberPage) return;

    const courseCodeElem = memberPage.querySelector('#course-code');
    const courseGroupElem = memberPage.querySelector('#course-group');
    const membersListContainer = memberPage.querySelector('#members-list');

    if (courseCodeElem) {
        courseCodeElem.textContent = project.subjectCode || project.subject || 'Project';
    }
    if (courseGroupElem) {
        courseGroupElem.textContent = project.groupName || project.projectName || '';
    }
    if (!membersListContainer) return;

    const projectId = Number(project.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
        setMemberListMessage(membersListContainer, 'Select a project to view its members.', true);
        return;
    }
    if (!window.memberApi) {
        setMemberListMessage(membersListContainer, 'Member service is unavailable.', true);
        return;
    }

    setMemberListMessage(membersListContainer, 'Loading members...');

    try {
        const members = await window.memberApi.getProjectMembers(projectId);
        if (!Array.isArray(members)) {
            throw new Error('The member service returned an invalid response.');
        }

        if (requestId !== memberRequestId || !document.querySelector('#contentBox .course-container')) return;

    // A project that comes from the backend has an id: ask the backend who its members are.
    if (membersListContainer && hasStoredAuthToken() && data.projectId) {
        loadMembersFromBackend(memberPage, data);
        return;
    }

    if (membersListContainer) {
        const members = Array.isArray(data.members) ? data.members : [];
        membersListContainer.replaceChildren(...members.map(createMemberItem));
        if (members.length === 0) {
            setMemberListMessage(membersListContainer, 'No members have been added to this project yet.');
            return;
        }

        membersListContainer.replaceChildren(...members.map(createMemberItem));
    } catch (error) {
        if (requestId !== memberRequestId) return;
        console.error('Failed to load project members:', error);
        setMemberListMessage(
            membersListContainer,
            error.message || 'Could not load project members.',
            true,
        );
    }
}

document.addEventListener('member:loaded', (event) => {
    loadProjectMembers(event.detail || {});
});
