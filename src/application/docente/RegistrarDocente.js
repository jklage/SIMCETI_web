class RegistrarDocente {
    constructor(docenteRepository) {
        this.docenteRepository = docenteRepository;
    }

    async ejecutar({ nombre, email, contrasena }) {
        if (!nombre || !email || !contrasena) {
            throw { code: 'CAMPOS_FALTANTES', message: 'Faltan campos obligatorios' };
        }
        await this.docenteRepository.registrar(nombre, email, contrasena);
    }
}

module.exports = RegistrarDocente;
