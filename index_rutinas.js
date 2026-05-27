// Importamos 'express', el framework principal que utilizamos para levantar 
// el servidor web y manejar las rutas HTTP de forma sencilla.
const express = require('express');

// Importamos el controlador (enrutador) de rutinas que creamos previamente.
// Este archivo contiene toda la lógica pesada, las validaciones y la orquestación 
// con los otros microservicios (usuarios y notificaciones).
const rutinasController = require('./controllers/rutinasController');

// Importamos 'morgan', un middleware que nos ayuda a monitorear el tráfico.
// Cada vez que alguien haga una petición a este microservicio, morgan imprimirá 
// los detalles en la consola.
const morgan = require('morgan');

// Importamos 'cors' (Cross-Origin Resource Sharing).
// En una arquitectura de microservicios, es vital habilitar CORS para que tu frontend 
// (la aplicación web o móvil) pueda consumir esta API sin que el navegador bloquee la petición.
const cors = require('cors');

// Inicializamos la aplicación de Express. 'app' será el objeto central 
// donde configuraremos todo nuestro servidor.
const app = express();

// --- SECCIÓN DE MIDDLEWARES ---
// Estas funciones interceptan y preparan las peticiones antes de que lleguen a tus rutas.

// Configuramos morgan en modo 'dev'. Esto nos dará logs coloridos y concisos en la consola
// (por ejemplo: "GET /rutinas/usuario/1 200 12.034 ms").
app.use(morgan('dev'));

// Habilitamos CORS para todas las rutas. Esto permite que cualquier origen externo 
// se comunique con este microservicio de rutinas.
app.use(cors());

// Le decimos a Express que analice automáticamente el cuerpo de las peticiones HTTP 
// que vengan en formato JSON. Si no hacemos esto, cuando envíes los datos de una 
// nueva rutina desde el cliente, 'req.body' aparecerá vacío.
app.use(express.json());

// --- SECCIÓN DE RUTAS ---

// Conectamos todas las rutas que definiste en 'rutinasController' a esta aplicación.
// A partir de este punto, el servidor ya sabe qué hacer si recibe una petición 
// a endpoints como '/rutinas' o '/rutinas/seleccionar'.
app.use(rutinasController);

// --- INICIO DEL SERVIDOR ---

// Finalmente, le indicamos al servidor que empiece a escuchar peticiones en el puerto 4002.
// Este es el puerto exclusivo para la gestión de rutinas, manteniendo la separación 
// de responsabilidades típica de los microservicios.
app.listen(4002, () => {
    // Imprimimos un mensaje de éxito en la consola para confirmar que el servidor 
    // arrancó sin problemas.
    console.log('Microservicio Rutinas ejecutandose en el puerto 4002');
});