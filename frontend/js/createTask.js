const dueDateDisplay = document.getElementById('due-date-input');
const dueDatePicker = document.getElementById('due-date-picker');
const taskTitle = document.querySelector('.task-title');
const descriptionInput = document.getElementById('description-input');
const submitMessage = document.getElementById('submit-message');
const taskStorageKey = 'cs261-tasks';

function showSubmitMessage(message) {
    submitMessage.textContent = message;
    submitMessage.hidden = false;
}

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
    const taskName = taskTitle.textContent.trim();
    const dueDate = dueDateDisplay.value.trim();
    const description = descriptionInput.value.trim();

    if (!taskName || taskName === 'Task name') {
        showSubmitMessage('กรุณาระบุ Task name');
        taskTitle.focus();
        return;
    }

    if (!dueDate) {
        showSubmitMessage('กรุณาเลือก Due Date');
        dueDateDisplay.focus();
        return;
    }

    if (!description) {
        showSubmitMessage('กรุณากรอก Description');
        descriptionInput.focus();
        return;
    }

    const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: taskName,
        dueDate,
        description,
        memberIds: [...selectedMemberIds],
        memberNames: window.groupMembers
            .filter((member) => selectedMemberIds.has(member.studentId))
            .map((member) => member.name),
        status: 'To do'
    };

    let storedTasks;
    try {
        storedTasks = JSON.parse(localStorage.getItem(taskStorageKey) || '[]');
    } catch {
        showSubmitMessage('ไม่สามารถบันทึก Task ได้ เนื่องจากข้อมูลที่บันทึกไว้ไม่ถูกต้อง');
        return;
    }

    if (!Array.isArray(storedTasks)) {
        showSubmitMessage('ไม่สามารถบันทึก Task ได้ เนื่องจากข้อมูลที่บันทึกไว้ไม่ถูกต้อง');
        return;
    }

    try {
        localStorage.setItem(taskStorageKey, JSON.stringify([...storedTasks, newTask]));
    } catch {
        showSubmitMessage('ไม่สามารถบันทึก Task ได้ กรุณาตรวจสอบการตั้งค่าพื้นที่จัดเก็บของเบราว์เซอร์');
        return;
    }

    window.location.href = 'task.html';
});