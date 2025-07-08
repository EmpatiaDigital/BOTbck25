const express = require('express');
const router = express.Router();
const Avatar = require('../models/Avatar');
const path = require('path');
const fs = require('fs');

// Guardar avatar
router.post('/avatar', async (req, res) => {
  if (!req.files || !req.files.avatar) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const avatarFile = req.files.avatar;

  // Crear la carpeta si no existe
  const uploadPath = path.join(__dirname, '../uploads/avatars');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const fileName = `avatar_${Date.now()}${path.extname(avatarFile.name)}`;
  const savePath = path.join(uploadPath, fileName);

  // Mover el archivo
  avatarFile.mv(savePath, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar archivo' });
    }

    const url = `/uploads/avatars/${fileName}`;
    const avatar = new Avatar({ url });
    await avatar.save();

    res.status(201).json({ message: 'Avatar guardado', avatar });
  });
});

router.get('/avatar', async (req, res) => {
    try {
      const avatars = await Avatar.find(); // Busca todos los avatares en la BD
      res.json(avatars);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener avatares' });
    }
  });

module.exports = router;
