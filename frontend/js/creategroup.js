document.addEventListener('creategroup:loaded', (event) => {
	const form = document.querySelector('#contentBox #create-group-form');
	if (!form) return;

	const projectDraft = event.detail || {};
	const groupNameInput = form.querySelector('#groupName');
	const subjectInput = form.querySelector('#subject');
	const dueDateInput = form.querySelector('#dueDate');
	const today = new Date();
	const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	if (groupNameInput) groupNameInput.value = projectDraft.groupName || '';
	if (subjectInput) {
		subjectInput.value = (projectDraft.subject || '').toUpperCase();
		subjectInput.addEventListener('input', () => {
			const cursorPosition = subjectInput.selectionStart;
		subjectInput.value = subjectInput.value.toUpperCase();
			subjectInput.setSelectionRange(cursorPosition, cursorPosition);
		});
	}
	if (dueDateInput) dueDateInput.value = projectDraft.dueDate || localToday;

	form.addEventListener('submit', (submitEvent) => {
		submitEvent.preventDefault();
		document.dispatchEvent(new CustomEvent('creategroup:next', {
			detail: {
				groupName: groupNameInput?.value.trim() || '',
				subject: subjectInput?.value.trim().toUpperCase() || '',
				dueDate: dueDateInput?.value || '',
			},
		}));
	});
});
