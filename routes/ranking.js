const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/ranking
router.get('/', auth, async (req, res) => {
  try {
    const ranking = await User.getRanking(20);
    const currentUser = await User.findById(req.userId);

    const formatted = ranking.map((u, index) => ({
      position: index + 1,
      id: u.ID_USUARIO,
      nombre: u.ID_USUARIO === currentUser.ID_USUARIO ? u.NOMBRE + ' (Tú)' : u.NOMBRE,
      apellido: u.APELLIDO,
      nivel: u.NOMBRE_NIVEL,
      xp: u.EXPERIENCIA_TOTAL,
      monedas: u.MONEDAS,
      foto: u.FOTO_PERFIL_URL,
      isCurrentUser: u.ID_USUARIO === currentUser.ID_USUARIO
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
