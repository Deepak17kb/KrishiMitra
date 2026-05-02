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
  // ✅ Render backend URL — already deployed
  BACKEND_URL: "https://krishi-mitra-backend.onrender.com",

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

/* ══════════════════════════════════════════════
   NEW WIDGETS — KrishiMitra v2.0
══════════════════════════════════════════════ */

/* ── FERTILIZER CALCULATOR ── */
const FERT_DATA = {
  wheat:     { N:120, P:60,  K:40,  label:"Wheat"     },
  rice:      { N:120, P:60,  K:60,  label:"Rice"      },
  maize:     { N:150, P:75,  K:40,  label:"Maize"     },
  cotton:    { N:120, P:60,  K:60,  label:"Cotton"    },
  soybean:   { N:20,  P:80,  K:40,  label:"Soybean"   },
  mustard:   { N:80,  P:40,  K:40,  label:"Mustard"   },
  sugarcane: { N:250, P:100, K:120, label:"Sugarcane" },
  potato:    { N:180, P:100, K:150, label:"Potato"    },
};

// Conversion factors to hectares
const AREA_TO_HA = { acre: 0.4047, bigha: 0.2, hectare: 1 };

// Urea=46%N, DAP=46%P2O5+18%N, MOP=60%K2O, SSP=16%P2O5
function calcFertilizer() {
  const crop = document.getElementById("fertCrop")?.value || "wheat";
  const area = parseFloat(document.getElementById("fertArea")?.value || 1);
  const unit = document.getElementById("fertUnit")?.value || "acre";

  const ha = area * AREA_TO_HA[unit];
  const { N, P, K } = FERT_DATA[crop];

  // kg of nutrient per ha → total kg
  const totalN = N * ha;
  const totalP = P * ha;
  const totalK = K * ha;

  // DAP provides 18%N + 46%P2O5 (as P)
  const dapKg  = Math.round((totalP / 0.46));
  const nFromDAP = dapKg * 0.18;
  const ureaKg = Math.round(((totalN - nFromDAP) / 0.46));
  const mopKg  = Math.round(totalK / 0.60);

  const el = document.getElementById("fertResults");
  if (!el) return;

  el.innerHTML = `
    <div class="fert-item">
      <div class="fert-item-name">Urea</div>
      <div class="fert-item-val">${Math.max(0,ureaKg)}</div>
      <div class="fert-item-unit">kg</div>
    </div>
    <div class="fert-item">
      <div class="fert-item-name">DAP</div>
      <div class="fert-item-val">${dapKg}</div>
      <div class="fert-item-unit">kg</div>
    </div>
    <div class="fert-item">
      <div class="fert-item-name">MOP</div>
      <div class="fert-item-val">${mopKg}</div>
      <div class="fert-item-unit">kg</div>
    </div>
  `;
}

/* ── SEASONAL PEST ALERTS ── */
const PEST_DATA = {
  kharif: {
    badge: "🌧️",
    label: "Kharif Pests (Jun–Oct)",
    subtitle: "High humidity season — watch daily",
    pests: [
      { icon:"🦟", name:"Brown Planthopper (BPH)", desc:"Attacks rice. Check stems weekly. Use Thiamethoxam if > 5/plant.", level:"high" },
      { icon:"🐛", name:"Fall Armyworm", desc:"Damages maize leaves & cobs. Apply Emamectin at night.", level:"high" },
      { icon:"🍄", name:"Blast Disease (Rice)", desc:"White lesions on leaves. Spray Tricyclazole at boot stage.", level:"medium" },
      { icon:"🕷️", name:"Red Mite (Spider Mite)", desc:"Cotton & soybean. Spray Abamectin or neem oil.", level:"medium" },
    ],
    tip: "💡 After rain: inspect field within 48 hrs. Most fungal infections spread fast in wet conditions. Apply protective fungicide before monsoon peaks."
  },
  rabi: {
    badge: "❄️",
    label: "Rabi Pests (Nov–Feb)",
    subtitle: "Cool & dry — aphids peak in Jan",
    pests: [
      { icon:"🐞", name:"Aphids (Mahu)", desc:"Wheat & mustard. Use Yellow sticky traps. Spray Dimethoate if >10/plant.", level:"high" },
      { icon:"🦠", name:"Powdery Mildew", desc:"Wheat, peas. White powdery coating. Spray Sulfur 80 WP at first sign.", level:"medium" },
      { icon:"🌾", name:"Loose Smut (Wheat)", desc:"Black powder in ears. Use certified disease-free seed & Carboxin seed treatment.", level:"medium" },
      { icon:"🐌", name:"Pod Borer (Gram)", desc:"Damages chickpea pods. NPV or Chlorpyrifos spray at 50% flowering.", level:"low" },
    ],
    tip: "💡 Rabi tip: Apply fungicide on dry days. Wet leaves slow absorption. Check wheat weekly for rust — orange spots = act immediately!"
  },
  zaid: {
    badge: "☀️",
    label: "Zaid Pests (Mar–May)",
    subtitle: "Hot season — watermelon & veggie pests",
    pests: [
      { icon:"🦟", name:"Whitefly", desc:"Spreads virus in cucurbits & tomato. Use silver reflective mulch + Imidacloprid.", level:"high" },
      { icon:"🐛", name:"Fruit Fly", desc:"Watermelon & muskmelon. Methyl Eugenol traps + Malathion bait.", level:"high" },
      { icon:"🍄", name:"Downy Mildew (Cucurbit)", desc:"Yellow patches on leaves. Spray Mancozeb 75 WP after rain.", level:"medium" },
      { icon:"🌡️", name:"Heat Stress Wilting", desc:"Not a pest but causes same damage. Irrigate early AM. Use shade nets.", level:"low" },
    ],
    tip: "💡 Zaid tip: Water early morning (5–7 AM) to reduce fungal risk. Evening irrigation in hot weather promotes disease. Use neem-based sprays during peak heat."
  }
};

