const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  // Podés relacionarlo con un usuario u otra entidad
  nombre: { type: String },  // opcional
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Avatar', avatarSchema);
