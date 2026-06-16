// mockGenerateContent is captured by reference inside the factory closure,
// so beforeEach can swap the implementation between tests.
let mockGenerateContent;

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: (...args) => mockGenerateContent(...args),
      };
    }
  },
}));

const { clasificarTareas } = require("../classifier");

const makeResponse = (text) => ({
  response: { text: () => text },
});

beforeEach(() => {
  mockGenerateContent = jest.fn();
});

describe("clasificarTareas", () => {
  it("parses and returns a valid JSON response from Gemini", async () => {
    const payload = {
      materias: { Cálculo: ["Ejercicios cap 3"] },
      resumen: "Tarea de Cálculo",
    };
    mockGenerateContent.mockResolvedValue(makeResponse(JSON.stringify(payload)));

    const result = await clasificarTareas("Tengo ejercicios de Cálculo");
    expect(result).toEqual(payload);
  });

  it("strips markdown backtick fences before parsing", async () => {
    const payload = { materias: { Física: ["Lab 2"] }, resumen: "Tarea de Física" };
    const fenced = "```json\n" + JSON.stringify(payload) + "\n```";
    mockGenerateContent.mockResolvedValue(makeResponse(fenced));

    const result = await clasificarTareas("Tengo laboratorio de Física");
    expect(result).toEqual(payload);
  });

  it("returns empty materias object (not null) when no tasks are detected", async () => {
    const payload = { materias: {}, resumen: "No se detectaron tareas" };
    mockGenerateContent.mockResolvedValue(makeResponse(JSON.stringify(payload)));

    const result = await clasificarTareas("Hola, ¿cómo estás?");
    expect(result).toEqual(payload);
    expect(result).not.toBeNull();
  });

  it("returns null when the API throws a network error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Network error"));

    const result = await clasificarTareas("Tengo ejercicios");
    expect(result).toBeNull();
  });

  it("returns null when Gemini responds with invalid JSON", async () => {
    mockGenerateContent.mockResolvedValue(makeResponse("esto no es JSON válido"));

    const result = await clasificarTareas("Tengo ejercicios");
    expect(result).toBeNull();
  });

  it("calls Gemini with a prompt that includes the user's message", async () => {
    const payload = { materias: {}, resumen: "" };
    mockGenerateContent.mockResolvedValue(makeResponse(JSON.stringify(payload)));

    await clasificarTareas("Resolver circuito RLC");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining("Resolver circuito RLC")
    );
  });
});
