// Importamos la versión de promesas de mysql2 para poder usar async/await.
const mysql = require('mysql2/promise');

// Creamos un "Pool" de conexiones a la base de datos específica de este microservicio.
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'rutinas_db', // Base de datos dedicada solo a las rutinas
    port: '3306'
});

// =========================
// CREAR RUTINA (Catálogo general)
// =========================
async function crearRutina(nombre, descripcion, objetivo, gramos) {
    // Inserta una nueva rutina en el "catálogo" general del gimnasio.
    // El 'null' es para el ID autoincrementable.
    const result = await connection.query(
        'INSERT INTO rutinas VALUES(null,?,?,?,?)',
        [nombre, descripcion, objetivo, gramos]
    );
    return result;
}

// =========================
// TRAER TODAS LAS RUTINAS
// =========================
async function traerRutinas() {
    // Consulta sencilla para obtener todo el catálogo de rutinas disponibles.
    const result = await connection.query(
        'SELECT * FROM rutinas'
    );
    return result[0];
}

// =========================
// TRAER UNA RUTINA (Por ID)
// =========================
async function traerRutina(id) {
    // Busca los detalles de una rutina específica del catálogo.
    const result = await connection.query(
        'SELECT * FROM rutinas WHERE id = ?',
        [id]
    );
    return result[0];
}

// =========================
// ASIGNAR RUTINA A USUARIO
// =========================
async function seleccionarRutina(id_usuario, id_rutina) {
    // Aquí insertamos en una tabla intermedia (rutinas_usuarios).
    // Esta tabla conecta el ID de un usuario con el ID de una rutina.
    // El 'false' final indica que, por defecto, la rutina inicia como "no terminada".
    const result = await connection.query(
        'INSERT INTO rutinas_usuarios VALUES(null,?,?,false)',
        [id_usuario, id_rutina]
    );
    return result;
}

// =========================
// VER RUTINAS ASIGNADAS A UN USUARIO
// =========================
async function traerRutinasUsuario(id_usuario) {
    // Usamos un INNER JOIN para combinar dos tablas: 
    // 'rutinas_usuarios' (ru) y 'rutinas' (r).
    // Esto nos permite devolver no solo que el usuario tiene la rutina #5, 
    // sino también el nombre, objetivo y detalles de esa rutina #5.
    const result = await connection.query(
        `SELECT ru.id,
                r.nombre,
                r.descripcion,
                r.objetivo,
                r.gramos,
                ru.terminada
         FROM rutinas_usuarios ru
         INNER JOIN rutinas r
         ON ru.id_rutina = r.id
         WHERE ru.id_usuario = ?`,
        [id_usuario]
    );
    return result[0];
}

// =========================
// MARCAR RUTINA COMO TERMINADA
// =========================
async function terminarRutina(id) {
    // Actualiza el estado en la tabla intermedia, cambiando el 'false' a 'true' (terminada).
    // El 'id' aquí es el identificador único de esa asignación específica.
    const result = await connection.query(
        'UPDATE rutinas_usuarios SET terminada = true WHERE id = ?',
        [id]
    );
    return result;
}

// =========================
// VER DETALLES DE UNA RUTINA ASIGNADA
// =========================
async function traerRutinaUsuario(id) {
    // Similar a traerRutinasUsuario, pero busca un registro específico en la tabla intermedia
    // usando el ID de la asignación (ru.id) en lugar del ID del usuario.
    const result = await connection.query(
        `SELECT ru.id,
                ru.id_usuario,
                ru.id_rutina,
                ru.terminada,
                r.nombre,
                r.descripcion,
                r.objetivo,
                r.gramos
         FROM rutinas_usuarios ru
         INNER JOIN rutinas r
         ON ru.id_rutina = r.id
         WHERE ru.id = ?`,
        [id]
    );
    return result[0];
}

// =========================
// VER HISTORIAL DE LOGROS (RUTINAS TERMINADAS)
// =========================
async function traerRutinasTerminadas(id_usuario) {
    // Hace el mismo INNER JOIN de antes, pero le añade una condición (AND ru.terminada = true)
    // para filtrar y mostrar únicamente las rutinas que el usuario ya completó.
    const result = await connection.query(
        `SELECT ru.id,
                r.nombre,
                r.descripcion,
                r.objetivo,
                r.gramos,
                ru.terminada
         FROM rutinas_usuarios ru
         INNER JOIN rutinas r
         ON ru.id_rutina = r.id
         WHERE ru.id_usuario = ?
         AND ru.terminada = true`,
        [id_usuario]
    );
    return result[0];
}

// Exportamos todas las funciones para que el controlador pueda usarlas.
module.exports = {
    crearRutina,
    traerRutinas,
    traerRutina,
    seleccionarRutina,
    traerRutinasUsuario,
    terminarRutina,
    traerRutinaUsuario,
    traerRutinasTerminadas
};
