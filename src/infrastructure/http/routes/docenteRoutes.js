const { Router } = require('express');

const crearDocenteRoutes = (docenteController) => {
    const router = Router();
    router.post('/insertarDocente', (req, res) => docenteController.registrar(req, res));
    router.post('/loginDocente', (req, res) => docenteController.login(req, res));
    return router;
};

module.exports = crearDocenteRoutes;
