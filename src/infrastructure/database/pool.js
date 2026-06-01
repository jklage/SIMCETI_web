const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const probarConexion = async () => {
    const client = await pool.connect();
    console.log(`Conexión exitosa a la base de datos: ${process.env.DB_NAME}`);
    client.release();
};

module.exports = { pool, probarConexion };
