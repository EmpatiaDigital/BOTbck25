// Components/Lista.js

const mongoose = require('mongoose');

// Esquema provisorio si no tenés definido
const listaSchema = new mongoose.Schema({
  nombre: String,
  precio: Number
});

const Lista = mongoose.models.Lista || mongoose.model('Lista', listaSchema);

async function enviarLista(client, msg, nombre) {
  try {
    const productos = await Lista.find().limit(20); // Límite máximo de búsqueda

    if (!productos.length) {
      await msg.reply(`📭 No hay listas disponibles por ahora, ${nombre || 'usuario'}.\n\n¿Qué deseás hacer ahora?\n1️⃣ Volver al menú principal\n2️⃣ Terminar`);
      return;
    }

    const primeros10 = productos.slice(0, 10);
    let respuesta = `📋 *Lista de productos* para ${nombre || 'vos'}:\n\n`;

    primeros10.forEach((item, index) => {
      respuesta += `${index + 1}. ${item.nombre} - $${item.precio}\n`;
    });

    if (productos.length > 10) {
      respuesta += `\n🛎 El resto de los productos serán enviados por un admin.`;
    }

    respuesta += `\n\n¿Qué deseás hacer ahora?\n1️⃣ Volver al menú principal\n2️⃣ Terminar`;

    await msg.reply(respuesta);
    console.log(`✅ Lista enviada a ${msg.from}`);
  } catch (err) {
    console.error('❌ Error al consultar o enviar la lista:', err);
    await msg.reply('⚠️ Ocurrió un error al buscar la lista. Por favor intentá más tarde.');
  }
}

module.exports = { enviarLista }; 

 