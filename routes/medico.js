var express = require('express');

var mdAuth = require('../middlewares/auth');

var app = express();

var Medico = require('../models/medico');

// ===========================================
// Obtener todos los médicos
// ===========================================
app.get('/', (req, res, next) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((err, medicos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error DB médicos',
                    errors: err
                });
            }

            Medico.count({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                });
            });


        });
});

// ===========================================
// Obtener medico por id
// ===========================================
app.get('/:id', (req, res, next) => {
    var id = req.params.id;

    Medico.findById(id)
        .populate('usuario', 'nombre img email google')
        .exec((err, medico) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error al buscar médico',
                    errors: err
                });
            }

            if (!medico) {
                return res.status(404).json({
                    ok: false,
                    message: 'Médico con id ' + id + ' no encontrado',
                    errors: { message: 'No existe un médico con ese id' }
                });
            }

            res.status(200).json({
                ok: true,
                medico: medico
            });
        });
});

// ===========================================
// Actualizar médico
// ===========================================
app.put('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar medico',
                errors: err
            });
        }

        if (!medico) {
            return res.status(404).json({
                ok: false,
                message: 'Médico con id ' + id + ' no encontrado',
                errors: { message: 'No existe un médico con ese id' }
            });
        }

        medico.nombre = body.nombre;
        medico.hospital = body.hospitalId;

        medico.save((err, medicoGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al editar el médico',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });
        });
    });
});

// ===========================================
// Crear un nuevo médico
// ===========================================
app.post('/', mdAuth.verifyToken, (req, res) => {
    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuario._id,
        hospital: body.hospitalId
    });

    medico.save((err, medicoGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear médico',
                errors: err
            });
        }

        res.status(201).json({
            medico: medicoGuardado,
            ok: true,
        });
    });
});

// ===========================================
// Eliminar médico
// ===========================================
app.delete('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al eliminar médico',
                errors: err
            });
        }

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                message: 'Médico con id ' + id + ' no encontrado',
                errors: { message: 'No existe un médico con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: medicoBorrado
        });
    });
});

module.exports = app;