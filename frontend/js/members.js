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
});