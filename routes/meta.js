const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meta = require('../models/Meta');

// GET /api/metas
router.get('/', auth, async (req, res) => {
  try {
    const metas = await Meta.findByUser(req.userId);
    res.json(metas);
  } catch (error) {
    console.error('Error al obtener metas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/metas
router.post('/', auth, async (req, res) => {
  try {
    const { titulo, descripcion, fechaInicio, fechaFin } = req.body;
    if (!titulo || !fechaInicio) {
      return res.status(400).json({ error: 'titulo y fechaInicio son obligatorios' });
    }
    const meta = await Meta.create({
      userId: req.userId, titulo, descripcion, fechaInicio, fechaFin
    });
    res.status(201).json(meta);
  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/metas/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const meta = await Meta.findById(req.params.id, req.userId);
    if (!meta) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json(meta);
  } catch (error) {
    console.error('Error al obtener meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/metas/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const meta = await Meta.findById(req.params.id, req.userId);
    if (!meta) return res.status(404).json({ error: 'Meta no encontrada' });

    const { titulo, descripcion, fechaInicio, fechaFin, estado } = req.body;
    const { pool } = require('../config/db');
    const fields = [];
    const values = [];

    if (titulo !== undefined) { fields.push('TITULO_META = ?'); values.push(titulo); }
    if (descripcion !== undefined) { fields.push('DESCRIPCION = ?'); values.push(descripcion); }
    if (fechaInicio !== undefined) { fields.push('FECHA_INICIO = ?'); values.push(fechaInicio); }
    if (fechaFin !== undefined) { fields.push('FECHA_FIN = ?'); values.push(fechaFin); }
    if (estado !== undefined) { fields.push('ESTADO = ?'); values.push(estado); }

    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    values.push(req.params.id, req.userId);
    await pool.query(
      `UPDATE META SET ${fields.join(', ')} WHERE ID_META = ? AND FK_ID_USUARIO = ?`,
      values
    );

    const updated = await Meta.findById(req.params.id, req.userId);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/metas/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Meta.delete(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json({ message: 'Meta eliminada' });
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
