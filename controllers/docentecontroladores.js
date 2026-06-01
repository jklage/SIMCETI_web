const { pool } = require('../configuracion/baseDatos');
const { OAuth2Client } = require('google-auth-library');

const clienteGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const insertarUsuario = async (req, res) => {
    try {
        const nombre = req.body.nombre || req.body.reg_username || req.body.username || req.body.registro_docente;
        const email  = req.body.email  || req.body.reg_email   || req.body.mail;
        const password = req.body.password || req.body.reg_password || req.body.contrasena;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', exito: false });
        }

        if (!email.endsWith('@ceti.mx')) {
            return res.status(403).json({ error: 'Solo se permiten cuentas con dominio @ceti.mx', exito: false });
        }

        const crearDocente = 'CALL sp_registrar_docente($1, $2, $3)';
        await pool.query(crearDocente, [nombre, email, password]);

        return res.status(201).json({ exito: true, mensaje: 'Usuario insertado correctamente' });
    } catch (error) {
        console.error('Error al insertar docente:', error.message);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.', exito: false });
        }
        return res.status(500).json({ error: 'Error al insertar usuario', exito: false });
    }
};

const validarUsuarioDocente = async (req, res) => {
    try {
        const { nombre, contrasena } = req.body;
        if (!nombre || !contrasena) {
            return res.status(400).json({ exito: false, error: 'Faltan credenciales' });
        }

        const resultado = await pool.query(
            'SELECT id, nombre, email FROM docente_registrado WHERE nombre = $1 AND contrasena = $2',
            [nombre, contrasena]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ exito: false, error: 'Credenciales inválidas' });
        }

        return res.json({ exito: true, usuario: resultado.rows[0] });
    } catch (error) {
        console.error('Error al validar docente:', error.message);
        return res.status(500).json({ exito: false, error: 'Error interno' });
    }
};

const loginGoogleDocente = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ exito: false, error: 'Token requerido' });
    }
    try {
        const ticket = await clienteGoogle.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email } = ticket.getPayload();

        if (!email.endsWith('@ceti.mx')) {
            return res.status(403).json({ exito: false, error: 'Solo se permiten cuentas @ceti.mx' });
        }

        const resultado = await pool.query(
            'SELECT id, nombre, email FROM docente_registrado WHERE email = $1',
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ exito: false, error: 'No existe una cuenta de docente con este correo. Regístrate primero.' });
        }

        return res.json({ exito: true, usuario: resultado.rows[0] });
    } catch (err) {
        return res.status(401).json({ exito: false, error: 'Token inválido' });
    }
};

module.exports = {
    insertarUsuario,
    validarUsuarioDocente,
    loginGoogleDocente
};
