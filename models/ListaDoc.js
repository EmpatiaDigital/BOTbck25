const mongoose = require('mongoose');

const listaDocSchema = new mongoose.Schema({
  titulo: String,
  nombreArchivo: String,
  archivoBase64: String,
  mimetype: String,
  fechaSubida: Date,
});

module.exports = mongoose.model('ListaDoc', listaDocSchema);
