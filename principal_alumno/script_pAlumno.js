const GOOGLE_CLIENT_ID = '69679398129-l7nfc1sp54l7qiomhfol99rkutjh6coe.apps.googleusercontent.com';
const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me'
].join(' ');

let tokenClient  = null;
let accessToken  = sessionStorage.getItem('classroom_token');
let todasLasTareas = [];
let tareasPorId    = {};
let colorPorCurso  = {};
let currentTarea      = null;
let currentSubmission = null;

// ── Navegación ────────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        link.classList.add('active');
    });
});

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

document.getElementById('btn-ir-tareas').addEventListener('click', () => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('tareas').classList.add('active');
    document.querySelector('[data-section="tareas"]').classList.add('active');
});

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

const savedAvatar = localStorage.getItem('alumno_avatar');
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
        localStorage.setItem('alumno_avatar', data);
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

function actualizarFecha() {
    const el = document.getElementById('dashboard-fecha');
    if (!el) return;
    const ahora = new Date();
    el.textContent = ahora.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}
actualizarFecha();

function generarNotificaciones(tareas) {
    const ahora  = new Date();
    const lista  = document.getElementById('notif-lista');
    const items  = [];

    tareas.forEach(tarea => {
        if (!tarea.dueDate) return;
        const fecha    = fechaDesdeDueDate(tarea.dueDate);
        const diffMs   = fecha - ahora;
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) {
            items.push({ clase: 'vencida', icon: 'alert-circle-outline', tarea, diffDias });
        } else if (diffDias <= 3) {
            items.push({ clase: diffDias === 0 ? 'hoy' : 'proxima', icon: 'time-outline', tarea, diffDias });
        }
    });

    if (!items.length) {
        lista.innerHTML = '<p class="notif-empty">Sin notificaciones nuevas.</p>';
        notifBadge.classList.add('hidden');
        return;
    }

    items.sort((a, b) => a.diffDias - b.diffDias);

    lista.innerHTML = items.map(({ clase, icon, tarea }) => {
        const { etiqueta } = etiquetaFecha(tarea.dueDate, ahora);
        return `
          <div class="notif-item ${clase}">
            <ion-icon name="${icon}"></ion-icon>
            <div class="notif-item-body">
              <strong>${tarea.title}</strong>
              <p>${tarea.nombreCurso}</p>
              <p>${etiqueta}</p>
            </div>
          </div>`;
    }).join('');

    notifBadge.textContent = items.length;
    notifBadge.classList.remove('hidden');
}

// ── Tabs de tareas ────────────────────────────────────────────────────────────

let tabActual   = 'asignado';
let claseActual = '';

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aplicarTab(btn.dataset.tab, claseActual);
    });
});

document.getElementById('filtro-clase')?.addEventListener('change', function () {
    claseActual = this.value;
    aplicarTab(tabActual, claseActual);
});

function clasificarTarea(tarea) {
    const estado = tarea.submission?.state || 'NEW';
    if (estado === 'TURNED_IN' || estado === 'RETURNED') return 'hecho';
    const ahora = new Date();
    if (tarea.dueDate && fechaDesdeDueDate(tarea.dueDate) < ahora) return 'sin_entregar';
    return 'asignado';
}

function aplicarTab(tab, claseId = '') {
    tabActual   = tab;
    claseActual = claseId;
    const base  = claseId ? todasLasTareas.filter(t => t.courseId === claseId) : todasLasTareas;
    const mapa  = {
        asignado:     base.filter(t => clasificarTarea(t) === 'asignado'),
        sin_entregar: base.filter(t => clasificarTarea(t) === 'sin_entregar'),
        hecho:        base.filter(t => clasificarTarea(t) === 'hecho'),
    };
    renderizarTareas(mapa[tab] || [], tab);
}

