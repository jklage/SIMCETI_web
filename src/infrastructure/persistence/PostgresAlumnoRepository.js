const AlumnoRepository = require('../../domain/alumno/AlumnoRepository');
const Alumno = require('../../domain/alumno/Alumno');

class PostgresAlumnoRepository extends AlumnoRepository {
    constructor(pool) {
        super();
        this.pool = pool;
    }

    async registrar(registro, email, contrasena) {
        await this.pool.query('CALL sp_registrar_alumno($1, $2, $3)', [registro, email, contrasena]);
    }

    async validar(registro, contrasena) {
        const resultado = await this.pool.query(
            'SELECT id, registro, email FROM alumno_registrado WHERE registro = $1 AND contrasena = $2',
            [registro, contrasena]
        );
        if (resultado.rows.length === 0) return null;
        return new Alumno(resultado.rows[0]);
    }

    async obtenerPorId(id) {
        const resultado = await this.pool.query(
            'SELECT id, registro, email FROM alumno_registrado WHERE id = $1',
            [id]
        );
        if (resultado.rows.length === 0) return null;
        return new Alumno(resultado.rows[0]);
    }

    async obtenerTodos() {
        const resultado = await this.pool.query('SELECT id, registro, email FROM alumno_registrado');
        return resultado.rows.map(row => new Alumno(row));
    }

    async eliminar(registro) {
        await this.pool.query('CALL sp_eliminar_alumno($1)', [registro]);
    }

    async buscarPorEmail(email) {
        const resultado = await this.pool.query(
            'SELECT id, registro, email FROM alumno_registrado WHERE email = $1',
            [email]
        );
        if (resultado.rows.length === 0) return null;
        return new Alumno(resultado.rows[0]);
    }
}

module.exports = PostgresAlumnoRepository;
