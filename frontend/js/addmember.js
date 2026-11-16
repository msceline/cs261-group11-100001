const addMemberScriptUrl = document.currentScript?.src || window.location.href;

function hasStoredAuthToken() {
    try {
        return Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));
    } catch {
        return false;
    }
}

function loadProjectApiForInvite() {
    if (window.projectApi) return Promise.resolve(window.projectApi);

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('../api/project-api.js', addMemberScriptUrl).href;
        script.onload = () => resolve(window.projectApi);
        script.onerror = () => reject(new Error('โหลดบริการข้อมูลโปรเจกต์ไม่สำเร็จ'));
        document.head.append(script);
    });
}

// Name shown on the invite card: the display name from the database, or just the id when there is no login to ask with.
function describeInvitedMember(memberId, displayName) {
    const name = displayName || memberId;
    return {
        avatarText: Array.from(name).slice(0, 2).join('').toUpperCase(),
        name,
        role: 'Member',
    };
}

function createInvitedMemberCard(member, memberId, onRemove) {
    const card = document.createElement('article');
    card.className = 'invited-member-card';
    card.dataset.memberId = memberId;

    const identity = document.createElement('div');
    identity.className = 'invited-member-card__identity';

    const avatar = document.createElement('span');
    avatar.className = 'invited-member-card__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = member.avatarText;

    const name = document.createElement('span');
    name.className = 'invited-member-card__name';
    name.textContent = member.name;

    const role = document.createElement('span');
    role.className = 'invited-member-card__role';
    role.textContent = member.role;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'invited-member-card__remove-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
        card.remove();
        onRemove(memberId);
    });

    identity.append(avatar, name);
    card.append(identity, role, deleteBtn);
    return card;
}

document.addEventListener('addmember:loaded', (event) => {
    const page = document.querySelector('#contentBox .addmember-page');
    if (!page) return;

    const projectDraft = event.detail || {};
    const groupName = page.querySelector('#groupNameAddMember');
    const invitedList = page.querySelector('#invitedMember');
    const inviteForm = page.querySelector('.invite-input form');
    const submitBtn = page.querySelector('.submition-addmember');
    const backBtn = page.querySelector('.back-to-creategroup');
    const message = page.querySelector('#addmember-message');
    const isExistingProject = projectDraft.addToExistingProject === true;
    const projectId = projectDraft.projectId;

    const invitedIds = new Set();
    const invitedMembers = new Map();

    if (groupName) {
        const name = projectDraft.groupName || projectDraft.projectName || '';
        const subject = projectDraft.subject || projectDraft.subjectCode || '';
        groupName.textContent = subject ? `${name}` : name;
    }
    if (submitBtn && isExistingProject) submitBtn.textContent = 'Add Members';
    if (backBtn && isExistingProject) backBtn.textContent = 'Back';

    function showMessage(text, isError = false) {
        if (!message) return;
        message.textContent = text;
        message.hidden = !text;
        message.classList.toggle('is-error', isError);
    }

    inviteForm?.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();
        const idInput = inviteForm.querySelector('input');
        const sendBtn = inviteForm.querySelector('button[type="submit"]');
        const memberId = idInput?.value.trim();

        if (!memberId) return;

        if (invitedIds.has(memberId)) {
            showMessage('ขื่อผู้ใช้นี้ถูกเพิ่มในรายการแล้ว', true);
            if (idInput) idInput.value = '';
            return;
        }

        showMessage('');
        let displayName = '';
        if (hasStoredAuthToken()) {
            if (sendBtn) sendBtn.disabled = true;
            try {
                const api = await loadProjectApiForInvite();
                // GET /api/users/{tu_id}: only people who have logged in before exist in the database.
                const user = await api.findUser(memberId);
                if (!user) {
                    showMessage(`ไม่พบรหัสนักศึกษา ${memberId} ในระบบของมหาวิทยาลัย (TU)`, true);
                    return;
                }

                const me = await api.getCurrentUser();
                if (user.tu_id === me.tu_id) {
                    showMessage('คุณเป็นหัวหน้ากลุ่มและเป็นสมาชิกของโปรเจกต์นี้แล้ว', true);
                    if (idInput) idInput.value = '';
                    return;
                }
                displayName = user.displayName;
            } catch (error) {
                showMessage(error.message, true);
                return;
            } finally {
                if (sendBtn) sendBtn.disabled = false;
            }
        }

        const member = describeInvitedMember(memberId, displayName);

        invitedIds.add(memberId);
        invitedMembers.set(memberId, member);

        const cardElement = createInvitedMemberCard(member, memberId, (removedId) => {
            invitedIds.delete(removedId);
            invitedMembers.delete(removedId);
        });

        invitedList?.append(cardElement);
        if (idInput) idInput.value = '';
    });

    if (isExistingProject) {
        submitBtn?.addEventListener('click', async () => {
            if (!projectId) {
                showMessage('ไม่พบรหัสโปรเจกต์ จึงไม่สามารถเพิ่มสมาชิกได้', true);
                return;
            }
            if (!hasStoredAuthToken()) {
                showMessage('กรุณาเข้าสู่ระบบก่อนเพิ่มสมาชิก', true);
                return;
            }
            if (!invitedIds.size) {
                showMessage('กรุณาเพิ่มสมาชิกอย่างน้อยหนึ่งคนก่อน', true);
                return;
            }

            submitBtn.disabled = true;
            showMessage('กำลังเพิ่มสมาชิก...');
            const failures = [];
            try {
                const api = await loadProjectApiForInvite();
                for (const memberId of invitedIds) {
                    try {
                        await api.addProjectMember(projectId, memberId);
                        Array.from(invitedList?.querySelectorAll('[data-member-id]') || [])
                            .find((card) => card.dataset.memberId === memberId)
                            ?.remove();
                        invitedIds.delete(memberId);
                        invitedMembers.delete(memberId);
                    } catch (error) {
                        failures.push(`${memberId}: ${error.message}`);
                    }
                }
            } catch (error) {
                showMessage(error.message, true);
                submitBtn.disabled = false;
                return;
            }
            submitBtn.disabled = false;
            showMessage(failures.length
                ? `เพิ่มสมาชิกไม่สำเร็จ: ${failures.join(' / ')}`
                : 'เพิ่มสมาชิกเรียบร้อยแล้ว');
        });
    } else {
        submitBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('addmember:create', {
                detail: {
                    groupName: projectDraft.groupName || '',
                    subject: projectDraft.subject || '',
                    dueDate: projectDraft.dueDate || '',
                    invitedMemberIds: [...invitedIds],
                    members: [...invitedIds].map((memberId) => ({
                        studentId: memberId,
                        name: invitedMembers.get(memberId).name,
                        role: invitedMembers.get(memberId).role,
                        avatarText: invitedMembers.get(memberId).avatarText,
                    })),
                },
            }));
        }, { once: true });
    }

    backBtn?.addEventListener('click', () => {
        document.dispatchEvent(new Event('addmember:back'));
    }, { once: true });
});