function updatePestAlerts() {
  const month = new Date().getMonth();
  const season = getSeason(month);
  const data = PEST_DATA[season];

  const seasonInfo = document.getElementById("pestSeasonInfo");
  if (seasonInfo) {
    seasonInfo.innerHTML = `
      <div class="pest-season-badge">${data.badge}</div>
      <div class="pest-season-text">
        ${data.label}
        <span>${data.subtitle}</span>
      </div>
    `;
  }

  const pestList = document.getElementById("pestList");
  if (pestList) {
    pestList.innerHTML = data.pests.map(p => `
      <div class="pest-item">
        <div class="pest-item-icon">${p.icon}</div>
        <div class="pest-item-body">
          <div class="pest-item-name">${p.name}</div>
          <div class="pest-item-desc">${p.desc}</div>
        </div>
        <span class="pest-alert-badge alert-${p.level}">${p.level}</span>
      </div>
    `).join("");
  }

  const pestTip = document.getElementById("pestTip");
  if (pestTip) pestTip.textContent = data.tip;
}

/* ── SUN & FIELD WORK PLANNER ── */
function getSunTimes(lat, lon) {
  // Uses Open-Meteo for sunrise/sunset
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,uv_index_max&timezone=Asia%2FKolkata&forecast_days=1`;
  fetch(url)
    .then(r => r.json())
    .then(data => {
      const sunrise = data.daily.sunrise?.[0];
      const sunset  = data.daily.sunset?.[0];
      const uvMax   = data.daily.uv_index_max?.[0] || 5;

      renderSunPlanner(sunrise, sunset, uvMax);
    })
    .catch(() => renderSunPlanner(null, null, 6));
}

function formatSunTime(isoStr) {
  if (!isoStr) return "--:--";
  const d = new Date(isoStr);
  const h = d.getHours().toString().padStart(2,"0");
  const m = d.getMinutes().toString().padStart(2,"0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const h12 = (d.getHours() % 12 || 12).toString().padStart(2,"0");
  return `${h12}:${m} ${ampm}`;
}

function renderSunPlanner(sunriseISO, sunsetISO, uvMax) {
  const srEl = document.getElementById("sunriseTime");
  const ssEl = document.getElementById("sunsetTime");
  if (srEl) srEl.textContent = formatSunTime(sunriseISO);
  if (ssEl) ssEl.textContent = formatSunTime(sunsetISO);

  // Animate sun arc
  const now = new Date();
  let progress = 0;
  if (sunriseISO && sunsetISO) {
    const sr = new Date(sunriseISO).getTime();
    const ss = new Date(sunsetISO).getTime();
    const nowT = now.getTime();
    progress = Math.max(0, Math.min(1, (nowT - sr) / (ss - sr)));
  }

  const arcPath = document.getElementById("sunArcProgress");
  const sunDot  = document.getElementById("sunDot");
  if (arcPath) arcPath.style.strokeDashoffset = (220 - (220 * progress)).toFixed(1);

  // Move sun dot along arc
  if (sunDot) {
    const angle = Math.PI - (progress * Math.PI); // 180deg to 0deg
    const cx = 80 + 70 * Math.cos(angle);
    const cy = 85 - 70 * Math.sin(angle);
    sunDot.setAttribute("cx", cx.toFixed(1));
    sunDot.setAttribute("cy", cy.toFixed(1));
  }

  // Field work time slots based on sunrise/sunset
  const slotsEl = document.getElementById("fieldworkSlots");
  if (slotsEl) {
    const srHour = sunriseISO ? new Date(sunriseISO).getHours() : 6;
    const ssHour = sunsetISO  ? new Date(sunsetISO).getHours()  : 18;
    const slots = [
      { time: `${srHour}:00 – ${srHour+2}:00 AM`, icon:"✅", task:"Ideal: Irrigation, pesticide spraying & light field work", cls:"fw-slot-ideal" },
      { time: `${srHour+2}:00 AM – 12:00 PM`,     icon:"✅", task:"Good: Weeding, planting, transplanting seedlings", cls:"fw-slot-ideal" },
      { time: "12:00 PM – 3:00 PM",                icon:"❌", task:"Avoid: Peak heat — risk of heat stress. Rest & hydrate.", cls:"fw-slot-avoid" },
      { time: `3:00 PM – ${ssHour}:00 PM`,         icon:"🟡", task:"Okay: Harvesting, heavy farm work in shade", cls:"fw-slot-okay" },
    ];
    slotsEl.innerHTML = slots.map(s => `
      <div class="fw-slot ${s.cls}">
        <div class="fw-slot-time">${s.time}</div>
        <div class="fw-slot-icon">${s.icon}</div>
        <div class="fw-slot-task">${s.task}</div>
      </div>
    `).join("");
  }

  // UV bar
  const uvBadge = document.getElementById("uvBadge");
  const uvFill  = document.getElementById("uvBarFill");
  const uvAdvice = document.getElementById("uvAdvice");
  const uvPct = Math.min(100, (uvMax / 11) * 100);

  if (uvBadge) uvBadge.textContent = uvMax.toFixed(1);
  if (uvFill)  uvFill.style.width  = uvPct + "%";

  const uvMsg =
    uvMax >= 11 ? "🔴 Extreme UV! Avoid outdoor work 10AM–4PM. Cover crops if possible." :
    uvMax >= 8  ? "🟠 Very High UV. Wear full-sleeve & hat. Spray before 9 AM." :
    uvMax >= 6  ? "🟡 High UV. Complete spraying before 10 AM. Stay hydrated." :
    uvMax >= 3  ? "🟢 Moderate UV. Good conditions for field work with precautions." :
                  "✅ Low UV. Comfortable for all-day field work.";

  if (uvAdvice) uvAdvice.textContent = uvMsg;
}

/* ── CROP PRICE TREND CHART ── */
const TREND_DATA = {
  wheat:  { color:"#4a8c47", base:2150, volatility:60  },
  rice:   { color:"#2196F3", base:2300, volatility:80  },
  onion:  { color:"#e8a820", base:1100, volatility:200 },
  tomato: { color:"#c0392b", base:900,  volatility:250 },
};

let trendChart = null;
let currentTrendCrop = "wheat";

function generateTrendData(crop) {
  const { base, volatility } = TREND_DATA[crop];
  const labels = [];
  const prices = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { day:"numeric", month:"short" }));
    const seed = d.getDate() * 17 + d.getMonth() * 31 + crop.charCodeAt(0);
    const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
    prices.push(Math.round(base + (pseudo - 0.5) * volatility * 2));
  }
  return { labels, prices };
}

function showTrend(crop, btn) {
  currentTrendCrop = crop;
  document.querySelectorAll(".trend-tab").forEach(t => t.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const { labels, prices } = generateTrendData(crop);
  const { color } = TREND_DATA[crop];

  const ctx = document.getElementById("trendChart");
  if (!ctx) return;

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: color,
        backgroundColor: color + "18",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => "₹" + ctx.parsed.y.toLocaleString("en-IN") + "/qtl"
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: { font: { size: 10 }, color: "#6b8c64" }
        },
        y: {
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: {
            font: { size: 10 },
            color: "#6b8c64",
            callback: v => "₹" + v.toLocaleString("en-IN")
          }
        }
      }
    }
  });

  // Summary stats
  const min   = Math.min(...prices);
  const max   = Math.max(...prices);
  const avg   = Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);
  const trend = prices[6] > prices[0] ? "up" : "down";
  const change = prices[6] - prices[0];
  const pct   = ((Math.abs(change)/prices[0])*100).toFixed(1);

  const summaryEl = document.getElementById("trendSummary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="trend-stat">
        <div class="trend-stat-val">₹${min.toLocaleString("en-IN")}</div>
        <div class="trend-stat-lbl">7-Day Low</div>
      </div>
      <div class="trend-stat">
        <div class="trend-stat-val">₹${max.toLocaleString("en-IN")}</div>
        <div class="trend-stat-lbl">7-Day High</div>
      </div>
      <div class="trend-stat">
        <div class="trend-stat-val">₹${avg.toLocaleString("en-IN")}</div>
        <div class="trend-stat-lbl">Avg Price</div>
      </div>
      <div class="trend-stat">
        <div class="trend-stat-val ${trend}">${trend==="up"?"▲":"▼"} ${pct}%</div>
        <div class="trend-stat-lbl">7-Day Change</div>
      </div>
    `;
  }
}

