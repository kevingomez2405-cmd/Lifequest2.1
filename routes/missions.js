const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Mission = require('../models/Mission');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { pool } = require('../config/db');

// GET /api/missions
router.get('/', auth, async (req, res) => {
  try {
    const missions = await Mission.findByUser(req.userId);
    res.json(missions);
  } catch (error) {
    console.error('Error al obtener misiones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/missions/active
router.get('/active', auth, async (req, res) => {
  try {
    const missions = await Mission.findActiveByUser(req.userId);
    res.json(missions);
  } catch (error) {
    console.error('Error al obtener misiones activas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/missions/completed
router.get('/completed', auth, async (req, res) => {
  try {
    const missions = await Mission.findCompletedByUser(req.userId);
    res.json(missions);
  } catch (error) {
    console.error('Error al obtener misiones completadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/missions
router.post('/', auth, async (req, res) => {
  try {
    const { nombre, descripcion, dificultad, metaId, plantillaId, tipo } = req.body;

    if (!nombre || !descripcion || !dificultad) {
      return res.status(400).json({ error: 'Nombre, descripción y dificultad son obligatorios' });
    }

    const [adminRows] = await pool.query('SELECT ID_ADMINISTRADOR FROM ADMINISTRADOR LIMIT 1');
    const adminId = adminRows[0] ? adminRows[0].ID_ADMINISTRADOR : 1;

    let finalMetaId = metaId;
    if (!finalMetaId) {
      const [existingMeta] = await pool.query(
        'SELECT ID_META FROM META WHERE FK_ID_USUARIO = ? ORDER BY ID_META DESC LIMIT 1',
        [req.userId]
      );
      if (existingMeta[0]) {
        finalMetaId = existingMeta[0].ID_META;
      } else {
        const [newMeta] = await pool.query(
          'INSERT INTO META (TITULO_META, DESCRIPCION, FECHA_INICIO, FK_ID_USUARIO) VALUES (?, ?, CURDATE(), ?)',
          ['Mis Metas', 'Metas generales del usuario', req.userId]
        );
        finalMetaId = newMeta.insertId;
      }
    }

    let finalPlantillaId = plantillaId;
    if (!finalPlantillaId) {
      if (tipo) {
        const [usedPlantillas] = await pool.query(
          `SELECT pm.ID_PLANTILLA FROM PLANTILLA_MISION pm
           JOIN MISIONES m ON m.FK_ID_PLANTILLA = pm.ID_PLANTILLA
           JOIN PROGRESO p ON p.FK_ID_MISION = m.ID_MISION AND p.FK_ID_USUARIO = ?
           WHERE pm.TIPO = ? AND pm.ACTIVA = TRUE`,
          [req.userId, tipo]
        );
        const usedIds = usedPlantillas.map(p => p.ID_PLANTILLA);
        let query = 'SELECT ID_PLANTILLA FROM PLANTILLA_MISION WHERE TIPO = ? AND ACTIVA = TRUE';
        const params = [tipo];
        if (usedIds.length > 0) {
          query += ` AND ID_PLANTILLA NOT IN (${usedIds.map(() => '?').join(',')})`;
          params.push(...usedIds);
        }
        query += ' ORDER BY EXP_BASE ASC LIMIT 1';
        const [plantillaRows] = await pool.query(query, params);
        finalPlantillaId = plantillaRows[0] ? plantillaRows[0].ID_PLANTILLA : null;
      }

      if (!finalPlantillaId) {
        const [plantillaRows] = await pool.query('SELECT ID_PLANTILLA FROM PLANTILLA_MISION LIMIT 1');
        finalPlantillaId = plantillaRows[0] ? plantillaRows[0].ID_PLANTILLA : 1;
      }
    }

    const mission = await Mission.create({
      userId: req.userId, nombre, descripcion, dificultad,
      metaId: finalMetaId, plantillaId: finalPlantillaId, adminId
    });

    res.status(201).json(mission);
  } catch (error) {
    console.error('Error al crear misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/missions/:id/complete
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id, req.userId);
    if (!mission) return res.status(404).json({ error: 'Misión no encontrada' });
    if (mission.estado_progreso === 'COMPLETADA') {
      return res.status(400).json({ error: 'La misión ya está completada' });
    }

    const [evidence] = await pool.query(
      'SELECT ID_EVIDENCIA FROM EVIDENCIA WHERE FK_ID_PROGRESO = ?',
      [mission.ID_PROGRESO]
    );
    if (!evidence[0]) {
      return res.status(400).json({ error: 'Debes subir una evidencia antes de completar la misión' });
    }

    await Mission.complete(req.params.id, req.userId);

    const user = await User.findById(req.userId);
    const newXp = user.EXPERIENCIA_TOTAL + mission.EXP_OTORGADA;
    const newCoins = user.MONEDAS + mission.MONEDAS_OTORGADAS;

    const [nivel] = await pool.query(
      'SELECT ID_NIVEL FROM NIVEL WHERE EXPERIENCIA_REQUERIDA <= ? ORDER BY EXPERIENCIA_REQUERIDA DESC LIMIT 1',
      [newXp]
    );
    const newLevelId = nivel[0] ? nivel[0].ID_NIVEL : user.FK_ID_NIVEL;

    await User.updateProfile(req.userId, {
      EXPERIENCIA_TOTAL: newXp,
      MONEDAS: newCoins,
      FK_ID_NIVEL: newLevelId,
      ULTIMA_ACTIVIDAD: new Date().toISOString().split('T')[0]
    });

    const [currentPlantilla] = await pool.query(
      'SELECT TIPO, EXP_BASE FROM PLANTILLA_MISION WHERE ID_PLANTILLA = ?',
      [mission.FK_ID_PLANTILLA]
    );

    let nextMission = null;
    if (currentPlantilla[0]) {
      const tipo = currentPlantilla[0].TIPO;
      const currentExp = currentPlantilla[0].EXP_BASE;
      const [nextPlantilla] = await pool.query(
        `SELECT * FROM PLANTILLA_MISION
         WHERE TIPO = ? AND ACTIVA = TRUE AND EXP_BASE > ?
         ORDER BY EXP_BASE ASC LIMIT 1`,
        [tipo, currentExp]
      );

      if (nextPlantilla[0]) {
        const [adminRows] = await pool.query('SELECT ID_ADMINISTRADOR FROM ADMINISTRADOR LIMIT 1');
        const adminId = adminRows[0] ? adminRows[0].ID_ADMINISTRADOR : 1;
        const [metaRows] = await pool.query(
          'SELECT ID_META FROM META WHERE FK_ID_USUARIO = ? ORDER BY ID_META DESC LIMIT 1',
          [req.userId]
        );
        const metaId = metaRows[0] ? metaRows[0].ID_META : 1;

        const np = nextPlantilla[0];
        nextMission = await Mission.create({
          userId: req.userId,
          nombre: np.NOMBRE,
          descripcion: np.DESCRIPCION,
          dificultad: np.DIFICULTAD,
          metaId,
          plantillaId: np.ID_PLANTILLA,
          adminId
        });
      }
    }

    res.json({
      mission: await Mission.findById(req.params.id, req.userId),
      xpGanado: mission.EXP_OTORGADA,
      monedasGanadas: mission.MONEDAS_OTORGADAS,
      levelUp: newLevelId > user.FK_ID_NIVEL,
      nextMission: nextMission ? { id: nextMission.id, nombre: nextMission.nombre, exp: nextMission.exp } : null
    });
  } catch (error) {
    console.error('Error al completar misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/missions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Mission.delete(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Misión no encontrada' });
    res.json({ message: 'Misión eliminada' });
  } catch (error) {
    console.error('Error al eliminar misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
