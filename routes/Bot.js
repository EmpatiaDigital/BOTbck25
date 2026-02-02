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

let client = null;
let qrCodeBase64 = "";
let isInitialized = false;

const usuariosUnicos = new Set();
const estadoUsuarios = new Map();
const inactividadTimers = new Map();

/* ─────────────────────────────── */
/* 🔒 Utilidades seguras           */
/* ─────────────────────────────── */

async function safeDestroyClient() {
  if (!client) return;
  try {
    await client.destroy();
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn("⚠️ Archivo de sesión no encontrado, se ignora.");
    } else {
      console.error("❌ Error destruyendo cliente:", err);
    }
  }
  client = null;
}

/* ─────────────────────────────── */
/* 🤖 Inicializar Bot              */
/* ─────────────────────────────── */

const connectBot = async () => {
  if (isInitialized) {
    console.log("⏩ Bot ya inicializado. Saltando...");
    return;
  }

  // 🔗 MongoDB
  await mongoose.connect(
    "mongodb+srv://devprueba2025:devprueba2025@cluster0.9x8yltr.mongodb.net/wwebjs?retryWrites=true&w=majority&appName=Cluster0"
  );
  console.log("🟢 Conectado a MongoDB");

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "gabot-session-local" }),
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

  /* ───────────── Eventos WhatsApp ───────────── */

  client.on("qr", async (qr) => {
    qrCodeBase64 = await qrcode.toDataURL(qr);
    console.log("🔄 QR generado");
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp listo");
    qrCodeBase64 = "";
  });

  client.on("authenticated", () => {
    console.log("🔐 Autenticado correctamente");
  });

  client.on("auth_failure", () => {
    console.error("❌ Fallo de autenticación");
  });

client.on("disconnected", async (reason) => {
  console.warn("📴 WhatsApp desconectado:", reason);
  qrCodeBase64 = "";
  isInitialized = false;

  if (reason !== "logout") {
    console.log("🔄 Reconectando cliente...");
    await safeDestroyClient();
    await connectBot(); 
  }
});


  /* ───────────── Mensajes ───────────── */

  client.on("message", async (msg) => {
    const from = msg.from;
    const texto = (msg.body || "").trim();
    const lowerTexto = texto.toLowerCase();

    usuariosUnicos.add(from);

    /* ⏳ Manejo de inactividad */
    if (inactividadTimers.has(from)) {
      clearTimeout(inactividadTimers.get(from));
    }

    inactividadTimers.set(
      from,
      setTimeout(async () => {
        estadoUsuarios.delete(from);
        inactividadTimers.delete(from);
        try {
          await msg.reply(
            "⌛ Por inactividad la sesión fue cerrada. Escribí *Hola* para empezar de nuevo."
          );
        } catch {}
      }, 3 * 60 * 1000)
    );

    /* ───── Inicio conversación ───── */

    if (!estadoUsuarios.has(from)) {
      if (lowerTexto === "hola") {
        estadoUsuarios.set(from, { estado: "esperando_nombre" });
        return msg.reply(
          "Hola, soy *Gabot 🤖*.\n¿Cómo te llamás?"
        );
      }
      return msg.reply("Escribí *Hola* para comenzar.");
    }

    const usuario = estadoUsuarios.get(from);
    const estado = usuario.estado;
    const nombre = usuario.nombre || null;

    /* ───── Guardar nombre ───── */

    if (estado === "esperando_nombre") {
      if (texto.length < 25 && !texto.includes(" ")) {
        let existente = await Usuario.findOne({ whatsappId: from });

        if (!existente) {
          existente = await new Usuario({
            nombre: texto,
            whatsappId: from,
          }).save();
        }

        estadoUsuarios.set(from, { nombre: texto, estado: "inicio" });

        return msg.reply(
          `Gracias ${texto} 😊\n\n¿Qué deseás ver?\n1️⃣ Productos\n2️⃣ Servicios\n3️⃣ Lista\n4️⃣ Dirección\n5️⃣ Horarios\n6️⃣ Hablar con humano\n7️⃣ Terminar`
        );
      }

      return msg.reply("Escribí solo tu nombre (sin espacios).");
    }

    /* ───── Flujos ───── */

    if (estado === "productos") {
      return productosFlow.responder(client, msg, texto, from, estadoUsuarios);
    }

    switch (texto) {
      case "1":
        estadoUsuarios.set(from, { nombre, estado: "productos" });
        return productosFlow.iniciarFlujo(client, msg, nombre);
      case "2":
        return enviarServicios(client, msg, nombre);
      case "3":
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
        return msg.reply("Elegí una opción válida del 1 al 7.");
    }
  });

  await client.initialize();
  isInitialized = true;
};

/* ─────────────────────────────── */
/* 📤 Exports                      */
/* ─────────────────────────────── */

module.exports = {
  connectBot,
  getClient: () => client,
  getQr: () => qrCodeBase64,
  getUsuariosUnicos: () => usuariosUnicos,
};



