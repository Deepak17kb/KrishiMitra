/* ═══════════════════════════════════════════════════
   KRISHIMITRA — script.js
   Kisan ka Sachcha Mitra | Complete Frontend Logic
   - Live Clock & Date
   - Weather API (Open-Meteo — FREE, no key needed)
   - Agriculture News (NewsData.io)
   - Season & Sowing Calendar
   - Mandi Rates
   - Chatbot (connects to backend/server.js)
═══════════════════════════════════════════════════ */

/* ══════════════════════════════
   CONFIG
══════════════════════════════ */
const CONFIG = {
  // Your backend server URL (change when deployed)
  BACKEND_URL: "https://krishimitra-backend-6spu.onrender.com",

  // NewsData.io free API key — get from https://newsdata.io (free signup)
  NEWS_API_KEY: "YOUR_NEWSDATA_API_KEY",

  // Default location if geolocation fails (New Delhi)
  DEFAULT_LAT: 28.6139,
  DEFAULT_LON: 77.2090,
  DEFAULT_CITY: "New Delhi",
};

/* ══════════════════════════════
   GLOBAL STATE
══════════════════════════════ */
let chatOpen = false;
let conversationHistory = [];
let currentWeather = null;
let userLat = CONFIG.DEFAULT_LAT;
let userLon = CONFIG.DEFAULT_LON;
let userCity = CONFIG.DEFAULT_CITY;
let isBotTyping = false;

