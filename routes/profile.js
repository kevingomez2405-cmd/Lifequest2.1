const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../config/db');

// GET /api/profile - obtener perfil completo
router.get('/', auth, async (req, res) => {
  try {
    const [perfil] = await pool.query(
      'SELECT * FROM PERFIL_USUARIO WHERE FK_ID_USUARIO = ?',
      [req.userId]
    );
    res.json(perfil[0] || null);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/profile - crear o actualizar perfil (onboarding)
router.post('/', auth, async (req, res) => {
  try {
    const { edad, peso, altura, objetivo, nivelFisico, tiempoDisponible, condicionFisica } = req.body;

    const [existing] = await pool.query(
      'SELECT ID_PERFIL FROM PERFIL_USUARIO WHERE FK_ID_USUARIO = ?',
      [req.userId]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE PERFIL_USUARIO SET EDAD=?, PESO=?, ALTURA=?, OBJETIVO=?, NIVEL_FISICO=?, TIEMPO_DISPONIBLE=?, CONDICION_FISICA=?
         WHERE FK_ID_USUARIO = ?`,
        [edad, peso, altura, objetivo, nivelFisico, tiempoDisponible, condicionFisica || null, req.userId]
      );
    } else {
      await pool.query(
        `INSERT INTO PERFIL_USUARIO (EDAD, PESO, ALTURA, OBJETIVO, NIVEL_FISICO, TIEMPO_DISPONIBLE, CONDICION_FISICA, FK_ID_USUARIO)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [edad, peso, altura, objetivo, nivelFisico, tiempoDisponible, condicionFisica || null, req.userId]
      );
    }

    res.json({ message: 'Perfil actualizado' });
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
