const { Router } = require('express');

const crearAlumnoRoutes = (alumnoController) => {
    const router = Router();
    router.post('/insertarAlumno', (req, res) => alumnoController.registrar(req, res));
    router.post('/login', (req, res) => alumnoController.login(req, res));
    router.post('/loginGoogle', (req, res) => alumnoController.loginGoogle(req, res));
    router.get('/obtenerAlumno', (req, res) => alumnoController.obtener(req, res));
    return router;
};

module.exports = crearAlumnoRoutes;
