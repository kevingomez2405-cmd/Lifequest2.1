const { pool } = require('../config/db');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM USUARIO WHERE CORREO = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.*, n.NOMBRE_NIVEL, n.EXPERIENCIA_REQUERIDA
       FROM USUARIO u
       JOIN NIVEL n ON u.FK_ID_NIVEL = n.ID_NIVEL
       WHERE u.ID_USUARIO = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ nombre, apellido, email, password, nivelId }) {
    const [result] = await pool.query(
      'INSERT INTO USUARIO (NOMBRE, APELLIDO, CORREO, CONTRASENA, FK_ID_NIVEL) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, password, nivelId]
    );
    return { id: result.insertId, nombre, apellido, email };
  },

  async updateProfile(id, data) {
    const fields = [];
    const values = [];
    const allowed = {
      NOMBRE: 'NOMBRE', APELLIDO: 'APELLIDO', EXPERIENCIA_TOTAL: 'EXPERIENCIA_TOTAL',
      MONEDAS: 'MONEDAS', ULTIMA_ACTIVIDAD: 'ULTIMA_ACTIVIDAD',
      FOTO_PERFIL_URL: 'FOTO_PERFIL_URL', FK_ID_NIVEL: 'FK_ID_NIVEL'
    };
    for (const [key, col] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    await pool.query(`UPDATE USUARIO SET ${fields.join(', ')} WHERE ID_USUARIO = ?`, values);
    return this.findById(id);
  },

  async updateXP(id, xp, coins) {
    await pool.query(
      'UPDATE USUARIO SET EXPERIENCIA_TOTAL = ?, MONEDAS = ? WHERE ID_USUARIO = ?',
      [xp, coins, id]
    );
  },

  async getRanking(limit = 20) {
    const [rows] = await pool.query(
      `SELECT u.ID_USUARIO, u.NOMBRE, u.APELLIDO, u.EXPERIENCIA_TOTAL, u.MONEDAS,
              n.NOMBRE_NIVEL, u.FOTO_PERFIL_URL
       FROM USUARIO u
       JOIN NIVEL n ON u.FK_ID_NIVEL = n.ID_NIVEL
       ORDER BY u.EXPERIENCIA_TOTAL DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
};

module.exports = User;
