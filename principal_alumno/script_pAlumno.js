const GOOGLE_CLIENT_ID = '69679398129-l7nfc1sp54l7qiomhfol99rkutjh6coe.apps.googleusercontent.com';
const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
].join(' ');

let tokenClient = null;
let accessToken = sessionStorage.getItem('classroom_token');
let todasLasTareas = [];

// ── Navegación entre secciones ────────────────────────────────────────────────

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const seccionId = link.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(seccionId).classList.add('active');
        link.classList.add('active');
    });
});

document.getElementById('btn-logout').addEventListener('click', e => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = '/elegir/eleccion.html';
});

// ── Filtros de tareas ─────────────────────────────────────────────────────────

document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aplicarFiltro(btn.dataset.filtro);
    });
});

function aplicarFiltro(filtro) {
    const ahora = new Date();
    const filtradas = filtro === 'pendientes'
        ? todasLasTareas.filter(t => {
            if (!t.dueDate) return true;
            const vence = fechaDesdeDueDate(t.dueDate);
            return vence >= ahora;
        })
        : todasLasTareas;
    renderizarTareas(filtradas);
}

// ── Google Identity Services ──────────────────────────────────────────────────

// GIS llama a este callback cuando el script carga (onload)
window.onGoogleLibraryLoad = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CLASSROOM_SCOPES,
        callback: async resp => {
            if (resp.error) {
                mostrarError('Error al autorizar: ' + resp.error);
                return;
            }
            accessToken = resp.access_token;
            sessionStorage.setItem('classroom_token', accessToken);
            await cargarClassroom();
        }
    });

    document.getElementById('btn-conectar-classroom').addEventListener('click', () => {
        tokenClient.requestAccessToken();
    });

    // Si ya hay token en sesión, cargar directamente
    if (accessToken) cargarClassroom();
};

// ── API de Classroom ──────────────────────────────────────────────────────────

async function classroomGet(url) {
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (resp.status === 401) {
        // Token expirado
        accessToken = null;
        sessionStorage.removeItem('classroom_token');
        throw Object.assign(new Error('token_expired'), { code: 401 });
    }
    if (!resp.ok) throw new Error(`Error ${resp.status} en ${url}`);
    return resp.json();
}

async function cargarClassroom() {
    document.getElementById('classroom-connect-banner').classList.add('loading');
    try {
        const data = await classroomGet(
            'https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE'
        );
        const cursos = data.courses || [];

        // Ocultar banner de conexión, mostrar resumen
        document.getElementById('classroom-connect-banner').classList.add('hidden');
        document.getElementById('classroom-resumen').classList.remove('hidden');

        renderizarCursos(cursos);
        document.getElementById('resumen-cursos-num').textContent = cursos.length;

        // Cargar tareas de todos los cursos en paralelo
        const tareasPorCurso = await Promise.allSettled(
            cursos.map(curso => cargarTareasDeCurso(curso))
        );

        todasLasTareas = tareasPorCurso
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort((a, b) => ordenarPorFecha(a, b));

        const ahora = new Date();
        const pendientes = todasLasTareas.filter(t => {
            if (!t.dueDate) return true;
            return fechaDesdeDueDate(t.dueDate) >= ahora;
        });
        const vencidas = todasLasTareas.filter(t => {
            if (!t.dueDate) return false;
            return fechaDesdeDueDate(t.dueDate) < ahora;
        });

        document.getElementById('resumen-tareas-num').textContent = pendientes.length;
        document.getElementById('resumen-vencidas-num').textContent = vencidas.length;

        aplicarFiltro('pendientes');

    } catch (err) {
        document.getElementById('classroom-connect-banner').classList.remove('loading');
        if (err.code === 401) {
            mostrarError('Sesión expirada. Vuelve a conectar Classroom.');
        } else {
            console.error(err);
            mostrarError('No se pudieron cargar los datos de Classroom.');
        }
    }
}

async function cargarTareasDeCurso(curso) {
    const data = await classroomGet(
        `https://classroom.googleapis.com/v1/courses/${curso.id}/courseWork?courseWorkStates=PUBLISHED&orderBy=dueDate+asc`
    );
    return (data.courseWork || []).map(tarea => ({
        ...tarea,
        nombreCurso: curso.name,
        colorCurso: curso.alternateLink
    }));
}

