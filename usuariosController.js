// Importamos Router de Express para manejar las rutas de este módulo.
const { Router } = require('express');
const router = Router();

// Importamos el modelo de usuarios que interactúa con la base de datos.
const usuariosModel = require('../models/usuariosModel');

// Importamos axios. Esta librería nos permite hacer peticiones HTTP desde el backend,
// ideal para comunicar microservicios entre sí (por ejemplo, hablar con el servicio de rutinas).
const axios = require('axios');

// Ruta GET para obtener la lista completa de todos los usuarios.
router.get('/usuarios', async (req, res) => {
    const result = await usuariosModel.traerUsuarios();
    res.json(result);
});

// Ruta GET para obtener un solo usuario basado en su ID.
// El ':id' en la URL es un parámetro dinámico.
router.get('/usuarios/:id', async (req, res) => {
    const id = req.params.id; // Extraemos el ID de la URL
    const result = await usuariosModel.traerUsuario(id);
    
    // Devolvemos solo el primer elemento (result[0]) porque esperamos un único usuario, no un arreglo.
    res.json(result[0]);
});

// Ruta POST para la autenticación (Login).
router.post('/login', async (req, res) => {
    // Extraemos las credenciales enviadas por el cliente.
    const usuario = req.body.usuario;
    const password = req.body.password;

    // Buscamos si existe una coincidencia en la base de datos.
    const result = await usuariosModel.login(usuario, password);

    // Si el arreglo está vacío (length == 0), las credenciales no coinciden.
    if (result.length == 0) {
        // Devolvemos un código de estado 401 (No autorizado) y detenemos la ejecución con 'return'.
        res.status(401).send('credenciales incorrectas');
        return;
    }

    // Si pasamos la validación, enviamos un mensaje de éxito junto con los datos del usuario.
    res.json({
        mensaje: 'login correcto',
        usuario: result[0]
    });
});

// Ruta POST para crear un nuevo usuario (cliente o entrenador).
// Incluye lógica de autorización y validaciones de negocio.
router.post('/usuarios', async (req, res) => {
    try {
        // 1. VALIDACIÓN DE AUTORIZACIÓN
        // Verificamos quién está intentando crear este usuario leyendo los 'headers' (cabeceras).
        const idUsuario = req.headers['usuario-id'];

        if (!idUsuario) {
            res.send('usuario-id requerido');
            return;
        }

        // 2. CONSULTA ENTRE MICROSERVICIOS
        // Hacemos una petición HTTP a la máquina virtual/servidor local para obtener 
        // los datos completos de quien está haciendo la solicitud.
        const response = await axios.get(
            `http://192.168.56.20:4001/usuarios/${idUsuario}`
        );

        const usuarioLogueado = response.data;

        if (!usuarioLogueado) {
            res.send('usuario no encontrado');
            return;
        }

        // 3. VALIDACIÓN DE ROL
        // Lógica de negocio: Protegemos la ruta para que solo los entrenadores puedan registrar gente.
        if (usuarioLogueado.rol != 'entrenador') {
            res.send('solo entrenadores pueden crear usuarios');
            return;
        }

        // 4. EXTRACCIÓN DE DATOS DEL NUEVO USUARIO
        const {
            nombre_completo,
            peso,
            meta,
            usuario,
            password,
            rol
        } = req.body;

        // 5. VALIDACIÓN DE INTEGRIDAD DE DATOS
        // Aseguramos que el rol sea válido para el sistema.
        if (rol != 'cliente' && rol != 'entrenador') {
            res.send('rol invalido');
            return;
        }

        // Evitamos registros lógicamente imposibles (pesos negativos o cero).
        if (peso <= 0) {
            res.send('peso invalido');
            return;
        }

        // Verificamos que no falten datos esenciales.
        if (
            !nombre_completo ||
            !meta ||
            !usuario ||
            !password
        ) {
            res.send('todos los campos son obligatorios');
            return;
        }

        // 6. CREACIÓN EN BASE DE DATOS
        // Si todas las validaciones pasan, guardamos el nuevo usuario.
        await usuariosModel.crearUsuario(
            nombre_completo,
            peso,
            meta,
            usuario,
            password,
            rol
        );

        res.send('usuario creado');

    } catch (error) {
        // Manejo de errores: Si algo falla (ej. el axios.get no encuentra el servidor), 
        // capturamos el error para que el microservicio no se caiga.
        console.log(error);
        res.send('error creando usuario');
    }
});

// Ruta PUT para actualizar únicamente el peso de un usuario.
router.put('/usuarios/:id/peso', async (req, res) => {
    const id = req.params.id;
    const pesoNuevo = req.body.peso;

    // Validación básica del nuevo peso.
    if (pesoNuevo <= 0) {
        res.send('peso invalido');
        return;
    }

    // Buscamos al usuario actual para saber cuánto pesaba antes.
    const usuario = await usuariosModel.traerUsuario(id);

    if (usuario.length == 0) {
        res.send('usuario no encontrado');
        return;
    }

    // Calculamos la diferencia entre el peso nuevo y el anterior.
    const pesoAnterior = usuario[0].peso;
    const diferencia = pesoNuevo - pesoAnterior;

    // Actualizamos el registro principal del usuario con su peso actual.
    await usuariosModel.actualizarPeso(id, pesoNuevo);

    // Guardamos el registro en la tabla de historial para poder graficar o trackear el progreso.
    await usuariosModel.crearHistorialPeso(
        id,
        pesoAnterior,
        pesoNuevo,
        diferencia,
        new Date()
    );

    res.send('peso actualizado');
});

// Ruta GET para traer todo el historial de fluctuación de peso de un usuario específico.
router.get('/usuarios/:id/historial', async (req, res) => {
    const id = req.params.id;
    const result = await usuariosModel.traerHistorialPeso(id);
    res.json(result);
});

// Exportamos el enrutador para montarlo en la aplicación principal de Express.
module.exports = router;