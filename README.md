# 🤖 WhatsApp Tareas Bot — Clasificador con Claude AI

Bot de WhatsApp que clasifica tus tareas por materia **sin resolverlas**, 
usando Claude AI como motor de inteligencia.

---

## ✨ Funciones

| Comando | Descripción |
|---|---|
| Enviar texto libre | Detecta y clasifica tareas por materia |
| `ver` | Muestra todas las tareas pendientes |
| `limpiar` | Borra todas las tareas |
| `listo [Materia] [#]` | Marca una tarea como completada |
| `ayuda` | Muestra el menú de ayuda |

---

## 📦 Instalación

```bash
# 1. Clonar o descargar el proyecto
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
5. Copia tu **Account SID** y **Auth Token**

### 2. Anthropic API
1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una API key
3. Cópiala en `.env`

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

**Tú escribes en WhatsApp:**
```
Tengo que terminar los ejercicios del capítulo 5 de Cálculo, resolver 
el circuito RLC de la práctica 3 de Electrónica y estudiar para el 
examen de Física de ondas mecánicas
```

**El bot responde:**
```
✅ 3 tareas clasificadas en 3 materias

📐 Cálculo en Varias Variables
  ⬜ 1. Ejercicios del capítulo 5

🔌 Electrónica
  ⬜ 1. Resolver circuito RLC - práctica 3

⚡ Física
  ⬜ 1. Estudiar ondas mecánicas para examen

Escribe *ver* para ver todas tus tareas acumuladas.
```

---

## 📁 Estructura del proyecto

```
whatsapp-tareas-bot/
├── server.js        # Servidor Express + webhook Twilio
├── classifier.js    # Integración con Claude API
├── storage.js       # Almacenamiento en JSON local
├── tareas.json      # Base de datos (se crea automático)
├── package.json
├── .env.example
└── README.md
```

---

## 🛠️ Tecnologías

- **Node.js + Express** — Servidor HTTP
- **Twilio** — Integración WhatsApp
- **Claude API (Sonnet 4.6)** — Clasificación inteligente
- **JSON local** — Almacenamiento de tareas

---

## 📌 Notas

- Las tareas se guardan en `tareas.json` por número de WhatsApp
- El bot **nunca resuelve** las tareas, solo clasifica
- Para producción, reemplaza el JSON por una base de datos real (MongoDB, SQLite, etc.)
