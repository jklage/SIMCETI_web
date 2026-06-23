# SIMCETI Web

Sistema de gestión escolar para el CETI. Permite a alumnos y docentes iniciar sesión con Google o con credenciales locales, ver cursos y tareas de Google Classroom, y entregar tareas directamente desde la plataforma.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- PostgreSQL 14 o superior
- Una cuenta de Google Cloud con un proyecto configurado
- Correos institucionales `@ceti.mx` para probar el login con Google

---

## Instalación

```bash
git clone https://github.com/jklage/SIMCETI_web.git
cd SIMCETI_web
npm install
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con este contenido:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_bd

GOOGLE_CLIENT_ID=tu_client_id_de_google_cloud
```

---

## Base de datos (PostgreSQL)

El proyecto usa stored procedures. Debes crearlos antes de correr el servidor.

### Stored procedure: alumnos

```sql
CREATE OR REPLACE PROCEDURE sp_registrar_alumno(
    p_registro TEXT,
    p_email    TEXT,
    p_contrasena TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO alumno_registrado (registro, email, contrasena)
    VALUES (p_registro, p_email, p_contrasena);
END;
$$;
```

### Stored procedure: docentes

```sql
CREATE OR REPLACE PROCEDURE sp_registrar_docente(
    p_nombre   TEXT,
    p_email    TEXT,
    p_contrasena TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO docente_registrado (nombre, email, contrasena)
    VALUES (p_nombre, p_email, p_contrasena);
END;
$$;
```

### Tablas mínimas requeridas

```sql
CREATE TABLE alumno_registrado (
    id        SERIAL PRIMARY KEY,
    registro  TEXT UNIQUE NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL
);

CREATE TABLE docente_registrado (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL
);
```

---

## Configuración de Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) y abre tu proyecto.
2. **APIs y servicios → Biblioteca** → Habilita **Google Classroom API**.
3. **APIs y servicios → Credenciales** → Crea un **ID de cliente OAuth 2.0** de tipo *Aplicación web*.
   - Orígenes de JavaScript autorizados: `http://localhost:3000`
   - Copia el **Client ID** y ponlo en `.env` como `GOOGLE_CLIENT_ID`.
4. **Pantalla de consentimiento de OAuth** → Editar app → Paso 2 (Alcances) → Agrega:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.student-submissions.students.me`
5. Si la app está en modo **Prueba**, agrega los correos `@ceti.mx` de prueba en el Paso 3 (Usuarios de prueba).

> **Importante:** Solo se permiten correos `@ceti.mx`. Cualquier otro dominio es rechazado por el backend.

---

## Correr el proyecto

```bash
# Producción
node servidor.js

# Desarrollo (recarga automática)
npm run dev
```

Abre el navegador en [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
simcetiweb/
├── alumno/                  # Login de alumno
├── docente/                 # Login de docente
├── elegir/                  # Pantalla de selección de rol
├── principal_alumno/        # Dashboard del alumno (Classroom inline)
├── principal_docente/       # Dashboard del docente
├── controllers/
│   ├── alumnocontroladores.js
│   └── docentecontroladores.js
├── configuracion/
│   └── baseDatos.js         # Conexión a PostgreSQL
├── servidor.js              # Entry point del servidor
└── .env                     # Variables de entorno (NO subir a git)
```

---

## Rutas de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/insertarAlumno` | Registrar alumno manualmente |
| GET | `/api/obtenerAlumno` | Obtener datos de alumno |
| POST | `/api/login` | Login alumno con registro + contraseña |
| POST | `/api/loginGoogle` | Login alumno con Google |
| POST | `/api/loginGoogleRegistrar` | Registrar alumno nuevo via Google |
| DELETE | `/api/eliminarAlumno` | Eliminar alumno |
| POST | `/api/insertarDocente` | Registrar docente manualmente |
| POST | `/api/loginDocente` | Login docente con credenciales |
| POST | `/api/loginGoogleDocente` | Login docente con Google (auto-registro) |

---

## Flujo de login con Google

**Alumno:**
1. Inicia sesión con Google (`@ceti.mx` obligatorio).
2. Si el correo ya está en la BD → redirige al dashboard.
3. Si es nuevo → aparece un modal pidiendo el número de registro escolar → se registra y redirige.

**Docente:**
1. Inicia sesión con Google (`@ceti.mx` obligatorio).
2. Si es nuevo → se registra automáticamente usando el nombre de la cuenta de Google.

---

## Funcionalidades principales

- **Alumnos:** Ver cursos y tareas de Google Classroom, entregar tareas con enlace adjunto, ver estado de entrega (Entregada / Pendiente / Vencida / Calificada).
- **Ambos roles:** Menú desplegable con perfil (cambio de avatar), configuración y cierre de sesión. Panel de notificaciones con tareas próximas a vencer.
