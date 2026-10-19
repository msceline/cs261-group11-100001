const defaultTasks = [
    { id: 'sample-git-repository', name: 'Create Git Repository', dueDate: '02/11/2026' },
    { id: 'sample-spring-boot', name: 'Initial Spring Boot', dueDate: '03/11/2026' }
];
const taskStorageKey = 'cs261-tasks';
const taskListInitializedKey = 'cs261-task-list-initialized';
const taskStatuses = ['To do', 'Doing', 'Done'];
const taskList = document.getElementById('task-list');
const taskListMessage = document.getElementById('task-list-message');

function normalizeTask(task, index) {
    return {
        id: typeof task.id === 'string' ? task.id : `saved-task-${index}`,
        name: task.name,
        dueDate: task.dueDate,
        description: typeof task.description === 'string' ? task.description : '',
        memberIds: Array.isArray(task.memberIds) ? task.memberIds : [],
        memberNames: Array.isArray(task.memberNames) ? task.memberNames : [],
        status: taskStatuses.includes(task.status) ? task.status : 'To do'
    };
}

function setTaskListMessage(message) {
    taskListMessage.textContent = message;
    taskListMessage.hidden = false;
}

function saveTasks(nextTasks) {
    try {
        localStorage.setItem(taskStorageKey, JSON.stringify(nextTasks));
        return true;
    } catch {
        setTaskListMessage('ไม่สามารถบันทึกการเปลี่ยนแปลง Task ได้ กรุณาตรวจสอบการตั้งค่าพื้นที่จัดเก็บของเบราว์เซอร์');
        return false;
    }
}

function getAssignedMemberNames(task) {
    if (task.memberNames.length > 0) return task.memberNames;

    return task.memberIds
        .map((memberId) => window.groupMembers.find((member) => member.studentId === memberId)?.name)
        .filter(Boolean);
}

function createTaskRow(task) {
    const row = document.createElement('article');
    row.className = 'task-row';

    const taskCard = document.createElement('div');
    taskCard.className = 'task-name';
    taskCard.setAttribute('role', 'group');

    const summary = document.createElement('div');
    summary.className = 'task-summary';

    const title = document.createElement('button');
    title.className = 'task-title';
    title.type = 'button';
    title.textContent = task.name;
    title.setAttribute('aria-expanded', 'false');

    const status = document.createElement('select');
    status.className = 'task-status';
    status.setAttribute('aria-label', `Status for ${task.name}`);
    taskStatuses.forEach((taskStatus) => {
        const option = document.createElement('option');
        option.value = taskStatus;
        option.textContent = taskStatus;
        status.append(option);
    });
    status.value = task.status;

    const dueDate = document.createElement('div');
    dueDate.className = 'task-deadline';
    const dueDateLabel = document.createElement('span');
    dueDateLabel.textContent = 'Due Date';
    const dueDateValue = document.createElement('strong');
    dueDateValue.textContent = task.dueDate;
    dueDate.append(dueDateLabel, dueDateValue);

    const details = document.createElement('div');
    details.className = 'task-details';
    details.hidden = true;

    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || '-';

    const assignedMembers = document.createElement('p');
    assignedMembers.className = 'task-assigned-members';
    const assignedLabel = document.createElement('strong');
    assignedLabel.textContent = 'Assigned Member: ';
    const assignedNames = document.createElement('span');
    assignedNames.textContent = getAssignedMemberNames(task).join(', ') || '-';
    assignedMembers.append(assignedLabel, assignedNames);
    details.append(description, assignedMembers);

    function toggleDetails() {
        const isExpanded = title.getAttribute('aria-expanded') === 'true';
        title.setAttribute('aria-expanded', String(!isExpanded));
        details.hidden = isExpanded;
        taskCard.classList.toggle('is-expanded', !isExpanded);
    }

    title.addEventListener('click', toggleDetails);
    summary.addEventListener('click', (event) => {
        if (event.target.closest('select, button')) return;
        toggleDetails();
    });

    status.addEventListener('click', (event) => event.stopPropagation());
    status.addEventListener('change', () => {
        if (status.value === 'Done') {
            const remainingTasks = activeTasks.filter((activeTask) => activeTask.id !== task.id);
            if (saveTasks(remainingTasks)) {
                activeTasks = remainingTasks;
                renderTasks();
            } else {
                status.value = task.status;
            }
            return;
        }

        const updatedTasks = activeTasks.map((activeTask) =>
            activeTask.id === task.id ? { ...activeTask, status: status.value } : activeTask
        );
        if (saveTasks(updatedTasks)) {
            activeTasks = updatedTasks;
        } else {
            status.value = task.status;
        }
    });

    summary.append(title, status, dueDate);
    taskCard.append(summary, details);
    row.append(taskCard);
    return row;
}

function renderTasks() {
    taskList.replaceChildren(...activeTasks.map(createTaskRow));
}

let activeTasks = defaultTasks.map(normalizeTask);

if (taskList) {
    let storageAvailable = true;
    let storedTasks = [];
    let taskListInitialized = false;

    try {
        const storedValue = localStorage.getItem(taskStorageKey);
        taskListInitialized = localStorage.getItem(taskListInitializedKey) === 'true';
        if (storedValue !== null) {
            const parsedTasks = JSON.parse(storedValue);
            if (!Array.isArray(parsedTasks)) {
                throw new TypeError('Stored task data must be an array');
            }
            storedTasks = parsedTasks
                .filter((task) => task && typeof task.name === 'string' && typeof task.dueDate === 'string')
                .map(normalizeTask);
        }
    } catch {
        storageAvailable = false;
        setTaskListMessage('ไม่สามารถโหลด Task ที่บันทึกไว้ได้ เนื่องจากข้อมูลเสียหายหรือพื้นที่จัดเก็บใช้งานไม่ได้');
    }

    if (storageAvailable) {
        if (taskListInitialized) {
            activeTasks = storedTasks;
        } else {
            const storedById = new Map(storedTasks.map((task) => [task.id, task]));
            activeTasks = [
                ...defaultTasks.map((task, index) => storedById.get(task.id) || normalizeTask(task, index)),
                ...storedTasks.filter((task) => !defaultTasks.some((defaultTask) => defaultTask.id === task.id))
            ];
        }

        try {
            localStorage.setItem(taskStorageKey, JSON.stringify(activeTasks));
            localStorage.setItem(taskListInitializedKey, 'true');
        } catch {
            storageAvailable = false;
            setTaskListMessage('ไม่สามารถบันทึกรายการ Task ในเบราว์เซอร์ได้');
        }
    }

    renderTasks();
}
