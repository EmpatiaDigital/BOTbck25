const mongoose = require('mongoose');

const ServicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: String },
  imagenUrl: { type: String }, // puede ser URL o una imagen subida que se guarda como URL después
}, {
  timestamps: true
});

module.exports = mongoose.model('Servicio', ServicioSchema);
