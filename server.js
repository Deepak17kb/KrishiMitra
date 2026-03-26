/* ═══════════════════════════════════════════════════
   KRISHIMITRA — backend/server.js
   Kisan ka Sachcha Mitra | AI Backend Server
   - Express.js REST API
   - Google Gemini AI Integration
   - Agriculture Expert System Prompt
   - CORS, Rate Limiting, Error Handling
═══════════════════════════════════════════════════ */

const express    = require("express");
const cors       = require("cors");
const dotenv     = require("dotenv");
const rateLimit  = require("express-rate-limit");

// Load environment variables from .env file
dotenv.config();

/* ══════════════════════════════
   APP SETUP
══════════════════════════════ */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ══════════════════════════════
   MIDDLEWARE
══════════════════════════════ */
app.use(express.json());

// CORS — allow your frontend to connect
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// Rate limiting — max 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/chat", limiter);

/* ══════════════════════════════
   KRISHIMITRA SYSTEM PROMPT
══════════════════════════════ */
const KRISHIMITRA_SYSTEM_PROMPT = `
You are KrishiMitra (कृषि मित्र) — "The Farmer's True Friend" — an expert AI assistant built exclusively to help Indian farmers with all aspects of agriculture, farming, and rural life.

## YOUR IDENTITY
- Name: KrishiMitra (कृषि मित्र)
- Role: Expert agricultural advisor for Indian farmers
- Tone: Warm, respectful, patient — like a knowledgeable neighbour
- Language: Respond in the SAME language the farmer writes in. If they write Hindi or Hinglish, reply in Hindi/Hinglish. If English, reply in English. Mix naturally if they mix.

## YOUR EXPERTISE:
1. **Crop Science**: All major Indian crops — Wheat (Gehun), Rice (Dhan), Maize (Makka), Bajra, Jowar, Cotton (Kapas), Sugarcane (Ganna), Soybean, Groundnut, Mustard (Sarson), Pulses, all vegetables and fruits
2. **Indian Seasons**: Kharif (June–Oct), Rabi (Nov–Feb), Zaid (March–May)
3. **Soil Health**: Soil types in India, pH balance, nutrients (N-P-K), composting
4. **Irrigation**: Drip, sprinkler, flood irrigation, water conservation
5. **Pest & Disease Management**: Common pests, fungal/bacterial diseases, IPM, organic solutions
6. **Fertilizers**: Chemical (Urea, DAP, MOP), organic (vermicompost, neem cake), nano urea, biofertilizers
7. **Government Schemes**: PM-KISAN, PM Fasal Bima, Soil Health Card, SMAM, eNAM, Kisan Credit Card, RKVY
8. **Mandi & Market**: Best prices, when to sell, eNAM, FPO, MSP crops
9. **Modern Farming**: Precision farming, drone spraying, organic farming, ZBNF
10. **Animal Husbandry**: Dairy, poultry, goat farming integrated with farming

## HOW TO RESPOND:
- Always greet warmly on first message (Jai Kisan! / Namaskar!)
- Give PRACTICAL, ACTIONABLE advice — not just theory
- Mention specific Indian crop varieties (PB-1121 basmati, HD-2967 wheat, etc.)
- Always warn about pesticide safety
- For government schemes, mention helpline numbers when possible
- Use simple language farmers can understand
- When weather context is provided, tailor advice to that weather

## RESPONSE FORMAT:
- Keep responses focused and clear
- Use bullet points (•) for lists
- Use **bold** for important crop names or terms
- End with an encouraging note or follow-up question
- For complex problems, use Step 1, Step 2 format

## WHAT YOU DON'T DO:
- Do NOT discuss non-farming topics
- Do NOT give human medical advice
- Do NOT make up fake schemes or wrong MSP prices
- If unsure, say "Mujhe yeh pakka nahi pata, lekin..."

Remember: You are talking to hardworking Indian farmers whose livelihood depends on their crops. Be accurate, caring, and their true Mitra (friend).

जय किसान! 🌾
`;

