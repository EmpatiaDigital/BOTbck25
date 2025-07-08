const express = require('express');
const router = express.Router();
const Servicio = require('../models/Servicios');

// Crear nuevo servicio
router.post('/servicio', async (req, res) => {
const { nombre, descripcion, precio, imagenUrl } = req.body;

if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

try {
  const servicio = new Servicio({ nombre, descripcion, precio, imagenUrl });
  await servicio.save();
  res.status(201).json(servicio);
} catch (err) {
  res.status(500).json({ error: 'Error al guardar servicio' });
}
});

// Obtener todos los servicios
router.get('/servicio', async (req, res) => {
try {
  const servicios = await Servicio.find();
  res.json(servicios);
} catch (err) {
  res.status(500).json({ error: 'Error al obtener servicios' });
}
});

// Actualizar servicio
router.put('/servicio/:id', async (req, res) => {
try {
  const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(servicio);
} catch (err) {
  res.status(500).json({ error: 'Error al actualizar' });
}
});

// Eliminar servicio
router.delete('/servicio/:id', async (req, res) => {
try {
  await Servicio.findByIdAndDelete(req.params.id);
  res.json({ message: 'Servicio eliminado' });
} catch (err) {
  res.status(500).json({ error: 'Error al eliminar' });
}
});




module.exports = router;
