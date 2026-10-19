const tasks = [
    { name: 'Create Git Repository', dueDate: '02/11/26' },
    { name: 'Initial Spring Boot', dueDate: '03/11/26' }
];

function createTaskRow(task) {
    const row = document.createElement('article');
    row.className = 'task-row';

    const name = document.createElement('h3');
    name.className = 'task-name';
    const taskTitle = document.createElement('span');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.name;

    const dueDate = document.createElement('div');
    dueDate.className = 'task-deadline';
    const dueDateLabel = document.createElement('span');
    dueDateLabel.textContent = 'Due Date';
    const dueDateValue = document.createElement('strong');
    dueDateValue.textContent = task.dueDate;
    dueDate.append(dueDateLabel, dueDateValue);

    name.append(taskTitle, dueDate);
    row.append(name);
    return row;
}

const taskList = document.getElementById('task-list');

if (taskList) {
    tasks.forEach((task) => taskList.append(createTaskRow(task)));
}