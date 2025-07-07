const Servicio = require('../../models/Servicios'); // Modelo mongoose para servicios (asegurate de tenerlo)

async function enviarServicios(client, msg, nombre) {
  try {
    const servicios = await Servicio.find().limit(10); // Trae hasta 10 servicios

    if (!servicios.length) {
      await msg.reply(
        `Hola ${nombre}, por ahora *no hay servicios adheridos*.\n\n` +
        `1️⃣ Volver al menú principal\n2️⃣ Terminar`
      );
      return;
    }

    let texto = `Hola ${nombre}, estos son algunos de nuestros servicios:\n\n`;

    servicios.forEach((servicio, i) => {
      texto += `${i + 1}. ${servicio.nombre}\n`;
    });

    texto += `\n1️⃣ Volver al menú principal\n2️⃣ Terminar`;

    await msg.reply(texto);

  } catch (error) {
    console.error('Error al traer servicios:', error);
    await msg.reply('Hubo un error al obtener los servicios. Por favor, intentá más tarde.');
  }
}

module.exports = { enviarServicios };
