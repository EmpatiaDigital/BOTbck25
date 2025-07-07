// Componentes/consulto.js
const Usuario = require('../../models/Usuario');

// Busca nombre parecido y devuelve el usuario si lo encuentra, sino null
async function buscarUsuarioPorNombre(nombre) {
  // Busca usuarios con nombre parecido (case-insensitive, regex)
  const usuarios = await Usuario.find({
    nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
  }).limit(1);

  if (usuarios.length > 0) {
    return usuarios[0];
  }
  return null;
}

module.exports = {
  buscarUsuarioPorNombre
};