/* ── CHAT SUGGESTION PAGINATION ── */
let currentSuggPage = 0;
const TOTAL_SUGG_PAGES = 4;

function changeSuggPage(dir) {
  const prev = currentSuggPage;
  currentSuggPage = (currentSuggPage + dir + TOTAL_SUGG_PAGES) % TOTAL_SUGG_PAGES;

  document.getElementById(`suggestionRow${prev}`)?.style && (document.getElementById(`suggestionRow${prev}`).style.display = "none");
  document.getElementById(`suggestionRow${currentSuggPage}`)?.style && (document.getElementById(`suggestionRow${currentSuggPage}`).style.display = "flex");

  document.querySelectorAll(".sugg-dot").forEach((d, i) => {
    d.classList.toggle("active", i === currentSuggPage);
  });
}

/* ── HOOK INTO INIT ── */
document.addEventListener("DOMContentLoaded", () => {
  // Fertilizer calculator
  calcFertilizer();

  // Pest alerts
  updatePestAlerts();

  // Sun planner (waits for geolocation to set userLat/userLon — retry after weather loads)
  setTimeout(() => getSunTimes(userLat, userLon), 2000);

  // Price trend chart
  showTrend("wheat", null);

  // Suggestion page dots click
  document.querySelectorAll(".sugg-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const page = parseInt(dot.dataset.page);
      const diff = page - currentSuggPage;
      if (diff !== 0) changeSuggPage(diff);
    });
  });

  // New features init
  calcProfit();
  updateSoilPh(6.5);
  showSoilType("loamy", null);
  initIrrigationTracker();
});

