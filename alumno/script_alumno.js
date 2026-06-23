const loginPanel = document.querySelector('.login-panel');
const registerPanel = document.querySelector('.register-panel');
const btnGoRegister = document.getElementById('go-register');
const btnGoLogin = document.getElementById('go-login');


if (registerPanel) registerPanel.classList.add('hide');


if (btnGoRegister) {
    btnGoRegister.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginPanel) loginPanel.classList.add('hide');
        if (registerPanel) registerPanel.classList.remove('hide');
    });
}


if (btnGoLogin) {
    btnGoLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerPanel) registerPanel.classList.add('hide');
        if (loginPanel) loginPanel.classList.remove('hide');
    });
}


// Toggle para mostrar/ocultar contraseña
function setupPasswordToggle(inputId, containerSelector) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return; // input no existe
    const container = passwordInput.closest(containerSelector);
    if (!container) return; // contenedor no encontrado
    const iconOpen = container.querySelector('.iconOpen');
    const iconClose = container.querySelector('.iconClose');
    if (!iconOpen || !iconClose) return; // iconos no encontrados


    function updateIcons() {
        if (passwordInput.type === 'password') {
            iconOpen.style.display = 'block';
            iconClose.style.display = 'none';
        } else {
            iconOpen.style.display = 'none';
            iconClose.style.display = 'block';
        }
    }


    // Inicializar estado de iconos
    updateIcons();


    // Toggle entre mostrar/ocultar
    const see = container.querySelector('.seePsw');
    if (see) {
        see.addEventListener('click', () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
            updateIcons();
        });
    }
}


// Aplicar toggle a ambos formularios
setupPasswordToggle('password', '.container-input');
setupPasswordToggle('reg-password', '.container-input');

// Alertas
function mostrarAlertaPersonalizada(idAlerta, mensaje) {
    const alertaDiv = document.getElementById(idAlerta);
    const textoDiv = document.getElementById(idAlerta + '-text');
    
    if (alertaDiv && textoDiv) {
        textoDiv.innerText = mensaje;
        alertaDiv.style.display = 'block';
        // Forzar reflow para que la transición de opacidad funcione
        void alertaDiv.offsetWidth;
        alertaDiv.style.opacity = '1';
        
        setTimeout(() => {
            alertaDiv.style.opacity = '0';
            setTimeout(() => { alertaDiv.style.display = 'none'; }, 600);
        }, 5000);
    }
}

// Registro: enviar POST a la API
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const register = document.getElementById('reg-register').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();

        if (!register || !email || !password) {
            mostrarAlertaPersonalizada('register-alert', 'Por favor, rellena todos los campos.');
            return;
        }

        try {

            const backend = 'http://localhost:3000';
            const resp = await fetch(backend + '/api/insertarAlumno', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registro: register, email: email, contrasena: password })
            });

                let data = null;
                try { data = await resp.json(); } catch (e) { data = null; }
                if (resp.ok && data && data.exito) {
                    mostrarAlertaPersonalizada('register-alert', '✔ Registro correcto. Puedes iniciar sesión.');
                    document.getElementById('register-alert').style.backgroundColor = '#4caf50';
                    setTimeout(() => {
                        if (registerPanel) registerPanel.classList.add('hide');
                        if (loginPanel) loginPanel.classList.remove('hide');
                        document.getElementById('register-alert').style.backgroundColor = '#f44336';
                    }, 2000);
                } else {
                    const msg = (data && (data.error || data.mensaje)) || ('Error en el registro: ' + resp.status);
                    mostrarAlertaPersonalizada('register-alert', msg);
                }
        } catch (err) {
            console.error('Error al llamar API de registro:', err);
            mostrarAlertaPersonalizada('register-alert', 'Error de comunicación con el servidor.');
        }
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
   
    const register = document.getElementById('register').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!register || !password) {
        alert('Por favor, rellena todos los campos');
        return;
    }

    (async () => {
        try {
            const backend = 'http://localhost:3000';
            const resp = await fetch(backend + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registro: register, contrasena: password })
            });

            let data = null;
            try { data = await resp.json(); } catch (e) { data = null; }
            if (resp.ok && data && data.exito) {
                window.location.href = '/principal_alumno/principal_alumno.html';
            } else {
                const msg = (data && (data.error || data.mensaje)) || ('Error en el registro: ' + resp.status);
                mostrarAlertaPersonalizada('login-alert', msg);
            }
        } catch (err) {
            console.error('Error al llamar API de registro:', err);
            mostrarAlertaPersonalizada('register-alert', 'Error de comunicación con el servidor.');
        }
    })();

});

const GOOGLE_CLIENT_ID = '69679398129-l7nfc1sp54l7qiomhfol99rkutjh6coe.apps.googleusercontent.com';
const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
].join(' ');

let googleTokenPendiente = null;

function handleGoogleLogin(response) {
    const token = response.credential;
    googleTokenPendiente = token;

    fetch('http://localhost:3000/api/loginGoogle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            solicitarTokenClassroom(() => {
                window.location.href = '/principal_alumno/principal_alumno.html';
            });
        } else if (data.nuevo) {
            document.getElementById('google-registro-modal').style.display = 'flex';
        } else {
            mostrarAlertaPersonalizada('login-alert', data.error || 'Error con Google');
        }
    })
    .catch(() => mostrarAlertaPersonalizada('login-alert', 'Error de comunicación con el servidor.'));
}

function solicitarTokenClassroom(onDone) {
    try {
        const tc = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: CLASSROOM_SCOPES,
            prompt: '',
            callback: (resp) => {
                if (!resp.error && resp.access_token) {
                    sessionStorage.setItem('classroom_token', resp.access_token);
                }
                onDone();
            }
        });
        tc.requestAccessToken();
    } catch {
        onDone();
    }
}

document.getElementById('modal-submit').addEventListener('click', async () => {
    const registro = document.getElementById('modal-registro').value.trim();
    const errorEl = document.getElementById('modal-error');

    if (!registro) {
        errorEl.textContent = 'Ingresa tu número de registro.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const resp = await fetch('http://localhost:3000/api/loginGoogleRegistrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleTokenPendiente, registro })
        });
        const data = await resp.json();
        if (data.exito) {
            window.location.href = '/principal_alumno/principal_alumno.html';
        } else {
            errorEl.textContent = data.error || 'Error al registrar.';
            errorEl.style.display = 'block';
        }
    } catch {
        errorEl.textContent = 'Error de comunicación con el servidor.';
        errorEl.style.display = 'block';
    }
});



    // Shift + Alt + A
    // ctrl + llave cierre