const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/evidences', require('./routes/evidences'));
app.use('/api/store', require('./routes/store'));
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/gaming', require('./routes/gaming'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/mascota', require('./routes/mascota'));
app.use('/api/habitos', require('./routes/habito'));
app.use('/api/metas', require('./routes/meta'));
app.use('/api/config', require('./routes/config'));
app.use('/api/upload', require('./routes/upload'));

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'LifeQuest API funcionando correctamente' });
});

// Iniciar servidor
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`LifeQuest server corriendo en http://localhost:${PORT}`);
    console.log(`Frontend disponible en http://localhost:${PORT}/index.html`);
  });
}

start();
