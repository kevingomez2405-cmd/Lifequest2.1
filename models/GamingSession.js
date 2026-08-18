const { pool } = require('../config/db');

const GamingSession = {
  async findActive(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM USUARIO_VIDEOJUEGO
       WHERE FK_ID_USUARIO = ? AND VINCULADO = TRUE
       ORDER BY FECHA_VINCULACION DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async link(userId, videojuegoId, usuarioJuego) {
    const [result] = await pool.query(
      `INSERT INTO USUARIO_VIDEOJUEGO (USUARIO_JUEGO, FK_ID_USUARIO, FK_ID_VIDEOJUEGO)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE VINCULADO = TRUE, ULTIMA_SINCRONIZACION = NOW()`,
      [usuarioJuego, userId, videojuegoId]
    );
    return { id: result.insertId };
  },

  async unlink(userId, videojuegoId) {
    await pool.query(
      'UPDATE USUARIO_VIDEOJUEGO SET VINCULADO = FALSE WHERE FK_ID_USUARIO = ? AND FK_ID_VIDEOJUEGO = ?',
      [userId, videojuegoId]
    );
  },

  async getMissionsByGame(videojuegoId) {
    const [rows] = await pool.query(
      'SELECT * FROM MISION_VIDEOJUEGO WHERE FK_ID_VIDEOJUEGO = ? AND ACTIVA = TRUE',
      [videojuegoId]
    );
    return rows;
  },

  async getStats(userId) {
    const [rows] = await pool.query(
      `SELECT r.ACTUAL AS actual, r.MAXIMA AS maxima, r.ULTIMA_FECHA
       FROM RACHA r
       WHERE r.FK_ID_USUARIO = ? AND r.TIPO = 'VIDEOJUEGOS'`,
      [userId]
    );
    return rows[0] || { actual: 0, maxima: 0, ultima_fecha: null };
  },

  async updateStreak(userId) {
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await pool.query(
      'SELECT * FROM RACHA WHERE FK_ID_USUARIO = ? AND TIPO = ?',
      [userId, 'VIDEOJUEGOS']
    );

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO RACHA (TIPO, ACTUAL, MAXIMA, ULTIMA_FECHA, FK_ID_USUARIO) VALUES (?, 1, 1, ?, ?)',
        ['VIDEOJUEGOS', today, userId]
      );
    } else {
      const last = new Date(existing[0].ULTIMA_FECHA);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const newActual = existing[0].ACTUAL + 1;
        const newMax = Math.max(newActual, existing[0].MAXIMA);
        await pool.query(
          'UPDATE RACHA SET ACTUAL = ?, MAXIMA = ?, ULTIMA_FECHA = ? WHERE ID_RACHA = ?',
          [newActual, newMax, today, existing[0].ID_RACHA]
        );
      } else if (diffDays > 1) {
        await pool.query(
          'UPDATE RACHA SET ACTUAL = 1, ULTIMA_FECHA = ? WHERE ID_RACHA = ?',
          [today, existing[0].ID_RACHA]
        );
      }
    }
  }
};

module.exports = GamingSession;
