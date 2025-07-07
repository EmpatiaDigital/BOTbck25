const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Listar productos
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().limit(10).lean();
    // Normalizar el _id a id para que el frontend lo entienda
    const normalized = products.map(p => ({ ...p, id: p._id }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/products - Crear producto
router.post('/products', async (req, res) => {
  try {
    const { name, price, discount = 0, quantity = 0, imageUrl = '' } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'Faltan datos obligatorios' });

    const newProduct = new Product({ name, price, discount, quantity, imageUrl });
    const saved = await newProduct.save();
    res.status(201).json({ ...saved.toObject(), id: saved._id }); // devolvemos también el "id"
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, discount = 0, quantity = 0, imageUrl = '' } = req.body;

    if (!name || price == null) return res.status(400).json({ error: 'Faltan datos obligatorios' });

    const updated = await Product.findByIdAndUpdate(
      id,
      { name, price, discount, quantity, imageUrl },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id - Borrar producto
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto borrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al borrar producto' });
  }
});

module.exports = router;
