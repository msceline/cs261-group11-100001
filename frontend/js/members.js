const courseData = {
    code: 'CS261',
    groupName: 'SoftWhere?',
};

const sampleMembers = [
    {
        name: 'ศิวดล อานามวัฒน์',
        studentId: '6809617431',
        role: 'Host',
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

function renderMembers(data = courseData) {
    const contentBox = document.getElementById('contentBox');
    const container = contentBox || document; 

    const courseCodeElem = container.querySelector('#course-code');
    const courseGroupElem = container.querySelector('#course-group');
    const membersListContainer = container.querySelector('#members-list');

    if (courseCodeElem && data.code) {
        courseCodeElem.textContent = data.code;
    }
    if (courseGroupElem && data.groupName) {
        courseGroupElem.textContent = data.groupName;
    }

    if (membersListContainer) {
        membersListContainer.replaceChildren(
            ...sampleMembers.map(createMemberItem)
        );
    }
}

document.addEventListener('DOMContentLoaded', () => renderMembers());

document.addEventListener('member:loaded', (event) => {
    renderMembers(event.detail || courseData);
});