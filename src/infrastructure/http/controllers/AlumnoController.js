// Adaptador primario HTTP: traduce req/res a llamadas de casos de uso
class AlumnoController {
    constructor({ registrarAlumno, loginAlumno, loginGoogleAlumno, obtenerAlumno }) {
        this.registrarAlumno = registrarAlumno;
        this.loginAlumno = loginAlumno;
        this.loginGoogleAlumno = loginGoogleAlumno;
        this.obtenerAlumno = obtenerAlumno;
    }

    async registrar(req, res) {
        try {
            const registro = req.body.register || req.body.reg_register || req.body.registro || req.body.registro_alumno;
            const email = req.body.email || req.body.reg_email || req.body.mail;
            const contrasena = req.body.password || req.body.reg_password || req.body.contrasena;

            await this.registrarAlumno.ejecutar({ registro, email, contrasena });
            res.status(201).json({ exito: true, mensaje: 'Usuario insertado correctamente' });
        } catch (error) {
            if (error.code === 'CAMPOS_FALTANTES') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            if (error.code === '23505') {
                const detalle = error.detail || '';
                if (detalle.includes('email')) {
                    return res.status(409).json({ exito: false, error: 'El correo electrónico ya está registrado.' });
                }
                return res.status(409).json({ exito: false, error: 'El número de registro ya está registrado.' });
            }
            console.error('Error al registrar alumno:', error.message);
            res.status(500).json({ exito: false, error: 'Error al insertar usuario' });
        }
    }

    async login(req, res) {
        try {
            const { registro, contrasena } = req.body;
            const usuario = await this.loginAlumno.ejecutar({ registro, contrasena });
            res.json({ exito: true, usuario });
        } catch (error) {
            if (error.code === 'CAMPOS_FALTANTES') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            if (error.code === 'CREDENCIALES_INVALIDAS') {
                return res.status(401).json({ exito: false, error: error.message });
            }
            console.error('Error en login alumno:', error.message);
            res.status(500).json({ exito: false, error: 'Error interno' });
        }
    }

    async loginGoogle(req, res) {
        try {
            const { token } = req.body;
            const resultado = await this.loginGoogleAlumno.ejecutar({ token });
            res.json({ exito: true, ...resultado });
        } catch (error) {
            if (error.code === 'CAMPOS_FALTANTES') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            res.status(401).json({ exito: false, error: 'Token inválido' });
        }
    }

    async obtener(req, res) {
        try {
            const { id } = req.query;
            const resultado = await this.obtenerAlumno.ejecutar({ id });
            if (Array.isArray(resultado)) {
                return res.json({ exito: true, usuarios: resultado });
            }
            res.json({ exito: true, usuario: resultado });
        } catch (error) {
            if (error.code === 'ID_INVALIDO') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            if (error.code === 'NO_ENCONTRADO') {
                return res.status(404).json({ exito: false, error: error.message });
            }
            console.error('Error al obtener alumno:', error.message);
            res.status(500).json({ exito: false, error: 'Error al obtener usuario' });
        }
    }
}

module.exports = AlumnoController;
