const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Habito = require('../models/Habito');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

// GET /api/habitos
router.get('/', auth, async (req, res) => {
  try {
    const habitos = await Habito.findByUser(req.userId);
    res.json(habitos);
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/habitos/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Hábito no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener hábito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/habitos
router.post('/', auth, async (req, res) => {
  try {
    const { nombre, descripcion, frecuencia, objetivoCantidad } = req.body;
    if (!nombre || !frecuencia) {
      return res.status(400).json({ error: 'nombre y frecuencia son obligatorios' });
    }
    const habito = await Habito.create({
      userId: req.userId, nombre, descripcion, frecuencia, objetivoCantidad
    });
    res.status(201).json(habito);
  } catch (error) {
    console.error('Error al crear hábito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/habitos/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const [existing] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Hábito no encontrado' });

    const { nombre, descripcion, frecuencia, objetivoCantidad, estado } = req.body;
    const fields = [];
    const values = [];

    if (nombre !== undefined) { fields.push('NOMBRE = ?'); values.push(nombre); }
    if (descripcion !== undefined) { fields.push('DESCRIPCION = ?'); values.push(descripcion); }
    if (frecuencia !== undefined) { fields.push('FRECUENCIA = ?'); values.push(frecuencia); }
    if (objetivoCantidad !== undefined) { fields.push('OBJETIVO_CANTIDAD = ?'); values.push(objetivoCantidad); }
    if (estado !== undefined) { fields.push('ESTADO = ?'); values.push(estado); }

    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    values.push(req.params.id, req.userId);
    await require('../config/db').pool.query(
      `UPDATE HABITO SET ${fields.join(', ')} WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?`,
      values
    );

    const [updated] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ?', [req.params.id]
    );
    res.json(updated[0]);
  } catch (error) {
    console.error('Error al actualizar hábito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/habitos/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Hábito no encontrado' });

    await require('../config/db').pool.query(
      'DELETE FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    res.json({ message: 'Hábito eliminado' });
  } catch (error) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/habitos/:id/complete
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { observacion } = req.body;

    const [habito] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    if (!habito[0]) return res.status(404).json({ error: 'Hábito no encontrado' });

    await Habito.registerCompletion(req.params.id, true, observacion);

    const xp = 15;
    const coins = 5;
    const user = await User.findById(req.userId);
    const newXp = (user.EXPERIENCIA_TOTAL || 0) + xp;
    const newCoins = (user.MONEDAS || 0) + coins;

    const [nivel] = await require('../config/db').pool.query(
      'SELECT ID_NIVEL FROM NIVEL WHERE EXPERIENCIA_REQUERIDA <= ? ORDER BY EXPERIENCIA_REQUERIDA DESC LIMIT 1',
      [newXp]
    );
    const newLevelId = nivel[0] ? nivel[0].ID_NIVEL : user.FK_ID_NIVEL;

    await User.updateProfile(req.userId, {
      EXPERIENCIA_TOTAL: newXp,
      MONEDAS: newCoins,
      FK_ID_NIVEL: newLevelId
    });

    await Achievement.unlock(req.userId, 6);

    res.json({
      message: 'Hábito registrado',
      xpGanado: xp,
      monedasGanadas: coins,
      levelUp: newLevelId > user.FK_ID_NIVEL
    });
  } catch (error) {
    console.error('Error al registrar hábito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/habitos/:id/records
router.get('/:id/records', auth, async (req, res) => {
  try {
    const [habito] = await require('../config/db').pool.query(
      'SELECT * FROM HABITO WHERE ID_HABITO = ? AND FK_ID_USUARIO = ?',
      [req.params.id, req.userId]
    );
    if (!habito[0]) return res.status(404).json({ error: 'Hábito no encontrado' });

    const records = await Habito.getRecords(req.params.id);
    res.json(records);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