/* ══════════════════════════════════════════════
   NEW FEATURES — KrishiMitra v2.0
══════════════════════════════════════════════ */

/* ── CROP PROFIT CALCULATOR ── */
const PROFIT_DEFAULTS = {
  wheat:   { yield: 20,  price: 2150, cost: 18000 },
  rice:    { yield: 25,  price: 2300, cost: 22000 },
  maize:   { yield: 22,  price: 1870, cost: 14000 },
  cotton:  { yield: 18,  price: 6100, cost: 35000 },
  soybean: { yield: 12,  price: 4000, cost: 16000 },
  mustard: { yield: 14,  price: 5200, cost: 15000 },
  onion:   { yield: 80,  price: 1100, cost: 25000 },
  potato:  { yield: 100, price: 900,  cost: 30000 },
};

// Update defaults when crop changes
document.addEventListener("DOMContentLoaded", () => {
  const cropSel = document.getElementById("profitCrop");
  if (cropSel) {
    cropSel.addEventListener("change", () => {
      const crop = cropSel.value;
      const d = PROFIT_DEFAULTS[crop];
      if (d) {
        document.getElementById("profitYield").value = d.yield;
        document.getElementById("profitPrice").value = d.price;
        document.getElementById("profitCost").value  = d.cost;
      }
      calcProfit();
    });
  }
});

function calcProfit() {
  const crop     = document.getElementById("profitCrop")?.value || "wheat";
  const area     = parseFloat(document.getElementById("profitArea")?.value || 1);
  const areaUnit = document.getElementById("profitAreaUnit")?.value || "acre";
  const yieldQtl = parseFloat(document.getElementById("profitYield")?.value || 20);
  const price    = parseFloat(document.getElementById("profitPrice")?.value || 2150);
  const cost     = parseFloat(document.getElementById("profitCost")?.value || 18000);

  if (isNaN(yieldQtl) || isNaN(price) || isNaN(cost) || isNaN(area)) return;

  // Adjust cost by area (input cost is per acre equivalent)
  const areaInAcres = area * { acre:1, bigha:0.494, hectare:2.47 }[areaUnit];
  const scaledCost  = cost * areaInAcres;

  const grossRevenue = yieldQtl * price * areaInAcres;
  const netProfit    = grossRevenue - scaledCost;
  const profitPct    = scaledCost > 0 ? ((netProfit / scaledCost) * 100).toFixed(1) : 0;
  const perQtlProfit = yieldQtl > 0 ? Math.round(netProfit / (yieldQtl * areaInAcres)) : 0;

  const isProfit = netProfit >= 0;
  const el = document.getElementById("profitResult");
  if (!el) return;

  // MSP reference
  const MSP = { wheat:2275, rice:2300, maize:1870, cotton:6620, soybean:4600, mustard:5650, onion:0, potato:0 };
  const mspVal = MSP[crop];
  const mspNote = mspVal
    ? `<div class="profit-msp">📋 MSP 2024-25: ₹${mspVal.toLocaleString("en-IN")}/qtl · ${price >= mspVal ? "✅ Above MSP" : "⚠️ Below MSP — consider waiting"}</div>`
    : "";

  el.innerHTML = `
    <div class="profit-summary ${isProfit ? "profit-positive" : "profit-negative"}">
      <div class="profit-main-val">${isProfit ? "+" : ""}₹${Math.abs(Math.round(netProfit)).toLocaleString("en-IN")}</div>
      <div class="profit-main-lbl">${isProfit ? "Estimated Profit" : "Estimated Loss"}</div>
    </div>
    <div class="profit-breakdown">
      <div class="pb-item">
        <span>Gross Revenue</span>
        <span>₹${Math.round(grossRevenue).toLocaleString("en-IN")}</span>
      </div>
      <div class="pb-item">
        <span>Total Input Cost</span>
        <span>₹${Math.round(scaledCost).toLocaleString("en-IN")}</span>
      </div>
      <div class="pb-item pb-highlight">
        <span>ROI (Return on Investment)</span>
        <span class="${isProfit ? "profit-up" : "profit-down"}">${profitPct}%</span>
      </div>
      <div class="pb-item">
        <span>Profit per Quintal</span>
        <span>₹${perQtlProfit.toLocaleString("en-IN")}/qtl</span>
      </div>
    </div>
    ${mspNote}
  `;
}

