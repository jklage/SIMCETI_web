class LoginDocente {
    constructor(docenteRepository) {
        this.docenteRepository = docenteRepository;
    }

    async ejecutar({ nombre, contrasena }) {
        if (!nombre || !contrasena) {
            throw { code: 'CAMPOS_FALTANTES', message: 'Faltan credenciales' };
        }
        const docente = await this.docenteRepository.validar(nombre, contrasena);
        if (!docente) {
            throw { code: 'CREDENCIALES_INVALIDAS', message: 'Credenciales inválidas' };
        }
        return docente;
    }
}

module.exports = LoginDocente;
