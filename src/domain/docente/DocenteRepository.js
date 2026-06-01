// Puerto (interfaz) que define el contrato para la persistencia de docentes.
// La capa de infraestructura provee la implementación concreta.
class DocenteRepository {
    async registrar(nombre, email, contrasena) { throw new Error('Not implemented'); }
    async validar(nombre, contrasena) { throw new Error('Not implemented'); }
}

module.exports = DocenteRepository;
