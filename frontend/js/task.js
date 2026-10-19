const tasks = [
    { name: 'Create Git Repository', dueDate: '02/11/26', dueTime: '11.59 pm' },
    { name: 'Initial Spring Boot', dueDate: '03/11/26', dueTime: '11.59 pm' }
];

function createTaskRow(task) {
    const row = document.createElement('article');
    row.className = 'task-row';

    const name = document.createElement('h3');
    name.className = 'task-name';
    name.textContent = task.name;

    const dueDate = document.createElement('div');
    dueDate.className = 'task-deadline';
    const dueDateLabel = document.createElement('span');
    dueDateLabel.textContent = 'Due Date';
    const dueDateValue = document.createElement('strong');
    dueDateValue.textContent = task.dueDate;
    dueDate.append(dueDateLabel, dueDateValue);

    const dueTime = document.createElement('div');
    dueTime.className = 'task-deadline';
    const dueTimeLabel = document.createElement('span');
    dueTimeLabel.textContent = 'Before';
    const dueTimeValue = document.createElement('strong');
    dueTimeValue.textContent = task.dueTime;
    dueTime.append(dueTimeLabel, dueTimeValue);

    row.append(name, dueDate, dueTime);
    return row;
}

const taskList = document.getElementById('task-list');

if (taskList) {
    tasks.forEach((task) => taskList.append(createTaskRow(task)));
}