const dueDateDisplay = document.getElementById('due-date-input');
const dueDatePicker = document.getElementById('due-date-picker');

function formatDueDate(dateValue) {
    if (!dateValue) return '';

    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
}

dueDateDisplay.addEventListener('click', () => {
    if (typeof dueDatePicker.showPicker === 'function') {
        dueDatePicker.showPicker();
        return;
    }

    dueDatePicker.click();
});

dueDatePicker.addEventListener('change', () => {
    dueDateDisplay.value = formatDueDate(dueDatePicker.value);
});

const assignmentPicker = document.querySelector('.assignment-picker');
const assignmentToggle = document.getElementById('assignment-toggle');
const assignmentMenu = document.getElementById('assignment-menu');
const assignedMembers = document.getElementById('assigned-members');
const selectedMemberIds = new Set();

window.groupMembers.forEach((member) => {
    const option = document.createElement('label');
    option.className = 'assignment-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = member.studentId;
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            selectedMemberIds.add(member.studentId);
        } else {
            selectedMemberIds.delete(member.studentId);
        }

        const selectedNames = window.groupMembers
            .filter((groupMember) => selectedMemberIds.has(groupMember.studentId))
            .map((groupMember) => groupMember.name);
        assignedMembers.textContent = selectedNames.length
            ? selectedNames.join(', ')
            : 'Select members';
    });

    const name = document.createElement('span');
    name.textContent = member.name;
    option.append(checkbox, name);
    assignmentMenu.append(option);
});

assignmentToggle.addEventListener('click', () => {
    const isExpanded = assignmentToggle.getAttribute('aria-expanded') === 'true';
    assignmentToggle.setAttribute('aria-expanded', String(!isExpanded));
    assignmentMenu.hidden = isExpanded;
});

document.addEventListener('click', (event) => {
    if (!assignmentPicker.contains(event.target)) {
        assignmentMenu.hidden = true;
        assignmentToggle.setAttribute('aria-expanded', 'false');
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !assignmentMenu.hidden) {
        assignmentMenu.hidden = true;
        assignmentToggle.setAttribute('aria-expanded', 'false');
        assignmentToggle.focus();
    }
});

const submitBtn = document.getElementById('submit-btn');

submitBtn.addEventListener('click', () => {
    window.location.href = 'task.html';
});