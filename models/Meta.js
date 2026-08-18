const { pool } = require('../config/db');

const Meta = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM META WHERE FK_ID_USUARIO = ? ORDER BY FECHA_INICIO DESC',
      [userId]
    );
    return rows;
  },

  async create({ userId, titulo, descripcion, fechaInicio, fechaFin }) {
    const [result] = await pool.query(
      'INSERT INTO META (TITULO_META, DESCRIPCION, FECHA_INICIO, FECHA_FIN, FK_ID_USUARIO) VALUES (?, ?, ?, ?, ?)',
      [titulo, descripcion || null, fechaInicio, fechaFin || null, userId]
    );
    return { id: result.insertId, titulo, fechaInicio };
  },

  async findById(id, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM META WHERE ID_META = ? AND FK_ID_USUARIO = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  async updateEstado(id, userId, estado) {
    await pool.query(
      'UPDATE META SET ESTADO = ? WHERE ID_META = ? AND FK_ID_USUARIO = ?',
      [estado, id, userId]
    );
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM META WHERE ID_META = ? AND FK_ID_USUARIO = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Meta;
