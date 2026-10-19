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
		const idInput = inviteForm.querySelector('input[type="number"]');
		const memberId = idInput?.value.trim();
		if (!memberId || invitedIds.has(memberId)) return;

		invitedIds.add(memberId);
		const invitedMember = document.createElement('p');
		invitedMember.className = 'invited-member-id';
		invitedMember.textContent = `Member ID: ${memberId}`;
		invitedList?.append(invitedMember);
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
