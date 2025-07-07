const Direccion = require("../../models/Direccion"); // Asegurate que esta ruta sea correcta

async function enviarDireccion(client, msg, nombre) {
  const saludo = nombre ? `Hola ${nombre} 😊.` : 'Hola 😊.';

  try {
    const datos = await Direccion.findOne(); // Busca la primera dirección registrada
    let mensaje;

    if (!datos) {
      mensaje = `${saludo} Estamos atendiendo. ¡Gracias por comunicarte!`;
    } else {
      const calle = datos.calle || null;
      const horario = datos.horario || null;
      const web = datos.web || null;

      if (calle && horario && web) {
        mensaje = `${saludo}\nEstamos en *${calle}* en el horario de *${horario}*.\nNuestra web es 🌐 ${web}`;
      } else if (calle && horario) {
        mensaje = `${saludo}\nEstamos en *${calle}* en el horario de *${horario}*.\nPor el momento no tenemos sitio web disponible.`;
      } else {
        mensaje = `${saludo} Estamos atendiendo. ¡Gracias por comunicarte!`;
      }
    }

    await msg.reply(mensaje);
    console.log(`📍 Dirección enviada a ${msg.from}`);
  } catch (error) {
    console.error('❌ Error al enviar la dirección:', error);
    await msg.reply("⚠️ Hubo un problema al obtener la dirección. Intentalo más tarde.");
  }
}

module.exports = { enviarDireccion };
