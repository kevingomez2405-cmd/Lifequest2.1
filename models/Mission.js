const { pool } = require('../config/db');

const Mission = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, p.ESTADO AS estado_progreso, p.PORCENTAJE, p.INTENTOS, p.ID_PROGRESO,
              pm.NOMBRE AS nombre_plantilla, pm.TIPO AS tipo_plantilla
       FROM MISIONES m
       JOIN PROGRESO p ON p.FK_ID_MISION = m.ID_MISION AND p.FK_ID_USUARIO = ?
       JOIN PLANTILLA_MISION pm ON m.FK_ID_PLANTILLA = pm.ID_PLANTILLA
       ORDER BY m.FECHA_CREACION DESC`,
      [userId]
    );
    return rows;
  },

  async findActiveByUser(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, p.ESTADO AS estado_progreso, p.PORCENTAJE,
              pm.NOMBRE AS nombre_plantilla, pm.TIPO AS tipo_plantilla
       FROM MISIONES m
       JOIN PROGRESO p ON p.FK_ID_MISION = m.ID_MISION AND p.FK_ID_USUARIO = ?
       JOIN PLANTILLA_MISION pm ON m.FK_ID_PLANTILLA = pm.ID_PLANTILLA
       WHERE p.ESTADO IN ('PENDIENTE', 'EN_PROGRESO')
       ORDER BY m.FECHA_CREACION DESC`,
      [userId]
    );
  },

  async findCompletedByUser(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, p.ESTADO AS estado_progreso, p.PORCENTAJE,
              pm.NOMBRE AS nombre_plantilla, pm.TIPO AS tipo_plantilla
       FROM MISIONES m
       JOIN PROGRESO p ON p.FK_ID_MISION = m.ID_MISION AND p.FK_ID_USUARIO = ?
       JOIN PLANTILLA_MISION pm ON m.FK_ID_PLANTILLA = pm.ID_PLANTILLA
       WHERE p.ESTADO = 'COMPLETADA'
       ORDER BY p.FECHA_FINALIZACION DESC`,
      [userId]
    );
  },

  async findById(id, userId) {
    const [rows] = await pool.query(
      `SELECT m.*, p.ESTADO AS estado_progreso, p.PORCENTAJE, p.ID_PROGRESO
       FROM MISIONES m
       JOIN PROGRESO p ON p.FK_ID_MISION = m.ID_MISION AND p.FK_ID_USUARIO = ?
       WHERE m.ID_MISION = ?`,
      [userId, id]
    );
    return rows[0] || null;
  },

  async create({ userId, nombre, descripcion, dificultad, metaId, plantillaId, adminId }) {
    const xpMap = { FACIL: 20, MEDIA: 50, DIFICIL: 100 };
    const exp = xpMap[dificultad] || 20;

    const [result] = await pool.query(
      `INSERT INTO MISIONES (NOMBRE_MISION, DESCRIPCION, DIFICULTAD, EXP_OTORGADA, MONEDAS_OTORGADAS, FECHA_CREACION, FK_ID_META, FK_ID_PLANTILLA, FK_ID_ADMINISTRADOR)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [nombre, descripcion, dificultad, exp, Math.floor(exp / 2), metaId, plantillaId, adminId]
    );

    await pool.query(
      'INSERT INTO PROGRESO (FK_ID_USUARIO, FK_ID_MISION) VALUES (?, ?)',
      [userId, result.insertId]
    );

    return { id: result.insertId, nombre, dificultad, exp };
  },

  async complete(id, userId) {
    await pool.query(
      `UPDATE PROGRESO SET ESTADO = 'COMPLETADA', PORCENTAJE = 100.00, FECHA_FINALIZACION = NOW()
       WHERE FK_ID_MISION = ? AND FK_ID_USUARIO = ?`,
      [id, userId]
    );
    await pool.query(
      `UPDATE MISIONES SET ESTADO = 'COMPLETADA' WHERE ID_MISION = ?`,
      [id]
    );
  },

  async countCompleted(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM PROGRESO
       WHERE FK_ID_USUARIO = ? AND ESTADO = 'COMPLETADA'`,
      [userId]
    );
    return rows[0].count;
  },

  async delete(id, userId) {
    await pool.query(
      'DELETE FROM PROGRESO WHERE FK_ID_MISION = ? AND FK_ID_USUARIO = ?',
      [id, userId]
    );
    const [result] = await pool.query(
      'DELETE FROM MISIONES WHERE ID_MISION = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Mission;
