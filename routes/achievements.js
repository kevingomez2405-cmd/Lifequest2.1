const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const { pool } = require('../config/db');

// GET /api/achievements
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.findByUser(req.userId);
    const result = achievements.map(a => ({
      id: a.ID_LOGRO_CATALOGO,
      nombre: a.NOMBRE,
      descripcion: a.DESCRIPCION,
      tipoCondicion: a.TIPO_CONDICION,
      valorCondicion: a.VALOR_CONDICION,
      unlocked: a.FECHA_DESBLOQUEO !== null,
      fechaDesbloqueo: a.FECHA_DESBLOQUEO
    }));
    res.json(result);
  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/achievements/check
router.post('/check', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const unlockedAchievements = [];

    const catalog = await Achievement.findCatalog();

    const [user] = await pool.query(
      'SELECT u.*, n.NOMBRE_NIVEL FROM USUARIO u JOIN NIVEL n ON u.FK_ID_NIVEL = n.ID_NIVEL WHERE u.ID_USUARIO = ?',
      [userId]
    );
    if (!user[0]) return res.json({ unlocked: [] });
    const userData = user[0];

    const [completedMissions] = await pool.query(
      'SELECT COUNT(*) as count FROM PROGRESO WHERE FK_ID_USUARIO = ? AND ESTADO = \'COMPLETADA\'',
      [userId]
    );
    const totalMissions = completedMissions[0].count;

    const [streakRow] = await pool.query(
      'SELECT MAX(ACTUAL) as max_streak FROM RACHA WHERE FK_ID_USUARIO = ?',
      [userId]
    );
    const maxStreak = streakRow[0].max_streak || 0;

    const [habitCount] = await pool.query(
      'SELECT COUNT(*) as count FROM HABITO_REGISTRO hr JOIN HABITO h ON hr.FK_ID_HABITO = h.ID_HABITO WHERE h.FK_ID_USUARIO = ? AND hr.COMPLETADO = TRUE',
      [userId]
    );
    const totalHabitsCompleted = habitCount[0].count;

    for (const ach of catalog) {
      const isAlreadyUnlocked = await Achievement.isUnlocked(userId, ach.ID_LOGRO_CATALOGO);
      if (isAlreadyUnlocked) continue;

      let conditionMet = false;

      switch (ach.TIPO_CONDICION) {
        case 'MISIONES':
          conditionMet = totalMissions >= ach.VALOR_CONDICION;
          break;
        case 'NIVEL':
          conditionMet = userData.FK_ID_NIVEL >= ach.VALOR_CONDICION;
          break;
        case 'RACHA':
          conditionMet = maxStreak >= ach.VALOR_CONDICION;
          break;
        case 'MONEDAS':
          conditionMet = userData.MONEDAS >= ach.VALOR_CONDICION;
          break;
        case 'HABITOS':
          conditionMet = totalHabitsCompleted >= ach.VALOR_CONDICION;
          break;
        case 'VIDEOJUEGOS':
          const [gamingSessions] = await pool.query(
            'SELECT COUNT(*) as count FROM USUARIO_VIDEOJUEGO WHERE FK_ID_USUARIO = ? AND VINCULADO = TRUE',
            [userId]
          );
          conditionMet = gamingSessions[0].count >= ach.VALOR_CONDICION;
          break;
      }

      if (conditionMet) {
        const wasNew = await Achievement.unlock(userId, ach.ID_LOGRO_CATALOGO);
        if (wasNew) {
          unlockedAchievements.push({
            id: ach.ID_LOGRO_CATALOGO,
            nombre: ach.NOMBRE,
            descripcion: ach.DESCRIPCION
          });
        }
      }
    }

    res.json({ unlocked: unlockedAchievements });
  } catch (error) {
    console.error('Error al verificar logros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/achievements/:id/unlock
router.put('/:id/unlock', auth, async (req, res) => {
  try {
    const catalogId = parseInt(req.params.id);
    const unlocked = await Achievement.unlock(req.userId, catalogId);
    if (unlocked) {
      res.json({ message: 'Logro desbloqueado', unlocked: true });
    } else {
      res.json({ message: 'Logro ya estaba desbloqueado', unlocked: false });
    }
  } catch (error) {
    console.error('Error al desbloquear logro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
