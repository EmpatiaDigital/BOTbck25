const Product = require('../../models/Product');

const productosFlow = {
  iniciarFlujo: async (client, msg, nombre) => {
    await msg.reply(`Bienvenido/a *${nombre}* 👋 a la sección de productos.
¿Qué deseás hacer?
1️⃣ Ver productos
2️⃣ Ver ofertas
3️⃣ Volver al menú principal
4️⃣ Terminar`);
  },

  responder: async (client, msg, texto, from, estadoUsuarios) => {
    const nombre = estadoUsuarios.get(from)?.nombre;

    switch (texto) {
      case '1': {
        // Traer productos de la base
        const productos = await Product.find().limit(10).lean();

        if (productos.length === 0) {
          return msg.reply('No hay productos agregados todavía.');
        }

        // Armar listado con nombre, precio, y cantidad opcional
        let textoRespuesta = '📦 *Productos disponibles:*\n';
        productos.forEach((p, i) => {
          textoRespuesta += `${i + 1}. ${p.name} - $${p.price.toFixed(2)}`;
          if (p.quantity && p.quantity > 0) {
            textoRespuesta += ` (Cantidad: ${p.quantity})`;
          }
          textoRespuesta += '\n';
        });

        return msg.reply(textoRespuesta);
      }

      case '2': {
        // Productos con descuento > 0
        const ofertas = await Product.find({ discount: { $gt: 0 } }).limit(10).lean();

        if (ofertas.length === 0) {
          return msg.reply('No hay ofertas activas en este momento.');
        }

        let textoOfertas = '🔥 *Ofertas activas:*\n';
        ofertas.forEach((p, i) => {
          textoOfertas += `${i + 1}. ${p.name} - ${p.discount}% OFF - Precio: $${p.price.toFixed(2)}\n`;
        });

        return msg.reply(textoOfertas);
      }

      case '3':
        estadoUsuarios.set(from, { nombre, estado: 'inicio' });
        return msg.reply(`🔙 Volviste al menú principal, *${nombre}*.
¿Qué deseás ver?
1️⃣ Productos
2️⃣ Servicios
3️⃣ Lista
4️⃣ Dirección
5️⃣ Horarios
6️⃣ Hablar con humano
7️⃣ Terminar`);

      case '4':
        estadoUsuarios.delete(from);
        return msg.reply('👋 ¡Gracias por visitar la sección de productos!');

      default:
        return msg.reply('Elegí una opción válida (1, 2, 3 o 4).');
    }
  },
};

module.exports = { productosFlow };
