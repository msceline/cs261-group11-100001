document.addEventListener('creategroup:loaded', () => {
	const dueDateInput = document.querySelector('#contentBox #dueDate');
	if (!dueDateInput) return;

	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	dueDateInput.value = `${year}-${month}-${day}`;
});