/* ── SOIL pH CHECKER ── */
function updateSoilPh(val) {
  val = parseFloat(val);
  const display = document.getElementById("phDisplay");
  if (display) display.textContent = val.toFixed(1);

  // Move marker
  const pct = ((val - 4) / (9 - 4)) * 100;
  const marker = document.getElementById("phMarker");
  if (marker) marker.style.left = pct + "%";

  // Slider background
  const slider = document.getElementById("soilPhSlider");
  if (slider) slider.value = val;

  // Result
  const el = document.getElementById("soilPhResult");
  if (!el) return;

  let status, color, crops, amendment;
  if (val < 5.0) {
    status = "Very Acidic 🔴"; color = "#c0392b";
    crops = "Blueberry, Tea — most crops will struggle";
    amendment = "Apply Agricultural Lime 2–4 tonnes/ha to raise pH";
  } else if (val < 6.0) {
    status = "Acidic 🟠"; color = "#e67e22";
    crops = "Potato, Sweet Potato, Maize (with amendments)";
    amendment = "Apply 1–2 tonnes/ha lime. Test again after 3 months.";
  } else if (val <= 7.0) {
    status = "Ideal / Neutral ✅"; color = "#27ae60";
    crops = "Wheat, Rice, Maize, Vegetables — excellent for most crops!";
    amendment = "No amendment needed. Maintain with organic matter.";
  } else if (val <= 7.5) {
    status = "Slightly Alkaline 🟡"; color = "#f39c12";
    crops = "Cotton, Barley, Sugar Beet — tolerates mild alkalinity";
    amendment = "Add organic compost or Gypsum to lower pH gradually.";
  } else if (val <= 8.5) {
    status = "Alkaline 🟠"; color = "#e67e22";
    crops = "Date Palm, some Pulses — limited crop options";
    amendment = "Apply Sulphur 250–500 kg/ha. Use acidifying fertilizers.";
  } else {
    status = "Very Alkaline 🔴"; color = "#c0392b";
    crops = "Very few crops — soil reclamation needed";
    amendment = "Deep ploughing + Gypsum + Organic manure required.";
  }

  el.innerHTML = `
    <div class="ph-status-badge" style="background:${color}20;color:${color};border-color:${color}40">${status}</div>
    <div class="ph-crops"><strong>Best Crops:</strong> ${crops}</div>
    <div class="ph-amendment"><strong>💊 Remedy:</strong> ${amendment}</div>
  `;
}

