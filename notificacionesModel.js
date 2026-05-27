const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'notificaciones_db',
    port: '3306'
});

async function crearNotificacion(
    usuario,
    rutina,
    nuevo_peso
) {

    const result = await connection.query(
        'INSERT INTO notificaciones VALUES(null,?,?,?,?)',
        [
            usuario,
            rutina,
            nuevo_peso,
            new Date()
        ]
    );

    return result;
}

async function traerNotificaciones() {

    const result = await connection.query(
        'SELECT * FROM notificaciones ORDER BY fecha DESC'
    );

    return result[0];
}

module.exports = {
    crearNotificacion,
    traerNotificaciones
};