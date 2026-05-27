// Importamos el framework 'express' para poder crear y configurar nuestro servidor web.
const express = require('express');

// Importamos el enrutador que contiene todas las rutas (GET, POST, PUT) 
// que definiste para la gestión de usuarios, login y el historial de peso.
const usuariosController = require('./controllers/usuariosController');

// Importamos 'morgan', una herramienta que nos sirve para registrar (loguear) 
// en la consola cada petición HTTP que llega al servidor. Es vital para debuggear.
const morgan = require('morgan');

// Importamos 'cors', un middleware esencial para permitir que otros 
// microservicios (como el de rutinas o notificaciones) o aplicaciones frontend 
// se comuniquen con este servidor sin ser bloqueados por políticas de seguridad.
const cors = require('cors');

// Inicializamos nuestra aplicación Express.
const app = express();

// --- MIDDLEWARES ---
// Los middlewares son funciones que se ejecutan antes de que la petición llegue a tus rutas.

// Activamos morgan en modo 'dev' para ver un resumen de las peticiones en la consola 
// (ej: POST /login 200 10ms).
app.use(morgan('dev'));

// Habilitamos CORS de forma global para aceptar peticiones externas.
app.use(cors());

// Le decimos a Express que analice las peticiones entrantes que traen 
// información en formato JSON (por ejemplo, cuando extraes req.body.usuario en el login).
app.use(express.json());

// --- RUTAS ---

// Conectamos el controlador de usuarios a la aplicación. 
// A partir de aquí, el servidor ya sabe cómo responder a los endpoints como /login o /usuarios.
app.use(usuariosController);

// --- INICIO DEL SERVIDOR ---

// Ponemos al servidor a escuchar las peticiones en el puerto 4001.
// En tu arquitectura de microservicios, el puerto 4001 está dedicado exclusivamente 
// a todo lo que tenga que ver con Usuarios.
app.listen(4001, () => {
    // Imprimimos un mensaje de confirmación para saber que el servidor arrancó correctamente.
    console.log('Microservicio Usuarios ejecutandose en el puerto 4001');
});