const SOIL_TYPES = {
  loamy: {
    icon: "🟫",
    title: "Loamy Soil",
    desc: "Best soil for farming — good drainage, retains moisture & nutrients.",
    crops: "Wheat, Rice, Cotton, Vegetables, Fruits — almost all crops",
    tips: ["Maintain organic matter with compost", "Crop rotation recommended", "Minimum tillage preferred", "NPK 120:60:40 for wheat"],
    color: "#8d6e63"
  },
  clay: {
    icon: "🏺",
    title: "Clay Soil",
    desc: "Heavy, retains water well but poor drainage. Can become waterlogged.",
    crops: "Rice, Sugarcane, Wheat (in some regions)",
    tips: ["Deep ploughing to improve structure", "Add sand + compost to improve drainage", "Avoid working when wet — compaction risk", "Raised beds for vegetables"],
    color: "#795548"
  },
  sandy: {
    icon: "🏜️",
    title: "Sandy Soil",
    desc: "Light, drains fast, low nutrient retention. Needs frequent irrigation.",
    crops: "Groundnut, Watermelon, Potato, Carrot, Sweet Potato",
    tips: ["Add compost/FYM liberally (10 t/ha)", "Drip irrigation preferred", "Split fertilizer doses — 3-4 times", "Mulching essential to retain moisture"],
    color: "#f9a825"
  },
  black: {
    icon: "⬛",
    title: "Black Cotton Soil (Regur)",
    desc: "Highly fertile, moisture-retaining. Sticky when wet, hard when dry.",
    crops: "Cotton, Soybean, Jowar, Wheat, Sunflower",
    tips: ["Avoid deep tillage when wet", "No irrigation needed for rabi in deep soils", "Add lime if acidic", "Ideal for cotton — no amendments needed"],
    color: "#37474f"
  }
};

