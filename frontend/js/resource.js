(() => {
  let currentProject = {};
  let cachedItems = [];
  let editingDescription = '';

  function getEls() {
    return {
      courseCode: document.getElementById('resource-course-code'),
      courseName: document.getElementById('resource-course-name'),
      openUploadBtn: document.getElementById('openUploadBtn'),
      skeleton: document.getElementById('resourceSkeleton'),
      list: document.getElementById('resourceList'),
      empty: document.getElementById('resourceEmptyState'),
      formView: document.getElementById('resourceFormView'),
      editingId: document.getElementById('editingResourceId'),
      linkInput: document.getElementById('resourceLinkInput'),
      titleInput: document.getElementById('resourceTitleInput'),
      cancelBtn: document.getElementById('cancelFormBtn'),
      submitBtn: document.getElementById('submitFormBtn'),
      backdrop: document.getElementById('statusModalBackdrop'),
      successPopup: document.getElementById('successPopup'),
      successText: document.getElementById('successMessageText'),
      successBtn: document.getElementById('successContinueBtn'),
      errorPopup: document.getElementById('errorPopup'),
      errorText: document.getElementById('errorMessageText'),
      errorBtn: document.getElementById('errorRetryBtn'),
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showMainListView(items) {
    const els = getEls();
    if (!els.list) return;

    cachedItems = items || [];
    els.skeleton.hidden = true;
    els.formView.hidden = true;
    els.openUploadBtn.hidden = false;

    if (cachedItems.length === 0) {
      els.list.hidden = true;
      els.empty.hidden = false;
      return;
    }

    els.empty.hidden = true;
    els.list.hidden = false;
    els.list.innerHTML = cachedItems
      .map(
        (item) => `
        <article class="resource-card" data-id="${escapeHtml(item.id)}">
          <div class="resource-card-top">
            <span class="resource-bullet" aria-hidden="true"></span>
            <a class="resource-link-title" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
            <span class="resource-short-desc">${escapeHtml(item.description || '')}</span>
            ${item.canEdit ? `<div class="resource-actions">
              <button type="button" class="icon-action-btn btn-edit-resource" data-id="${escapeHtml(item.id)}" aria-label="Edit resource" title="Edit">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
              <button type="button" class="icon-action-btn btn-delete-resource" data-id="${escapeHtml(item.id)}" aria-label="Delete resource" title="Delete">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>` : ''}
          </div>
          <div class="resource-card-details">
            <p class="resource-full-desc">${escapeHtml(item.description || item.url)}</p>
            <div class="resource-meta">
              Uploaded ${escapeHtml(item.uploadedAt)}
              <span>by ${escapeHtml(item.uploadedBy)}</span>
            </div>
          </div>
        </article>
      `
      )
      .join('');
  }

  function openFormView(mode = 'upload', item = null) {
    const els = getEls();
    els.list.hidden = true;
    els.empty.hidden = true;
    els.skeleton.hidden = true;
    els.openUploadBtn.hidden = true;
    els.formView.hidden = false;

    if (mode === 'edit' && item) {
      els.editingId.value = item.id;
      els.linkInput.value = item.url;
      els.titleInput.value = item.title;
      editingDescription = item.description || '';
      els.submitBtn.textContent = 'save';
    } else {
      els.editingId.value = '';
      els.linkInput.value = '';
      els.titleInput.value = '';
      editingDescription = '';
      els.submitBtn.textContent = 'upload';
    }
    els.cancelBtn.disabled = false;
    els.submitBtn.disabled = false;
  }

  function showPopup(type, message) {
    const els = getEls();
    els.backdrop.hidden = false;
    els.successPopup.hidden = type !== 'success';
    els.errorPopup.hidden = type !== 'error';
    if (type === 'success' && message) els.successText.textContent = message;
    if (type === 'error' && message) els.errorText.textContent = message;
  }

  function closePopups() {
    const els = getEls();
    els.backdrop.hidden = true;
    els.successPopup.hidden = true;
    els.errorPopup.hidden = true;
  }

  async function refreshResources() {
    const els = getEls();
    if (!els.list) return;

    els.list.hidden = true;
    els.empty.hidden = true;
    els.formView.hidden = true;
    els.skeleton.hidden = false;

    try {
      if (!window.ResourceAPI) throw new Error('Resource API service unavailable');
      const items = await window.ResourceAPI.getResources(currentProject.projectId);
      showMainListView(items);
    } catch (error) {
      els.skeleton.hidden = true;
      els.list.hidden = true;
      els.empty.hidden = true;
      els.openUploadBtn.hidden = false;
      showPopup('error', error.message || 'Unable to load resources.');
    }
  }

  function bindEvents() {
    const els = getEls();
    if (!els.openUploadBtn || els.openUploadBtn.dataset.bound) return;
    els.openUploadBtn.dataset.bound = 'true';

    els.openUploadBtn.addEventListener('click', () => openFormView('upload'));
    els.cancelBtn.addEventListener('click', () => refreshResources());

    els.formView.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = els.linkInput.value.trim();
      const title = els.titleInput.value.trim();
      const isEdit = Boolean(els.editingId.value);

      if (!url || !title) {
        showPopup('error');
        return;
      }

      els.cancelBtn.disabled = true;
      els.submitBtn.disabled = true;
      els.submitBtn.textContent = isEdit ? 'saving...' : 'uploading...';

      try {
        if (!window.ResourceAPI) throw new Error('API service unavailable');

        if (isEdit) {
          await window.ResourceAPI.updateResource(currentProject.projectId, els.editingId.value, {
            url,
            title,
            description: editingDescription,
          });
          showPopup('success', 'Your link has been updated successfully!');
        } else {
          await window.ResourceAPI.createResource(currentProject.projectId, {
            url,
            title,
          });
          showPopup('success', 'Your link has been added successfully!');
        }
      } catch (error) {
        els.cancelBtn.disabled = false;
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = isEdit ? 'save' : 'upload';
        showPopup('error', error.message || 'Unable to save this link.');
      }
    });

    els.list.addEventListener('click', async (e) => {
      if (e.target.closest('.resource-link-title')) return;

      const editBtn = e.target.closest('.btn-edit-resource');
      if (editBtn) {
        const target = cachedItems.find((item) => String(item.id) === String(editBtn.dataset.id));
        if (target) openFormView('edit', target);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-resource');
      if (deleteBtn) {
        try {
          await window.ResourceAPI.deleteResource(currentProject.projectId, deleteBtn.dataset.id);
          await refreshResources();
        } catch (error) {
          showPopup('error', error.message || 'Unable to delete this link.');
        }
        return;
      }

      const card = e.target.closest('.resource-card');
      if (card) {
        card.classList.toggle('is-expanded');
      }
    });

    els.successBtn.addEventListener('click', () => {
      closePopups();
      refreshResources();
    });

    els.errorBtn.addEventListener('click', () => {
      closePopups();
    });
  }

  document.addEventListener('resources:loaded', (event) => {
    const incoming = event.detail || {};
    
    if (Object.keys(incoming).length > 0) {
      currentProject = incoming;
      sessionStorage.setItem('activeResourceProject', JSON.stringify(incoming));
    } else {
      try {
        currentProject = JSON.parse(sessionStorage.getItem('activeResourceProject') || '{}');
      } catch {
        currentProject = {};
      }
    }

    const els = getEls();
    if (els.courseCode) {
      els.courseCode.textContent =
        currentProject.subjectCode ||
        currentProject.courseCode ||
        currentProject.subject ||
        currentProject.code ||
        currentProject.title ||
        '';
    }
    if (els.courseName) {
      els.courseName.textContent =
        currentProject.groupName ||
        currentProject.projectName ||
        currentProject.group ||
        currentProject.name ||
        '';
    }
    bindEvents();
    refreshResources();
  });
})();