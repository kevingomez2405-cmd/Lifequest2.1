const { pool } = require('../config/db');

const Mascota = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, cm.NOMBRE AS nombre_catalogo, cm.DESCRIPCION AS desc_catalogo
       FROM MASCOTA m
       JOIN CATALOGO_MASCOTA cm ON m.FK_ID_CATALOGO = cm.ID_CATALOGO
       WHERE m.FK_ID_USUARIO = ?`,
      [userId]
    );
    return rows;
  },

  async findFavorite(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, cm.NOMBRE AS nombre_catalogo
       FROM MASCOTA m
       JOIN CATALOGO_MASCOTA cm ON m.FK_ID_CATALOGO = cm.ID_CATALOGO
       WHERE m.FK_ID_USUARIO = ? AND m.FAVORITA = TRUE
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async adopt(userId, catalogoId, nombre) {
    const [result] = await pool.query(
      'INSERT INTO MASCOTA (NOMBRE, FK_ID_USUARIO, FK_ID_CATALOGO) VALUES (?, ?, ?)',
      [nombre, userId, catalogoId]
    );
    return { id: result.insertId, nombre };
  },

  async getCatalog() {
    const [rows] = await pool.query('SELECT * FROM CATALOGO_MASCOTA');
    return rows;
  },

  async getAccessories(mascotaId) {
    const [rows] = await pool.query(
      `SELECT a.*, ma.EQUIPADO
       FROM MASCOTA_ACCESORIO ma
       JOIN ACCESORIOS a ON ma.FK_ID_ACCESORIO = a.ID_ACCESORIOS
       WHERE ma.FK_ID_MASCOTA = ?`,
      [mascotaId]
    );
    return rows;
  },

  async equipAccessory(mascotaId, accesorioId) {
    await pool.query(
      `INSERT INTO MASCOTA_ACCESORIO (FK_ID_MASCOTA, FK_ID_ACCESORIO)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE EQUIPADO = TRUE`,
      [mascotaId, accesorioId]
    );
  }
};

module.exports = Mascota;
