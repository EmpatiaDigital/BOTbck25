// models/Usuario.js
const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  whatsappId: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
