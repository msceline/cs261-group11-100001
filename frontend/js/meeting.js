function formatLocalDateTime(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

document.addEventListener('meeting:loaded', (event) => {
  const form = document.getElementById('meeting-form');
  if (!form) return;

  const project = event.detail || {};
  const topicInput = document.getElementById('meeting-topic');
  const dateTimeInput = document.getElementById('meeting-date-time');
  const locationInput = document.getElementById('meeting-location');
  const descriptionInput = document.getElementById('meeting-description');
  const submitButton = document.getElementById('meeting-submit');
  const message = document.getElementById('meeting-message');

  dateTimeInput.value = formatLocalDateTime(new Date());

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.hidden = !text;
    message.classList.toggle('is-error', isError);
  }

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    showMessage('');

    if (!form.reportValidity()) return;
    if (!project.projectId) {
      showMessage('Meeting can only be created for a saved project.', true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      await window.meetingApi.createMeeting(project.projectId, {
        topic: topicInput.value.trim(),
        dateTime: dateTimeInput.value,
        location: locationInput.value.trim(),
        description: descriptionInput.value.trim(),
      });
      document.dispatchEvent(new CustomEvent('meeting:created', { detail: project }));
    } catch (error) {
      showMessage(error.message || 'Could not create meeting.', true);
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  });
});
