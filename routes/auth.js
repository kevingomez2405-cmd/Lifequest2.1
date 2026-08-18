const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pool } = require('../config/db');

const resetCodes = {};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }

    const [nivelRows] = await pool.query('SELECT ID_NIVEL FROM NIVEL ORDER BY EXPERIENCIA_REQUERIDA ASC LIMIT 1');
    const nivelId = nivelRows[0] ? nivelRows[0].ID_NIVEL : 1;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, apellido, email, password: hashedPassword, nivelId });

    await pool.query('INSERT INTO CONFIGURACION (FK_ID_USUARIO) VALUES (?)', [user.id]);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(201).json({ token, user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email } });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const validPassword = await bcrypt.compare(password, user.CONTRASENA);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user.ID_USUARIO }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user.ID_USUARIO, nombre: user.NOMBRE, apellido: user.APELLIDO,
        email: user.CORREO, nivel: user.FK_ID_NIVEL, xp: user.EXPERIENCIA_TOTAL,
        monedas: user.MONEDAS, foto: user.FOTO_PERFIL_URL
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email es obligatorio' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.json({ message: 'Si el correo existe, recibirás un código de verificación' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email] = { code, expires: Date.now() + 15 * 60 * 1000 };

    console.log(`[RESET] Código para ${email}: ${code}`);

    res.json({ message: 'Código de verificación enviado', code });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son obligatorios' });
    }

    const stored = resetCodes[email];
    if (!stored) {
      return res.status(400).json({ error: 'Código no solicitado' });
    }

    if (Date.now() > stored.expires) {
      delete resetCodes[email];
      return res.status(400).json({ error: 'Código expirado. Solicita uno nuevo' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    const resetToken = jwt.sign({ email, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ message: 'Código verificado', resetToken });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const user = await User.findByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE USUARIO SET CONTRASENA = ? WHERE ID_USUARIO = ?',
      [hashedPassword, user.ID_USUARIO]
    );

    delete resetCodes[decoded.email];

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/change-password (authenticated)
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.CONTRASENA);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE USUARIO SET CONTRASENA = ? WHERE ID_USUARIO = ?',
      [hashedPassword, user.ID_USUARIO]
    );

    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
