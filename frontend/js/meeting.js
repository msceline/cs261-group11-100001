function formatLocalDateTime(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

document.addEventListener('meeting:loaded', (event) => {
  const form = document.getElementById('meeting-form');
  if (!form) return;

  const project = event.detail || {};
  const editingMeeting = project.meeting || null;
  const topicInput = document.getElementById('meeting-topic');
  const dateTimeInput = document.getElementById('meeting-date-time');
  const locationInput = document.getElementById('meeting-location');
  const descriptionInput = document.getElementById('meeting-description');
  const submitButton = document.getElementById('meeting-submit');
  const message = document.getElementById('meeting-message');
  const title = document.getElementById('meeting-page-title');
  const backButton = document.getElementById('meeting-back');

  backButton?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('meeting:back', { detail: project }));
  });

  if (editingMeeting) {
    document.title = 'Edit Meeting';
    title.textContent = 'Edit Meeting';
    submitButton.textContent = 'Save Changes';
    topicInput.value = editingMeeting.topic || '';
    dateTimeInput.value = formatLocalDateTime(new Date(editingMeeting.dateTime));
    locationInput.value = editingMeeting.location || '';
    descriptionInput.value = editingMeeting.description || '';
  } else {
    dateTimeInput.value = formatLocalDateTime(new Date());
  }

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
    submitButton.textContent = editingMeeting ? 'Saving...' : 'Submitting...';

    try {
      const meeting = {
        topic: topicInput.value.trim(),
        dateTime: dateTimeInput.value,
        location: locationInput.value.trim(),
        description: descriptionInput.value.trim(),
      };
      if (editingMeeting) {
        const updatedMeeting = await window.meetingApi.updateMeeting(
          project.projectId,
          editingMeeting.meetingId,
          meeting,
        );
        const updatedDate = new Date(updatedMeeting?.dateTime || meeting.dateTime);
        const returnProject = { ...project };
        if (!Number.isNaN(updatedDate.getTime())) {
          returnProject.calendarYear = updatedDate.getFullYear();
          returnProject.calendarMonth = updatedDate.getMonth();
        }
        document.dispatchEvent(new CustomEvent('meeting:updated', { detail: returnProject }));
      } else {
        await window.meetingApi.createMeeting(project.projectId, meeting);
        document.dispatchEvent(new CustomEvent('meeting:created', { detail: project }));
      }
    } catch (error) {
      showMessage(error.message || 'Could not save meeting.', true);
      submitButton.disabled = false;
      submitButton.textContent = editingMeeting ? 'Save Changes' : 'Submit';
    }
  });
});
