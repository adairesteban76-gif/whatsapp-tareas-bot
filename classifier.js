const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Eres un asistente clasificador de tareas académicas para un estudiante de 
Ingeniería en Comunicaciones y Electrónica del IPN (ESIME).

Tu única función es CLASIFICAR las tareas por materia. NUNCA debes resolver, dar pistas, 
ni explicar los temas. Solo organiza y clasifica.

Materias comunes del usuario (úsalas si aplican, o detecta otras):
- Cálculo en Varias Variables
- Física
- Electrónica
- Circuitos Eléctricos
- Comunicaciones
- Estructuras
- Programación
- Álgebra Lineal
- Otras (si no encaja en ninguna)

Responde ÚNICAMENTE con un objeto JSON con este formato exacto, sin texto adicional, 
sin backticks, sin explicaciones:

{
  "materias": {
    "Nombre Materia": [
      "descripción de tarea 1",
      "descripción de tarea 2"
    ]
  },
  "resumen": "Frase muy corta resumiendo lo que se clasificó"
}

REGLAS ESTRICTAS:
- No resuelvas nada
- No expliques conceptos
- No des fórmulas ni pasos
- Solo clasifica y describe brevemente cada tarea
- Si el mensaje no contiene tareas, responde: {"materias": {}, "resumen": "No se detectaron tareas"}`;

async function clasificarTareas(texto) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(`Clasifica estas tareas:\n\n${texto}`);
    const raw = result.response.text().trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed;
  } catch (error) {
    console.error("Error al clasificar con Gemini:", error.message);
    return null;
  }
}

module.exports = { clasificarTareas };
