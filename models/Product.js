const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // porcentaje 0 si no tiene
  quantity: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
});

module.exports = mongoose.model('Product', ProductSchema);
