// Puerto (interfaz) que define el contrato para la persistencia de alumnos.
// La capa de infraestructura provee la implementación concreta.
class AlumnoRepository {
    async registrar(registro, email, contrasena) { throw new Error('Not implemented'); }
    async validar(registro, contrasena) { throw new Error('Not implemented'); }
    async obtenerPorId(id) { throw new Error('Not implemented'); }
    async obtenerTodos() { throw new Error('Not implemented'); }
    async eliminar(registro) { throw new Error('Not implemented'); }
    async buscarPorEmail(email) { throw new Error('Not implemented'); }
}

module.exports = AlumnoRepository;
