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

window.groupMembers = sampleMembers;

function createMemberItem(member) {
    const item = document.createElement('div');
    item.className = 'member-item';

    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.textContent = member.avatarText;

    const details = document.createElement('div');
    details.className = 'member-details';

    const name = document.createElement('span');
    name.className = 'member-name';
    name.textContent = member.name;

    const studentId = document.createElement('span');
    studentId.className = 'member-id';
    studentId.textContent = member.studentId;

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
        membersListContainer.replaceChildren(...sampleMembers.map(createMemberItem));
    }
}

document.addEventListener('member:loaded', (event) => {
    renderMembers(event.detail || {});
});