const sampleMembers = [
	{ logo: 'AC', name: 'Arthit Chaiyasit', id: '65010001', role: 'Project Lead' },
	{ logo: 'KS', name: 'Kanya Srisuk', id: '65010002', role: 'Developer' },
	{ logo: 'NW', name: 'Narin Wongsawat', id: '65010003', role: 'Designer' },
	{ logo: 'SP', name: 'Suda Ploykaew', id: '65010004', role: 'QA Tester' },
];

function createMemberCard(member, index) {
	const card = document.createElement('article');
	card.className = 'member-card';

	const logo = document.createElement('div');
	logo.className = 'member-card__logo';
	logo.dataset.tone = String(index % 4);
	logo.setAttribute('aria-hidden', 'true');
	logo.textContent = member.logo;

	const identity = document.createElement('div');
	identity.className = 'member-card__identity';

	const name = document.createElement('h3');
	name.className = 'member-card__name';
	name.textContent = member.name;

	const id = document.createElement('p');
	id.className = 'member-card__id';
	id.textContent = `ID: ${member.id}`;
	identity.append(name, id);

	const role = document.createElement('span');
	role.className = 'member-card__role';
	role.textContent = member.role;

	card.append(logo, identity, role);
	return card;
}

document.addEventListener('member:loaded', (event) => {
	const memberPage = document.querySelector('#contentBox .member-page');
	if (!memberPage) return;

	const project = event.detail || {};
	const groupName = memberPage.querySelector('#gropnameMember');
	const subject = memberPage.querySelector('#subjectMember');
	const memberList = memberPage.querySelector('#memberList');

	if (groupName) groupName.textContent = project.groupName || '';
	if (subject) subject.textContent = project.subject || '';

	if (memberList) {
		memberList.replaceChildren(...sampleMembers.map(createMemberCard));
	}
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