/* ══════════════════════════════
   1. LIVE CLOCK
══════════════════════════════ */
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = (hours % 12 || 12).toString().padStart(2, "0");
  const el = document.getElementById("liveClock");
  if (el) el.textContent = `${displayHour}:${minutes} ${ampm}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════
   2. DATE & SEASON
══════════════════════════════ */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const WEEKDAYS = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
];

const WEEKDAYS_HINDI = [
  "Ravivar","Somvar","Mangalvar","Budhvar","Guruvar","Shukravar","Shanivar"
];

function getSeason(month) {
  // month is 0-indexed
  if (month >= 5 && month <= 9)  return "kharif";   // Jun–Oct
  if (month >= 10 || month <= 1) return "rabi";     // Nov–Feb
  return "zaid";                                     // Mar–May
}

const SEASON_DATA = {
  kharif: {
    name: "☔ Kharif Season",
    period: "June – October",
    crops: "Rice, Maize, Soybean, Cotton, Groundnut, Bajra, Jowar",
    color: "#2e6b2c",
    items: [
      { emoji:"🍚", name:"Rice (Dhan)",      detail:"Water-intensive, paddy fields",   months:"Jun–Oct" },
      { emoji:"🌽", name:"Maize (Makka)",    detail:"Versatile, good yield",           months:"Jun–Sep" },
      { emoji:"🫘", name:"Soybean",          detail:"Protein-rich, oil crop",          months:"Jul–Oct" },
      { emoji:"🌿", name:"Cotton (Kapas)",   detail:"Cash crop, warm weather",         months:"Jun–Nov" },
      { emoji:"🥜", name:"Groundnut (Moongfali)", detail:"Oil crop, sandy soil",       months:"Jun–Sep" },
      { emoji:"🌾", name:"Bajra",            detail:"Drought tolerant millet",         months:"Jul–Oct" },
    ]
  },
  rabi: {
    name: "❄️ Rabi Season",
    period: "November – February",
    crops: "Wheat, Mustard, Gram, Barley, Peas, Lentils",
    color: "#1b3a1a",
    items: [
      { emoji:"🌾", name:"Wheat (Gehun)",    detail:"India's main food crop",          months:"Nov–Apr" },
      { emoji:"🟡", name:"Mustard (Sarson)", detail:"Oil seed, cool weather",          months:"Oct–Mar" },
      { emoji:"🫘", name:"Gram (Chana)",     detail:"Protein-rich pulse",              months:"Oct–Feb" },
      { emoji:"🌰", name:"Barley (Jau)",     detail:"Used in malt & feed",             months:"Nov–Apr" },
      { emoji:"🟢", name:"Peas (Matar)",     detail:"Cool season vegetable",           months:"Oct–Jan" },
      { emoji:"🔴", name:"Lentil (Masoor)",  detail:"Nitrogen-fixing pulse",           months:"Oct–Feb" },
    ]
  },
  zaid: {
    name: "☀️ Zaid Season",
    period: "March – May",
    crops: "Watermelon, Cucumber, Moong, Vegetables, Sunflower",
    color: "#7a5000",
    items: [
      { emoji:"🍉", name:"Watermelon (Tarbooz)", detail:"High water needs, summer",   months:"Mar–Jun" },
      { emoji:"🥒", name:"Cucumber (Kheera)",    detail:"Short duration crop",         months:"Mar–May" },
      { emoji:"🫘", name:"Moong Dal",            detail:"Short duration pulse",        months:"Mar–Jun" },
      { emoji:"🌻", name:"Sunflower (Surajmukhi)",detail:"Oil crop, drought tolerant", months:"Jan–Apr" },
      { emoji:"🍈", name:"Muskmelon (Kharbooza)",detail:"Sandy soil, warm weather",   months:"Feb–May" },
      { emoji:"🥬", name:"Summer Vegetables",    detail:"Bhindi, Turai, Lauki",        months:"Mar–Jun" },
    ]
  }
};

const SOWING_CALENDAR = [
  { crop:"🌾 Wheat",      time:"Nov–Dec", status:"upcoming" },
  { crop:"🍚 Rice",       time:"Jun–Jul", status:"done"     },
  { crop:"🌽 Maize",      time:"Jun–Aug", status:"done"     },
  { crop:"🟡 Mustard",    time:"Sep–Oct", status:"upcoming" },
  { crop:"🫘 Gram",       time:"Oct–Nov", status:"upcoming" },
];

function updateDateDisplay() {
  const now = new Date();
  const month = now.getMonth();
  const currentSeason = getSeason(month);

  // Update hero stats
  const heroDate = document.getElementById("heroDate");
  if (heroDate) heroDate.textContent = now.getDate() + " " + MONTHS[month].slice(0,3);

  const heroSeason = document.getElementById("heroSeason");
  if (heroSeason) {
    const sNames = { kharif:"Kharif", rabi:"Rabi", zaid:"Zaid" };
    heroSeason.textContent = sNames[currentSeason];
  }

  // Update date card
  const dateDay = document.getElementById("dateDay");
  if (dateDay) dateDay.textContent = now.getDate().toString().padStart(2,"0");

  const dateMonthYear = document.getElementById("dateMonthYear");
  if (dateMonthYear) dateMonthYear.textContent = MONTHS[month] + " " + now.getFullYear();

  const dateWeekday = document.getElementById("dateWeekday");
  if (dateWeekday) dateWeekday.textContent = WEEKDAYS[now.getDay()] + " · " + WEEKDAYS_HINDI[now.getDay()];

  // Season block
  const sData = SEASON_DATA[currentSeason];
  const seasonName = document.getElementById("seasonName");
  if (seasonName) seasonName.textContent = sData.name + " · " + sData.period;

  const seasonCrops = document.getElementById("seasonCrops");
  if (seasonCrops) seasonCrops.textContent = "Main crops: " + sData.crops;

  // Sowing calendar
  const sowingList = document.getElementById("sowingList");
  if (sowingList) {
    sowingList.innerHTML = SOWING_CALENDAR.map(item => `
      <div class="sowing-item">
        <span class="sowing-crop">${item.crop}</span>
        <span class="sowing-time">${item.time}</span>
        <span class="sowing-status status-${item.status}">
          ${item.status === "active" ? "Now" : item.status === "upcoming" ? "Soon" : "Done"}
        </span>
      </div>
    `).join("");
  }

  // Season card default
  showSeason(currentSeason, null);
}

function showSeason(type, btn) {
  // Update active tab
  if (btn) {
    document.querySelectorAll(".s-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
  } else {
    const tabs = document.querySelectorAll(".s-tab");
    const map = { kharif:0, rabi:1, zaid:2 };
    tabs.forEach(t => t.classList.remove("active"));
    if (tabs[map[type]]) tabs[map[type]].classList.add("active");
  }

  const sData = SEASON_DATA[type];
  const container = document.getElementById("seasonContent");
  if (!container) return;

  container.innerHTML = sData.items.map((item, i) => `
    <div class="season-crop-item" style="animation-delay:${i * 0.05}s">
      <div class="sci-emoji">${item.emoji}</div>
      <div class="sci-info">
        <div class="sci-name">${item.name}</div>
        <div class="sci-detail">${item.detail}</div>
      </div>
      <span class="sci-months">${item.months}</span>
    </div>
  `).join("");
}

/* ══════════════════════════════
   3. WEATHER API (Open-Meteo)
   FREE — No API key needed
══════════════════════════════ */
const WMO_CODES = {
  0:  { desc:"Clear Sky",        icon:"☀️" },
  1:  { desc:"Mostly Clear",     icon:"🌤️" },
  2:  { desc:"Partly Cloudy",    icon:"⛅" },
  3:  { desc:"Overcast",         icon:"☁️" },
  45: { desc:"Foggy",            icon:"🌫️" },
  48: { desc:"Icy Fog",          icon:"🌫️" },
  51: { desc:"Light Drizzle",    icon:"🌦️" },
  53: { desc:"Drizzle",          icon:"🌦️" },
  61: { desc:"Light Rain",       icon:"🌧️" },
  63: { desc:"Moderate Rain",    icon:"🌧️" },
  65: { desc:"Heavy Rain",       icon:"🌧️" },
  71: { desc:"Light Snow",       icon:"🌨️" },
  80: { desc:"Rain Showers",     icon:"🌦️" },
  95: { desc:"Thunderstorm",     icon:"⛈️" },
  99: { desc:"Heavy Thunderstorm",icon:"⛈️" },
};

function getWeatherAdvice(temp, humidity, weatherCode, windSpeed) {
  if (weatherCode >= 95)
    return "⚠️ Thunderstorm alert! Keep crops covered. Avoid field work today.";
  if (weatherCode >= 61 && weatherCode <= 67)
    return "🌧️ Heavy rain expected. Check drainage in fields. Delay fertilizer application.";
  if (weatherCode >= 51 && weatherCode <= 57)
    return "🌦️ Light drizzle — good for germination. Avoid pesticide spraying.";
  if (temp > 40)
    return "🌡️ Extreme heat! Irrigate crops in early morning or evening. Protect nurseries.";
  if (temp > 35)
    return "☀️ Hot day ahead. Irrigate fields in the morning. Mulch to retain moisture.";
  if (temp < 5)
    return "❄️ Near-frost conditions! Protect seedlings with covers. Check irrigation pipes.";
  if (humidity > 85)
    return "💧 High humidity — watch for fungal disease. Ensure proper crop spacing.";
  if (windSpeed > 30)
    return "🌬️ Strong winds today. Avoid spraying pesticides. Support tall crop plants.";
  if (weatherCode <= 1)
    return "✅ Clear skies — ideal for spraying, harvesting, and field work today!";
  return "🌱 Good farming conditions. Stay updated with weather changes.";
}

async function fetchWeather() {
  try {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          userLat = pos.coords.latitude;
          userLon = pos.coords.longitude;
          await getCityName(userLat, userLon);
          await getWeatherData(userLat, userLon);
        },
        async () => {
          // Permission denied — use default
          await getWeatherData(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON);
        }
      );
    } else {
      await getWeatherData(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON);
    }
  } catch (err) {
    console.error("Weather fetch error:", err);
    showWeatherError();
  }
}

async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    const addr = data.address;
    userCity =
      addr.city || addr.town || addr.village ||
      addr.county || addr.state_district || addr.state || "Your Location";

    const locPill = document.getElementById("locationPill");
    if (locPill) locPill.textContent = "📍 " + userCity + ", " + (addr.state || "India");
  } catch {
    userCity = CONFIG.DEFAULT_CITY;
  }
}

async function getWeatherData(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `precipitation_probability,wind_speed_10m,weather_code` +
    `&timezone=Asia%2FKolkata` +
    `&forecast_days=1`;

  const res = await fetch(url);
  const data = await res.json();
  const c = data.current;

  currentWeather = {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    rainChance: c.precipitation_probability,
    code: c.weather_code,
  };

  const wInfo = WMO_CODES[c.weather_code] || { desc:"Unknown", icon:"🌡️" };

  // Update DOM — Weather Card
  setText("weatherTemp", currentWeather.temp + "°");
  setText("weatherDesc", wInfo.icon + " " + wInfo.desc);
  setText("weatherLoc", "📍 " + userCity);
  setText("wHumidity", currentWeather.humidity + "%");
  setText("wWind", currentWeather.windSpeed + " km/h");
  setText("wFeels", currentWeather.feelsLike + "°");
  setText("wRain", currentWeather.rainChance + "%");

  // Farm Advice
  const advice = getWeatherAdvice(
    currentWeather.temp,
    currentWeather.humidity,
    currentWeather.code,
    currentWeather.windSpeed
  );
  setText("adviceText", advice);

  // Hero stat
  setText("heroTemp", currentWeather.temp + "°C");
}

function showWeatherError() {
  setText("weatherDesc", "⚠️ Could not load weather");
  setText("weatherLoc", "Check internet connection");
}

/* ══════════════════════════════
   4. AGRICULTURE NEWS
   Using NewsData.io (free tier)
   Get key at: https://newsdata.io
══════════════════════════════ */
async function fetchNews() {
  const newsList = document.getElementById("newsList");
  if (!newsList) return;

  // Show skeletons
  newsList.innerHTML = `
    <div class="news-skeleton"></div>
    <div class="news-skeleton"></div>
    <div class="news-skeleton"></div>
  `;

  try {
    // If no API key, show fallback news
    if (CONFIG.NEWS_API_KEY === "YOUR_NEWSDATA_API_KEY") {
      showFallbackNews();
      return;
    }

    const url = `https://newsdata.io/api/1/news?` +
      `apikey=${CONFIG.NEWS_API_KEY}` +
      `&country=in` +
      `&category=business` +
      `&q=agriculture+farmer+kisan+crop` +
      `&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "success" && data.results && data.results.length > 0) {
      renderNews(data.results.slice(0, 6));
    } else {
      showFallbackNews();
    }
  } catch (err) {
    console.error("News fetch error:", err);
    showFallbackNews();
  }
}

function renderNews(articles) {
  const newsList = document.getElementById("newsList");
  if (!newsList) return;

  newsList.innerHTML = articles.map((article, i) => `
    <div class="news-item" onclick="openLink('${article.link || "#"}')" style="animation-delay:${i * 0.08}s">
      <div class="news-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="news-body">
        <span class="news-tag">🌾 Agriculture</span>
        <div class="news-title">${truncate(article.title, 100)}</div>
        <div class="news-meta">
          <span>📰 ${article.source_id || "News"}</span>
          <span>🕐 ${formatDate(article.pubDate)}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function showFallbackNews() {
  // Static fallback news when API key not set
  const fallbackArticles = [
    {
      title: "Government raises MSP for Kharif crops — Wheat MSP increased by ₹150/quintal for 2024-25",
      source: "Economic Times",
      date: "2 hours ago",
      tag: "MSP / Policy"
    },
    {
      title: "PM-KISAN 17th installment released — 9.26 crore farmers receive ₹2,000 directly in bank accounts",
      source: "PIB India",
      date: "5 hours ago",
      tag: "PM-KISAN"
    },
    {
      title: "IMD forecasts above-normal monsoon in 2024 — Good news for Kharif season farming",
      source: "IMD India",
      date: "Yesterday",
      tag: "Monsoon"
    },
    {
      title: "Soil health cards scheme expanded — 14 crore farmers to receive free soil testing by March",
      source: "Krishi Jagran",
      date: "2 days ago",
      tag: "Soil Health"
    },
    {
      title: "Digital Agriculture Mission 2021-2025 update — Agri-stack database covers 6 crore farmers",
      source: "MoA India",
      date: "3 days ago",
      tag: "Digital Agri"
    },
    {
      title: "Nano urea adoption rises — IFFCO reports 2 crore bottles sold, reduces import costs",
      source: "IFFCO",
      date: "4 days ago",
      tag: "Fertilizers"
    },
  ];

  const newsList = document.getElementById("newsList");
  if (!newsList) return;

  newsList.innerHTML = fallbackArticles.map((article, i) => `
    <div class="news-item" style="animation-delay:${i * 0.08}s">
      <div class="news-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="news-body">
        <span class="news-tag">🌾 ${article.tag}</span>
        <div class="news-title">${article.title}</div>
        <div class="news-meta">
          <span>📰 ${article.source}</span>
          <span>🕐 ${article.date}</span>
        </div>
      </div>
    </div>
  `).join("");
}

