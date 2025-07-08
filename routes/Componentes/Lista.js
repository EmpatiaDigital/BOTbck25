const mongoose = require('mongoose');
const ListaDoc = require('../../models/ListaDoc');
const { MessageMedia } = require('whatsapp-web.js');

async function enviarLista(client, msg, nombre) {
  try {
    const documentos = await ListaDoc.find().limit(3);

    if (!documentos.length) {
      await msg.reply(`📭 No hay listas disponibles por ahora, ${nombre || 'usuario'}.\n\n¿Qué deseás hacer ahora?\n1️⃣ Volver al menú principal\n2️⃣ Terminar`);
      return;
    }

    for (const doc of documentos) {
      if (!doc.archivoBase64 || typeof doc.archivoBase64 !== 'string' || doc.archivoBase64.trim() === '') {
        console.error(`❌ Documento con _id ${doc._id} no tiene campo base64 válido.`);
        await msg.reply(`⚠️ No se pudo enviar el archivo *${doc.titulo || 'sin título'}*. Está incompleto.`);
        continue;
      }

      const mimetype = doc.mimetype || 'application/pdf';
      const extension =
        mimetype === 'application/pdf'
          ? 'pdf'
          : mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : 'bin';

      const filename = doc.nombreArchivo || `documento.${extension}`;

      const media = new MessageMedia(
        mimetype,
        doc.archivoBase64,
        filename
      );

      await client.sendMessage(msg.from, media, {
        sendMediaAsDocument: true,
        caption: `📄 *${doc.titulo || 'Documento'}* enviado para vos, ${nombre || 'usuario'}.`
      });

    }

    let texto = `✅ Te envié ${documentos.length} archivo(s), ${nombre || 'usuario'}.\n\n`;
    texto += `¿Qué deseás hacer ahora?\n1️⃣ Volver al menú principal\n2️⃣ Terminar`;

    await msg.reply(texto);

  } catch (error) {
    console.error('❌ Error al consultar o enviar documentos:', error);
    await msg.reply('⚠️ Ocurrió un error al buscar o enviar las listas. Intentá más tarde.');
  }
}

module.exports = { enviarLista };
