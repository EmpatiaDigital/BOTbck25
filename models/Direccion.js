const mongoose = require("mongoose");

const direccionSchema = new mongoose.Schema({
  calle: {
    type: String,
    required: false, // Puede estar vacío
  },
  horario: {
    type: String,
    required: false,
  },
  web: {
    type: String,
    required: false,
  },
}, {
  timestamps: true // Guarda createdAt y updatedAt automáticamente
});

module.exports = mongoose.model("Direccion", direccionSchema);
