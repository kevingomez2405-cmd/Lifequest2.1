const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Evidence = require('../models/Evidence');
const Mission = require('../models/Mission');
const { pool } = require('../config/db');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const updated = await User.updateProfile(req.userId, req.body);
    if (!updated) return res.status(400).json({ error: 'No hay campos para actualizar' });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const completedMissions = await Mission.countCompleted(req.userId);
    const totalEvidences = await Evidence.countByUser(req.userId);

    let streak = 0;
    try {
      const [rachaRows] = await pool.query(
        `SELECT MAX(ACTUAL) as max_streak FROM RACHA WHERE FK_ID_USUARIO = ?`,
        [req.userId]
      );
      streak = rachaRows[0] ? rachaRows[0].max_streak || 0 : 0;
    } catch (e) {}

    res.json({
      nivel: user.NOMBRE_NIVEL,
      xp: user.EXPERIENCIA_TOTAL,
      monedas: user.MONEDAS,
      misionesCompletadas: completedMissions,
      evidenciasTotales: totalEvidences,
      racha: streak
    });
  } catch (error) {
    console.error('Error al obtener stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
