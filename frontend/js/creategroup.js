document.addEventListener('creategroup:loaded', (event) => {
    const form = document.querySelector('#contentBox #createProjectForm');
    if (!form) return;

    const projectDraft = event.detail || {};
    const projectName = form.querySelector('#groupName');
    const subjectCode = form.querySelector('#subject');
    const atDate = form.querySelector('#dueDate');

    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (projectName) {
        projectName.value = projectDraft.groupName || '';
    }

    if (subjectCode) {
        subjectCode.value = (projectDraft.subject || '').toUpperCase();
        subjectCode.addEventListener('input', () => {
            const cursorPosition = subjectCode.selectionStart;
            subjectCode.value = subjectCode.value.toUpperCase();
            subjectCode.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    if (atDate) {
        atDate.value = projectDraft.dueDate || localToday;
    }

    form.addEventListener('submit', (submitEvent) => {
        submitEvent.preventDefault();

        const groupName = projectName?.value.trim() || '';
        const subject = subjectCode?.value.trim().toUpperCase() || '';
        const dueDate = atDate?.value || '';

        if (!groupName || !subject || !dueDate) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วนก่อนไปขั้นตอนถัดไปครับ');
            return;
        }

        document.dispatchEvent(new CustomEvent('creategroup:next', {
            detail: {
                groupName,
                subject,
                dueDate,
            },
        }));
    }, { once: true });
});