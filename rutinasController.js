const { Router } = require('express');

const router = Router();

const rutinasModel =
require('../models/rutinasModel');

const axios = require('axios');



// =========================
// VALIDAR USUARIO
// =========================

async function validarUsuario(
    req,
    res,
    next
) {

    try {

        const idUsuario =
            req.headers['usuario-id'];

        if (!idUsuario) {

            res.status(400).json({
                mensaje:
                'usuario-id requerido'
            });

            return;
        }

        const response =
            await axios.get(
                `http://192.168.56.20:4001/usuarios/${idUsuario}`
            );

        if (!response.data) {

            res.status(404).json({
                mensaje:
                'usuario no encontrado'
            });

            return;
        }

        next();

    } catch (error) {

        res.status(400).json({
            mensaje:
            'usuario invalido'
        });
    }
}



// =========================
// CREAR RUTINA
// =========================

router.post(
    '/rutinas',
    validarUsuario,
    async (req, res) => {

        try {

            const idUsuario =
                req.headers['usuario-id'];

            const response =
                await axios.get(
                    `http://192.168.56.20:4001/usuarios/${idUsuario}`
                );

            const usuario =
                response.data;

            if (!usuario) {

                res.status(404).json({
                    mensaje:
                    'usuario no encontrado'
                });

                return;
            }

            if (
                usuario.rol !=
                'entrenador'
            ) {

                res.status(403).json({
                    mensaje:
                    'solo los entrenadores pueden crear rutinas'
                });

                return;
            }

            const {
                nombre,
                descripcion,
                objetivo,
                gramos
            } = req.body;

            if (
                objetivo != 'aumentar'
                &&
                objetivo != 'reducir'
            ) {

                res.status(400).json({
                    mensaje:
                    'objetivo invalido'
                });

                return;
            }

            if (gramos <= 0) {

                res.status(400).json({
                    mensaje:
                    'los gramos deben ser mayores a cero'
                });

                return;
            }

            await rutinasModel.crearRutina(
                nombre,
                descripcion,
                objetivo,
                gramos
            );

            res.json({
                mensaje:
                'rutina creada'
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje:
                'error creando rutina'
            });
        }
    }
);



// =========================
// TRAER RUTINAS
// =========================

router.get(
    '/rutinas',
    async (req, res) => {

        const result =
            await rutinasModel
            .traerRutinas();

        res.json(result);
    }
);



// =========================
// TRAER RUTINA
// =========================

router.get(
    '/rutinas/:id',
    async (req, res) => {

        const id =
            req.params.id;

        const result =
            await rutinasModel
            .traerRutina(id);

        res.json(result[0]);
    }
);



// =========================
// SELECCIONAR RUTINA
// =========================

router.post(
    '/rutinas/seleccionar',
    validarUsuario,
    async (req, res) => {

        const {
            id_usuario,
            id_rutina
        } = req.body;

        try {

            const usuarioResponse =
                await axios.get(
                    `http://192.168.56.20:4001/usuarios/${id_usuario}`
                );

            if (
                !usuarioResponse.data
            ) {

                res.status(404).json({
                    mensaje:
                    'usuario no encontrado'
                });

                return;
            }

            const rutina =
                await rutinasModel
                .traerRutina(
                    id_rutina
                );

            if (
                rutina.length == 0
            ) {

                res.status(404).json({
                    mensaje:
                    'rutina no encontrada'
                });

                return;
            }

            await rutinasModel
            .seleccionarRutina(
                id_usuario,
                id_rutina
            );

            res.json({
                mensaje:
                'rutina seleccionada'
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje:
                'error validando usuario'
            });
        }
    }
);



// =========================
// RUTINAS DE USUARIO
// =========================

router.get(
    '/rutinas/usuario/:id',
    async (req, res) => {

        const id =
            req.params.id;

        const result =
            await rutinasModel
            .traerRutinasUsuario(id);

        res.json(result);
    }
);



// =========================
// TERMINAR RUTINA
// =========================

router.put(
    '/rutinas/terminar/:id',
    validarUsuario,
    async (req, res) => {

        const id =
            req.params.id;

        try {

            const rutinaUsuario =
                await rutinasModel
                .traerRutinaUsuario(id);

            if (
                rutinaUsuario.length == 0
            ) {

                res.status(404).json({
                    mensaje:
                    'rutina no encontrada'
                });

                return;
            }

            const data =
                rutinaUsuario[0];

            if (
                data.terminada == 1
            ) {

                res.status(400).json({
                    mensaje:
                    'la rutina ya fue terminada'
                });

                return;
            }

            const usuarioResponse =
                await axios.get(
                    `http://192.168.56.20:4001/usuarios/${data.id_usuario}`
                );

            const usuario =
                usuarioResponse.data;

            let nuevoPeso =
                usuario.peso;

            if (
                data.objetivo ==
                'reducir'
            ) {

                nuevoPeso =
                    usuario.peso
                    -
                    (
                        data.gramos
                        / 1000
                    );

            } else {

                nuevoPeso =
                    usuario.peso
                    +
                    (
                        data.gramos
                        / 1000
                    );
            }

            await axios.put(
                `http://192.168.56.20:4001/usuarios/${usuario.id}/peso`,
                {
                    peso:
                    nuevoPeso
                }
            );

            await rutinasModel
            .terminarRutina(id);

            await axios.post(
                'http://192.168.56.20:4003/notificaciones',
                {
                    usuario:
                    usuario.usuario,

                    rutina:
                    data.nombre,

                    nuevo_peso:
                    nuevoPeso
                }
            );

            res.json({
                mensaje:
                'rutina terminada'
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje:
                'error terminando rutina'
            });
        }
    }
);



// =========================
// RUTINAS TERMINADAS
// =========================

router.get(
    '/rutinas/usuario/:id/terminadas',
    async (req, res) => {

        const id =
            req.params.id;

        const result =
            await rutinasModel
            .traerRutinasTerminadas(id);

        res.json(result);
    }
);

module.exports = router;