function poblarFiltroClases(cursos) {
    const select    = document.getElementById('filtro-clase');
    if (!select) return;
    const existentes = new Set([...select.options].map(o => o.value));
    cursos.forEach(c => {
        if (existentes.has(c.id)) return;
        const opt = document.createElement('option');
        opt.value       = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// ── Google Identity Services ──────────────────────────────────────────────────

window.onGoogleLibraryLoad = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CLASSROOM_SCOPES,
        callback: async resp => {
            if (resp.error) { mostrarError('Error al autorizar: ' + resp.error); return; }
            accessToken = resp.access_token;
            sessionStorage.setItem('classroom_token', accessToken);
            await cargarClassroom();
        }
    });

    document.getElementById('btn-conectar-classroom').addEventListener('click', () => {
        tokenClient.requestAccessToken();
    });

    if (accessToken) cargarClassroom();
};

// ── API Classroom ─────────────────────────────────────────────────────────────

async function classroomGet(url) {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (resp.status === 401) {
        accessToken = null;
        sessionStorage.removeItem('classroom_token');
        throw Object.assign(new Error('token_expired'), { code: 401 });
    }
    if (!resp.ok) throw new Error(`Error ${resp.status}`);
    return resp.json();
}

async function cargarClassroom() {
    document.getElementById('classroom-connect-banner').classList.add('loading');
    try {
        const data   = await classroomGet('https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE');
        const cursos = data.courses || [];

        document.getElementById('classroom-connect-banner').classList.add('hidden');
        document.getElementById('classroom-resumen').classList.remove('hidden');

        renderizarCursos(cursos);
        document.getElementById('resumen-cursos-num').textContent = cursos.length;

        const resultados = await Promise.allSettled(cursos.map(c => cargarTareasDeCurso(c)));

        todasLasTareas = resultados
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort(ordenarPorFecha);

        tareasPorId = {};
        todasLasTareas.forEach(t => { tareasPorId[t.id] = t; });

        const asignado    = todasLasTareas.filter(t => clasificarTarea(t) === 'asignado');
        const sinEntregar = todasLasTareas.filter(t => clasificarTarea(t) === 'sin_entregar');

        document.getElementById('resumen-tareas-num').textContent   = asignado.length;
        document.getElementById('resumen-vencidas-num').textContent = sinEntregar.length;

        const cuentasPorCurso = {};
        todasLasTareas.forEach(t => {
            cuentasPorCurso[t.courseId] = (cuentasPorCurso[t.courseId] || 0) + 1;
        });
        renderizarCursos(cursos, cuentasPorCurso);
        poblarFiltroClases(cursos);

        aplicarTab('asignado');
        renderizarProximas(asignado);
        generarNotificaciones(todasLasTareas);

    } catch (err) {
        document.getElementById('classroom-connect-banner').classList.remove('loading');
        if (err.code === 401) mostrarError('Sesión expirada. Vuelve a conectar Classroom.');
        else { console.error(err); mostrarError('No se pudieron cargar los datos de Classroom.'); }
    }
}

async function cargarTareasDeCurso(curso) {
    const [workData, submData] = await Promise.all([
        classroomGet(`https://classroom.googleapis.com/v1/courses/${curso.id}/courseWork?courseWorkStates=PUBLISHED&orderBy=dueDate+asc`),
        classroomGet(`https://classroom.googleapis.com/v1/courses/${curso.id}/courseWork/-/studentSubmissions?userId=me`)
            .catch(() => ({ studentSubmissions: [] }))
    ]);
    const submissions = {};
    (submData.studentSubmissions || []).forEach(s => { submissions[s.courseWorkId] = s; });
    return (workData.courseWork || []).map(t => ({
        ...t, courseId: curso.id, nombreCurso: curso.name, submission: submissions[t.id] || null
    }));
}

// ── Renderizado: Cursos ───────────────────────────────────────────────────────

const COLORES_CURSO = ['#4285F4','#EA4335','#FBBC04','#34A853','#FF6D00','#9C27B0','#00BCD4','#F06292'];

function iconoPorTipo(workType) {
    if (workType === 'SHORT_ANSWER_QUESTION' || workType === 'MULTIPLE_CHOICE_QUESTION') return 'help-circle-outline';
    if (workType === 'MATERIAL') return 'document-text-outline';
    return 'clipboard-outline';
}

