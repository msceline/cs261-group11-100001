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

const submitBtn = document.getElementById('submit-btn');

submitBtn.addEventListener('click', function() {
    // เปลี่ยนปุ่มเป็นสถานะโหลด คล้ายกับหน้า login
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    submitBtn.style.opacity = '0.85';

    // จำลองเวลาหน่วง 1.5 วินาที สำหรับการส่งไฟล์
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submitted';
        submitBtn.style.backgroundColor = '#16a34a'; // เปลี่ยนเป็นสีเขียวเมื่อส่งสำเร็จ
        submitBtn.style.opacity = '1';
    }, 1500);
});