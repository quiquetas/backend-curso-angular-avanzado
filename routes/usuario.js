var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var mdAuth = require('../middlewares/auth');

var app = express();

var Usuario = require('../models/usuario');

// ===========================================
// Obtener todos los usuarios
// ===========================================
app.get('/', (req, res, next) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, 'nombre email img role google')
        .skip(desde)
        .limit(5)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error DB usuarios',
                    errors: err
                });
            }

            Usuario.count({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    usuarios: usuarios,
                    total: conteo
                });
            });
        });
});

// ===========================================
// Actualizar usuario
// ===========================================
app.put('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario con id ' + id + ' no encontrado',
                errors: { message: 'No existe un usuario con ese id' }
            });
        }

        // Si el usuario es de Google, no se le permite cambiar el email
        // Si fuera necesario permitírselo, habría que pedirle que defina contraseña
        if (usuario.google && body.email !== usuario.email) {
            return res.status(400).json({
                ok: false,
                message: 'No puede cambiar el email',
                errors: { message: 'No puede cambiar el email al ser un usuario de Google' }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al editar el usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = ':)';

            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });
        });
    });
});

// ===========================================
// Crear un nuevo usuario
// ===========================================
app.post('/', (req, res) => {
    var body = req.body;

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear usuario',
                errors: err
            });
        }

        usuarioGuardado.password = ':)';

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            creator: req.usuario
        });
    });
});

// ===========================================
// Eliminar usuario
// ===========================================
app.delete('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;

    // El usuario identificado con el token no puede borrarse a sí mismo.
    if (req.usuario._id === id) {
        return res.status(400).json({
            ok: false,
            message: 'No puede borrarse a sí mismo',
            errors: { message: 'No puede borrarse a sí mismo' }
        });
    }

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al eliminar usuario',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario con id ' + id + ' no encontrado',
                errors: { message: 'No existe un usuario con ese id' }
            });
        }

        usuarioBorrado.password = ':)';

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});

module.exports = app;