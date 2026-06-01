const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { probarConexion } = require('../configuracion/baseDatos');
const { 
    insertarUsuario,
    eliminarUsuario,
    validarUsuarioDocente
} = require('../controllers/docentecontroladores');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
    res.sendStatus(200);
});

// apis para usuarios
app.post('/api/insertarDocente', insertarUsuario);
app.post('/api/loginDocente', validarUsuarioDocente);

const iniciarServidor = async () => {
    try{
        await probarConexion();
        app.listen(port, () => {
        console.log(`Servidor escuchando en el puerto ${port}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
    }
};

iniciarServidor();