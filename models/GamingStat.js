const { pool } = require('../config/db');

const GamingStat = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM RACHA WHERE FK_ID_USUARIO = ?',
      [userId]
    );
    const stats = {};
    rows.forEach(r => {
      stats[r.TIPO] = { actual: r.ACTUAL, maxima: r.MAXIMA, ultimaFecha: r.ULTIMA_FECHA };
    });
    return stats;
  },

  async getOrCreate(userId, tipo) {
    const [rows] = await pool.query(
      'SELECT * FROM RACHA WHERE FK_ID_USUARIO = ? AND TIPO = ?',
      [userId, tipo]
    );
    if (rows.length > 0) return rows[0];

    const today = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      'INSERT INTO RACHA (TIPO, ACTUAL, MAXIMA, ULTIMA_FECHA, FK_ID_USUARIO) VALUES (?, 0, 0, ?, ?)',
      [tipo, today, userId]
    );
    return { ID_RACHA: result.insertId, TIPO: tipo, ACTUAL: 0, MAXIMA: 0 };
  }
};

module.exports = GamingStat;