function renderizarCursos(cursos, cuentas = {}) {
    cursos.forEach((c, i) => { colorPorCurso[c.id] = COLORES_CURSO[i % COLORES_CURSO.length]; });
    const cont = document.getElementById('lista-cursos');
    document.getElementById('cursos-count').textContent =
        `${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`;

    if (!cursos.length) {
        cont.innerHTML = `<div class="estado-vacio"><ion-icon name="book-outline"></ion-icon><p>No tienes cursos activos.</p></div>`;
        return;
    }

    cont.innerHTML = cursos.map((curso, i) => {
        const color   = COLORES_CURSO[i % COLORES_CURSO.length];
        const inicial = curso.name.charAt(0).toUpperCase();
        const nTareas = cuentas[curso.id] || 0;
        const badgeTareas = nTareas > 0
            ? `<span class="curso-badge-tareas">${nTareas} tarea${nTareas !== 1 ? 's' : ''}</span>`
            : '';
        return `
          <div class="curso-card" style="--curso-color:${color}">
            <div class="curso-portada">
              <span class="curso-inicial">${inicial}</span>
              ${badgeTareas}
            </div>
            <div class="curso-info">
              <h3 class="curso-nombre">${curso.name}</h3>
              ${curso.section            ? `<p class="curso-seccion"><ion-icon name="people-outline"></ion-icon>${curso.section}</p>` : ''}
              ${curso.descriptionHeading ? `<p class="curso-desc">${curso.descriptionHeading}</p>` : ''}
            </div>
            <div class="curso-footer">
              <a href="${curso.alternateLink}" target="_blank" rel="noopener" class="curso-link-classroom">
                <ion-icon name="open-outline"></ion-icon><span>Abrir en Classroom</span>
              </a>
            </div>
          </div>`;
    }).join('');
}

// ── Renderizado: Tareas (estilo Classroom) ────────────────────────────────────

const GRUPOS_ASIGNADO = [
    { key: 'esta_semana',    titulo: 'Esta semana'          },
    { key: 'proxima_semana', titulo: 'Próxima semana'       },
    { key: 'mas_tarde',      titulo: 'Más tarde'            },
    { key: 'sin_fecha',      titulo: 'Sin fecha de entrega' },
];

const GRUPOS_SIN_ENTREGAR = [
    { key: 'esta_semana',   titulo: 'Vencidas esta semana'      },
    { key: 'semana_pasada', titulo: 'Vencidas la semana pasada' },
    { key: 'anterior',      titulo: 'Vencidas anteriormente'    },
];

function _inicioSemana(ahora) {
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    hoy.setDate(hoy.getDate() - hoy.getDay()); // retrocede al domingo
    return hoy;
}

function grupoPorFecha(tarea) {
    if (!tarea.dueDate) return 'sin_fecha';
    const ahora        = new Date();
    const fecha        = fechaDesdeDueDate(tarea.dueDate);
    const inicioSemana = _inicioSemana(ahora);
    const finSemana    = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    const finProxSemana = new Date(finSemana);
    finProxSemana.setDate(finSemana.getDate() + 7);
    if (fecha <= finSemana)    return 'esta_semana';
    if (fecha <= finProxSemana) return 'proxima_semana';
    return 'mas_tarde';
}

function grupoVencida(tarea) {
    const ahora             = new Date();
    const fecha             = fechaDesdeDueDate(tarea.dueDate);
    const inicioSemana      = _inicioSemana(ahora);
    const inicioSemAnterior = new Date(inicioSemana);
    inicioSemAnterior.setDate(inicioSemana.getDate() - 7);
    if (fecha >= inicioSemana)      return 'esta_semana';
    if (fecha >= inicioSemAnterior) return 'semana_pasada';
    return 'anterior';
}

