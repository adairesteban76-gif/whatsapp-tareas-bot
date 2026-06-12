const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "tareas.json");

// ── Inicializar archivo si no existe ──────────────────────────────────────────
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }
}

// ── Leer todas las tareas ─────────────────────────────────────────────────────
function leerTareas(userId) {
  initDB();
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  return data[userId] || {};
}

// ── Guardar tareas clasificadas por materia ───────────────────────────────────
function guardarTareas(userId, materiasNuevas) {
  initDB();
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  if (!data[userId]) data[userId] = {};

  for (const [materia, tareas] of Object.entries(materiasNuevas)) {
    if (!data[userId][materia]) data[userId][materia] = [];
    data[userId][materia].push(...tareas);
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data[userId];
}

// ── Marcar tarea como completada ──────────────────────────────────────────────
function completarTarea(userId, materia, indice) {
  initDB();
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  const mat = Object.keys(data[userId] || {}).find(
    (m) => m.toLowerCase() === materia.toLowerCase()
  );

  if (!mat || !data[userId][mat][indice]) return false;

  data[userId][mat][indice] = {
    texto: data[userId][mat][indice].texto || data[userId][mat][indice],
    completada: true,
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return true;
}

// ── Limpiar todas las tareas de un usuario ────────────────────────────────────
function limpiarTareas(userId) {
  initDB();
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  data[userId] = {};
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { leerTareas, guardarTareas, completarTarea, limpiarTareas };
