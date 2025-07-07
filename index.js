// index.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Auto-ping interno para Render
const path = require('path');

const {
  connectBot,
  getClient,
  getQr,
  getUsuariosUnicos
} = require('./routes/Bot');

const app = express();
const PORT = process.env.PORT || 5000;
const direccionRoutes = require('./routes/direccion');
const productosRoutes = require('./routes/products');

app.use(cors());
app.use('/api', express.json(), direccionRoutes);
app.use('/api', express.json(), productosRoutes);

// 🔌 Iniciar el bot una sola vez (MongoDB + WhatsApp)
connectBot().catch(err => {
  console.error("❌ Error inicializando el bot:", err);
});

// 🌐 Endpoints API
app.get('/api/users', (req, res) => {
  res.json({ count: getUsuariosUnicos().size });
});

app.get('/api/qr', (req, res) => {
  const qr = getQr();
  if (qr) {
    res.json({ qr });
  } else {
    res.json({ message: '✅ Sesión activa o esperando conexión.' });
  }
});

app.get('/api/status', (req, res) => {
  const client = getClient();
  res.json({ status: client?.info ? 'activo' : 'no conectado' });
});

app.get('/api/logout', async (req, res) => {
  const client = getClient();
  try {
    if (client) {
      await client.logout();
      await client.destroy();
      console.log('🔒 Sesión cerrada desde el frontend.');
      res.json({ message: 'Sesión cerrada correctamente' });
    } else {
      res.status(400).json({ error: 'Cliente no iniciado' });
    }
  } catch (err) {
    console.error('❌ Error al cerrar sesión:', err);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// 🔁 Ruta para mantener vivo el bot (auto-ping para Render)
app.get('/api/ping', (req, res) => {
  res.send('🏓 Pong - Bot activo');
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);

  // 🔄 Auto-ping interno cada 5 minutos (evita suspensión en Render)
  setInterval(() => {
    const url = `http://localhost:${PORT}/api/ping`;
    fetch(url)
      .then(res => res.text())
      .then(txt => console.log(`🟢 Auto-ping: ${txt}`))
      .catch(err => console.warn('⚠️ Error en auto-ping:', err));
  }, 300000); // 5 minutos
});
