require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { probarConexion } = require('./configuracion/baseDatos');

const {
    insertarUsuario: insertarAlumno,
    obtenerUsuario:  obtenerAlumno,
    validarUsuario,
    eliminarUsuario,
    loginGoogle,
    loginGoogleRegistrar
} = require('./controllers/alumnocontroladores');

const {
    insertarUsuario:      insertarDocente,
    validarUsuarioDocente,
    loginGoogleDocente
} = require('./controllers/docentecontroladores');

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rutas alumno
app.post('/api/insertarAlumno', insertarAlumno);
app.get( '/api/obtenerAlumno',  obtenerAlumno);
app.post('/api/login',          validarUsuario);
app.post('/api/loginGoogle',           loginGoogle);
app.post('/api/loginGoogleRegistrar', loginGoogleRegistrar);
app.delete('/api/eliminarAlumno', eliminarUsuario);

// Rutas docente
app.post('/api/insertarDocente',      insertarDocente);
app.post('/api/loginDocente',         validarUsuarioDocente);
app.post('/api/loginGoogleDocente',   loginGoogleDocente);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'elegir', 'eleccion.html')));

const iniciarServidor = async () => {
    try {
        await probarConexion();
        app.listen(port, () => console.log(`Servidor escuchando en el puerto ${port}`));
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

iniciarServidor();
