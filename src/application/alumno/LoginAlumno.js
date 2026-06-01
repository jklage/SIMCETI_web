class LoginAlumno {
    constructor(alumnoRepository) {
        this.alumnoRepository = alumnoRepository;
    }

    async ejecutar({ registro, contrasena }) {
        if (!registro || !contrasena) {
            throw { code: 'CAMPOS_FALTANTES', message: 'Faltan credenciales' };
        }
        const alumno = await this.alumnoRepository.validar(registro, contrasena);
        if (!alumno) {
            throw { code: 'CREDENCIALES_INVALIDAS', message: 'Error al iniciar sesión' };
        }
        return alumno;
    }
}

module.exports = LoginAlumno;
