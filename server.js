require("dotenv").config();

const express = require("express");
const { MessagingResponse } = require("twilio").twiml;
const { clasificarTareas } = require("./classifier");
const {
  leerTareas,
  guardarTareas,
  completarTarea,
  limpiarTareas,
} = require("./storage");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── Emojis por materia ────────────────────────────────────────────────────────
const EMOJIS = {
  "cálculo": "📐",
  "física": "⚡",
  "electrónica": "🔌",
  "circuitos": "🔋",
  "comunicaciones": "📡",
  "estructuras": "🏗️",
  "programación": "💻",
  "álgebra": "🔢",
  "otras": "📚",
};

function emojiMateria(nombre) {
  const lower = nombre.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "📖";
}

// ── Formatear lista de tareas ─────────────────────────────────────────────────
function formatearTareas(materias) {
  if (!materias || Object.keys(materias).length === 0) {
    return "✅ No tienes tareas registradas.";
  }

  let texto = "📋 *Tus tareas clasificadas:*\n\n";
  let totalTareas = 0;

  for (const [materia, tareas] of Object.entries(materias)) {
    if (!tareas || tareas.length === 0) continue;

    const emoji = emojiMateria(materia);
    texto += `${emoji} *${materia}*\n`;

    tareas.forEach((tarea, i) => {
      const desc = typeof tarea === "object" ? tarea.texto : tarea;
      const done = typeof tarea === "object" && tarea.completada;
      texto += `  ${done ? "✅" : "⬜"} ${i + 1}. ${desc}\n`;
      if (!done) totalTareas++;
    });

    texto += "\n";
  }

  texto += `_Total pendientes: ${totalTareas} tarea(s)_`;
  return texto;
}

// ── Menú de ayuda ─────────────────────────────────────────────────────────────
const AYUDA = `🤖 *Bot Clasificador de Tareas*

Puedo ayudarte a organizar tus tareas por materia sin resolverlas.

*Comandos:*
• *ver* — Ver todas tus tareas
• *limpiar* — Borrar todas las tareas
• *ayuda* — Ver este menú

*Para agregar tareas:*
Solo escríbeme lo que tienes pendiente, por ejemplo:

_"Tengo que hacer los ejercicios del capítulo 3 de Cálculo, resolver el circuito RLC del libro de Hayt y estudiar el tema de modulación AM para el examen"_

¡Yo me encargo de clasificarlo! 📚`;

// ── Webhook principal ─────────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  const twiml = new MessagingResponse();
  const mensaje = (req.body.Body || "").trim();
  const userId = req.body.From || "default"; // número de WhatsApp del usuario

  console.log(`[${new Date().toISOString()}] Mensaje de ${userId}: "${mensaje}"`);

  let respuesta = "";
  const cmd = mensaje.toLowerCase();

  // ── Comandos ────────────────────────────────────────────────────────────────
  if (cmd === "ver" || cmd === "mis tareas" || cmd === "tareas") {
    const tareas = leerTareas(userId);
    respuesta = formatearTareas(tareas);

  } else if (cmd === "limpiar" || cmd === "borrar todo" || cmd === "clear") {
    limpiarTareas(userId);
    respuesta = "🗑️ Todas tus tareas han sido eliminadas.";

  } else if (cmd === "ayuda" || cmd === "help" || cmd === "hola" || cmd === "inicio") {
    respuesta = AYUDA;

  } else if (cmd.startsWith("listo ") || cmd.startsWith("completar ")) {
    // Formato: "listo Cálculo 2" → marca tarea 2 de Cálculo como completada
    const partes = mensaje.split(" ");
    const indice = parseInt(partes[partes.length - 1]) - 1;
    const materia = partes.slice(1, partes.length - 1).join(" ");
    const ok = completarTarea(userId, materia, indice);
    respuesta = ok
      ? `✅ Tarea marcada como completada en *${materia}*.`
      : `❌ No encontré esa tarea. Usa *ver* para revisar la lista.`;

  } else if (mensaje.length < 5) {
    respuesta = `No entendí eso. Escribe *ayuda* para ver los comandos disponibles.`;

  } else {
    // ── Clasificar con Gemini ──────────────────────────────────────────────────
    const resultado = await clasificarTareas(mensaje);

    if (!resultado || Object.keys(resultado.materias).length === 0) {
      respuesta =
        "🤔 No detecté tareas en tu mensaje. Intenta ser más específico, por ejemplo:\n\n" +
        "_\"Tengo ejercicios de Cálculo del capítulo 4 y un circuito de Electrónica\"_";
    } else {
      guardarTareas(userId, resultado.materias);

      let msg = `✅ *${resultado.resumen}*\n\n`;
      msg += "*Tareas agregadas:*\n\n";

      for (const [materia, tareas] of Object.entries(resultado.materias)) {
        const emoji = emojiMateria(materia);
        msg += `${emoji} *${materia}*\n`;
        tareas.forEach((t, i) => {
          msg += `  ⬜ ${i + 1}. ${t}\n`;
        });
        msg += "\n";
      }

      msg += "_Escribe *ver* para ver todas tus tareas acumuladas._";
      respuesta = msg;
    }
  }

  twiml.message(respuesta);
  res.type("text/xml").send(twiml.toString());
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "🟢 Bot activo",
    version: "1.0.0",
    webhook: "/webhook",
  });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🤖 Bot de tareas iniciado en puerto ${PORT}`);
    console.log(`📡 Webhook listo en: http://localhost:${PORT}/webhook`);
    console.log(`\nPara exponer al internet: npx ngrok http ${PORT}\n`);
  });
}

module.exports = { app, emojiMateria, formatearTareas };