/* ══════════════════════════════
   5. CHAT WIDGET
══════════════════════════════ */
function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById("chatPanel");
  const overlay = document.getElementById("chatOverlay");
  const notif = document.getElementById("chatNotif");
  const icon = document.getElementById("chatToggleIcon");

  if (chatOpen) {
    panel.classList.add("open");
    overlay.style.display = "block";
    notif.classList.add("hidden");
    icon.textContent = "✕";
    scrollToBottom();
  } else {
    panel.classList.remove("open");
    overlay.style.display = "none";
    icon.textContent = "🌾";
  }
}

function clearChat() {
  conversationHistory = [];
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  chatMessages.innerHTML = `
    <div class="msg msg-bot">
      <div class="msg-avatar">🌾</div>
      <div class="msg-bubble">
        Chat cleared! Namaskar 🙏 Main KrishiMitra hoon. Kya sawaal hai aapka?
      </div>
    </div>
  `;
}

function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + "px";
}

function sendSuggestion(btn) {
  const text = btn.textContent.trim();
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.value = text;
    sendMessage();
  }
}

async function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const userText = chatInput ? chatInput.value.trim() : "";

  if (!userText || isBotTyping) return;

  // Clear input
  chatInput.value = "";
  chatInput.style.height = "auto";

  // Add user message to UI
  appendMessage("user", userText);

  // Add to history
  conversationHistory.push({ role: "user", content: userText });

  // Show typing
  showTyping();

  try {
    const reply = await callBackend(userText);
    hideTyping();
    appendMessage("bot", reply);
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    hideTyping();
    appendMessage("bot", "⚠️ Sorry, mujhe abhi server se connect karne mein dikkat aa rahi hai. Thodi der baad try karein. (Could not connect to server)");
    console.error("Chat error:", err);
  }
}

