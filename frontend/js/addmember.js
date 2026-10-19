const memberDirectory = new Map([
	['6809617431', { avatarText: 'SA', name: 'ศิวดล อานามวัฒน์', role: 'Leader' }],
	['6809617118', { avatarText: 'NB', name: 'ณัฐรดา บัวสุวรรณ', role: 'Member' }],
	['6809617134', { avatarText: 'TC', name: 'ตรีทิพยนิภา ชูเชิด', role: 'Member' }],
	['6809540161', { avatarText: 'NK', name: 'นวมินทร์ตรา คำมุงคุล', role: 'Member' }],
	['6809617217', { avatarText: 'PR', name: 'ปภังกร รักนิยม', role: 'Member' }],
	['6809681486', { avatarText: 'SS', name: 'สุวิจักษณ์ แซ่ท้าว', role: 'Member' }],
]);

function createInvitedMemberCard(member, memberId) {
	const card = document.createElement('article');
	card.className = 'invited-member-card';
	card.dataset.memberId = memberId;

	const identity = document.createElement('div');
	identity.className = 'invited-member-card__identity';

	const avatar = document.createElement('span');
	avatar.className = 'invited-member-card__avatar';
	avatar.setAttribute('aria-hidden', 'true');
	avatar.textContent = member.avatarText;

	const name = document.createElement('span');
	name.className = 'invited-member-card__name';
	name.textContent = member.name;

	const role = document.createElement('span');
	role.className = 'invited-member-card__role';
	role.textContent = member.role;

	identity.append(avatar, name);
	card.append(identity, role);
	return card;
}

document.addEventListener('addmember:loaded', (event) => {
	const page = document.querySelector('#contentBox .addmember-page');
	if (!page) return;

	const projectDraft = event.detail || {};
	const groupName = page.querySelector('#groupNameAddMember');
	const invitedList = page.querySelector('#invitedMember');
	const inviteForm = page.querySelector('.invite-input form');
	const invitedIds = new Set();

	if (groupName) groupName.textContent = projectDraft.groupName || '';

	inviteForm?.addEventListener('submit', (submitEvent) => {
		submitEvent.preventDefault();
		const idInput = inviteForm.querySelector('input');
		const memberId = idInput?.value.trim();
		if (!memberId || invitedIds.has(memberId)) return;

		invitedIds.add(memberId);
		const member = memberDirectory.get(memberId) || {
			avatarText: memberId.slice(-2),
			name: `Member ${memberId}`,
			role: 'Member',
		};
		invitedList?.append(createInvitedMemberCard(member, memberId));
		if (idInput) idInput.value = '';
	});

	page.querySelector('.submition-addmember')?.addEventListener('click', () => {
		document.dispatchEvent(new CustomEvent('addmember:create', {
			detail: {
				groupName: projectDraft.groupName || '',
				subject: projectDraft.subject || '',
				dueDate: projectDraft.dueDate || '',
				invitedMemberIds: [...invitedIds],
			},
		}));
	});

	page.querySelector('.back-to-creategroup')?.addEventListener('click', () => {
		document.dispatchEvent(new Event('addmember:back'));
	});
});
