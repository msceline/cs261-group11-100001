const courseData = {
    code: 'CS261',
    groupName: 'SoftWhere?',
};

const sampleMembers = [
    {
        name: 'ศิวดล อานามวัฒน์',
        studentId: '6809617431',
        role: 'Leader',
        avatarText: 'SA'
    },
    {
        name: 'ณัฐรดา บัวสุวรรณ',
        studentId: '6809617118',
        role: 'Member',
        avatarText: 'NB'
    },
    {
        name: 'ตรีทิพยนิภา ชูเชิด',
        studentId: '6809617134',
        role: 'Member',
        avatarText: 'TC'
    },
    {
        name: 'นวมินทร์ตรา คำมุงคุล',
        studentId: '6809540161',
        role: 'Member',
        avatarText: 'NK'
    },
    {
        name: 'ปภังกร รักนิยม',
        studentId: '6809617217',
        role: 'Member',
        avatarText: 'PR'
    },
    {
        name: 'สุวิจักษณ์ แซ่ท้าว',
        studentId: '6809681486',
        role: 'Member',
        avatarText: 'SS'
    }
];

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

    const studentId = document.createElement('span');
    studentId.className = 'member-id';
    studentId.textContent = member.studentId || '';

    details.append(name, studentId);

    const role = document.createElement('span');
    role.className = 'member-role';
    role.textContent = member.role;

    item.append(avatar, details, role);
    return item;
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

    if (membersListContainer) {
        const members = Array.isArray(data.members) ? data.members : sampleMembers;
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