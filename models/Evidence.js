const { pool } = require('../config/db');

const Evidence = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT e.*, m.NOMBRE_MISION
       FROM EVIDENCIA e
       JOIN PROGRESO p ON e.FK_ID_PROGRESO = p.ID_PROGRESO
       JOIN MISIONES m ON p.FK_ID_MISION = m.ID_MISION
       WHERE p.FK_ID_USUARIO = ?
       ORDER BY e.FECHA_ENVIO DESC`,
      [userId]
    );
    return rows;
  },

  async create({ userId, progresoId, urlFoto }) {
    const [result] = await pool.query(
      'INSERT INTO EVIDENCIA (URL_FOTO, FK_ID_PROGRESO) VALUES (?, ?)',
      [urlFoto, progresoId]
    );
    return { id: result.insertId, urlFoto, estado: 'PENDIENTE' };
  },

  async countByUser(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM EVIDENCIA e
       JOIN PROGRESO p ON e.FK_ID_PROGRESO = p.ID_PROGRESO
       WHERE p.FK_ID_USUARIO = ?`,
      [userId]
    );
    return rows[0].count;
  }
};

module.exports = Evidence;
