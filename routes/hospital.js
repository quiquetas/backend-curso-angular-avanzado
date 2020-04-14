var express = require('express');

var mdAuth = require('../middlewares/auth');

var app = express();

var Hospital = require('../models/hospital');

// ===========================================
// Obtener todos los hospitales
// ===========================================
app.get('/', (req, res, next) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);

    Hospital.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .exec((err, hospitales) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error DB hospitales',
                    errors: err
                });
            }

            Hospital.count({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    hospitales: hospitales,
                    total: conteo
                });
            });


        });
});

// ===========================================
// Obtener hospital por id
// ===========================================
app.get('/:id', (req, res, next) => {
    var id = req.params.id;

    Hospital.findById(id)
        .populate('usuario', 'nombre img email google')
        .exec((err, hospital) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error al buscar hospital',
                    errors: err
                });
            }

            if (!hospital) {
                return res.status(404).json({
                    ok: false,
                    message: 'Hospital con id ' + id + ' no encontrado',
                    errors: { message: 'No existe un hospital con ese id' }
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospital
            });
        });
});

// ===========================================
// Actualizar hospital
// ===========================================
app.put('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar hospital',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(404).json({
                ok: false,
                message: 'Hospital con id ' + id + ' no encontrado',
                errors: { message: 'No existe un hospital con ese id' }
            });
        }

        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save((err, hospitalGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al editar el hospital',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });
        });
    });
});

// ===========================================
// Crear un nuevo hospital
// ===========================================
app.post('/', mdAuth.verifyToken, (req, res) => {
    var body = req.body;

    var hospital = new Hospital({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuario._id
    });

    hospital.save((err, hospitalGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear hospital',
                errors: err
            });
        }

        res.status(201).json({
            hospital: hospitalGuardado,
            ok: true,
        });
    });
});

// ===========================================
// Eliminar hospital
// ===========================================
app.delete('/:id', mdAuth.verifyToken, (req, res) => {
    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al eliminar hospital',
                errors: err
            });
        }

        if (!hospitalBorrado) {
            return res.status(400).json({
                ok: false,
                message: 'Hospital con id ' + id + ' no encontrado',
                errors: { message: 'No existe un hospital con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });
    });
});

module.exports = app;