// Components/Humano.js

const ADMIN_NUMBER = '543462529718@c.us'; // Número del admin (formato WhatsApp)

async function derivarConHumano(client, msg, nombre) {
  if (!nombre) {
    return msg.reply('Necesito tu nombre para poder contactarte con un humano. ¿Cómo te llamás?');
  }

  // Aviso al usuario
  await msg.reply(`✅ Ya le enviamos un mensaje al admin. En breve te va a responder, ${nombre}.`);

  // Mensaje al administrador
  const mensajeAdmin = `📞 El usuario *${nombre}* quiere contactarse con vos.`;
  try {
    await client.sendMessage(ADMIN_NUMBER, mensajeAdmin);
    console.log(`📩 Aviso enviado al admin: ${mensajeAdmin}`);
  } catch (error) {
    console.error('❌ Error al enviar mensaje al admin:', error);
  }
}

module.exports = { derivarConHumano };
