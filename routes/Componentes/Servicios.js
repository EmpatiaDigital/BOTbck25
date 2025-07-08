const Servicio = require('../../models/Servicios');
const Direccion = require('../../models/Direccion');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

function generarSlug(texto) {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function enviarServicios(client, msg, nombre) {
  try {
    const servicios = await Servicio.find().limit(10);
    const direccion = await Direccion.findOne();


    if (!servicios.length) {
      await msg.reply(
        `Hola ${nombre}, por ahora *no hay servicios adheridos*.\n\n` +
        `1️⃣ Volver al menú principal\n2️⃣ Terminar`
      );
      return;
    }

    const imagePath = path.join(__dirname, '../assets/luz.jpg');
    const fallbackImageBuffer = fs.existsSync(imagePath)
      ? fs.readFileSync(imagePath)
      : null;

    for (const servicio of servicios) {
      if (!servicio.slug) {
        servicio.slug = generarSlug(servicio.nombre);
        await servicio.save();
      }

      const url = `${direccion.web}`;

      let texto = `*${servicio.nombre}*`;
      if (servicio.descripcion) texto += `\n📄 ${servicio.descripcion}`;
      if (servicio.precio) texto += `\n💰 ${servicio.precio}`;
      texto += `\n🔗 ${url}`;

      let media = null;

      // Si tiene URL externa de imagen
      if (servicio.imagenUrl) {
        try {
          if (servicio.imagenUrl.startsWith('data:')) {
            // Es base64
            const matches = servicio.imagenUrl.match(/^data:(.+);base64,(.*)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              media = new MessageMedia(mimeType, base64Data, 'servicio.' + mimeType.split('/')[1]);
            }
          } else if (servicio.imagenUrl.startsWith('http')) {
            // Es URL normal
            media = await MessageMedia.fromUrl(servicio.imagenUrl);
          }
        } catch (err) {
          console.warn('❌ No se pudo procesar imagenUrl, uso fallback');
        }
      }
      

      // Si no hay media válida, usar imagen local
      if (!media && fallbackImageBuffer) {
        media = new MessageMedia(
          'image/jpeg',
          fallbackImageBuffer.toString('base64'),
          'luz.jpg'
        );
      }

      if (media) {
        await client.sendMessage(msg.from, media, { caption: texto });
      } else {
        await client.sendMessage(msg.from, texto);
      }
    }

    await client.sendMessage(
      msg.from,
      `\n1️⃣ Volver al menú principal\n2️⃣ Terminar`
    );
  } catch (error) {
    console.error('❌ Error al enviar servicios:', error);
    await msg.reply('Hubo un error al obtener los servicios. Intentá más tarde.');
  }
}

module.exports = { enviarServicios };
