// Importamos la clase Router del módulo 'express'.
// Esto nos permite crear manejadores de rutas modulares y montables.
const { Router } = require('express');

// Inicializamos una instancia del enrutador. 
// A este objeto 'router' le asignaremos todas las rutas de este módulo.
const router = Router();

// Importamos el modelo de notificaciones.
// Este archivo contiene la lógica para interactuar con la base de datos 
// (por ejemplo, guardar o buscar registros).
const notificacionesModel = require('../models/notificacionesModel');

// Definimos una ruta POST en el endpoint '/notificaciones'.
// Se utiliza cuando el cliente quiere enviar datos al servidor para crear algo nuevo
// (por ejemplo, registrar que un usuario alcanzó un nuevo peso en su rutina).
router.post('/notificaciones', async (req, res) => {

    // Usamos desestructuración para extraer variables específicas 
    // desde el cuerpo de la petición (req.body).
    const {
        usuario,
        rutina,
        nuevo_peso
    } = req.body;

    // Llamamos a la función asíncrona del modelo para guardar los datos en la base de datos.
    // Usamos 'await' para pausar la ejecución de esta ruta hasta que la base de datos 
    // termine de guardar la notificación de la rutina.
    await notificacionesModel.crearNotificacion(
        usuario,
        rutina,
        nuevo_peso
    );

    // Una vez que se guardó exitosamente, enviamos una respuesta de texto al cliente 
    // confirmando que la acción se completó.
    res.send('notificacion creada');
});

// Definimos una ruta GET en el endpoint '/notificaciones'.
// Se utiliza cuando el cliente quiere solicitar o leer datos desde el servidor.
router.get('/notificaciones', async (req, res) => {

    // Llamamos al modelo para obtener el historial de notificaciones.
    // Nuevamente usamos 'await' para esperar la respuesta de la base de datos 
    // antes de continuar.
    const result = await notificacionesModel.traerNotificaciones();

    // Enviamos el resultado (las notificaciones obtenidas) de vuelta al cliente 
    // formateado como un objeto JSON.
    res.json(result);
});

// Exportamos el enrutador para que pueda ser importado y utilizado 
// en el archivo principal del microservicio o aplicación (usualmente app.js o index.js).
module.exports = router;
