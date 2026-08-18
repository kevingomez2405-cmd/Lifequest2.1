const { pool } = require('../config/db');

const StoreItem = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM ITEM_TIENDA WHERE DISPONIBLE = TRUE'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM ITEM_TIENDA WHERE ID_ITEM = ? AND DISPONIBLE = TRUE',
      [id]
    );
    return rows[0] || null;
  },

  async buy(userId, item) {
    const [result] = await pool.query(
      `INSERT INTO COMPRA (FK_ID_USUARIO, FK_ID_ITEM, CANTIDAD, PRECIO_UNITARIO, PRECIO_TOTAL, ESTADO)
       VALUES (?, ?, 1, ?, ?, 'COMPLETADA')`,
      [userId, item.ID_ITEM, item.PRECIO, item.PRECIO]
    );
    await pool.query(
      'UPDATE USUARIO SET MONEDAS = MONEDAS - ? WHERE ID_USUARIO = ?',
      [item.PRECIO, userId]
    );
    return { id: result.insertId };
  },

  async getPurchases(userId) {
    const [rows] = await pool.query(
      `SELECT c.*, it.NOMBRE, it.TIPO, it.IMAGEN
       FROM COMPRA c
       JOIN ITEM_TIENDA it ON c.FK_ID_ITEM = it.ID_ITEM
       WHERE c.FK_ID_USUARIO = ?
       ORDER BY c.FECHA_COMPRA DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = StoreItem;
