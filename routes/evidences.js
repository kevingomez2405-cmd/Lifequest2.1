const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Evidence = require('../models/Evidence');
const { pool } = require('../config/db');

// GET /api/evidences
router.get('/', auth, async (req, res) => {
  try {
    const evidences = await Evidence.findByUser(req.userId);
    res.json(evidences);
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/evidences
router.post('/', auth, async (req, res) => {
  try {
    const { progresoId, urlFoto } = req.body;

    if (!progresoId || !urlFoto) {
      return res.status(400).json({ error: 'progresoId y urlFoto son obligatorios' });
    }

    const [progreso] = await pool.query(
      'SELECT ID_PROGRESO FROM PROGRESO WHERE ID_PROGRESO = ? AND FK_ID_USUARIO = ?',
      [progresoId, req.userId]
    );
    if (!progreso[0]) {
      return res.status(404).json({ error: 'Progreso no encontrado o no pertenece al usuario' });
    }

    const evidence = await Evidence.create({
      userId: req.userId,
      progresoId,
      urlFoto
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error('Error al crear evidencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/evidences/:id/validate (admin)
router.put('/:id/validate', auth, async (req, res) => {
  try {
    const { estado, comentario } = req.body;
    if (!['VALIDADA', 'RECHAZADA'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser VALIDADA o RECHAZADA' });
    }

    await pool.query(
      'UPDATE EVIDENCIA SET ESTADO = ?, COMENTARIO_ADMIN = ?, FK_ID_ADMINISTRADOR = (SELECT ID_ADMINISTRADOR FROM ADMINISTRADOR LIMIT 1) WHERE ID_EVIDENCIA = ?',
      [estado, comentario || null, req.params.id]
    );

    res.json({ message: `Evidencia ${estado.toLowerCase()}` });
  } catch (error) {
    console.error('Error al validar evidencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
