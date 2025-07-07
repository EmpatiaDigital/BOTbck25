const express = require('express');
const router = express.Router();
const Direccion = require('../models/Direccion');

// Obtener dirección (único registro)
router.get('/direccion', async (req, res) => {
  try {
    const direccion = await Direccion.findOne();
    res.json(direccion || null);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching direccion' });
  }
});

// Actualizar dirección (crear si no existe)
router.post('/direccion', async (req, res) => {
  try {
    const { calle, horario, web } = req.body;

    let direccion = await Direccion.findOne();

    if (!direccion) {
      direccion = new Direccion({ calle, horario, web });
    } else {
      direccion.calle = calle;
      direccion.horario = horario;
      direccion.web = web;
    }

    await direccion.save();

    res.json({ success: true, direccion });
  } catch (err) {
    res.status(500).json({ error: 'Error saving direccion' });
  }
});

module.exports = router;
