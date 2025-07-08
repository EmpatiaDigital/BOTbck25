const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");

const { derivarConHumano } = require("./Componentes/Humano");
const { productosFlow } = require("./Componentes/Productos");
const { enviarDireccion } = require("./Componentes/Direccion");
const { enviarHorario } = require("./Componentes/Horario");
const { enviarLista } = require("./Componentes/Lista");
const { enviarServicios } = require("./Componentes/Servicios");
const {
  iniciarTerminar,
  procesarRespuesta,
} = require("./Componentes/Terminar");

let client;
let qrCodeBase64 = "";
const usuariosUnicos = new Set();
let isInitialized = false;
const estadoUsuarios = new Map();
const inactividadTimers = new Map();

async function safeDestroyClient() {
  if (!client) return;
  try {
    await client.destroy();
  } catch (error) {
    if (error.code === "ENOENT" && error.syscall === "unlink") {
      console.warn(`⚠️ Archivo de sesión no encontrado para borrar: ${error.path}. Se ignora el error.`);
    } else {
      console.error("❌ Error destruyendo cliente:", error);
    }
  }
}

const connectBot = async () => {
  if (isInitialized) {
    console.log("⏩ El cliente ya fue inicializado. Saltando...");
    return;
  }

  await mongoose.connect(
    "mongodb+srv://devprueba2025:devprueba2025@cluster0.9x8yltr.mongodb.net/wwebjs?retryWrites=true&w=majority&appName=Cluster0"
  );
  console.log("🟢 Conectado exitosamente a MongoDB");

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "gabot-session-local",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", async (qr) => {
    qrCodeBase64 = await qrcode.toDataURL(qr);
    console.log("🔄 Nuevo QR generado.");
  });

  client.on("ready", () => {
    console.log("✅ Cliente de WhatsApp listo.");
  });

  client.on("authenticated", () => {
    console.log("🔐 Cliente autenticado.");
    qrCodeBase64 = "";
  });

  client.on("auth_failure", () => {
    console.error("❌ Fallo de autenticación");
  });

  client.on("disconnected", async (reason) => {
    console.warn("📴 Cliente desconectado:", reason);
    qrCodeBase64 = "";

    if (reason !== "logout") {
      try {
        console.log("🔄 Reintentando conexión automática...");
        await safeDestroyClient();
        await client.initialize();
      } catch (err) {
        console.error("❌ Error al reconectar:", err);
      }
    }
  });

  client.on("message", async (msg) => {
    const from = msg.from;
    const texto = (msg.body || "").trim();
    const lowerTexto = texto.toLowerCase();
    const isGroup = msg.from.endsWith("@g.us");
    const mentionsBot = msg.mentionedIds?.includes("543413559239@c.us");
    const diceBeSmart = lowerTexto.includes("be smart");
    const esAudio = msg.hasAudio;
    const esMultimedia = msg.type === "image" || msg.type === "audio" || msg.type === "video";

    usuariosUnicos.add(from);

    const iniciarFlujo = async () => {
      estadoUsuarios.set(from, { estado: "esperando_nombre" });
      await msg.reply("Hola, soy *Gabot 🤖*. ¿Cómo puedo ayudarte?");

      // ⏳ Timer de inactividad
      if (inactividadTimers.has(from)) clearTimeout(inactividadTimers.get(from));
      inactividadTimers.set(
        from,
        setTimeout(async () => {
          console.log(`⌛ Usuario ${from} inactivo 3 min. Cerrando sesión...`);
          estadoUsuarios.delete(from);
          inactividadTimers.delete(from);
          try {
            await msg.reply("⌛ Por inactividad la sesión fue cerrada. Podés escribir *Hola* para volver a empezar.");
          } catch (e) {}
        }, 3 * 60 * 1000)
      );
    };

    // ✅ Caso 1: GRUPO solo responde si dice "be smart" o manda audio o lo mencionan
    if (isGroup) {
      if (diceBeSmart || esAudio || mentionsBot || lowerTexto.includes("bot para grupo")) {
        return iniciarFlujo();
      } else {
        return; // No hace nada si no se cumplen condiciones
      }
    }

    // ✅ Caso 2: PRIVADO - RESPONDE A UN STATUS (imagen, audio, video)
    if (esMultimedia && !isGroup) {
      if (msg.hasQuotedMsg) {
        const quoted = await msg.getQuotedMessage();
        if (quoted.fromMe && quoted.type === "status") {
          return iniciarFlujo();
        }
      }
    }

    // ✅ Caso 3: FLUJO NORMAL EN PRIVADO
    if (inactividadTimers.has(from)) clearTimeout(inactividadTimers.get(from));
    inactividadTimers.set(
      from,
      setTimeout(async () => {
        console.log(`⌛ Usuario ${from} inactivo 3 min. Cerrando sesión...`);
        estadoUsuarios.delete(from);
        inactividadTimers.delete(from);
        try {
          await msg.reply("⌛ Por inactividad la sesión fue cerrada. Podés escribir *Hola* para volver a empezar.");
        } catch (e) {}
      }, 3 * 60 * 1000)
    );

    if (!estadoUsuarios.has(from)) {
      if (lowerTexto === "hola") {
        estadoUsuarios.set(from, { estado: "esperando_nombre" });
        return msg.reply(
          "Hola, soy *Gabot 🤖*, un gusto saludarte.\nPara poder ayudarte mejor, necesito saber ¿cómo te llamás?"
        );
      } else {
        return msg.reply("Por favor escribí *Hola* para comenzar la conversación.");
      }
    }

    const usuario = estadoUsuarios.get(from);
    let nombre = usuario.nombre || null;
    let estado = usuario.estado || null;

    if (estado === "esperando_nombre") {
      if (texto.length < 25 && !texto.includes(" ")) {
        try {
          const usuarioExistente = await Usuario.findOne({ whatsappId: from });
          const fechaStr = usuarioExistente
            ? usuarioExistente.fecha.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : null;

          if (usuarioExistente) {
            estadoUsuarios.set(from, {
              nombre: texto,
              estado: "inicio",
              nombreAnterior: usuarioExistente.nombre,
              fechaRegistro: fechaStr,
            });

            return msg.reply(
              `Puede ser que ya me escribiste como *${usuarioExistente.nombre}* el ${fechaStr}.\nPero esta vez te registraste como *${texto}*.\n¿Qué deseás ver?\n1️⃣ Productos\n2️⃣ Servicios\n3️⃣ Lista\n4️⃣ Dirección\n5️⃣ Horarios\n6️⃣ Hablar con humano\n7️⃣ Terminar`
            );
          } else {
            const nuevoUsuario = new Usuario({
              nombre: texto,
              whatsappId: from,
            });
            await nuevoUsuario.save();
            estadoUsuarios.set(from, { nombre: texto, estado: "inicio" });
            return msg.reply(
              `Gracias ${texto} 😊. ¿Qué deseás ver?\n1️⃣ Productos\n2️⃣ Servicios\n3️⃣ Lista\n4️⃣ Dirección\n5️⃣ Horarios\n6️⃣ Hablar con humano\n7️⃣ Terminar`
            );
          }
        } catch (error) {
          console.warn("❌ Error buscando o guardando usuario en DB:", error);
          return msg.reply("Ocurrió un error guardando tu nombre. Intentalo más tarde.");
        }
      } else {
        return msg.reply("Necesito saber tu nombre para ayudarte. Por favor escribí tu nombre sin espacios ni símbolos.");
      }
    }

    if (estado === "pregunta_guardar_nombre" || estado === "confirmar_reconocido") {
      return procesarRespuesta(client, msg, texto, from, estadoUsuarios, inactividadTimers);
    }

    if (estado === "despues_lista") {
      if (texto === "1") {
        estadoUsuarios.set(from, { nombre, estado: "inicio" });
        return msg.reply(
          `¿Qué deseás ver?\n1️⃣ Productos\n2️⃣ Servicios\n3️⃣ Lista\n4️⃣ Dirección\n5️⃣ Horarios\n6️⃣ Hablar con humano\n7️⃣ Terminar`
        );
      } else if (texto === "2") {
        estadoUsuarios.delete(from);
        clearTimeout(inactividadTimers.get(from));
        inactividadTimers.delete(from);
        await msg.reply("👋 ¡Gracias por comunicarte con Gabot! Hasta pronto.");
        return;
      } else {
        return msg.reply("Elegí una opción válida:\n1️⃣ Menú principal\n2️⃣ Terminar");
      }
    }

    if (estado === "despues_servicios") {
      if (texto === "1") {
        estadoUsuarios.set(from, { nombre, estado: "inicio" });
        return msg.reply(
          `¿Qué deseás ver?\n1️⃣ Productos\n2️⃣ Servicios\n3️⃣ Lista\n4️⃣ Dirección\n5️⃣ Horarios\n6️⃣ Hablar con humano\n7️⃣ Terminar`
        );
      } else if (texto === "2") {
        estadoUsuarios.delete(from);
        clearTimeout(inactividadTimers.get(from));
        inactividadTimers.delete(from);
        await msg.reply("👋 ¡Gracias por comunicarte con Gabot! Hasta pronto.");
        return;
      } else {
        return msg.reply("Elegí una opción válida:\n1️⃣ Menú principal\n2️⃣ Terminar");
      }
    }

    if (estado === "productos") {
      return productosFlow.responder(client, msg, texto, from, estadoUsuarios);
    }

    switch (texto) {
      case "1":
        estadoUsuarios.set(from, { nombre, estado: "productos" });
        return productosFlow.iniciarFlujo(client, msg, nombre);
      case "2":
        estadoUsuarios.set(from, { nombre, estado: "despues_servicios" });
        return enviarServicios(client, msg, nombre);
      case "3":
        estadoUsuarios.set(from, { nombre, estado: "despues_lista" });
        return enviarLista(client, msg, nombre);
      case "4":
        return enviarDireccion(client, msg, nombre);
      case "5":
        return enviarHorario(client, msg, nombre);
      case "6":
        return derivarConHumano(client, msg, nombre);
      case "7":
        return iniciarTerminar(client, msg, nombre, from, estadoUsuarios);
      default:
        return msg.reply("Por favor elegí una opción válida del 1 al 7.");
    }
  });

  try {
    await client.initialize();
  } catch (error) {
    if (error.code === "ENOENT" && error.syscall === "unlink") {
      console.warn(`⚠️ Archivo de sesión no encontrado para borrar: ${error.path}. Se ignora el error.`);
    } else {
      console.error("❌ Error inicializando cliente:", error);
    }
  }

  isInitialized = true;

  setInterval(() => {
    if (client) {
      client
        .getState()
        .then((state) => console.log(`📶 Estado actual del cliente: ${state}`))
        .catch((err) => console.warn("⚠️ Error en el ping del cliente:", err));
    }
  }, 55000);
};

module.exports = {
  connectBot,
  getClient: () => client,
  getQr: () => qrCodeBase64,
  getUsuariosUnicos: () => usuariosUnicos,
};
