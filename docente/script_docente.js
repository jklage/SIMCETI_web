// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    const loginPanel = document.querySelector('.login-panel');
    const registerPanel = document.querySelector('.register-panel');
    const btnGoRegister = document.getElementById('go-register');
    const btnGoLogin = document.getElementById('go-login');

    // Ocultar panel de registro al inicio
    if (registerPanel) registerPanel.classList.add('hide');

    // Mostrar formulario de registro
    if (btnGoRegister) {
        btnGoRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginPanel) loginPanel.classList.add('hide');
            if (registerPanel) registerPanel.classList.remove('hide');
        });
    }

    // Mostrar formulario de login
    if (btnGoLogin) {
        btnGoLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerPanel) registerPanel.classList.add('hide');
            if (loginPanel) loginPanel.classList.remove('hide');
        });
    }

    // Función para toggle de contraseña
    function setupPasswordToggle(inputId) {
        const passwordInput = document.getElementById(inputId);
        if (!passwordInput) return;
        
        const container = passwordInput.closest('.container-input');
        if (!container) return;
        
        const iconOpen = container.querySelector('.iconOpen');
        const iconClose = container.querySelector('.iconClose');
        if (!iconOpen || !iconClose) return;

        function updateIcons() {
            if (passwordInput.type === 'password') {
                iconOpen.style.display = 'block';
                iconClose.style.display = 'none';
            } else {
                iconOpen.style.display = 'none';
                iconClose.style.display = 'block';
            }
        }

        updateIcons();

        const see = container.querySelector('.seePsw');
        if (see) {
            see.addEventListener('click', () => {
                passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                updateIcons();
            });
        }
    }

    // Aplicar toggle a ambos campos de contraseña
    setupPasswordToggle('password');
    setupPasswordToggle('reg-password');

    // Registro de usuario
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();

            if (!username || !email || !password) {
                alert('Por favor completa todos los campos de registro');
                return;
            }

            // Validar email y dominio
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor ingresa un email válido');
                return;
            }
            if (!email.endsWith('@ceti.mx')) {
                alert('Solo se permiten cuentas con dominio @ceti.mx');
                return;
            }

            try {
                const backend = 'http://localhost:3000';
                const resp = await fetch(backend + '/api/insertarDocente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, email: email, contrasena: password })
                });

                const data = await resp.json();
                if (resp.ok && data.exito) {
                    alert('Registro correcto. Ahora puedes iniciar sesión.');
                    // Cambiar al panel de login
                    if (registerPanel) registerPanel.classList.add('hide');
                    if (loginPanel) loginPanel.classList.remove('hide');
                    // Limpiar formulario de registro
                    registerForm.reset();
                } else {
                    alert(data.error || data.mensaje || 'Error en el registro');
                }
            } catch (err) {
                console.error('Error al llamar API de registro:', err);
                alert('Error de comunicación con el servidor. ¿Está el servidor corriendo?');
            }
        });
    }

    // Login de usuario
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usuario = document.getElementById('usernameEmail').value.trim();
            const password = document.getElementById('password').value.trim();
            const rememberMe = document.getElementById('rememberMe').checked;

            if (!usuario || !password) {
                alert('Por favor, rellena todos los campos');
                return;
            }

            try {
                const backend = 'http://localhost:3000';
                const resp = await fetch(backend + '/api/loginDocente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario: usuario, contrasena: password })
                });

                const data = await resp.json();

                if (resp.ok && data && data.exito) {
                    if (rememberMe) {
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('username', usuario);
                    }
                    window.location.href = '/principal_docente/principal_docente.html';
                } else {
                    const msg = data?.error || data?.mensaje || 'Error en autenticación';
                    alert(msg);
                }
            } catch (err) {
                console.error('Error al autenticar:', err);
                alert('Error de comunicación con el servidor. Verifica que el servidor esté corriendo en http://localhost:3000');
            }
        });
    }
});

function handleGoogleLoginDocente(response) {
    const token = response.credential;
    fetch('http://localhost:3000/api/loginGoogleDocente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            window.location.href = '/principal_docente/principal_docente.html';
        } else {
            alert(data.error || 'Error al iniciar sesión con Google');
        }
    })
    .catch(() => alert('Error de comunicación con el servidor'));
}