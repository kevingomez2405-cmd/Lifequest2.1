const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GamingSession = require('../models/GamingSession');
const User = require('../models/User');
const { pool } = require('../config/db');

// GET /api/gaming/games
router.get('/games', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM VIDEOJUEGO');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener videojuegos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/gaming/link
router.post('/link', auth, async (req, res) => {
  try {
    const { videojuegoId, usuarioJuego } = req.body;
    if (!videojuegoId || !usuarioJuego) {
      return res.status(400).json({ error: 'videojuegoId y usuarioJuego son obligatorios' });
    }
    await GamingSession.link(req.userId, videojuegoId, usuarioJuego);
    res.json({ message: 'Vinculado correctamente' });
  } catch (error) {
    console.error('Error al vincular juego:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/gaming/linked
router.get('/linked', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT uv.*, v.NOMBRE AS nombre_juego, v.PLATAFORMA, v.ICONO
       FROM USUARIO_VIDEOJUEGO uv
       JOIN VIDEOJUEGO v ON uv.FK_ID_VIDEOJUEGO = v.ID_VIDEOJUEGO
       WHERE uv.FK_ID_USUARIO = ? AND uv.VINCULADO = TRUE`,
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener juegos vinculados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/gaming/missions/:gameId
router.get('/missions/:gameId', async (req, res) => {
  try {
    const missions = await GamingSession.getMissionsByGame(req.params.gameId);
    res.json(missions);
  } catch (error) {
    console.error('Error al obtener misiones gaming:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/gaming/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await GamingSession.getStats(req.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener stats gaming:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/gaming/session-log
router.post('/session-log', auth, async (req, res) => {
  try {
    const { minutos } = req.body;
    if (!minutos || minutos <= 0) {
      return res.status(400).json({ error: 'minutos es obligatorio y debe ser > 0' });
    }

    const xp = Math.floor(minutos / 15) * 20;
    const coins = Math.floor(minutos / 15) * 10;

    if (xp > 0 || coins > 0) {
      const user = await User.findById(req.userId);
      await User.updateProfile(req.userId, {
        EXPERIENCIA_TOTAL: user.EXPERIENCIA_TOTAL + xp,
        MONEDAS: user.MONEDAS + coins
      });
    }

    await GamingSession.updateStreak(req.userId);

    res.json({ minutos, xpGanado: xp, monedasGanadas: coins });
  } catch (error) {
    console.error('Error al registrar sesión gaming:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
