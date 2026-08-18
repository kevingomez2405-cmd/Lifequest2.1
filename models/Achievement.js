const { pool } = require('../config/db');

const Achievement = {
  async findCatalog() {
    const [rows] = await pool.query('SELECT * FROM LOGRO_CATALOGO');
    return rows;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT lc.*, l.FECHA_DESBLOQUEO, l.MOSTRADO
       FROM LOGRO_CATALOGO lc
       LEFT JOIN LOGROS l ON lc.ID_LOGRO_CATALOGO = l.FK_ID_LOGRO_CATALOGO AND l.FK_ID_USUARIO = ?
       ORDER BY lc.ID_LOGRO_CATALOGO`,
      [userId]
    );
    return rows;
  },

  async isUnlocked(userId, catalogId) {
    const [rows] = await pool.query(
      'SELECT ID_LOGRO FROM LOGROS WHERE FK_ID_USUARIO = ? AND FK_ID_LOGRO_CATALOGO = ?',
      [userId, catalogId]
    );
    return rows.length > 0;
  },

  async unlock(userId, catalogId) {
    const exists = await this.isUnlocked(userId, catalogId);
    if (exists) return false;

    await pool.query(
      'INSERT INTO LOGROS (FK_ID_USUARIO, FK_ID_LOGRO_CATALOGO) VALUES (?, ?)',
      [userId, catalogId]
    );
    return true;
  }
};

module.exports = Achievement;
