// Importamos el framework 'express' para crear nuestro servidor web.
// Express facilita mucho levantar el servidor y manejar las peticiones HTTP.
const express = require('express');

// Importamos el enrutador (router) que definimos en el primer archivo.
// Esto conecta las rutas (GET y POST de /notificaciones) con esta aplicación principal.
const notificacionesController = require('./controllers/notificacionesController');

// Importamos 'morgan', que es un middleware (un intermediario).
// Sirve para registrar (loguear) cada petición que llega al servidor en la consola, 
// lo cual es súper útil para saber si tus rutas se están llamando correctamente.
const morgan = require('morgan');

// Importamos 'cors' (Cross-Origin Resource Sharing).
// Esto es vital en una arquitectura de microservicios: permite que tu frontend 
// (o los otros microservicios, como el de usuarios o rutinas) puedan hacer 
// peticiones a este puerto sin ser bloqueados por políticas de seguridad del navegador.
const cors = require('cors');

// Inicializamos la aplicación de Express. Esta constante 'app' es la que 
// configuraremos de aquí en adelante.
const app = express();

// --- SECCIÓN DE MIDDLEWARES ---
// Usamos app.use() para ejecutar funciones antes de que las peticiones lleguen a las rutas.

// Configuramos morgan en modo 'dev' para ver en consola un resumen de cada petición
// con colores (ejemplo: "POST /notificaciones 200 15ms").
app.use(morgan('dev'));

// Habilitamos CORS de manera global para no rechazar peticiones externas.
app.use(cors());

// Este middleware es fundamental: le dice a Express que extraiga y entienda los 
// datos que vienen en formato JSON en el cuerpo de las peticiones.
// Sin esto, el 'req.body' de tu ruta POST llegaría como 'undefined'.
app.use(express.json());

// --- SECCIÓN DE RUTAS ---
// Le decimos a la aplicación que integre las rutas del controlador que importamos arriba.
// A partir de esta línea, la app ya sabe qué hacer si le piden algo en '/notificaciones'.
app.use(notificacionesController);

// --- INICIO DEL SERVIDOR ---
// Le indicamos a la aplicación que "escuche" las peticiones en el puerto 4003.
// Usar el 4003 está perfecto, ya que en los microservicios cada módulo 
// (usuarios, rutinas, etc.) necesita vivir en un puerto independiente.
app.listen(4003, () => {
    
    // Imprimimos un mensaje en consola para confirmar visualmente 
    // que el servidor arrancó bien y está listo para recibir peticiones.
    console.log(
        'Microservicio Notificaciones ejecutandose en el puerto 4003'
    );
});