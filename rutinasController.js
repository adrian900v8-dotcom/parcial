// Importamos Router de Express para manejar las rutas.
const { Router } = require('express');
const router = Router();

// Importamos el modelo que interactúa con la base de datos de las rutinas.
const rutinasModel = require('../models/rutinasModel');

// Importamos axios. Es la herramienta clave aquí para que este microservicio 
// pueda hacer peticiones HTTP y hablar con los otros microservicios en el puerto 4001 y 4003.
const axios = require('axios');

// =========================
// MIDDLEWARE: VALIDAR USUARIO
// =========================
// Esta función actúa como un "guardia de seguridad" (middleware). 
// Antes de dejar que ciertas rutas se ejecuten, verifica si quien hace la petición 
// es un usuario legítimo registrado en el sistema.
async function validarUsuario(req, res, next) {
    try {
        // Extrae el ID del usuario desde las cabeceras (headers) de la petición HTTP.
        const idUsuario = req.headers['usuario-id'];

        if (!idUsuario) {
            res.status(400).json({ mensaje: 'usuario-id requerido' });
            return;
        }

        // Hace una llamada al microservicio de Usuarios (puerto 4001) en tu máquina 
        // para verificar si ese ID realmente existe en la base de datos.
        const response = await axios.get(
            `http://192.168.56.20:4001/usuarios/${idUsuario}`
        );

        if (!response.data) {
            res.status(404).json({ mensaje: 'usuario no encontrado' });
            return;
        }

        // Si todo está bien, 'next()' permite que la petición continúe hacia la ruta final.
        next();
    } catch (error) {
        // Si el microservicio de usuarios falla o rechaza la conexión, capturamos el error.
        res.status(400).json({ mensaje: 'usuario invalido' });
    }
}

// =========================
// CREAR RUTINA MÁSTRA
// =========================
// Ruta POST protegida por el middleware 'validarUsuario'.
router.post('/rutinas', validarUsuario, async (req, res) => {
    try {
        const idUsuario = req.headers['usuario-id'];

        // Volvemos a consultar al microservicio de usuarios para obtener los datos completos,
        // ya que necesitamos saber qué ROL tiene la persona que intenta crear la rutina.
        const response = await axios.get(
            `http://192.168.56.20:4001/usuarios/${idUsuario}`
        );
        const usuario = response.data;

        if (!usuario) {
            res.status(404).json({ mensaje: 'usuario no encontrado' });
            return;
        }

        // Lógica de negocio: Validamos que estrictamente un 'entrenador' pueda diseñar rutinas.
        if (usuario.rol != 'entrenador') {
            res.status(403).json({ mensaje: 'solo los entrenadores pueden crear rutinas' });
            return;
        }

        // Extraemos los datos de la nueva rutina desde el cuerpo de la petición.
        const { nombre, descripcion, objetivo, gramos } = req.body;

        // Validamos que el objetivo de la rutina tenga sentido (subir o bajar de peso).
        if (objetivo != 'aumentar' && objetivo != 'reducir') {
            res.status(400).json({ mensaje: 'objetivo invalido' });
            return;
        }

        // Prevenimos rutinas con metas de 0 o negativas.
        if (gramos <= 0) {
            res.status(400).json({ mensaje: 'los gramos deben ser mayores a cero' });
            return;
        }

        // Guardamos la rutina en la base de datos de este microservicio.
        await rutinasModel.crearRutina(nombre, descripcion, objetivo, gramos);

        res.json({ mensaje: 'rutina creada' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'error creando rutina' });
    }
});

// =========================
// TRAER TODAS LAS RUTINAS
// =========================
router.get('/rutinas', async (req, res) => {
    const result = await rutinasModel.traerRutinas();
    res.json(result);
});

// =========================
// TRAER UNA RUTINA ESPECÍFICA
// =========================
router.get('/rutinas/:id', async (req, res) => {
    const id = req.params.id;
    const result = await rutinasModel.traerRutina(id);
    res.json(result[0]); // Retornamos solo el objeto, no un arreglo.
});

