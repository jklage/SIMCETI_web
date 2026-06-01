const DocenteRepository = require('../../domain/docente/DocenteRepository');
const Docente = require('../../domain/docente/Docente');

class PostgresDocenteRepository extends DocenteRepository {
    constructor(pool) {
        super();
        this.pool = pool;
    }

    async registrar(nombre, email, contrasena) {
        await this.pool.query('CALL sp_registrar_docente($1, $2, $3)', [nombre, email, contrasena]);
    }

    async validar(nombre, contrasena) {
        const resultado = await this.pool.query(
            'SELECT id, nombre, email FROM docente_registrado WHERE nombre = $1 AND contrasena = $2',
            [nombre, contrasena]
        );
        if (resultado.rows.length === 0) return null;
        return new Docente(resultado.rows[0]);
    }
}

module.exports = PostgresDocenteRepository;
