const { Router } = require('express');

const router = Router();

const notificacionesModel =
    require('../models/notificacionesModel');

router.post('/notificaciones', async (req, res) => {

    const {
        usuario,
        rutina,
        nuevo_peso
    } = req.body;

    await notificacionesModel.crearNotificacion(
        usuario,
        rutina,
        nuevo_peso
    );

    res.send('notificacion creada');
});

router.get('/notificaciones', async (req, res) => {

    const result =
        await notificacionesModel.traerNotificaciones();

    res.json(result);
});

module.exports = router;