function _renderGrupos(definiciones, grupos, ahora, tab, claseHeader = '') {
    return definiciones
        .filter(g => grupos[g.key] && grupos[g.key].length > 0)
        .map(g => `
          <div class="tareas-grupo" data-grupo="${g.key}">
            <button type="button" class="grupo-header ${claseHeader}">
              <ion-icon name="chevron-down-outline" class="grupo-chevron"></ion-icon>
              <span class="grupo-titulo-text">${g.titulo}</span>
              <span class="grupo-count ${claseHeader ? 'grupo-count-vencida' : ''}">${grupos[g.key].length}</span>
            </button>
            <div class="tareas-grupo-lista">
              ${grupos[g.key].map(t => renderTareaItem(t, ahora, tab)).join('')}
            </div>
          </div>`)
        .join('');
}

function renderizarTareas(tareas, tab) {
    const cont = document.getElementById('lista-tareas');
    const msgs = {
        asignado:     '¡Sin tareas asignadas pendientes!',
        sin_entregar: 'No tienes tareas vencidas sin entregar.',
        hecho:        'Aún no has entregado ninguna tarea.',
    };
    const ahora = new Date();

    if (!tareas.length) {
        cont.innerHTML = `<div class="estado-vacio"><ion-icon name="checkmark-done-circle-outline"></ion-icon><p>${msgs[tab] || '¡Sin tareas!'}</p></div>`;
        return;
    }

    if (tab === 'asignado') {
        const grupos = { esta_semana: [], proxima_semana: [], mas_tarde: [], sin_fecha: [] };
        tareas.forEach(t => { grupos[grupoPorFecha(t)].push(t); });
        cont.innerHTML = _renderGrupos(GRUPOS_ASIGNADO, grupos, ahora, tab);

    } else if (tab === 'sin_entregar') {
        // Ordenar: más recientemente vencida primero (fecha descendente)
        const sorted = [...tareas].sort(ordenarPorFechaDesc);
        const grupos = { esta_semana: [], semana_pasada: [], anterior: [] };
        sorted.forEach(t => { grupos[grupoVencida(t)].push(t); });
        cont.innerHTML = _renderGrupos(GRUPOS_SIN_ENTREGAR, grupos, ahora, tab, 'grupo-header-vencida');

    } else { // hecho
        const sorted = [...tareas].sort(ordenarPorFechaDesc);
        cont.innerHTML = `<div class="tareas-grupo-lista">${sorted.map(t => renderTareaItem(t, ahora, tab)).join('')}</div>`;
    }

    cont.querySelectorAll('.grupo-header').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.tareas-grupo').classList.toggle('collapsed'));
    });
    cont.querySelectorAll('.tarea-item').forEach(el => {
        const abrir = () => abrirModalTarea(tareasPorId[el.dataset.id]);
        el.addEventListener('click', abrir);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') abrir(); });
    });
}

function renderTareaItem(tarea, ahora, tab) {
    const { etiqueta, clase } = etiquetaFecha(tarea.dueDate, ahora);
    const color  = colorPorCurso[tarea.courseId] || 'var(--background-color)';
    const icono  = iconoPorTipo(tarea.workType);

    let metaFecha = '';
    if (!tarea.dueDate && tarea.creationTime) {
        const d = new Date(tarea.creationTime);
        metaFecha = `<p class="tarea-publish-date">Publicado: ${d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}</p>`;
    }

    let meta = '';
    if (tab === 'hecho') {
        const estado = tarea.submission?.state || 'TURNED_IN';
        const info   = INFO_ESTADO[estado] || INFO_ESTADO.TURNED_IN;
        meta = `<span class="tarea-estado-badge ${info.clase}"><ion-icon name="${info.icon}"></ion-icon>${info.texto}</span>`;
    } else {
        meta = `<span class="tarea-fecha ${clase}">${etiqueta}</span>`;
    }

    const desc = !metaFecha && tarea.description
        ? `<p class="tarea-desc">${tarea.description.slice(0, 120)}${tarea.description.length > 120 ? '…' : ''}</p>`
        : '';

    return `
      <div class="tarea-item ${clase}" data-id="${tarea.id}" role="button" tabindex="0">
        <div class="tarea-icono" style="background:${color}">
          <ion-icon name="${icono}"></ion-icon>
        </div>
        <div class="tarea-cuerpo">
          <p class="tarea-curso-nombre">${tarea.nombreCurso}</p>
          <h4 class="tarea-titulo">${tarea.title}</h4>
          ${metaFecha}${desc}
        </div>
        <div class="tarea-meta">
          ${meta}
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </div>
      </div>`;
}