/* ══════════════════════════════
   GEMINI API CALL FUNCTION
══════════════════════════════ */
async function callGemini(history, userMessage, context) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in .env file");
  }

  // Gemini API endpoint — using free gemini-1.5-flash model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Build conversation history in Gemini format
  const contents = [];

  // Add previous messages
  for (const msg of history) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Build current message — inject weather + date context
  let fullUserMessage = userMessage;
  if (context) {
    fullUserMessage = `[Context: ${context}]\n\nFarmer's question: ${userMessage}`;
  }

  contents.push({
    role: "user",
    parts: [{ text: fullUserMessage }],
  });

  // Full request body
  const requestBody = {
    system_instruction: {
      parts: [{ text: KRISHIMITRA_SYSTEM_PROMPT }],
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 800,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json();
    const errMsg  = errData?.error?.message || "Gemini API error";
    const errCode = response.status;

    if (errCode === 400) throw new Error("Bad request / Invalid key: " + errMsg);
    if (errCode === 403) throw new Error("API key permission denied: " + errMsg);
    if (errCode === 429) throw new Error("RATE_LIMIT: " + errMsg);
    throw new Error(`Gemini error ${errCode}: ${errMsg}`);
  }

  const data = await response.json();
  const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return text;
}

/* ══════════════════════════════
   ROUTES
══════════════════════════════ */

// Health check
app.get("/", (req, res) => {
  res.json({
    status:    "running",
    app:       "KrishiMitra Backend",
    ai:        "Google Gemini 1.5 Flash",
    version:   "1.0.0",
    message:   "Jai Kisan! Server is healthy. 🌾",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/* ══════════════════════════════
   MAIN CHAT ENDPOINT
   POST /chat
   Body: { message, history, context }
══════════════════════════════ */
app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], context = "" } = req.body;

    // Validate
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message too long. Keep under 2000 characters." });
    }

    // Sanitize history
    const validHistory = Array.isArray(history)
      ? history.slice(-10).filter(
          m => m.role && m.content &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
        )
      : [];

    // Call Gemini
    const reply = await callGemini(validHistory, message.trim(), context);

    res.json({ reply });

  } catch (err) {
    console.error("❌ Chat error:", err.message);

    if (err.message.includes("GEMINI_API_KEY not found")) {
      return res.status(500).json({ error: "API key missing. Add GEMINI_API_KEY to .env file." });
    }
    if (err.message.includes("Bad request") || err.message.includes("Invalid key")) {
      return res.status(401).json({ error: "Invalid Gemini API key. Please check your .env file." });
    }
    if (err.message.includes("RATE_LIMIT")) {
      return res.status(429).json({ error: "Gemini rate limit hit. Please wait a moment." });
    }

    res.status(500).json({
      error:  "Server error. Please try again.",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/* ══════════════════════════════
   404 HANDLER
══════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({
    error:     "Route not found",
    available: ["GET /", "GET /health", "POST /chat"],
  });
});

/* ══════════════════════════════
   GLOBAL ERROR HANDLER
══════════════════════════════ */
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

/* ══════════════════════════════
   START SERVER
══════════════════════════════ */
app.listen(PORT, () => {
  console.log("\n🌾 ══════════════════════════════════════");
  console.log("   KrishiMitra Backend Server");
  console.log("   Powered by Google Gemini AI");
  console.log("🌾 ══════════════════════════════════════");
  console.log(`✅ Server running at : http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint     : http://localhost:${PORT}/chat`);
  console.log(`❤️  Health check      : http://localhost:${PORT}/health`);
  console.log("🌾 ══════════════════════════════════════\n");

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY not found in .env file!");
    console.warn("   Add your Gemini key to backend/.env to enable AI chat.\n");
  } else {
    console.log("🔑 Gemini API key : Loaded ✓");
    console.log("🤖 AI Model       : gemini-1.5-flash (Free tier)\n");
  }
});
