const Direccion = require("../../models/Direccion"); // Asegurate que esta ruta sea correcta

async function enviarHorario(client, msg, nombre) {
  const saludo = nombre ? `Hola ${nombre} 😊.` : 'Hola 😊.';

  try {
    const datos = await Direccion.findOne();
    let mensaje;

    if (datos && datos.horario) {
      const horarioTexto = datos.horario;
      mensaje = `${saludo}\nNuestro horario de atención es de *${horarioTexto}*.`; // base

      // Extraer horas del string
      const regex = /(\d{1,2}):?(\d{0,2})?\s*a\s*(\d{1,2}):?(\d{0,2})?/i;
      const match = horarioTexto.match(regex);

      if (match) {
        const [ , hInicio, mInicio = "00", hFin, mFin = "00" ] = match;

        const ahora = new Date();
        const inicio = new Date();
        inicio.setHours(parseInt(hInicio), parseInt(mInicio), 0, 0);

        const fin = new Date();
        fin.setHours(parseInt(hFin), parseInt(mFin), 0, 0);

        const diferenciaInicio = (ahora - inicio) / 60000; // minutos desde que abrió
        const diferenciaFin = (fin - ahora) / 60000;       // minutos hasta que cierra

        if (diferenciaFin <= 30 && diferenciaFin > 0) {
          mensaje += `\n🕓 *Mirá que queda poco para cerrar.*`;
        }

        if (diferenciaInicio >= 0 && diferenciaInicio <= 30) {
          mensaje += `\n🆕 *Abrimos hace poquito, hace media hora.*`;
        }
      } else {
        console.warn("⚠️ No se pudo interpretar el formato de horario:", horarioTexto);
      }
    } else {
      mensaje = `${saludo} Ya estamos con vos. Disculpá, estamos atendiendo. Muchas gracias por tu paciencia 🙏.`;
    }

    await msg.reply(mensaje);
    console.log(`⏰ Horario enviado a ${msg.from}`);
  } catch (error) {
    console.error('❌ Error al enviar el horario:', error);
    await msg.reply("⚠️ Hubo un problema al obtener el horario. Intentalo más tarde.");
  }
}

module.exports = { enviarHorario };