async function callBackend(userMessage) {
  // Build context with current weather and date
  const weatherContext = currentWeather
    ? `Current weather: ${currentWeather.temp}°C, humidity ${currentWeather.humidity}%, wind ${currentWeather.windSpeed} km/h, rain chance ${currentWeather.rainChance}%. Location: ${userCity}.`
    : "";

  const now = new Date();
  const dateContext = `Today is ${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}. Current season: ${getSeason(now.getMonth()).toUpperCase()}.`;

  const res = await fetch(`${CONFIG.BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMessage,
      history: conversationHistory.slice(-10), // last 10 messages for context
      context: `${weatherContext} ${dateContext}`,
    }),
  });

  if (!res.ok) throw new Error("Backend error: " + res.status);

  const data = await res.json();
  return data.reply || "Main samajh nahi paya. Dobara poochein.";
}

function appendMessage(role, text) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const div = document.createElement("div");
  div.className = `msg msg-${role === "user" ? "user" : "bot"}`;

  // Format text — convert **bold** and line breaks
  const formatted = formatBotText(text);

  if (role === "user") {
    div.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-avatar">🌾</div>
      <div class="msg-bubble">${formatted}</div>
    `;
  }

  chatMessages.appendChild(div);
  scrollToBottom();
}

function showTyping() {
  isBotTyping = true;
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const div = document.createElement("div");
  div.className = "msg msg-bot msg-typing";
  div.id = "typingIndicator";
  div.innerHTML = `
    <div class="msg-avatar">🌾</div>
    <div class="msg-bubble">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function hideTyping() {
  isBotTyping = false;
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }
}

/* ══════════════════════════════
   6. TEXT FORMATTING
══════════════════════════════ */
function formatBotText(text) {
  // Escape HTML first
  let safe = escapeHtml(text);

  // Convert **bold** to <strong>
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em>
  safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert bullet points (lines starting with - or •)
  const lines = safe.split("\n");
  let inList = false;
  let result = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (!inList) { result.push("<ul>"); inList = true; }
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      if (trimmed === "") {
        result.push("<br/>");
      } else {
        result.push(trimmed);
      }
    }
  }
  if (inList) result.push("</ul>");

  return result.join(" ");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ══════════════════════════════
   7. UTILITY FUNCTIONS
══════════════════════════════ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function truncate(str, maxLen) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

function formatDate(dateStr) {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
    if (diff < 60) return diff + " min ago";
    if (diff < 1440) return Math.floor(diff / 60) + " hrs ago";
    return Math.floor(diff / 1440) + " days ago";
  } catch { return "Recent"; }
}

function openLink(url) {
  if (url && url !== "#") window.open(url, "_blank", "noopener");
}

/* ══════════════════════════════
   8. MANDI RATES (Static Demo)
   Replace with Agmarknet API
   when you get API access
══════════════════════════════ */
function updateMandiRates() {
  // Slight daily variation to simulate live data
  const base = {
    wheat:   { min: 2015, max: 2275, modal: 2150 },
    maize:   { min: 1780, max: 1980, modal: 1870 },
    rice:    { min: 2100, max: 2450, modal: 2300 },
    soybean: { min: 3800, max: 4200, modal: 4000 },
    onion:   { min: 800,  max: 1400, modal: 1100 },
    tomato:  { min: 600,  max: 1200, modal: 900  },
    potato:  { min: 700,  max: 1100, modal: 900  },
    cotton:  { min: 5800, max: 6500, modal: 6100 },
  };

  function vary(val) {
    // ±3% random variation
    return Math.round(val * (0.97 + Math.random() * 0.06));
  }

  const crops = [
    { emoji:"🌾", name:"Wheat",     ...base.wheat   },
    { emoji:"🌽", name:"Maize",     ...base.maize   },
    { emoji:"🍚", name:"Rice",      ...base.rice    },
    { emoji:"🫘", name:"Soybean",   ...base.soybean },
    { emoji:"🧅", name:"Onion",     ...base.onion   },
    { emoji:"🍅", name:"Tomato",    ...base.tomato  },
    { emoji:"🥔", name:"Potato",    ...base.potato  },
    { emoji:"🌿", name:"Cotton",    ...base.cotton  },
  ];

  const mandiRates = document.getElementById("mandiRates");
  if (!mandiRates) return;

  mandiRates.innerHTML = crops.map(c => `
    <div class="mandi-row">
      <span>${c.emoji} ${c.name}</span>
      <span>₹${vary(c.min).toLocaleString("en-IN")}</span>
      <span>₹${vary(c.max).toLocaleString("en-IN")}</span>
      <span>₹${vary(c.modal).toLocaleString("en-IN")}</span>
    </div>
  `).join("");
}

/* ══════════════════════════════
   9. KEYBOARD SHORTCUTS
══════════════════════════════ */
document.addEventListener("keydown", (e) => {
  // Press '/' to focus chat input when panel is open
  if (e.key === "/" && chatOpen) {
    e.preventDefault();
    const chatInput = document.getElementById("chatInput");
    if (chatInput) chatInput.focus();
  }
  // Press Escape to close chat
  if (e.key === "Escape" && chatOpen) {
    toggleChat();
  }
});

/* ══════════════════════════════
   10. INIT — Run on page load
══════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Date & Season
  updateDateDisplay();

  // 2. Weather (auto-detects location)
  fetchWeather();

  // 3. Agriculture News
  fetchNews();

  // 4. Mandi rates
  updateMandiRates();

  // 5. Auto-refresh weather every 10 minutes
  setInterval(fetchWeather, 10 * 60 * 1000);

  // 6. Auto-refresh news every 30 minutes
  setInterval(fetchNews, 30 * 60 * 1000);

  // 7. Update mandi rates every 5 minutes
  setInterval(updateMandiRates, 5 * 60 * 1000);

  // 8. Update date display every minute
  setInterval(updateDateDisplay, 60 * 1000);

  console.log("🌾 KrishiMitra loaded — Jai Kisan!");
});
