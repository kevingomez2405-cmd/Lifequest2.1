const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Mascota = require('../models/Mascota');
const { pool } = require('../config/db');

// GET /api/mascota/catalog
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await Mascota.getCatalog();
    res.json(catalog);
  } catch (error) {
    console.error('Error al obtener catálogo mascotas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/mascota - mascotas del usuario
router.get('/', auth, async (req, res) => {
  try {
    const mascotas = await Mascota.findByUser(req.userId);
    res.json(mascotas);
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/mascota/favorite
router.get('/favorite', auth, async (req, res) => {
  try {
    const fav = await Mascota.findFavorite(req.userId);
    res.json(fav);
  } catch (error) {
    console.error('Error al obtener mascota favorita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/mascota/adopt
router.post('/adopt', auth, async (req, res) => {
  try {
    const { catalogoId, nombre } = req.body;
    if (!catalogoId || !nombre) {
      return res.status(400).json({ error: 'catalogoId y nombre son obligatorios' });
    }

    const [catalog] = await pool.query(
      'SELECT * FROM CATALOGO_MASCOTA WHERE ID_CATALOGO = ?',
      [catalogoId]
    );
    if (!catalog[0]) {
      return res.status(404).json({ error: 'Tipo de mascota no encontrado' });
    }

    const mascota = await Mascota.adopt(req.userId, catalogoId, nombre);
    await pool.query('UPDATE MASCOTA SET FAVORITA = FALSE WHERE FK_ID_USUARIO = ?', [req.userId]);
    await pool.query('UPDATE MASCOTA SET FAVORITA = TRUE WHERE ID_MASCOTA = ?', [mascota.id]);

    res.status(201).json(mascota);
  } catch (error) {
    console.error('Error al adoptar mascota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/mascota/:id/accessories
router.get('/:id/accessories', auth, async (req, res) => {
  try {
    const accessories = await Mascota.getAccessories(req.params.id);
    res.json(accessories);
  } catch (error) {
    console.error('Error al obtener accesorios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/mascota/:id/equip
router.post('/:id/equip', auth, async (req, res) => {
  try {
    const { accesorioId } = req.body;
    if (!accesorioId) return res.status(400).json({ error: 'accesorioId es obligatorio' });
    await Mascota.equipAccessory(req.params.id, accesorioId);
    res.json({ message: 'Accesorio equipado' });
  } catch (error) {
    console.error('Error al equipar accesorio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
