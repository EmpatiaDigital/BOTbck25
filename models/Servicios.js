// models/Servicio.js
const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String }
});

module.exports = mongoose.model('Servicios', servicioSchema);
