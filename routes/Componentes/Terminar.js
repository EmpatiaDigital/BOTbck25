const Usuario = require('../../models/Usuario');
const { buscarUsuarioPorNombre } = require('./Consulto');

async function iniciarTerminar(client, msg, nombre, from, estadoUsuarios) {
  // Buscamos si existe usuario parecido
  const usuarioEncontrado = await buscarUsuarioPorNombre(nombre);

  if (usuarioEncontrado) {
    const fechaStr = usuarioEncontrado.fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    await msg.reply(
      `Estas son las opciones:\n1️⃣ Guardar nombre\n2️⃣ Terminar sin guardar`
    );
    estadoUsuarios.set(from, { nombre, estado: 'pregunta_guardar_nombre' });
  } else {
    // No hay usuario parecido, simplemente pregunta
    await msg.reply(
      `¿Querés que recuerde tu nombre para la próxima vez?\n1️⃣ Sí, guardalo\n2️⃣ No, prefiero que no`
    );
    estadoUsuarios.set(from, { nombre, estado: 'pregunta_guardar_nombre' });
  }
}

async function procesarRespuesta(client, msg, texto, from, estadoUsuarios, inactividadTimers) {
  const usuario = estadoUsuarios.get(from);
  if (!usuario) return;

  const { nombre, estado } = usuario;

  if (estado === 'pregunta_guardar_nombre') {
    if (texto === '1') {
      try {
        await Usuario.findOneAndUpdate(
          { whatsappId: from },
          { nombre, whatsappId: from, fecha: new Date() },
          { upsert: true }
        );
        await msg.reply(`✅ Perfecto, ${nombre}. Guardé tu nombre para la próxima vez. ¡Gracias por usar Gabot!`);
      } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        await msg.reply('Hubo un error al guardar tus datos, pero igual gracias por usar Gabot.');
      }
    } else if (texto === '2') {
      await msg.reply(`👌 Entendido, no guardaré tus datos. ¡Gracias por usar Gabot!`);
    } else {
      return msg.reply('Por favor respondé con 1 para *Guardar* o 2 para *No guardar*.');
    }

    // Limpio estado y timer de inactividad para este usuario
    estadoUsuarios.delete(from);
    if (inactividadTimers.has(from)) {
      clearTimeout(inactividadTimers.get(from));
      inactividadTimers.delete(from);
    }
  }
}

module.exports = {
  iniciarTerminar,
  procesarRespuesta
};
