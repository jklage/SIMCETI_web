const { pool } = require('../configuracion/baseDatos');
const { OAuth2Client } = require('google-auth-library');

const clienteGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const insertarUsuario = async (req, res) => {
    try {
        const registro = req.body.register || req.body.reg_register || req.body.registro || req.body.registro_alumno;
        const email    = req.body.email    || req.body.reg_email    || req.body.mail;
        const contrasena = req.body.password || req.body.reg_password || req.body.contrasena;

        if (!registro || !email || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', exito: false });
        }

        await pool.query('CALL sp_registrar_alumno($1, $2, $3)', [registro, email, contrasena]);
        return res.status(201).json({ exito: true, mensaje: 'Usuario insertado correctamente' });
    } catch (error) {
        console.error('Error al insertar alumno:', error.message);
        if (error.code === '23505') {
            const detalle = error.detail || '';
            if (detalle.includes('email')) {
                return res.status(409).json({ error: 'El correo electrónico ya está registrado.', exito: false });
            }
            return res.status(409).json({ error: 'El número de registro ya está registrado.', exito: false });
        }
        return res.status(500).json({ error: 'Error al insertar usuario', exito: false });
    }
};

const obtenerUsuario = async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {
            const idValido = Number.isInteger(Number(id)) ? Number(id) : null;
            if (!idValido) {
                return res.status(400).json({ error: 'ID inválido', exito: false });
            }
            const resultado = await pool.query(
                'SELECT id, registro, email FROM alumno_registrado WHERE id = $1',
                [idValido]
            );
            if (resultado.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado', exito: false });
            }
            return res.json({ exito: true, usuario: resultado.rows[0] });
        }

        const resultado = await pool.query('SELECT id, registro, email FROM alumno_registrado');
        return res.json({ exito: true, usuarios: resultado.rows });
    } catch (error) {
        console.error('Error al obtener alumno:', error.message);
        return res.status(500).json({ error: 'Error al obtener usuario', exito: false });
    }
};

const validarUsuario = async (req, res) => {
    try {
        const { registro, contrasena } = req.body;
        if (!registro || !contrasena) {
            return res.status(400).json({ exito: false, error: 'Faltan credenciales' });
        }

        const resultado = await pool.query(
            'SELECT id, registro, email FROM alumno_registrado WHERE registro = $1 AND contrasena = $2',
            [registro, contrasena]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ exito: false, error: 'Error al iniciar sesión' });
        }

        return res.json({ exito: true, usuario: resultado.rows[0] });
    } catch (error) {
        console.error('Error al validar alumno:', error.message);
        return res.status(500).json({ exito: false, error: 'Error interno' });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { registro } = req.body;
        if (!registro) {
            return res.status(400).json({ error: 'Falta el registro', exito: false });
        }
        await pool.query('CALL sp_eliminar_alumno($1)', [registro]);
        return res.status(200).json({ exito: true, mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar alumno:', error.message);
        return res.status(500).json({ error: 'Error al eliminar usuario', exito: false });
    }
};

const loginGoogle = async (req, res) => {
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
            'SELECT id, registro, email FROM alumno_registrado WHERE email = $1',
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.json({ exito: false, nuevo: true });
        }

        return res.json({ exito: true, usuario: resultado.rows[0] });
    } catch (err) {
        return res.status(401).json({ exito: false, error: 'Token inválido' });
    }
};

const loginGoogleRegistrar = async (req, res) => {
    const { token, registro } = req.body;
    if (!token || !registro) {
        return res.status(400).json({ exito: false, error: 'Token y registro requeridos' });
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

        const password = require('crypto').randomUUID();
        await pool.query('CALL sp_registrar_alumno($1, $2, $3)', [registro, email, password]);

        const resultado = await pool.query(
            'SELECT id, registro, email FROM alumno_registrado WHERE email = $1',
            [email]
        );

        return res.json({ exito: true, usuario: resultado.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            const detalle = err.detail || '';
            if (detalle.includes('registro')) {
                return res.status(409).json({ exito: false, error: 'Ese número de registro ya está en uso.' });
            }
            return res.status(409).json({ exito: false, error: 'Ese correo ya está registrado.' });
        }
        return res.status(401).json({ exito: false, error: 'Token inválido o error al registrar.' });
    }
};

module.exports = {
    insertarUsuario,
    obtenerUsuario,
    validarUsuario,
    eliminarUsuario,
    loginGoogle,
    loginGoogleRegistrar
};
