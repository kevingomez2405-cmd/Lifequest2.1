const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../config/db');

// GET /api/config
router.get('/', auth, async (req, res) => {
  try {
    const [config] = await pool.query(
      'SELECT * FROM CONFIGURACION WHERE FK_ID_USUARIO = ?',
      [req.userId]
    );
    res.json(config[0] || { IDIOMA: 'ESPAÑOL', TEMA: 'CLARO', NOTIFICACIONES: true });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/config
router.put('/', auth, async (req, res) => {
  try {
    const { idioma, tema, notificaciones } = req.body;
    const [existing] = await pool.query(
      'SELECT ID_CONFIGURACION FROM CONFIGURACION WHERE FK_ID_USUARIO = ?',
      [req.userId]
    );

    if (existing.length > 0) {
      const fields = [];
      const values = [];
      if (idioma !== undefined) { fields.push('IDIOMA = ?'); values.push(idioma); }
      if (tema !== undefined) { fields.push('TEMA = ?'); values.push(tema); }
      if (notificaciones !== undefined) { fields.push('NOTIFICACIONES = ?'); values.push(notificaciones); }

      if (fields.length > 0) {
        values.push(req.userId);
        await pool.query(
          `UPDATE CONFIGURACION SET ${fields.join(', ')} WHERE FK_ID_USUARIO = ?`,
          values
        );
      }
    } else {
      await pool.query(
        'INSERT INTO CONFIGURACION (IDIOMA, TEMA, NOTIFICACIONES, FK_ID_USUARIO) VALUES (?, ?, ?, ?)',
        [idioma || 'ESPAÑOL', tema || 'CLARO', notificaciones !== undefined ? notificaciones : true, req.userId]
      );
    }

    const [updated] = await pool.query(
      'SELECT * FROM CONFIGURACION WHERE FK_ID_USUARIO = ?',
      [req.userId]
    );
    res.json(updated[0]);
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