// ── Widget: próximas entregas (dashboard) ─────────────────────────────────────

function renderizarProximas(pendientes) {
    const widget = document.getElementById('proximas-widget');
    const lista  = document.getElementById('lista-proximas');
    const ahora  = new Date();

    const proximas = pendientes
        .filter(t => t.dueDate)
        .slice(0, 5);

    if (!proximas.length) {
        widget.classList.add('hidden');
        return;
    }

    widget.classList.remove('hidden');
    lista.innerHTML = proximas.map(tarea => {
        const { etiqueta, clase } = etiquetaFecha(tarea.dueDate, ahora);
        return `
          <div class="proxima-item" data-id="${tarea.id}" role="button" tabindex="0">
            <span class="proxima-badge ${clase}">${etiqueta}</span>
            <div class="proxima-info">
              <span class="proxima-curso">${tarea.nombreCurso}</span>
              <strong class="proxima-titulo">${tarea.title}</strong>
            </div>
            <ion-icon name="chevron-forward-outline" class="proxima-chevron"></ion-icon>
          </div>`;
    }).join('');

    lista.querySelectorAll('.proxima-item').forEach(el => {
        el.addEventListener('click', () => abrirModalTarea(tareasPorId[el.dataset.id]));
    });
}

// ── Modal de tarea ────────────────────────────────────────────────────────────

const tareaModal       = document.getElementById('tarea-modal');
const modalLoading     = document.getElementById('modal-loading');
const modalEstado      = document.getElementById('modal-estado-submission');
const modalEntregaForm = document.getElementById('modal-entrega-form');

document.getElementById('cerrar-tarea-modal').addEventListener('click', () =>
    tareaModal.classList.add('hidden'));

tareaModal.addEventListener('click', e => {
    if (e.target === tareaModal) tareaModal.classList.add('hidden');
});

async function abrirModalTarea(tarea) {
    if (!tarea) return;
    currentTarea = tarea;
    currentSubmission = null;

    document.getElementById('modal-tarea-curso').textContent  = tarea.nombreCurso;
    document.getElementById('modal-tarea-titulo').textContent = tarea.title;
    const { etiqueta } = etiquetaFecha(tarea.dueDate, new Date());
    document.getElementById('modal-tarea-fecha').textContent = `Fecha límite: ${etiqueta}`;
    document.getElementById('modal-tarea-desc').textContent  = tarea.description || 'Sin descripción.';
    document.getElementById('submission-link-input').value   = '';

    modalEstado.classList.add('hidden');
    modalEntregaForm.classList.add('hidden');
    modalLoading.classList.remove('hidden');
    tareaModal.classList.remove('hidden');

    try {
        currentSubmission = await cargarSubmission(tarea.courseId, tarea.id);
        mostrarEstadoSubmission(currentSubmission, tarea);
    } catch {
        modalLoading.classList.add('hidden');
        modalEstado.className = 'submission-badge pendiente';
        modalEstado.innerHTML = '<ion-icon name="alert-circle-outline"></ion-icon> Error al cargar el estado';
        modalEstado.classList.remove('hidden');
    }
}

