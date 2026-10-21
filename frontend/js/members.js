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
    avatar.textContent = member.avatarText || (member.name || member.displayName || '?')
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const details = document.createElement('div');
    details.className = 'member-details';

    const name = document.createElement('span');
    name.className = 'member-name';
    name.textContent = member.name || member.displayName || 'Unknown member';

    const tuIdElement = document.createElement('span');
    tuIdElement.className = 'member-id';
    tuIdElement.textContent = member.tu_id || member.tuId || member.studentId;

    details.append(name, tuIdElement);

    const role = document.createElement('span');
    role.className = 'member-role';
    role.textContent = member.role;

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
        courseCodeElem.textContent = data.code || data.subject || data.subjectCode || courseData.code;
    }
    if (courseGroupElem) {
        courseGroupElem.textContent = data.groupName || courseData.groupName;
    }

    // A project that comes from the backend has an id: ask the backend who its members are.
    if (membersListContainer && hasStoredAuthToken() && data.projectId) {
        loadMembersFromBackend(memberPage, data);
        return;
    }

    if (membersListContainer) {
        const members = Array.isArray(data.members) ? data.members : [];
        membersListContainer.replaceChildren(...members.map(createMemberItem));
        if (members.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'members-empty-message';
            emptyMessage.textContent = 'No members have been added to this project yet.';
            membersListContainer.append(emptyMessage);
        }
    }
}

document.addEventListener('member:loaded', (event) => {
    renderMembers(event.detail || {});
});