// =========================
// ASIGNAR/SELECCIONAR RUTINA A UN USUARIO
// =========================
// Ruta POST para vincular un usuario (cliente) con una rutina específica.
router.post('/rutinas/seleccionar', validarUsuario, async (req, res) => {
    const { id_usuario, id_rutina } = req.body;

    try {
        // 1. Verificamos mediante el microservicio 4001 que el usuario a asignar exista.
        const usuarioResponse = await axios.get(
            `http://192.168.56.20:4001/usuarios/${id_usuario}`
        );

        if (!usuarioResponse.data) {
            res.status(404).json({ mensaje: 'usuario no encontrado' });
            return;
        }

        // 2. Verificamos localmente que la rutina exista en nuestra base de datos.
        const rutina = await rutinasModel.traerRutina(id_rutina);

        if (rutina.length == 0) {
            res.status(404).json({ mensaje: 'rutina no encontrada' });
            return;
        }

        // 3. Si ambos existen, creamos el vínculo en la tabla intermedia.
        await rutinasModel.seleccionarRutina(id_usuario, id_rutina);

        res.json({ mensaje: 'rutina seleccionada' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'error validando usuario' });
    }
});

// =========================
// TRAER RUTINAS ACTIVAS DE UN USUARIO
// =========================
router.get('/rutinas/usuario/:id', async (req, res) => {
    const id = req.params.id;
    const result = await rutinasModel.traerRutinasUsuario(id);
    res.json(result);
});

// =========================
// TERMINAR RUTINA (ORQUESTACIÓN DE MICROSERVICIOS)
// =========================
// Esta es la ruta más compleja porque coordina actualizaciones en 3 bases de datos distintas.
router.put('/rutinas/terminar/:id', validarUsuario, async (req, res) => {
    const id = req.params.id; // ID del registro en la tabla intermedia (usuario_rutina)

    try {
        // Buscamos los detalles de la rutina asignada a este usuario.
        const rutinaUsuario = await rutinasModel.traerRutinaUsuario(id);

        if (rutinaUsuario.length == 0) {
            res.status(404).json({ mensaje: 'rutina no encontrada' });
            return;
        }

        const data = rutinaUsuario[0];

        // Evitamos que una rutina se termine dos veces y altere el peso incorrectamente.
        if (data.terminada == 1) {
            res.status(400).json({ mensaje: 'la rutina ya fue terminada' });
            return;
        }

        // Traemos el perfil completo del usuario desde el microservicio 4001 
        // para conocer su peso actual.
        const usuarioResponse = await axios.get(
            `http://192.168.56.20:4001/usuarios/${data.id_usuario}`
        );
        const usuario = usuarioResponse.data;

        let nuevoPeso = usuario.peso;

        // MATEMÁTICAS DEL PESO:
        // Convertimos los gramos de la rutina a kilogramos (dividiendo por 1000).
        // Restamos o sumamos dependiendo del objetivo establecido al crear la rutina.
        if (data.objetivo == 'reducir') {
            nuevoPeso = usuario.peso - (data.gramos / 1000);
        } else {
            nuevoPeso = usuario.peso + (data.gramos / 1000);
        }

        // ORQUESTACIÓN PASO 1: Actualizar el peso.
        // Hacemos una petición PUT al microservicio de usuarios para que actualice 
        // el peso en su base de datos y genere el historial de fluctuación.
        await axios.put(
            `http://192.168.56.20:4001/usuarios/${usuario.id}/peso`,
            { peso: nuevoPeso }
        );

        // ORQUESTACIÓN PASO 2: Marcar como terminada.
        // Actualizamos nuestra propia base de datos local para cerrar la rutina.
        await rutinasModel.terminarRutina(id);

        // ORQUESTACIÓN PASO 3: Disparar notificación.
        // Hacemos una petición POST al microservicio de notificaciones (puerto 4003)
        // para registrar el logro del usuario.
        await axios.post(
            'http://192.168.56.20:4003/notificaciones',
            {
                usuario: usuario.usuario,
                rutina: data.nombre,
                nuevo_peso: nuevoPeso
            }
        );

        res.json({ mensaje: 'rutina terminada' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'error terminando rutina' });
    }
});

// =========================
// HISTORIAL DE RUTINAS TERMINADAS
// =========================
router.get('/rutinas/usuario/:id/terminadas', async (req, res) => {
    const id = req.params.id;
    // Consulta al modelo para traer el historial de logros del usuario.
    const result = await rutinasModel.traerRutinasTerminadas(id);
    res.json(result);
});

module.exports = router;