async function cargarSubmission(courseId, courseWorkId) {
    const data = await classroomGet(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions?userId=me`
    );
    return (data.studentSubmissions || [])[0] || null;
}

const INFO_ESTADO = {
    TURNED_IN:            { clase: 'entregada', icon: 'checkmark-circle-outline', texto: 'Entregada' },
    RETURNED:             { clase: 'devuelta',  icon: 'star-outline',             texto: 'Calificada y devuelta' },
    NEW:                  { clase: 'pendiente', icon: 'time-outline',             texto: 'Sin entregar' },
    CREATED:              { clase: 'pendiente', icon: 'time-outline',             texto: 'Sin entregar' },
    RECLAIMED_BY_STUDENT: { clase: 'pendiente', icon: 'refresh-outline',          texto: 'Reclamada — puedes re-entregar' }
};

function mostrarEstadoSubmission(submission, tarea) {
    modalLoading.classList.add('hidden');
    const estado = submission?.state || 'NEW';
    const info   = INFO_ESTADO[estado] || INFO_ESTADO.NEW;
    const { clase } = etiquetaFecha(tarea.dueDate, new Date());

    const vencidaSinEntregar = clase === 'vencida' && estado !== 'TURNED_IN' && estado !== 'RETURNED';
    modalEstado.className = `submission-badge ${vencidaSinEntregar ? 'vencida' : info.clase}`;
    modalEstado.innerHTML = `<ion-icon name="${info.icon}"></ion-icon> ${vencidaSinEntregar ? 'Vencida sin entregar' : info.texto}`;
    modalEstado.classList.remove('hidden');

    if (estado !== 'TURNED_IN' && estado !== 'RETURNED') {
        modalEntregaForm.classList.remove('hidden');
    }
}

document.getElementById('btn-entregar').addEventListener('click', async () => {
    if (!currentTarea || !currentSubmission) return;

    const btn = document.getElementById('btn-entregar');
    btn.disabled = true;
    btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Entregando…';

    const { courseId, id: courseWorkId } = currentTarea;
    const submissionId = currentSubmission.id;
    const linkUrl = document.getElementById('submission-link-input').value.trim();

    try {
        if (linkUrl) {
            await fetch(
                `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}?updateMask=assignmentSubmission`,
                {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignmentSubmission: { attachments: [{ link: { url: linkUrl } }] } })
                }
            );
        }

        await fetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:turnIn`,
            { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
        );

        currentSubmission = await cargarSubmission(courseId, courseWorkId);
        mostrarEstadoSubmission(currentSubmission, currentTarea);

    } catch (err) {
        console.error('Error al entregar:', err);
        btn.disabled = false;
        btn.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Entregar tarea';
        modalEstado.className = 'submission-badge vencida';
        modalEstado.innerHTML = '<ion-icon name="alert-circle-outline"></ion-icon> Error al entregar. Intenta de nuevo.';
    }
});

// ── Utilidades de fecha ───────────────────────────────────────────────────────

function fechaDesdeDueDate({ year, month, day }) {
    return new Date(year, month - 1, day, 23, 59);
}

function ordenarPorFecha(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return fechaDesdeDueDate(a.dueDate) - fechaDesdeDueDate(b.dueDate);
}

function ordenarPorFechaDesc(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return fechaDesdeDueDate(b.dueDate) - fechaDesdeDueDate(a.dueDate);
}

function etiquetaFecha(dueDate, ahora) {
    if (!dueDate) return { etiqueta: 'Sin fecha límite', clase: 'sin-fecha' };
    const fecha    = fechaDesdeDueDate(dueDate);
    const diffMs   = fecha - ahora;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs < 0) {
        const dias = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
        if (dias === 1) return { etiqueta: 'Venció ayer', clase: 'vencida' };
        if (dias <= 7)  return { etiqueta: `Venció hace ${dias} días`, clase: 'vencida' };
        return { etiqueta: `Venció el ${fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`, clase: 'vencida' };
    }
    if (diffDias === 0) return { etiqueta: 'Vence hoy',         clase: 'hoy'    };
    if (diffDias === 1) return { etiqueta: 'Vence mañana',      clase: 'manana' };
    if (diffDias <= 7)  return { etiqueta: `En ${diffDias} días`, clase: 'proxima' };
    return { etiqueta: fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), clase: '' };
}

function mostrarError(msg) {
    const banner = document.getElementById('classroom-connect-banner');
    banner.classList.remove('loading', 'hidden');
    const p = banner.querySelector('.banner-text p');
    if (p) p.textContent = msg;
}
