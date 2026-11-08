const membersScriptUrl = document.currentScript?.src || window.location.href;

let memberRequestId = 0;

function getMemberInitials(name) {
    const initials = String(name || '?')
        .trim()
        .split(/\s+/)
        .map((part) => Array.from(part)[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return initials || '?';
}

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

function setMemberListMessage(container, text) {
    const message = document.createElement('p');
    message.className = 'members-empty-message';
    message.textContent = text;
    container.replaceChildren(message);
}

// Shows the members of the opened project (GET /api/projects/{id}/members).
async function renderMembers(data = {}) {
    const memberPage = document.querySelector('#contentBox .course-container');
    if (!memberPage) return;

    const courseCodeElem = memberPage.querySelector('#course-code');
    const courseGroupElem = memberPage.querySelector('#course-group');
    const membersListContainer = memberPage.querySelector('#members-list');

    if (courseCodeElem) {
        courseCodeElem.textContent = data.subjectCode || data.subject || 'Project';
    }
    if (courseGroupElem) {
        courseGroupElem.textContent = data.groupName || data.projectName || '';
    }
    if (!membersListContainer) return;

    const projectId = Number(data.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
        setMemberListMessage(membersListContainer, 'Select a project to view its members.');
        return;
    }

    memberRequestId += 1;
    const requestId = memberRequestId;
    setMemberListMessage(membersListContainer, 'Loading members...');

    try {
        const api = await loadProjectApiForMembers();
        const members = await api.getProjectMembers(projectId);
        if (!Array.isArray(members)) {
            throw new Error('The member service returned an invalid response.');
        }

        // A newer request, or another page, has taken over: drop this result.
        if (requestId !== memberRequestId || !membersListContainer.isConnected) return;

        if (members.length === 0) {
            setMemberListMessage(membersListContainer, 'No members have been added to this project yet.');
            return;
        }

        membersListContainer.replaceChildren(...members.map(createMemberItem));
    } catch (error) {
        if (requestId !== memberRequestId || !membersListContainer.isConnected) return;
        console.error('Failed to load project members:', error);
        setMemberListMessage(membersListContainer, error.message || 'Could not load project members.');
    }
}

document.addEventListener('member:loaded', (event) => {
    renderMembers(event.detail || {});
});
