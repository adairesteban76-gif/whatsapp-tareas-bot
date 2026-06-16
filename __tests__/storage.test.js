jest.mock("fs");

const fs = require("fs");
const { leerTareas, guardarTareas, completarTarea, limpiarTareas } = require("../storage");

const mockDB = (data = {}) => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.writeFileSync.mockImplementation(() => {});
});

// ── leerTareas ────────────────────────────────────────────────────────────────

describe("leerTareas", () => {
  it("returns empty object for a user with no tasks", () => {
    mockDB({});
    expect(leerTareas("user1")).toEqual({});
  });

  it("returns the user's tasks when they exist", () => {
    mockDB({ user1: { Cálculo: ["Ejercicios cap 3"] } });
    expect(leerTareas("user1")).toEqual({ Cálculo: ["Ejercicios cap 3"] });
  });

  it("does not return another user's tasks", () => {
    mockDB({ user2: { Física: ["Laboratorio"] } });
    expect(leerTareas("user1")).toEqual({});
  });

  it("creates the DB file when it does not exist", () => {
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue(JSON.stringify({}));

    leerTareas("user1");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("tareas.json"),
      JSON.stringify({}, null, 2)
    );
  });
});

// ── guardarTareas ─────────────────────────────────────────────────────────────

describe("guardarTareas", () => {
  it("creates a new user entry when the user does not exist", () => {
    mockDB({});
    guardarTareas("user1", { Cálculo: ["Ejercicio 1"] });

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1).toEqual({ Cálculo: ["Ejercicio 1"] });
  });

  it("appends tasks to an existing subject", () => {
    mockDB({ user1: { Cálculo: ["Ejercicio 1"] } });
    guardarTareas("user1", { Cálculo: ["Ejercicio 2"] });

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1.Cálculo).toEqual(["Ejercicio 1", "Ejercicio 2"]);
  });

  it("creates a new subject for an existing user without touching other subjects", () => {
    mockDB({ user1: { Cálculo: ["Ejercicio 1"] } });
    guardarTareas("user1", { Física: ["Laboratorio"] });

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1.Cálculo).toEqual(["Ejercicio 1"]);
    expect(saved.user1.Física).toEqual(["Laboratorio"]);
  });

  it("saves multiple subjects at once", () => {
    mockDB({});
    guardarTareas("user1", { Cálculo: ["T1"], Física: ["T2"] });

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1).toEqual({ Cálculo: ["T1"], Física: ["T2"] });
  });

  it("returns the updated tasks for that user", () => {
    mockDB({ user1: { Cálculo: ["T1"] } });
    const result = guardarTareas("user1", { Física: ["T2"] });

    expect(result).toEqual({ Cálculo: ["T1"], Física: ["T2"] });
  });

  it("does not affect other users", () => {
    mockDB({ user2: { Álgebra: ["Tarea"] } });
    guardarTareas("user1", { Cálculo: ["T1"] });

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user2).toEqual({ Álgebra: ["Tarea"] });
  });
});

// ── completarTarea ────────────────────────────────────────────────────────────

describe("completarTarea", () => {
  it("marks a string task as completed (converts to object)", () => {
    mockDB({ user1: { Cálculo: ["Ejercicio 1", "Ejercicio 2"] } });
    const ok = completarTarea("user1", "Cálculo", 0);

    expect(ok).toBe(true);
    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1.Cálculo[0]).toEqual({ texto: "Ejercicio 1", completada: true });
    expect(saved.user1.Cálculo[1]).toBe("Ejercicio 2");
  });

  it("marks an already-converted object task as completed", () => {
    mockDB({ user1: { Cálculo: [{ texto: "Ejercicio 1", completada: false }] } });
    const ok = completarTarea("user1", "Cálculo", 0);

    expect(ok).toBe(true);
    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1.Cálculo[0]).toEqual({ texto: "Ejercicio 1", completada: true });
  });

  it("matches subject name case-insensitively", () => {
    mockDB({ user1: { Cálculo: ["Ejercicio"] } });
    const ok = completarTarea("user1", "cálculo", 0);
    expect(ok).toBe(true);
  });

  it("matches subject name regardless of original casing", () => {
    mockDB({ user1: { CÁLCULO: ["Ejercicio"] } });
    const ok = completarTarea("user1", "Cálculo", 0);
    expect(ok).toBe(true);
  });

  it("returns false when user does not exist", () => {
    mockDB({});
    const ok = completarTarea("unknown", "Cálculo", 0);
    expect(ok).toBe(false);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("returns false when subject does not exist for the user", () => {
    mockDB({ user1: { Física: ["Tarea"] } });
    const ok = completarTarea("user1", "Cálculo", 0);
    expect(ok).toBe(false);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("returns false when index is out of bounds", () => {
    mockDB({ user1: { Cálculo: ["Tarea 1"] } });
    const ok = completarTarea("user1", "Cálculo", 5);
    expect(ok).toBe(false);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("returns false for negative index", () => {
    mockDB({ user1: { Cálculo: ["Tarea 1"] } });
    const ok = completarTarea("user1", "Cálculo", -1);
    expect(ok).toBe(false);
  });
});

// ── limpiarTareas ─────────────────────────────────────────────────────────────

describe("limpiarTareas", () => {
  it("clears all tasks for the specified user", () => {
    mockDB({ user1: { Cálculo: ["T1"] } });
    limpiarTareas("user1");

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user1).toEqual({});
  });

  it("does not affect other users", () => {
    mockDB({ user1: { Cálculo: ["T1"] }, user2: { Física: ["T2"] } });
    limpiarTareas("user1");

    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved.user2).toEqual({ Física: ["T2"] });
  });

  it("persists the change by calling writeFileSync", () => {
    mockDB({ user1: { Cálculo: ["T1"] } });
    limpiarTareas("user1");
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });
});
