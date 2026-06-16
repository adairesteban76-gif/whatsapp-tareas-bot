jest.mock("../classifier");
jest.mock("../storage");

const { clasificarTareas } = require("../classifier");
const { leerTareas, guardarTareas, completarTarea, limpiarTareas } = require("../storage");
const request = require("supertest");
const { app, emojiMateria, formatearTareas } = require("../server");

// Helper: POST to /webhook with Twilio-shaped body
const webhook = (body, from = "whatsapp:+521234567890") =>
  request(app)
    .post("/webhook")
    .type("form")
    .send({ Body: body, From: from });

// Helper: extract message text from TwiML XML
const twimlMessage = (text) => expect(text).toContain("</Message>");
const bodyContains = (res, str) => expect(res.text).toContain(str);

beforeEach(() => {
  jest.clearAllMocks();
  leerTareas.mockReturnValue({});
  guardarTareas.mockReturnValue({});
  completarTarea.mockReturnValue(true);
  limpiarTareas.mockImplementation(() => {});
});

// ── emojiMateria ──────────────────────────────────────────────────────────────

describe("emojiMateria", () => {
  const cases = [
    ["cálculo", "📐"],
    ["Cálculo", "📐"],
    ["física", "⚡"],
    ["electrónica", "🔌"],
    ["circuitos", "🔋"],
    ["comunicaciones", "📡"],
    ["estructuras", "🏗️"],
    ["programación", "💻"],
    ["álgebra", "🔢"],
    ["otras", "📚"],
  ];

  it.each(cases)("returns correct emoji for %s", (nombre, emoji) => {
    expect(emojiMateria(nombre)).toBe(emoji);
  });

  it("matches partial subject names (e.g. full course names)", () => {
    expect(emojiMateria("Cálculo en Varias Variables")).toBe("📐");
    expect(emojiMateria("Álgebra Lineal")).toBe("🔢");
    expect(emojiMateria("Circuitos Eléctricos")).toBe("🔋");
  });

  it("returns 📖 for unknown subjects", () => {
    expect(emojiMateria("Química")).toBe("📖");
    expect(emojiMateria("")).toBe("📖");
  });
});

// ── formatearTareas ───────────────────────────────────────────────────────────

describe("formatearTareas", () => {
  it("returns 'no tasks' message for null input", () => {
    expect(formatearTareas(null)).toBe("✅ No tienes tareas registradas.");
  });

  it("returns 'no tasks' message for empty object", () => {
    expect(formatearTareas({})).toBe("✅ No tienes tareas registradas.");
  });

  it("renders pending string tasks with ⬜", () => {
    const result = formatearTareas({ Cálculo: ["Ejercicio 1"] });
    expect(result).toContain("⬜");
    expect(result).toContain("Ejercicio 1");
  });

  it("renders completed object tasks with ✅", () => {
    const result = formatearTareas({ Cálculo: [{ texto: "Ejercicio 1", completada: true }] });
    expect(result).toContain("✅");
    expect(result).toContain("Ejercicio 1");
  });

  it("renders non-completed object tasks with ⬜", () => {
    const result = formatearTareas({ Cálculo: [{ texto: "Ejercicio 1", completada: false }] });
    expect(result).toContain("⬜");
  });

  it("counts only pending tasks in the total", () => {
    const materias = {
      Cálculo: [
        { texto: "Hecha", completada: true },
        "Pendiente",
      ],
    };
    const result = formatearTareas(materias);
    expect(result).toContain("Total pendientes: 1");
  });

  it("includes the subject emoji in output", () => {
    const result = formatearTareas({ Cálculo: ["T1"] });
    expect(result).toContain("📐");
  });

  it("skips subjects with empty task arrays", () => {
    const result = formatearTareas({ Cálculo: [], Física: ["T1"] });
    expect(result).not.toContain("📐");
    expect(result).toContain("⚡");
  });

  it("numbers tasks starting from 1", () => {
    const result = formatearTareas({ Cálculo: ["T1", "T2"] });
    expect(result).toContain("1. T1");
    expect(result).toContain("2. T2");
  });
});

// ── GET / ─────────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("returns health check JSON with status and webhook path", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.webhook).toBe("/webhook");
    expect(res.body.status).toBeDefined();
  });
});

// ── POST /webhook — view commands ─────────────────────────────────────────────

describe("POST /webhook — view commands", () => {
  beforeEach(() => {
    leerTareas.mockReturnValue({ Cálculo: ["Ejercicio 1"] });
  });

  it.each(["ver", "mis tareas", "tareas"])(
    'returns formatted task list for "%s"',
    async (cmd) => {
      const res = await webhook(cmd);
      expect(res.status).toBe(200);
      bodyContains(res, "Ejercicio 1");
      expect(leerTareas).toHaveBeenCalledWith("whatsapp:+521234567890");
    }
  );
});

