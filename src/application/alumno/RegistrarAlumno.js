class RegistrarAlumno {
    constructor(alumnoRepository) {
        this.alumnoRepository = alumnoRepository;
    }

    async ejecutar({ registro, email, contrasena }) {
        if (!registro || !email || !contrasena) {
            throw { code: 'CAMPOS_FALTANTES', message: 'Faltan campos obligatorios' };
        }
        await this.alumnoRepository.registrar(registro, email, contrasena);
    }
}

module.exports = RegistrarAlumno;
