class ObtenerAlumno {
    constructor(alumnoRepository) {
        this.alumnoRepository = alumnoRepository;
    }

    async ejecutar({ id } = {}) {
        if (id) {
            const idValido = Number.isInteger(Number(id)) ? Number(id) : null;
            if (!idValido) {
                throw { code: 'ID_INVALIDO', message: 'ID inválido' };
            }
            const alumno = await this.alumnoRepository.obtenerPorId(idValido);
            if (!alumno) {
                throw { code: 'NO_ENCONTRADO', message: 'Usuario no encontrado' };
            }
            return alumno;
        }
        return this.alumnoRepository.obtenerTodos();
    }
}

module.exports = ObtenerAlumno;