// ── POST /webhook — clear commands ────────────────────────────────────────────

describe("POST /webhook — clear commands", () => {
  it.each(["limpiar", "borrar todo", "clear"])(
    'clears tasks and confirms for "%s"',
    async (cmd) => {
      const res = await webhook(cmd);
      expect(res.status).toBe(200);
      bodyContains(res, "eliminadas");
      expect(limpiarTareas).toHaveBeenCalledWith("whatsapp:+521234567890");
    }
  );
});

// ── POST /webhook — help commands ─────────────────────────────────────────────

describe("POST /webhook — help commands", () => {
  it.each(["ayuda", "help", "hola", "inicio"])(
    'returns help menu for "%s"',
    async (cmd) => {
      const res = await webhook(cmd);
      expect(res.status).toBe(200);
      bodyContains(res, "Bot Clasificador");
    }
  );
});

// ── POST /webhook — complete task commands ────────────────────────────────────

describe("POST /webhook — complete task commands", () => {
  it('marks task as done with "listo Materia #" and confirms', async () => {
    completarTarea.mockReturnValue(true);
    const res = await webhook("listo Cálculo 2");
    expect(res.status).toBe(200);
    bodyContains(res, "completada");
    expect(completarTarea).toHaveBeenCalledWith("whatsapp:+521234567890", "Cálculo", 1);
  });

  it('marks task as done with "completar Materia #" and confirms', async () => {
    completarTarea.mockReturnValue(true);
    const res = await webhook("completar Física 1");
    expect(res.status).toBe(200);
    bodyContains(res, "completada");
    expect(completarTarea).toHaveBeenCalledWith("whatsapp:+521234567890", "Física", 0);
  });

  it("returns not-found message when task does not exist", async () => {
    completarTarea.mockReturnValue(false);
    const res = await webhook("listo Cálculo 99");
    expect(res.status).toBe(200);
    bodyContains(res, "No encontré esa tarea");
  });

  it("handles multi-word subject names correctly", async () => {
    completarTarea.mockReturnValue(true);
    const res = await webhook("listo Circuitos Eléctricos 3");
    expect(completarTarea).toHaveBeenCalledWith(
      "whatsapp:+521234567890",
      "Circuitos Eléctricos",
      2
    );
    expect(res.status).toBe(200);
  });
});

// ── POST /webhook — short message ─────────────────────────────────────────────

describe("POST /webhook — short message", () => {
  it("returns help hint for messages shorter than 5 characters", async () => {
    const res = await webhook("hi");
    expect(res.status).toBe(200);
    bodyContains(res, "ayuda");
    expect(clasificarTareas).not.toHaveBeenCalled();
  });
});

// ── POST /webhook — classification flow ───────────────────────────────────────

describe("POST /webhook — classification flow", () => {
  it("calls clasificarTareas for long messages and returns the result", async () => {
    const materias = { Cálculo: ["Ejercicios cap 4"] };
    clasificarTareas.mockResolvedValue({ materias, resumen: "Tarea de Cálculo" });
    guardarTareas.mockReturnValue(materias);

    const res = await webhook("Tengo ejercicios de Cálculo del capítulo 4");
    expect(res.status).toBe(200);
    expect(clasificarTareas).toHaveBeenCalledWith(
      "Tengo ejercicios de Cálculo del capítulo 4"
    );
    bodyContains(res, "Tarea de Cálculo");
    bodyContains(res, "Ejercicios cap 4");
  });

  it("calls guardarTareas with the classified tasks", async () => {
    const materias = { Cálculo: ["Ejercicios cap 4"] };
    clasificarTareas.mockResolvedValue({ materias, resumen: "Tarea de Cálculo" });

    await webhook("Tengo ejercicios de Cálculo del capítulo 4");

    expect(guardarTareas).toHaveBeenCalledWith("whatsapp:+521234567890", materias);
  });

  it("returns 'no tasks detected' message when classification finds nothing", async () => {
    clasificarTareas.mockResolvedValue({ materias: {}, resumen: "No se detectaron tareas" });

    const res = await webhook("Tengo ejercicios de Cálculo del capítulo 4");
    expect(res.status).toBe(200);
    bodyContains(res, "No detecté tareas");
    expect(guardarTareas).not.toHaveBeenCalled();
  });

  it("returns 'no tasks detected' message when clasificarTareas returns null", async () => {
    clasificarTareas.mockResolvedValue(null);

    const res = await webhook("Tengo ejercicios de Cálculo del capítulo 4");
    expect(res.status).toBe(200);
    bodyContains(res, "No detecté tareas");
    expect(guardarTareas).not.toHaveBeenCalled();
  });
});
