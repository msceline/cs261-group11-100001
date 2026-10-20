let memberRequestId = 0;

function getMemberInitials(name) {
    return (name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
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

function setMemberListMessage(container, text, isError = false) {
    const message = document.createElement('p');
    message.className = 'members-empty-message';
    if (isError) message.setAttribute('role', 'alert');
    else message.setAttribute('role', 'status');
    message.textContent = text;
    container.replaceChildren(message);
}

async function loadProjectMembers(project) {
    const requestId = ++memberRequestId;
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
