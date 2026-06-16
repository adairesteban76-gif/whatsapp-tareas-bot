# 🤖 WhatsApp Tareas Bot

Bot de WhatsApp que clasifica tus tareas por materia **sin resolverlas**,
usando Google Gemini como motor de inteligencia.

---

## ✨ Comandos

| Comando | Descripción |
|---|---|
| Texto libre | Detecta y clasifica tus tareas por materia |
| `ver` / `mis tareas` / `tareas` | Muestra todas las tareas pendientes |
| `listo [Materia] [#]` | Marca una tarea como completada |
| `completar [Materia] [#]` | Igual que `listo` |
| `limpiar` / `borrar todo` / `clear` | Borra todas las tareas |
| `ayuda` / `help` / `hola` / `inicio` | Muestra el menú de ayuda |

---

## 📦 Instalación

```bash
# 1. Clonar el proyecto
cd whatsapp-tareas-bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus claves reales
```

---

## 🔑 Credenciales necesarias

### 1. Twilio (WhatsApp Sandbox)
1. Ve a [console.twilio.com](https://console.twilio.com)
2. Crea una cuenta gratuita
3. Ve a **Messaging → Try it out → Send a WhatsApp message**
4. Activa el sandbox escaneando el QR con tu WhatsApp
5. Copia tu **Account SID** y **Auth Token** en `.env`

### 2. Google Gemini API
1. Ve a [aistudio.google.com](https://aistudio.google.com)
2. Crea una API key (capa gratuita disponible)
3. Cópiala en `.env` como `GEMINI_API_KEY`

---

## 🚀 Ejecutar

```bash
# Terminal 1 — Iniciar el servidor
npm start

# Terminal 2 — Exponer al internet (necesario para Twilio)
npx ngrok http 3000
```

Copia la URL de ngrok (ej: `https://abc123.ngrok.io`) y configúrala en Twilio:

1. En el sandbox de WhatsApp de Twilio
2. En **"When a message comes in"** pega: `https://TU-URL.ngrok.io/webhook`
3. Método: **HTTP POST**
4. Guarda

---

## 💬 Ejemplo de uso

**1. Agregar tareas** — escribe libremente:
```
Tengo que terminar los ejercicios del capítulo 5 de Cálculo, resolver
el circuito RLC de la práctica 3 de Electrónica y estudiar para el
examen de Física de ondas mecánicas
```

**El bot responde:**
```
✅ 3 tareas clasificadas en 3 materias

📐 Cálculo
  ⬜ 1. Ejercicios del capítulo 5

🔌 Electrónica
  ⬜ 1. Resolver circuito RLC - práctica 3

⚡ Física
  ⬜ 1. Estudiar ondas mecánicas para examen

Escribe *ver* para ver todas tus tareas acumuladas.
```

**2. Ver tareas:**
```
ver
```

**3. Marcar como completada** (usando materia y número de la lista):
```
listo Cálculo 1
```
```
✅ Tarea marcada como completada en *Cálculo*.
```

**4. Borrar todo:**
```
limpiar
```

---

## 🧪 Tests

```bash
npm test              # Ejecutar suite completa (68 tests)
npm run test:coverage # Con reporte de cobertura (~96%)
```

Cobertura actual:

| Archivo | Statements | Branches | Funciones | Líneas |
|---|---|---|---|---|
| `classifier.js` | 100% | 100% | 100% | 100% |
| `storage.js` | 100% | 100% | 100% | 100% |
| `server.js` | 94% | 91% | 86% | 94% |

---

## 📁 Estructura del proyecto

```
whatsapp-tareas-bot/
├── __tests__/
│   ├── classifier.test.js  # Tests de integración con Gemini (mockeado)
│   ├── server.test.js      # Tests de rutas webhook y funciones auxiliares
│   └── storage.test.js     # Tests de persistencia JSON
├── server.js               # Servidor Express + webhook Twilio
├── classifier.js           # Integración con Google Gemini
├── storage.js              # Almacenamiento en JSON local
├── tareas.json             # Base de datos (se crea automáticamente)
├── package.json
├── .env.example
└── README.md
```

---

## 🛠️ Tecnologías

- **Node.js + Express** — Servidor HTTP
- **Twilio** — Integración WhatsApp
- **Google Gemini 1.5 Flash** — Clasificación inteligente de tareas
- **JSON local** — Almacenamiento de tareas por usuario
- **Jest + supertest** — Suite de tests

---

## 📌 Notas

- Las tareas se guardan en `tareas.json` separadas por número de WhatsApp
- El bot **nunca resuelve** las tareas, solo las clasifica y organiza
- Para producción, reemplaza el JSON por una base de datos real (MongoDB, SQLite, etc.)
- Las materias reconocidas por defecto: Cálculo, Física, Electrónica, Circuitos, Comunicaciones, Estructuras, Programación, Álgebra Lineal, Otras
