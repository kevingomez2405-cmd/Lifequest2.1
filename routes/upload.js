const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${req.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes y videos.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/upload/image
router.post('/image', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/upload/evidence
router.post('/evidence', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const { progresoId } = req.body;
    if (!progresoId) {
      return res.status(400).json({ error: 'progresoId es obligatorio' });
    }

    const { pool } = require('../config/db');
    const [progreso] = await pool.query(
      'SELECT ID_PROGRESO FROM PROGRESO WHERE ID_PROGRESO = ? AND FK_ID_USUARIO = ?',
      [progresoId, req.userId]
    );
    if (!progreso[0]) {
      return res.status(404).json({ error: 'Progreso no encontrado' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const [result] = await pool.query(
      'INSERT INTO EVIDENCIA (URL_FOTO, FK_ID_PROGRESO) VALUES (?, ?)',
      [fileUrl, progresoId]
    );

    res.status(201).json({
      id: result.insertId,
      url: fileUrl,
      estado: 'PENDIENTE'
    });
  } catch (error) {
    console.error('Error al subir evidencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/upload/profile-photo
router.post('/profile-photo', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const User = require('../models/User');
    await User.updateProfile(req.userId, { FOTO_PERFIL_URL: fileUrl });

    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir foto de perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
