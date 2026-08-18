const { pool } = require('../config/db');

const Nivel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM NIVEL ORDER BY EXPERIENCIA_REQUERIDA ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM NIVEL WHERE ID_NIVEL = ?', [id]);
    return rows[0] || null;
  },

  async getLevelForXP(totalXP) {
    const [rows] = await pool.query(
      'SELECT * FROM NIVEL WHERE EXPERIENCIA_REQUERIDA <= ? ORDER BY EXPERIENCIA_REQUERIDA DESC LIMIT 1',
      [totalXP]
    );
    return rows[0] || null;
  },

  async getNextLevel(currentLevelId) {
    const [rows] = await pool.query(
      'SELECT * FROM NIVEL WHERE ID_NIVEL > ? ORDER BY ID_NIVEL ASC LIMIT 1',
      [currentLevelId]
    );
    return rows[0] || null;
  }
};

module.exports = Nivel;
