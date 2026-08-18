const { pool } = require('../config/db');

const Habito = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM HABITO WHERE FK_ID_USUARIO = ? ORDER BY FECHA_CREACION DESC',
      [userId]
    );
    return rows;
  },

  async create({ userId, nombre, descripcion, frecuencia, objetivoCantidad }) {
    const [result] = await pool.query(
      'INSERT INTO HABITO (NOMBRE, DESCRIPCION, FRECUENCIA, OBJETIVO_CANTIDAD, FK_ID_USUARIO) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion || null, frecuencia, objetivoCantidad || null, userId]
    );
    return { id: result.insertId, nombre, frecuencia };
  },

  async registerCompletion(habitoId, completado, observacion) {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO HABITO_REGISTRO (FK_ID_HABITO, FECHA, COMPLETADO, OBSERVACION)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE COMPLETADO = ?, OBSERVACION = ?`,
      [habitoId, today, completado, observacion || null, completado, observacion || null]
    );
  },

  async getRecords(habitoId) {
    const [rows] = await pool.query(
      'SELECT * FROM HABITO_REGISTRO WHERE FK_ID_HABITO = ? ORDER BY FECHA DESC',
      [habitoId]
    );
    return rows;
  },

  async getStreak(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM RACHA WHERE FK_ID_USUARIO = ? AND TIPO = ?',
      [userId, 'HABITOS']
    );
    return rows[0] || { actual: 0, maxima: 0 };
  }
};

module.exports = Habito;
