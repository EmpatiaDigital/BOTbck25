const express = require('express');
const router = express.Router();
const ListaDoc = require('../models/ListaDoc');

// POST /api/lista/upload
router.post('/upload', async (req, res) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILES:', req.files);

    if (!req.files || !req.files.archivo) {
      return res.status(400).json({ error: 'No se subió archivo' });
    }

    const archivo = req.files.archivo;
    const nombreArchivo = Buffer.from(archivo.name, 'latin1').toString('utf8');

    // Convertir a base64
    const archivoBase64 = archivo.data.toString('base64');
    

    if (!archivoBase64 || archivoBase64.trim() === '') {
      return res.status(400).json({ error: 'Archivo vacío' });
    }

    const nuevoDoc = new ListaDoc({
      titulo: req.body.titulo || '',
      nombreArchivo,
      archivoBase64,
      mimetype: archivo.mimetype,
      fechaSubida: new Date(),
    });

    await nuevoDoc.save();

    res.json({
      message: 'Documento subido correctamente',
      id: nuevoDoc._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/lista
router.get('/', async (req, res) => {
  try {
    const listas = await ListaDoc.find().sort({ fechaSubida: -1 });
    res.json(listas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener listas' });
  }
});

// DELETE /api/lista/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await ListaDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });

    await ListaDoc.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// GET /api/lista/archivo/:id
router.get('/archivo/:id', async (req, res) => {
  try {
    const doc = await ListaDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Archivo no encontrado' });

    res.json({
      base64: doc.archivoBase64,
      mimetype: doc.mimetype,
      nombre: doc.nombreArchivo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener archivo' });
  }
});

module.exports = router;
