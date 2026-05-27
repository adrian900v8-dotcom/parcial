// Importamos la versión basada en promesas del módulo 'mysql2' para 
// poder utilizar la sintaxis moderna de async/await.
const mysql = require('mysql2/promise');

// Creamos un "Pool" de conexiones específico para la base de datos de usuarios.
// Esto administra eficientemente las conexiones a MySQL, reutilizándolas 
// en lugar de abrir y cerrar una nueva por cada consulta.
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'usuarios_db', // Conectamos a la DB específica de este microservicio
    port: '3306'
});

// Función para obtener todos los usuarios registrados en el sistema.
async function traerUsuarios() {
    // Ejecuta una consulta SELECT básica.
    const result = await connection.query('SELECT * FROM usuarios');
    // Retornamos result[0] para enviar solo las filas de datos, omitiendo la metadata de MySQL.
    return result[0];
}

// Función para buscar un único usuario por su ID.
async function traerUsuario(id) {
    // Usamos '?' como marcador de posición para el parámetro 'id'.
    // Esto previene ataques de inyección SQL sanitizando la entrada automáticamente.
    const result = await connection.query(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
    );

    return result[0];
}

// Función para validar las credenciales de acceso.
async function login(usuario, password) {
    // Busca un registro donde coincidan tanto el nombre de usuario como la contraseña.
    // Nota: En un entorno de producción real, las contraseñas deberían estar encriptadas (ej. con bcrypt).
    const result = await connection.query(
        'SELECT * FROM usuarios WHERE usuario = ? AND password = ?',
        [usuario, password]
    );

    return result[0];
}

// Función para insertar un nuevo usuario (cliente o entrenador) en la base de datos.
async function crearUsuario(
    nombre_completo,
    peso,
    meta,
    usuario,
    password,
    rol
) {
    // El primer valor es 'null' porque asumimos que la columna ID es AUTO_INCREMENT.
    // Los demás valores se pasan en el arreglo en el mismo orden que los signos '?'.
    const result = await connection.query(
        'INSERT INTO usuarios VALUES(null,?,?,?,?,?,?)',
        [nombre_completo, peso, meta, usuario, password, rol]
    );

    // Aquí retornamos 'result' completo porque en un INSERT suele ser útil 
    // la metadata (como el insertId del nuevo registro).
    return result;
}

// Función para actualizar el peso actual de un usuario específico.
async function actualizarPeso(id, peso) {
    // Ejecuta un UPDATE para modificar únicamente la columna 'peso' del usuario que coincida con el 'id'.
    const result = await connection.query(
        'UPDATE usuarios SET peso = ? WHERE id = ?',
        [peso, id] // El orden aquí es vital: primero el peso (para el SET), luego el id (para el WHERE).
    );

    return result;
}

// Función para registrar un cambio de peso en la tabla de historial.
async function crearHistorialPeso(
    id_usuario,
    peso_anterior,
    peso_nuevo,
    diferencia,
    fecha
) {
    // Inserta un nuevo registro detallando la fluctuación de peso.
    const result = await connection.query(
        'INSERT INTO historial_peso VALUES(null,?,?,?,?,?)',
        [
            id_usuario,
            peso_anterior,
            peso_nuevo,
            diferencia,
            fecha
        ]
    );

    return result;
}

// Función para obtener todo el historial de cambios de peso de un usuario.
async function traerHistorialPeso(id_usuario) {
    // Busca todos los registros en la tabla 'historial_peso' que pertenezcan al ID proporcionado.
    const result = await connection.query(
        'SELECT * FROM historial_peso WHERE id_usuario = ?',
        [id_usuario]
    );

    // Retornamos result[0] que contendrá el arreglo con todo el historial de ese usuario.
    return result[0];
}

// Exportamos todas las funciones para que el controlador (router) 
// pueda invocarlas cuando reciba peticiones HTTP.
module.exports = {
    traerUsuarios,
    traerUsuario,
    login,
    crearUsuario,
    actualizarPeso,
    crearHistorialPeso,
    traerHistorialPeso
};