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

    const invitedIds = new Set();
    const invitedMembers = new Map();

    if (groupName) groupName.textContent = projectDraft.groupName || '';

    inviteForm?.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();
        const idInput = inviteForm.querySelector('input');
        const sendBtn = inviteForm.querySelector('button[type="submit"]');
        const memberId = idInput?.value.trim();

        if (!memberId) return;

        if (invitedIds.has(memberId)) {
            alert('รหัสสมาชิกนี้ถูกเพิ่มในรายการแล้วครับ');
            if (idInput) idInput.value = '';
            return;
        }

        let displayName = '';
        if (hasStoredAuthToken()) {
            if (sendBtn) sendBtn.disabled = true;
            try {
                const api = await loadProjectApiForInvite();
                // GET /api/users/{tu_id}: only people who have logged in before exist in the database.
                const user = await api.findUser(memberId);
                if (!user) {
                    alert(`ไม่มีรหัสนักศึกษา ${memberId} ในระบบ (ต้องเคยเข้าสู่ระบบอย่างน้อย 1 ครั้ง)`);
                    return;
                }

                const me = await api.getCurrentUser();
                if (user.tu_id === me.tu_id) {
                    alert('คุณเป็นหัวหน้ากลุ่มและเป็นสมาชิกของโปรเจกต์นี้อยู่แล้วครับ');
                    if (idInput) idInput.value = '';
                    return;
                }
                displayName = user.displayName;
            } catch (error) {
                alert(error.message);
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

    backBtn?.addEventListener('click', () => {
        document.dispatchEvent(new Event('addmember:back'));
    }, { once: true });
});