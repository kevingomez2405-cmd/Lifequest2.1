const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StoreItem = require('../models/StoreItem');
const User = require('../models/User');

// GET /api/store
router.get('/', async (req, res) => {
  try {
    const items = await StoreItem.findAll();
    res.json(items);
  } catch (error) {
    console.error('Error al obtener tienda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/store/buy/:id
router.post('/buy/:id', auth, async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    const user = await User.findById(req.userId);
    if (user.MONEDAS < item.PRECIO) {
      return res.status(400).json({ error: 'No tienes suficientes monedas' });
    }

    await StoreItem.buy(req.userId, item);

    const updatedUser = await User.findById(req.userId);
    res.json({ message: `Compraste ${item.NOMBRE}`, user: updatedUser });
  } catch (error) {
    console.error('Error al comprar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/store/purchases
router.get('/purchases', auth, async (req, res) => {
  try {
    const purchases = await StoreItem.getPurchases(req.userId);
    res.json(purchases);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