// ── Renderizado: Cursos ───────────────────────────────────────────────────────

const COLORES_CURSO = [
    '#4285F4', '#EA4335', '#FBBC04', '#34A853',
    '#FF6D00', '#9C27B0', '#00BCD4', '#F06292'
];

function renderizarCursos(cursos) {
    const contenedor = document.getElementById('lista-cursos');
    document.getElementById('cursos-count').textContent =
        `${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`;

    if (!cursos.length) {
        contenedor.innerHTML = `
          <div class="estado-vacio">
            <ion-icon name="book-outline"></ion-icon>
            <p>No tienes cursos activos en Classroom.</p>
          </div>`;
        return;
    }

    contenedor.innerHTML = cursos.map((curso, i) => {
        const color = COLORES_CURSO[i % COLORES_CURSO.length];
        const inicial = curso.name.charAt(0).toUpperCase();
        return `
          <a class="curso-card" href="${curso.alternateLink}" target="_blank" rel="noopener"
             style="--curso-color:${color}">
            <div class="curso-portada">
              <span class="curso-inicial">${inicial}</span>
            </div>
            <div class="curso-info">
              <h3 class="curso-nombre">${curso.name}</h3>
              ${curso.section ? `<p class="curso-seccion">${curso.section}</p>` : ''}
              ${curso.descriptionHeading ? `<p class="curso-desc">${curso.descriptionHeading}</p>` : ''}
            </div>
            <div class="curso-footer">
              <ion-icon name="open-outline"></ion-icon>
              <span>Abrir en Classroom</span>
            </div>
          </a>`;
    }).join('');
}

// ── Renderizado: Tareas ───────────────────────────────────────────────────────

function renderizarTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');

    if (!tareas.length) {
        contenedor.innerHTML = `
          <div class="estado-vacio">
            <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            <p>¡Sin tareas pendientes!</p>
          </div>`;
        return;
    }

    const ahora = new Date();
    contenedor.innerHTML = tareas.map(tarea => {
        const { etiqueta, clase } = etiquetaFecha(tarea.dueDate, ahora);
        const link = tarea.alternateLink || '#';
        return `
          <a class="tarea-item ${clase}" href="${link}" target="_blank" rel="noopener">
            <div class="tarea-curso-dot"></div>
            <div class="tarea-cuerpo">
              <p class="tarea-curso-nombre">${tarea.nombreCurso}</p>
              <h4 class="tarea-titulo">${tarea.title}</h4>
              ${tarea.description
                ? `<p class="tarea-desc">${tarea.description.slice(0, 100)}${tarea.description.length > 100 ? '…' : ''}</p>`
                : ''}
            </div>
            <div class="tarea-meta">
              <span class="tarea-fecha ${clase}">${etiqueta}</span>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </div>
          </a>`;
    }).join('');
}

// ── Utilidades de fecha ───────────────────────────────────────────────────────

function fechaDesdeDueDate(dueDate) {
    const { year, month, day } = dueDate;
    return new Date(year, month - 1, day, 23, 59);
}

function ordenarPorFecha(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return fechaDesdeDueDate(a.dueDate) - fechaDesdeDueDate(b.dueDate);
}

function etiquetaFecha(dueDate, ahora) {
    if (!dueDate) return { etiqueta: 'Sin fecha límite', clase: 'sin-fecha' };

    const fecha = fechaDesdeDueDate(dueDate);
    const diffMs = fecha - ahora;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return { etiqueta: 'Vencida', clase: 'vencida' };
    if (diffDias === 0) return { etiqueta: 'Vence hoy', clase: 'hoy' };
    if (diffDias === 1) return { etiqueta: 'Vence mañana', clase: 'manana' };
    if (diffDias <= 7) return { etiqueta: `${diffDias} días`, clase: 'proxima' };

    const opciones = { day: 'numeric', month: 'short' };
    return { etiqueta: fecha.toLocaleDateString('es-MX', opciones), clase: '' };
}

// ── Error visible en pantalla ─────────────────────────────────────────────────

function mostrarError(msg) {
    const banner = document.getElementById('classroom-connect-banner');
    banner.classList.remove('loading', 'hidden');
    const p = banner.querySelector('.banner-text p');
    if (p) p.textContent = msg;
}