function showSoilType(type, btn) {
  if (btn) {
    document.querySelectorAll(".soil-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
  } else {
    document.querySelectorAll(".soil-tab").forEach((t, i) => {
      t.classList.toggle("active", ["loamy","clay","sandy","black"][i] === type);
    });
  }
  const d = SOIL_TYPES[type];
  const el = document.getElementById("soilTypeResult");
  if (!el || !d) return;

  el.innerHTML = `
    <div class="soil-type-card" style="border-color:${d.color}30">
      <div class="stc-top">
        <span class="stc-icon">${d.icon}</span>
        <div>
          <div class="stc-title" style="color:${d.color}">${d.title}</div>
          <div class="stc-desc">${d.desc}</div>
        </div>
      </div>
      <div class="stc-crops">🌱 <strong>Best Crops:</strong> ${d.crops}</div>
      <ul class="stc-tips">
        ${d.tips.map(t => `<li>• ${t}</li>`).join("")}
      </ul>
    </div>
  `;
}

/* ── IRRIGATION TRACKER ── */
const DEFAULT_IRR_CROPS = [
  { name: "Wheat",   icon: "🌾", lastIrr: 5,  interval: 10, done: false },
  { name: "Onion",   icon: "🧅", lastIrr: 2,  interval: 5,  done: false },
  { name: "Tomato",  icon: "🍅", lastIrr: 1,  interval: 3,  done: false },
];

let irrCrops = JSON.parse(localStorage.getItem("krishimitra_irr") || "null") || DEFAULT_IRR_CROPS.map(c => ({...c}));

function saveIrrCrops() {
  try { localStorage.setItem("krishimitra_irr", JSON.stringify(irrCrops)); } catch {}
}

function initIrrigationTracker() {
  renderIrrList();
  updateIrrWeatherStrip();
}

function updateIrrWeatherStrip() {
  const strip = document.getElementById("irrWeatherStrip");
  const msgEl = document.getElementById("irrWeatherMsg");
  const iconEl = document.getElementById("irrWeatherIcon");
  if (!strip || !msgEl) return;

  if (currentWeather) {
    const { rainChance, temp, code } = currentWeather;
    if (rainChance >= 70) {
      iconEl.textContent = "🌧️";
      msgEl.textContent = `Rain ${rainChance}% likely today — skip irrigation, save water!`;
      strip.style.background = "rgba(33,150,243,0.10)";
      strip.style.borderColor = "rgba(33,150,243,0.25)";
    } else if (rainChance >= 40) {
      iconEl.textContent = "⛅";
      msgEl.textContent = `${rainChance}% rain chance — light irrigation may be sufficient.`;
      strip.style.background = "rgba(255,193,7,0.10)";
    } else if (temp > 38) {
      iconEl.textContent = "🌡️";
      msgEl.textContent = `Very hot (${temp}°C) — irrigate early morning (5–7 AM) only.`;
      strip.style.background = "rgba(244,67,54,0.08)";
    } else {
      iconEl.textContent = "✅";
      msgEl.textContent = `Good weather for irrigation. Best time: 6–9 AM or after 5 PM.`;
    }
  } else {
    msgEl.textContent = "Best irrigation time: Early morning (5–8 AM) or evening (5–7 PM).";
  }
}

function renderIrrList() {
  const list = document.getElementById("irrCropList");
  if (!list) return;

  list.innerHTML = irrCrops.map((crop, i) => {
    const daysUntil = crop.interval - crop.lastIrr;
    const urgency = daysUntil <= 0 ? "irr-urgent" : daysUntil <= 1 ? "irr-soon" : "irr-ok";
    const label   = daysUntil <= 0 ? "Irrigate NOW" : daysUntil === 1 ? "Due tomorrow" : `In ${daysUntil} days`;
    return `
      <div class="irr-crop-item ${crop.done ? "irr-done" : ""} ${urgency}">
        <div class="irr-check">
          <input type="checkbox" id="irrCheck${i}" ${crop.done ? "checked" : ""} onchange="toggleIrrDone(${i}, this.checked)"/>
        </div>
        <label class="irr-crop-label" for="irrCheck${i}">
          <span class="irr-icon">${crop.icon}</span>
          <span class="irr-name">${crop.name}</span>
        </label>
        <div class="irr-status">
          <div class="irr-label-badge ${urgency}-badge">${label}</div>
          <div class="irr-interval">Every ${crop.interval} days</div>
        </div>
        <button class="irr-del" onclick="removeIrrCrop(${i})" title="Remove">×</button>
      </div>
    `;
  }).join("") || `<div class="irr-empty">No crops added. Click "+ Add Crop" below.</div>`;

  // Tips
  const tipsEl = document.getElementById("irrTips");
  if (tipsEl) {
    const month = new Date().getMonth();
    const tips = month >= 5 && month <= 9
      ? ["🌧️ Kharif: Monitor waterlogging in rice fields", "💧 Use drip for cotton — saves 40% water", "⏱️ Irrigate between 5–8 AM to reduce evaporation"]
      : ["❄️ Rabi: Wheat needs 4–6 irrigations total", "🕐 Critical stages: CRI (21 days), Jointing, Heading", "🌡️ Avoid irrigation when frost is expected at night"];
    tipsEl.innerHTML = tips.map(t => `<div class="irr-tip-item">${t}</div>`).join("");
  }
}

function toggleIrrDone(i, checked) {
  irrCrops[i].done = checked;
  if (checked) irrCrops[i].lastIrr = 0; // reset counter — just irrigated
  saveIrrCrops();
  renderIrrList();
}

function removeIrrCrop(i) {
  irrCrops.splice(i, 1);
  saveIrrCrops();
  renderIrrList();
}

function addIrrCrop() {
  const name = prompt("Enter crop name (e.g., Mustard, Bajra):");
  if (!name || !name.trim()) return;
  const interval = parseInt(prompt(`Irrigation interval for ${name} (days)?`) || "7");
  irrCrops.push({ name: name.trim(), icon: "🌿", lastIrr: interval - 1, interval: isNaN(interval) ? 7 : interval, done: false });
  saveIrrCrops();
  renderIrrList();
}

function resetIrrigation() {
  if (confirm("Reset irrigation checklist to defaults?")) {
    irrCrops = DEFAULT_IRR_CROPS.map(c => ({...c}));
    saveIrrCrops();
    renderIrrList();
  }
}

// Update irrigation weather strip when weather loads
const _origGetWeatherData = getWeatherData;
// Patch after weather loads
const _irrWeatherPatch = setInterval(() => {
  if (currentWeather) {
    updateIrrWeatherStrip();
    clearInterval(_irrWeatherPatch);
  }
}, 2000);

/* ── GOVERNMENT SCHEME ELIGIBILITY CHECKER ── */
let schemeAadhar = "yes";

function setSchemeToggle(type, val) {
  if (type === "aadhar") {
    schemeAadhar = val;
    document.getElementById("schemeAadharYes").classList.toggle("active", val === "yes");
    document.getElementById("schemeAadharNo").classList.toggle("active", val === "no");
  }
}

const SCHEMES_DB = [
  {
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    icon: "💰",
    benefit: "₹6,000/year in 3 installments of ₹2,000 directly to bank",
    eligibility: { land: ["small","marginal"], aadhar: "yes" },
    helpline: "155261 / 011-23381092",
    url: "https://pmkisan.gov.in",
    color: "#27ae60"
  },
  {
    name: "PM Fasal Bima Yojana (Crop Insurance)",
    icon: "🛡️",
    benefit: "Crop loss coverage at 1.5–2% premium for Rabi, 2% for Kharif",
    eligibility: { land: ["small","marginal","medium"], aadhar: "yes" },
    helpline: "14447",
    url: "https://pmfby.gov.in",
    color: "#2196f3"
  },
  {
    name: "Kisan Credit Card (KCC)",
    icon: "💳",
    benefit: "Crop loans at 4% interest (subsidized). Up to ₹3 lakh for crop needs",
    eligibility: { land: ["small","marginal","medium","large"], aadhar: "yes" },
    helpline: "Contact nearest bank / Kisan Call Center: 1800-180-1551",
    url: "https://www.nabard.org/content1.aspx?id=596",
    color: "#9c27b0"
  },
  {
    name: "Soil Health Card Scheme",
    icon: "🧪",
    benefit: "Free soil testing + personalized fertilizer recommendations",
    eligibility: { land: ["small","marginal","medium","large"], aadhar: "any" },
    helpline: "Contact nearest KVK or Agriculture Department",
    url: "https://soilhealth.dac.gov.in",
    color: "#795548"
  },
  {
    name: "SMAM — Sub-Mission on Agricultural Mechanization",
    icon: "🚜",
    benefit: "50–80% subsidy on tractors, harvesters, implements for small farmers",
    eligibility: { land: ["small","marginal"], aadhar: "yes" },
    helpline: "Nearest Krishi Vigyan Kendra (KVK)",
    url: "https://agrimachinery.nic.in",
    color: "#ff9800"
  },
  {
    name: "eNAM — National Agriculture Market",
    icon: "📱",
    benefit: "Sell crops online at best mandi prices across India — no middlemen",
    eligibility: { land: ["small","marginal","medium","large"], aadhar: "yes" },
    helpline: "1800-270-0224",
    url: "https://enam.gov.in",
    color: "#00bcd4"
  },
  {
    name: "RKVY — Rashtriya Krishi Vikas Yojana",
    icon: "🏗️",
    benefit: "Infrastructure grants — cold storage, irrigation, farm ponds",
    eligibility: { land: ["medium","large"], aadhar: "any" },
    helpline: "State Agriculture Department",
    url: "https://rkvy.nic.in",
    color: "#607d8b"
  },
];

function checkSchemes() {
  const land = document.getElementById("schemeLand")?.value || "small";
  const el   = document.getElementById("schemeResults");
  if (!el) return;

  const eligible = SCHEMES_DB.filter(s => {
    const landOk   = s.eligibility.land.includes(land);
    const aadharOk = s.eligibility.aadhar === "any" || s.eligibility.aadhar === schemeAadhar;
    return landOk && aadharOk;
  });

  if (eligible.length === 0) {
    el.innerHTML = `<div class="scheme-no-result">⚠️ No matching schemes found. Contact your local agriculture office.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="scheme-result-header">${eligible.length} schemes found for you!</div>
    ${eligible.map(s => `
      <div class="scheme-result-item" onclick="window.open('${s.url}','_blank')" style="border-left-color:${s.color}">
        <div class="sri-top">
          <span class="sri-icon">${s.icon}</span>
          <div class="sri-name">${s.name}</div>
        </div>
        <div class="sri-benefit">${s.benefit}</div>
        <div class="sri-helpline">📞 ${s.helpline}</div>
      </div>
    `).join("")}
    <div class="scheme-disclaimer">* Eligibility may vary. Visit official websites or your state agriculture portal for final confirmation.</div>
  `;
}

/* ── MANDI RATES: Add trend arrows to existing table ── */
function getMandiTrend(cropKey) {
  const seed = new Date().getDate() + cropKey.charCodeAt(0);
  const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
  if (pseudo > 0.6) return { arrow: "▲", cls: "mandi-up",   pct: (pseudo * 3).toFixed(1) };
  if (pseudo < 0.4) return { arrow: "▼", cls: "mandi-down", pct: (pseudo * 3).toFixed(1) };
  return { arrow: "─", cls: "mandi-flat", pct: "0.0" };
}

// Patch updateMandiRates to include trend arrows
const _originalUpdateMandiRates = updateMandiRates;
function updateMandiRates() {
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
    return Math.round(val * (0.97 + Math.random() * 0.06));
  }

  const crops = [
    { emoji:"🌾", name:"Wheat",   key:"wheat",   ...base.wheat   },
    { emoji:"🌽", name:"Maize",   key:"maize",   ...base.maize   },
    { emoji:"🍚", name:"Rice",    key:"rice",    ...base.rice    },
    { emoji:"🫘", name:"Soybean", key:"soybean", ...base.soybean },
    { emoji:"🧅", name:"Onion",   key:"onion",   ...base.onion   },
    { emoji:"🍅", name:"Tomato",  key:"tomato",  ...base.tomato  },
    { emoji:"🥔", name:"Potato",  key:"potato",  ...base.potato  },
    { emoji:"🌿", name:"Cotton",  key:"cotton",  ...base.cotton  },
  ];

  const mandiRates = document.getElementById("mandiRates");
  if (!mandiRates) return;

  mandiRates.innerHTML = crops.map(c => {
    const trend = getMandiTrend(c.key);
    return `
      <div class="mandi-row">
        <span>${c.emoji} ${c.name}</span>
        <span>₹${vary(c.min).toLocaleString("en-IN")}</span>
        <span>₹${vary(c.max).toLocaleString("en-IN")}</span>
        <span class="mandi-modal-cell">
          ₹${vary(c.modal).toLocaleString("en-IN")}
          <span class="${trend.cls} mandi-trend-arrow">${trend.arrow}${trend.pct}%</span>
        </span>
      </div>
    `;
  }).join("");
}
