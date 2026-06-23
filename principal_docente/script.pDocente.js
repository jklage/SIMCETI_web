// ── Logout ────────────────────────────────────────────────────────────────────

function hacerLogout() {
    sessionStorage.clear();
    window.location.href = '/elegir/eleccion.html';
}

document.getElementById('btn-logout').addEventListener('click', e => {
    e.preventDefault();
    hacerLogout();
});

document.getElementById('btn-logout-header').addEventListener('click', hacerLogout);

// ── Dropdown de usuario ───────────────────────────────────────────────────────

const userMenuTrigger = document.getElementById('user-menu-trigger');
const userDropdown    = document.getElementById('user-dropdown');

userMenuTrigger.addEventListener('click', e => {
    e.stopPropagation();
    userDropdown.classList.toggle('open');
});

document.addEventListener('click', e => {
    if (!userDropdown.contains(e.target) && e.target !== userMenuTrigger) {
        userDropdown.classList.remove('open');
    }
});

// ── Perfil / avatar ───────────────────────────────────────────────────────────

const avatarModal   = document.getElementById('avatar-modal');
const avatarPreview = document.getElementById('avatar-preview-img');
const headerAvatar  = document.getElementById('header-avatar');

const savedAvatar = localStorage.getItem('docente_avatar');
if (savedAvatar) {
    headerAvatar.src = savedAvatar;
    avatarPreview.src = savedAvatar;
}

document.getElementById('btn-ver-avatar').addEventListener('click', () => {
    userDropdown.classList.remove('open');
    avatarModal.classList.remove('hidden');
});

document.getElementById('cerrar-avatar-modal').addEventListener('click', () =>
    avatarModal.classList.add('hidden'));

avatarModal.addEventListener('click', e => {
    if (e.target === avatarModal) avatarModal.classList.add('hidden');
});

document.getElementById('avatar-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const data = ev.target.result;
        headerAvatar.src = data;
        avatarPreview.src = data;
        localStorage.setItem('docente_avatar', data);
    };
    reader.readAsDataURL(file);
});

// ── Configuración ─────────────────────────────────────────────────────────────

const settingsModal = document.getElementById('settings-modal');

document.getElementById('btn-configuracion').addEventListener('click', () => {
    userDropdown.classList.remove('open');
    settingsModal.classList.remove('hidden');
});

document.getElementById('cerrar-settings-modal').addEventListener('click', () =>
    settingsModal.classList.add('hidden'));

settingsModal.addEventListener('click', e => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

// ── Notificaciones ────────────────────────────────────────────────────────────

const notifPanel   = document.getElementById('notif-panel');
const notifOverlay = document.getElementById('notif-overlay');
const notifBadge   = document.getElementById('notif-badge');

document.getElementById('notif-btn').addEventListener('click', () => {
    notifPanel.classList.toggle('hidden');
    notifOverlay.classList.toggle('hidden');
    notifBadge.classList.add('hidden');
});

document.getElementById('cerrar-notif-panel').addEventListener('click', cerrarNotifPanel);
notifOverlay.addEventListener('click', cerrarNotifPanel);

function cerrarNotifPanel() {
    notifPanel.classList.add('hidden');
    notifOverlay.classList.add('hidden');
}
