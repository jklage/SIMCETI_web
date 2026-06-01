// Adaptador primario HTTP: traduce req/res a llamadas de casos de uso
class DocenteController {
    constructor({ registrarDocente, loginDocente }) {
        this.registrarDocente = registrarDocente;
        this.loginDocente = loginDocente;
    }

    async registrar(req, res) {
        try {
            const nombre = req.body.nombre || req.body.reg_username || req.body.username || req.body.registro_docente;
            const email = req.body.email || req.body.reg_email || req.body.mail;
            const contrasena = req.body.password || req.body.reg_password || req.body.contrasena;

            await this.registrarDocente.ejecutar({ nombre, email, contrasena });
            res.status(201).json({ exito: true, mensaje: 'Usuario insertado correctamente' });
        } catch (error) {
            if (error.code === 'CAMPOS_FALTANTES') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            console.error('Error al registrar docente:', error.message);
            res.status(500).json({ exito: false, error: 'Error al insertar usuario' });
        }
    }

    async login(req, res) {
        try {
            const { nombre, contrasena } = req.body;
            const usuario = await this.loginDocente.ejecutar({ nombre, contrasena });
            res.json({ exito: true, usuario });
        } catch (error) {
            if (error.code === 'CAMPOS_FALTANTES') {
                return res.status(400).json({ exito: false, error: error.message });
            }
            if (error.code === 'CREDENCIALES_INVALIDAS') {
                return res.status(401).json({ exito: false, error: error.message });
            }
            console.error('Error en login docente:', error.message);
            res.status(500).json({ exito: false, error: 'Error interno' });
        }
    }
}

module.exports = DocenteController;
