/* ═══════════════════════════════════════════════════
   KRISHIMITRA | script.js
   Kisan ka Sachcha Mitra | Frontend Logic
   - Hindi / English switch
   - Location (GPS, search, remembered choice)
   - Weather, 7 days, spray times, watering advice
     (Open-Meteo: FREE, no key needed)
   - What to sow, pests, government price (MSP)
   - Calculators (fertilizer, profit, land units)
   - Chatbot (connects to backend/server.js)
═══════════════════════════════════════════════════ */
"use strict";

/* ══════════════════════════════
   CONFIG
══════════════════════════════ */
const CONFIG = {
  // Backend on Render
  BACKEND_URL: "https://krishimitra-backend-6spu.onrender.com",

  // Used instead when the page is opened with ?backend=local
  // (for testing a backend running on this computer)
  LOCAL_BACKEND_URL: "http://localhost:3000",

  // Shown until the visitor shares or picks a place
  DEFAULT_PLACE: { name: "New Delhi", region: "Delhi", lat: 28.6139, lon: 77.209 },

  WEATHER_REFRESH_MS: 15 * 60 * 1000,
  WEATHER_CACHE_MS: 10 * 60 * 1000,
  CHAT_TIMEOUT_MS: 75 * 1000,
};

const BACKEND_URL = new URLSearchParams(location.search).get("backend") === "local"
  ? CONFIG.LOCAL_BACKEND_URL
  : CONFIG.BACKEND_URL;

/* ══════════════════════════════
   SMALL HELPERS
══════════════════════════════ */
const $ = id => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function esc(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, ch => map[ch]);
}

function num(value, digits = 0) {
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: digits });
}

const rupees = value => "₹" + num(Math.round(value));
const sum = list => list.reduce((total, v) => total + (v ?? 0), 0);

// Storage can be blocked (private mode), so never let it break the page
function readStore(area, key) {
  try { return JSON.parse(window[area + "Storage"].getItem(key)); } catch { return null; }
}
function writeStore(area, key, value) {
  try { window[area + "Storage"].setItem(key, JSON.stringify(value)); } catch { /* blocked or full */ }
}

/* ══════════════════════════════
   LANGUAGE (English / Hindi)
   - Fixed text in index.html carries its Hindi in a data-hi attribute
   - Text made here uses tr("English", "हिंदी")
   - Lists of data keep both as [English, Hindi] pairs, read with pick()
══════════════════════════════ */
let lang = readStore("local", "km_lang");
if (lang !== "hi" && lang !== "en") {
  lang = (navigator.language || "").toLowerCase().startsWith("hi") ? "hi" : "en";
}

const tr = (en, hi) => (lang === "hi" ? hi : en);
const pick = pair => pair[lang === "hi" ? 1 : 0];

function applyStaticText() {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-hi]").forEach(el => {
    if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
    el.innerHTML = lang === "hi" ? el.dataset.hi : el.dataset.en;
  });
  document.querySelectorAll("[data-hi-placeholder]").forEach(el => {
    if (el.dataset.enPlaceholder === undefined) el.dataset.enPlaceholder = el.placeholder;
    el.placeholder = lang === "hi" ? el.dataset.hiPlaceholder : el.dataset.enPlaceholder;
  });

  // The button always shows the language you can switch to
  setText("langBtn", lang === "hi" ? "English" : "हिंदी");
}

/* ══════════════════════════════
   DATE & SEASON
══════════════════════════════ */
const MONTHS = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  hi: ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"],
};
const MONTHS_SHORT = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  hi: ["जन.","फ़र.","मार्च","अप्रैल","मई","जून","जुलाई","अग.","सित.","अक्टू.","नव.","दिस."],
};
const WEEKDAYS = {
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  hi: ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"],
};
const WEEKDAYS_SHORT = {
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  hi: ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"],
};

const SEASONS = {
  kharif: ["Kharif", "खरीफ़"],
  rabi:   ["Rabi", "रबी"],
  zaid:   ["Zaid", "ज़ायद"],
};

function getSeason(month) {
  // month is 0-indexed
  if (month >= 5 && month <= 9)  return "kharif";   // Jun to Oct
  if (month >= 10 || month <= 1) return "rabi";     // Nov to Feb
  return "zaid";                                     // Mar to May
}

// Hindi says the part of the day instead of am / pm
function dayPart(hour) {
  if (hour < 4)  return "रात";
  if (hour < 12) return "सुबह";
  if (hour < 16) return "दोपहर";
  if (hour < 20) return "शाम";
  return "रात";
}

function hourLabel(hour) {
  const h = hour % 24;
  const h12 = h % 12 || 12;
  return lang === "hi" ? `${dayPart(h)} ${h12}` : `${h12} ${h < 12 ? "am" : "pm"}`;
}

const hourRange = (from, to) => tr(
  `${hourLabel(from)} to ${hourLabel(to)}`,
  `${hourLabel(from)} से ${hourLabel(to)} बजे`
);

// Open-Meteo sends local times as "2026-10-03T06:21". Read them as written.
function clock(iso) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  const time = `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
  return lang === "hi" ? `${dayPart(h)} ${time}` : `${time} ${h < 12 ? "am" : "pm"}`;
}

const dayName = isoDate => WEEKDAYS_SHORT[lang][new Date(isoDate + "T12:00").getDay()];

function monthRange([first, last]) {
  const names = MONTHS_SHORT[lang];
  return names[first - 1] + (last !== first ? tr(" to ", " से ") + names[last - 1] : "");
}

function renderDate() {
  const now = new Date();
  const season = pick(SEASONS[getSeason(now.getMonth())]);
  setText("heroDate", `${WEEKDAYS[lang][now.getDay()]}, ${now.getDate()} ${MONTHS[lang][now.getMonth()]}`);
  setText("heroSeason", tr(`${season} season`, `${season} का मौसम`));
}

/* ══════════════════════════════
   LOCATION
══════════════════════════════ */
let place = { ...CONFIG.DEFAULT_PLACE, auto: true, isDefault: true };

function placeLabel() {
  return place.region && place.region !== place.name ? `${place.name}, ${place.region}` : place.name;
}

function setPlace(next) {
  place = next;
  writeStore("local", "km_place", place);
  setText("locationLabel", place.name);
  loadWeather({ force: true });
}

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), reject, {
      timeout: 10000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

async function reverseGeocode(lat, lon) {
  const fallback = { name: tr("Your place", "आपकी जगह"), region: "" };
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    return { name: data.city || data.locality || fallback.name, region: data.principalSubdivision || "" };
  } catch {
    return fallback;
  }
}

async function useDeviceLocation({ force = false } = {}) {
  const { latitude, longitude } = await locate();

  // Same spot as last time: nothing to update
  const moved = Math.abs(latitude - place.lat) > 0.03 || Math.abs(longitude - place.lon) > 0.03;
  if (!force && !moved && !place.isDefault) return;

  const named = await reverseGeocode(latitude, longitude);
  setPlace({ ...named, lat: +latitude.toFixed(4), lon: +longitude.toFixed(4), auto: true });
}

async function searchPlaces(query) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    `&count=6&language=en&format=json&countryCode=IN`
  );
  const data = await res.json();
  return (data.results || []).map(r => ({
    name: r.name,
    region: [r.admin2, r.admin1].filter(Boolean).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

function initLocation() {
  const saved = readStore("local", "km_place");
  if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) place = saved;
  setText("locationLabel", place.name);

  const dialog = $("locationDialog");
  const status = $("locationStatus");
  const results = $("locationResults");

  // Older iPhones do not have showModal()
  const open = () => (dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", ""));
  const close = () => (dialog.close ? dialog.close() : dialog.removeAttribute("open"));

  $("locationBtn").addEventListener("click", () => {
    status.textContent = "";
    results.innerHTML = "";
    open();
  });
  $("locationClose").addEventListener("click", close);
  dialog.addEventListener("click", e => { if (e.target === dialog) close(); });

  $("locationForm").addEventListener("submit", async e => {
    e.preventDefault();
    const query = $("locationQuery").value.trim();
    if (query.length < 2) return;

    status.textContent = tr("Searching…", "खोज रहे हैं…");
    results.innerHTML = "";
    try {
      const found = await searchPlaces(query);
      status.textContent = found.length ? "" : tr(
        "No place found with that name. Try the nearest town.",
        "इस नाम की कोई जगह नहीं मिली। पास के क़स्बे का नाम लिखें।"
      );
      results.innerHTML = found.map((p, i) => `
        <li><button class="result-btn" type="button" data-index="${i}" style="animation-delay:${i * 50}ms">
          ${esc(p.name)}<span>${esc(p.region)}</span>
        </button></li>
      `).join("");
      results.querySelectorAll(".result-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const p = found[btn.dataset.index];
          setPlace({ name: p.name, region: p.region.split(", ").pop(), lat: p.lat, lon: p.lon, auto: false });
          close();
        });
      });
    } catch {
      status.textContent = tr(
        "Search did not work. Check your internet and try again.",
        "खोज नहीं हो पाई। इंटरनेट जाँचकर फिर कोशिश करें।"
      );
    }
  });

  $("useMyLocation").addEventListener("click", async () => {
    status.textContent = tr("Finding your place…", "आपकी जगह ढूँढ रहे हैं…");
    try {
      await useDeviceLocation({ force: true });
      close();
    } catch {
      status.textContent = tr(
        "Could not find your place. Please search for your town.",
        "आपकी जगह नहीं मिल पाई। कृपया अपना क़स्बा खोजें।"
      );
    }
  });

  // First visit, or last place came from GPS: quietly check where we are now
  if (place.auto) useDeviceLocation().catch(() => { /* keep the current place */ });
}

/* ══════════════════════════════
   WEATHER API (Open-Meteo)
   FREE: no API key needed
   One request brings current, hourly and daily data
══════════════════════════════ */
// code: [English, Hindi, day icon, night icon]
const WEATHER_CODES = {
  0:  ["Clear sky", "साफ़ आसमान", "☀️", "🌙"],
  1:  ["Mostly clear", "लगभग साफ़", "🌤️", "🌙"],
  2:  ["Some clouds", "कुछ बादल", "⛅", "☁️"],
  3:  ["Cloudy", "घने बादल", "☁️"],
  45: ["Fog", "कोहरा", "🌫️"],
  48: ["Thick fog", "घना कोहरा", "🌫️"],
  51: ["Light drizzle", "हल्की फुहार", "🌦️"],
  53: ["Drizzle", "फुहार", "🌦️"],
  55: ["Heavy drizzle", "तेज़ फुहार", "🌧️"],
  56: ["Cold drizzle", "ठंडी फुहार", "🌧️"],
  57: ["Cold drizzle", "ठंडी फुहार", "🌧️"],
  61: ["Light rain", "हल्की बारिश", "🌧️"],
  63: ["Rain", "बारिश", "🌧️"],
  65: ["Heavy rain", "तेज़ बारिश", "🌧️"],
  66: ["Icy rain", "बर्फ़ीली बारिश", "🌧️"],
  67: ["Icy rain", "बर्फ़ीली बारिश", "🌧️"],
  71: ["Light snow", "हल्की बर्फ़बारी", "🌨️"],
  73: ["Snow", "बर्फ़बारी", "🌨️"],
  75: ["Heavy snow", "भारी बर्फ़बारी", "❄️"],
  77: ["Snow", "बर्फ़बारी", "🌨️"],
  80: ["Light showers", "हल्की बौछार", "🌦️"],
  81: ["Showers", "बौछारें", "🌧️"],
  82: ["Heavy showers", "तेज़ बौछारें", "⛈️"],
  85: ["Snow showers", "बर्फ़ की बौछार", "🌨️"],
  86: ["Snow showers", "बर्फ़ की बौछार", "🌨️"],
  95: ["Thunderstorm", "आँधी-तूफ़ान", "⛈️"],
  96: ["Storm with hail", "ओलों के साथ तूफ़ान", "⛈️"],
  99: ["Storm with hail", "ओलों के साथ तूफ़ान", "⛈️"],
};

function describeWeather(code, isDay = true) {
  const [en, hi, day, night] = WEATHER_CODES[code] || ["Weather", "मौसम", "🌡️"];
  return { label: tr(en, hi), icon: isDay ? day : night || day };
}

// One short, plain sentence about what the weather means for field work
function farmAdvice({ code, temp, humidity, wind, rainChance }) {
  if (code >= 95) return tr(
    "Storm risk. Stay out of open fields. Keep your harvest covered.",
    "तूफ़ान का ख़तरा। खुले खेत में न जाएँ। कटी फ़सल ढककर रखें।");
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return tr(
    "Rain today. Do not spray or put fertilizer. Keep field drains open.",
    "आज बारिश है। छिड़काव या खाद न डालें। खेत की नालियाँ खुली रखें।");
  if (code >= 51 && code <= 57) return tr(
    "Light drizzle. Spray will wash off, so wait for dry weather.",
    "हल्की फुहार है। दवा धुल जाएगी, इसलिए सूखे मौसम का इंतज़ार करें।");
  if (rainChance >= 60) return tr(
    `Rain may come in a few hours (${rainChance}%). Finish spraying and harvest work early.`,
    `कुछ घंटों में बारिश हो सकती है (${rainChance}%)। छिड़काव और कटाई जल्दी निपटा लें।`);
  if (temp >= 40) return tr(
    "Very hot. Water crops early in the morning or in the evening. Rest in the afternoon.",
    "बहुत तेज़ गर्मी। सुबह जल्दी या शाम को सिंचाई करें। दोपहर में आराम करें।");
  if (temp >= 35) return tr(
    "Hot afternoon. Water your crops in the morning or evening.",
    "दोपहर में गर्मी रहेगी। सुबह या शाम को सिंचाई करें।");
  if (temp <= 4) return tr(
    "Frost risk. Give light water in the evening and cover young plants.",
    "पाले का ख़तरा। शाम को हल्की सिंचाई करें और छोटे पौधों को ढकें।");
  if (wind >= 25) return tr(
    "Strong wind. Do not spray today, it will blow away.",
    "तेज़ हवा है। आज छिड़काव न करें, दवा उड़ जाएगी।");
  if (code === 45 || code === 48) return tr(
    "Fog and damp. Check wheat, mustard and potato for disease.",
    "कोहरा और नमी है। गेहूँ, सरसों और आलू में रोग की जाँच करें।");
  if (humidity >= 85) return tr(
    "Very humid. Disease spreads fast, so look under the leaves.",
    "बहुत नमी है। रोग तेज़ी से फैलता है, पत्तों के नीचे देखें।");
  if (code <= 2) return tr(
    "Good weather for field work today.",
    "आज खेत के काम के लिए अच्छा मौसम है।");
  return tr(
    "The weather is okay for field work.",
    "खेत के काम के लिए मौसम ठीक है।");
}

let weather = null;       // latest Open-Meteo response

function weatherUrl({ lat, lon }) {
  return "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code," +
      "wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day" +
    "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code," +
      "wind_speed_10m,is_day,soil_temperature_6cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum," +
      "precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset," +
      "uv_index_max,et0_fao_evapotranspiration" +
    "&timezone=auto&forecast_days=7";
}

async function loadWeather({ force = false } = {}) {
  const key = `${place.lat},${place.lon}`;
  // The name changes whenever the request asks for new fields, so old saved copies are ignored
  const cached = readStore("session", "km_weather_v2");
  const fresh = cached && cached.key === key && Date.now() - cached.at < CONFIG.WEATHER_CACHE_MS;

  if (fresh && !force) {
    weather = cached.data;
    weather.fetchedAt = cached.at;
    renderWeather();
    return;
  }

  const refreshBtn = $("refreshWeather");
  refreshBtn.classList.add("is-busy");
  try {
    const res = await fetch(weatherUrl(place));
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.reason || "Weather request failed");

    const firstLoad = !weather;
    weather = data;
    weather.fetchedAt = Date.now();
    writeStore("session", "km_weather_v2", { key, at: weather.fetchedAt, data });
    renderWeather();
    if (!firstLoad) flashStats();
  } catch (err) {
    console.error("Weather fetch error:", err);
    if (!weather) showWeatherError();
  } finally {
    refreshBtn.classList.remove("is-busy");
  }
}

// Position of the current hour in the hourly arrays
function hourIndexNow() {
  return Math.max(0, weather.hourly.time.indexOf(weather.current.time.slice(0, 13) + ":00"));
}

// Highest rain probability over the next `hours` hours
function rainChanceAhead(hours) {
  const i = hourIndexNow();
  return Math.max(0, ...weather.hourly.precipitation_probability.slice(i, i + hours).map(v => v ?? 0));
}

function renderWeather() {
  renderNow();
  renderHourly();
  renderForecast();
  renderSpray();
  renderWater();
  renderAlerts();
  renderDryDays();
}

function showWeatherError() {
  const message = tr(
    "Could not load the weather. Check your internet and press the refresh button.",
    "मौसम की जानकारी नहीं आ पाई। इंटरनेट जाँचकर ताज़ा करें का बटन दबाएँ।"
  );
  const missing = tr("No weather", "मौसम नहीं मिला");
  setText("wxCond", missing);
  setText("wxAdvice", message);
  setText("heroCond", missing);
  setText("heroAdvice", message);
  setText("sprayBest", missing);
  setText("waterAnswer", missing);
  setText("alertAnswer", missing);
  setText("dryAnswer", missing);
  setText("weekSummary", missing);
  $("hourly").innerHTML = "";
  $("forecastList").innerHTML = `<li class="placeholder">${missing}</li>`;
}

// Briefly highlights the numbers after a refresh so the change is noticed
function flashStats() {
  document.querySelectorAll("#today .stat").forEach(el => {
    el.classList.remove("flash");
    void el.offsetWidth;          // restart the animation
    el.classList.add("flash");
  });
}

/* ── Weather now ── */
function windWord(kmh) {
  if (kmh < 6)  return tr("Calm", "शांत");
  if (kmh < 16) return tr("Light", "हल्की");
  if (kmh < 26) return tr("Medium", "मध्यम");
  return tr("Strong", "तेज़");
}

function renderNow() {
  const c = weather.current;
  const info = describeWeather(c.weather_code, c.is_day === 1);
  const temp = Math.round(c.temperature_2m);
  const rainChance = rainChanceAhead(6);
  const advice = farmAdvice({
    code: c.weather_code,
    temp,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    rainChance,
  });

  const condition = `<span class="wx-icon" aria-hidden="true">${info.icon}</span> ${info.label}`;
  const d = weather.daily;
  const kmh = tr("km/h", "किमी/घंटा");
  const high = Math.round(d.temperature_2m_max[0]);
  const low = Math.round(d.temperature_2m_min[0]);

  countTo($("wxTemp"), temp, v => Math.round(v) + "°");
  $("wxCond").innerHTML = condition;
  setText("wxPlace", placeLabel());
  setText("wxFeels", tr(
    `Feels like ${Math.round(c.apparent_temperature)}°. Today ${high}° by day, ${low}° at night.`,
    `महसूस होता है ${Math.round(c.apparent_temperature)}°। आज दिन में ${high}°, रात में ${low}°।`
  ));

  // Rain: the chance, and when it is most likely
  const rainAt = nextRainHour();
  const rainToday = d.precipitation_sum[0] ?? 0;
  setText("wxRain", rainChance + "%");
  setText("wxRainNote",
    rainAt !== null ? tr(`Rain likely around ${hourLabel(rainAt)}`, `लगभग ${hourLabel(rainAt)} बजे बारिश हो सकती है`)
    : rainToday >= 0.5 ? tr(`About ${num(rainToday, 0)} mm today`, `आज लगभग ${num(rainToday, 0)} मिमी`)
    : tr("No rain expected today", "आज बारिश की उम्मीद नहीं"));

  // Wind: strength, where it blows from, and gusts when they matter
  const from = pick(WIND_FROM[Math.round(c.wind_direction_10m / 45) % 8]);
  const gust = Math.round(c.wind_gusts_10m ?? 0);
  setText("wxWind", `${windWord(c.wind_speed_10m)} · ${Math.round(c.wind_speed_10m)} ${kmh}`);
  setText("wxWindNote", tr(`From the ${from}`, `${from} से`) +
    (gust >= 30 ? tr(`. Gusts up to ${gust} km/h.`, `। झोंके ${gust} किमी/घंटा तक।`) : ""));

  setText("wxHumidity", c.relative_humidity_2m + "%");
  setText("wxHumidityNote", humidityWord(c.relative_humidity_2m));

  const sun = sunStrength(d.uv_index_max[0]);
  setText("wxUv", sun.word);
  setText("wxUvNote", sun.note);

  // Sun: rise, set, length of the day and how long until sunset
  const minutes = iso => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
  const span = mins => tr(`${Math.floor(mins / 60)} h ${mins % 60} min`, `${Math.floor(mins / 60)} घंटे ${mins % 60} मिनट`);
  const rise = minutes(d.sunrise[0]);
  const set = minutes(d.sunset[0]);
  const nowMin = minutes(c.time);
  setText("wxSunrise", clock(d.sunrise[0]));
  setText("wxSunset", clock(d.sunset[0]));
  setText("wxDayLength", tr(`${span(set - rise)} of daylight`, `${span(set - rise)} का दिन`));
  setText("wxNightNote",
    nowMin < rise ? tr(`Sun rises in ${span(rise - nowMin)}`, `${span(rise - nowMin)} में सूरज उगेगा`)
    : nowMin < set ? tr(`${span(set - nowMin)} of light left`, `${span(set - nowMin)} की रोशनी बाकी`)
    : tr("The sun has set", "सूरज डूब चुका है"));

  setText("wxAdvice", advice);
  setText("wxUpdated", tr(`Updated at ${clock(c.time)}`, `${clock(c.time)} बजे की जानकारी`));

  // Hero snapshot
  countTo($("heroTemp"), temp, v => Math.round(v) + "°");
  $("heroCond").innerHTML = condition;
  setText("heroPlace", placeLabel());
  setText("heroAdvice", advice);
}

// Where the wind blows from, in words
const WIND_FROM = [
  ["north", "उत्तर"], ["north-east", "उत्तर-पूर्व"], ["east", "पूर्व"], ["south-east", "दक्षिण-पूर्व"],
  ["south", "दक्षिण"], ["south-west", "दक्षिण-पश्चिम"], ["west", "पश्चिम"], ["north-west", "उत्तर-पश्चिम"],
];

function humidityWord(humidity) {
  if (humidity < 30) return tr("Dry air", "सूखी हवा");
  if (humidity < 60) return tr("Comfortable", "ठीक-ठाक");
  if (humidity < 85) return tr("Humid", "उमस है");
  return tr("Very humid. Crop disease can spread.", "बहुत उमस। फ़सल में रोग फैल सकता है।");
}

// How strong the sun is today (UV index), with what to do about it
function sunStrength(uv) {
  if (uv == null) return { word: "--", note: "" };
  if (uv < 3)  return { word: tr("Low", "कम"),           note: tr("Safe to work outside all day.", "दिन भर बाहर काम करना सुरक्षित है।") };
  if (uv < 6)  return { word: tr("Medium", "मध्यम"),     note: tr("Wear a cap or gamchha at midday.", "दोपहर में टोपी या गमछा पहनें।") };
  if (uv < 8)  return { word: tr("Strong", "तेज़"),       note: tr("Cover your head from 11 am to 3 pm.", "सुबह 11 से दोपहर 3 बजे तक सिर ढककर रखें।") };
  if (uv < 11) return { word: tr("Very strong", "बहुत तेज़"), note: tr("Stay out of the midday sun. Drink plenty of water.", "दोपहर की धूप से बचें। ख़ूब पानी पिएँ।") };
  return { word: tr("Extreme", "बेहद तेज़"), note: tr("Stay in the shade at midday.", "दोपहर में छाँव में रहें।") };
}

// The first hour in the next 12 when rain is likely, or null
function nextRainHour() {
  const h = weather.hourly;
  const now = hourIndexNow();
  for (let i = now; i < Math.min(now + 12, h.time.length); i++) {
    if ((h.precipitation_probability[i] ?? 0) >= 50 || (h.precipitation[i] ?? 0) >= 0.3) return i;
  }
  return null;
}

/* ── Next 24 hours ── */
function renderHourly() {
  const h = weather.hourly;
  const now = hourIndexNow();
  const temps = h.temperature_2m.slice(now, now + 25);
  if (temps.length < 25) { $("hourly").innerHTML = ""; return; }

  // Temperature curve: 800 wide, 80 tall, warmer is higher
  const low = Math.min(...temps);
  const high = Math.max(...temps);
  const range = Math.max(1, high - low);
  const line = temps
    .map((t, i) => `${i ? "L" : "M"}${((i / 24) * 800).toFixed(1)} ${(68 - ((t - low) / range) * 56).toFixed(1)}`)
    .join(" ");

  // One column for every three hours. Each column starts at its own time on the curve.
  const slots = [0, 3, 6, 9, 12, 15, 18, 21].map((offset, n) => {
    const i = now + offset;
    const info = describeWeather(h.weather_code[i], h.is_day[i] === 1);
    const rain = h.precipitation_probability[i] ?? 0;
    return `
      <li class="hourly-slot" style="--i:${n}">
        <span class="hourly-time">${offset === 0 ? tr("Now", "अभी") : hourLabel(i)}</span>
        <span class="hourly-icon" role="img" aria-label="${info.label}" title="${info.label}">${info.icon}</span>
        <span class="hourly-temp">${Math.round(h.temperature_2m[i])}°</span>
        <span class="hourly-rain">${rain >= 20 ? `💧${rain}%` : ""}</span>
      </li>
    `;
  }).join("");

  const warmAt = hourLabel(now + temps.indexOf(high));
  const coolAt = hourLabel(now + temps.indexOf(low));

  $("hourly").innerHTML = `
    <svg class="hourly-curve" viewBox="0 0 800 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e3bd6a" stop-opacity="0.45" />
          <stop offset="1" stop-color="#e3bd6a" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path class="hourly-area" d="${line} L800 80 L0 80 Z" fill="url(#hourlyFill)" />
      <path class="hourly-line" d="${line}" pathLength="1" />
    </svg>
    <ol class="hourly-slots">${slots}</ol>
    <p class="meta">${tr(
      `Warmest ${Math.round(high)}° around ${warmAt}. Coolest ${Math.round(low)}° around ${coolAt}.`,
      `सबसे गर्म ${Math.round(high)}°, लगभग ${warmAt} बजे। सबसे ठंडा ${Math.round(low)}°, लगभग ${coolAt} बजे।`
    )}</p>
  `;
}

/* ── Next 7 days ── */
function renderForecast() {
  const d = weather.daily;
  const mm = tr("mm", "मिमी");
  const kmh = tr("km/h", "किमी/घंटा");

  // One line for the whole week
  const wetDays = d.precipitation_sum.filter(v => (v ?? 0) >= 0.5).length;
  const total = Math.round(sum(d.precipitation_sum));
  const hottest = Math.round(Math.max(...d.temperature_2m_max));
  const coolest = Math.round(Math.min(...d.temperature_2m_min));
  const rainLine = wetDays === 0 ? tr("A dry week.", "पूरा हफ़्ता सूखा रहेगा।")
    : wetDays === 1 ? tr(`Rain on 1 day, about ${total} mm.`, `1 दिन बारिश, लगभग ${total} मिमी।`)
    : tr(`Rain on ${wetDays} days, about ${total} mm in all.`, `${wetDays} दिन बारिश, कुल लगभग ${total} मिमी।`);
  $("weekSummary").className = "answer" + (wetDays ? " is-wait" : " is-good");
  setText("weekSummary", `${rainLine} ${tr(
    `Hottest day ${hottest}°, coolest night ${coolest}°.`,
    `सबसे गर्म दिन ${hottest}°, सबसे ठंडी रात ${coolest}°।`
  )}`);

  $("forecastList").innerHTML = d.time.map((date, i) => {
    const info = describeWeather(d.weather_code[i]);
    const rain = d.precipitation_sum[i] ?? 0;
    const chance = d.precipitation_probability_max[i] ?? 0;
    const wind = Math.round(d.wind_speed_10m_max[i] ?? 0);

    let rainText = tr("No rain", "बारिश नहीं");
    if (rain >= 0.5)       rainText = tr(`Rain ${num(rain, 0)} ${mm}, ${chance}% chance`, `बारिश ${num(rain, 0)} ${mm}, ${chance}% संभावना`);
    else if (chance >= 40) rainText = tr(`Rain possible, ${chance}% chance`, `बारिश हो सकती है, ${chance}% संभावना`);
    const wet = rain >= 0.5 || chance >= 40;

    return `
      <li class="fc-row${i === 0 ? " is-today" : ""}" style="--i:${i}">
        <span class="fc-day">${i === 0 ? tr("Today", "आज") : `${dayName(date)} ${Number(date.slice(8, 10))}`}</span>
        <span class="fc-icon" role="img" aria-label="${info.label}" title="${info.label}">${info.icon}</span>
        <span class="fc-text">
          <span class="fc-label">${info.label}</span>
          <span class="fc-detail"><span class="fc-rain${wet ? " is-wet" : ""}">${rainText}</span> · ${tr("wind", "हवा")} ${wind} ${kmh}</span>
        </span>
        <span class="fc-temps"><span class="fc-max">${Math.round(d.temperature_2m_max[i])}°</span><span class="fc-min">${Math.round(d.temperature_2m_min[i])}°</span></span>
      </li>
    `;
  }).join("");
}

/* ══════════════════════════════
   WHEN TO SPRAY
   Rates each daylight hour from wind, rain, heat and humidity
══════════════════════════════ */
const SPRAY_LIMITS = {
  windCalm: 3,      // km/h. Below this, spray hangs in still air
  windFair: 15,     // above this, spray starts to drift
  windAvoid: 20,
  tempFair: 30,     // °C. Above this, spray dries too fast
  tempAvoid: 35,
  humidityFair: 40, // %. Below this, drops dry before they land
  rainFair: 30,     // % chance within the next 4 hours
  rainAvoid: 55,
};

const SPRAY_WORDS = {
  good:  ["Good time", "अच्छा समय"],
  fair:  ["Okay", "ठीक-ठाक"],
  avoid: ["Do not spray", "छिड़काव न करें"],
  night: ["Night", "रात"],
};

const SPRAY_REASONS = {
  rain:   ["rain", "बारिश"],
  wind:   ["strong wind", "तेज़ हवा"],
  heat:   ["heat", "गर्मी"],
  shower: ["a chance of rain", "बारिश की संभावना"],
  breeze: ["wind", "हवा"],
  dry:    ["dry air", "सूखी हवा"],
  still:  ["no wind", "हवा बंद"],
};

function rateHour(i) {
  const h = weather.hourly;
  if (h.is_day[i] !== 1) return { rating: "night" };

  // Rain in this hour or the three after it would wash the spray off
  const ahead = [i, i + 1, i + 2, i + 3].filter(k => k < h.time.length);
  const rainChance = Math.max(...ahead.map(k => h.precipitation_probability[k] ?? 0));
  const rain = Math.max(...ahead.map(k => h.precipitation[k] ?? 0));
  const wind = h.wind_speed_10m[i];
  const temp = h.temperature_2m[i];
  const humidity = h.relative_humidity_2m[i];
  const L = SPRAY_LIMITS;

  if (rain > 0.1 || rainChance >= L.rainAvoid) return { rating: "avoid", reason: "rain" };
  if (wind > L.windAvoid)                      return { rating: "avoid", reason: "wind" };
  if (temp > L.tempAvoid)                      return { rating: "avoid", reason: "heat" };

  if (rainChance >= L.rainFair)  return { rating: "fair", reason: "shower" };
  if (wind > L.windFair)         return { rating: "fair", reason: "breeze" };
  if (temp > L.tempFair)         return { rating: "fair", reason: "heat" };
  if (humidity < L.humidityFair) return { rating: "fair", reason: "dry" };
  if (wind < L.windCalm)         return { rating: "fair", reason: "still" };

  return { rating: "good" };
}

// Longest run of "good" hours between two positions in the hourly arrays
function bestRun(ratings, from, to) {
  let best = null;
  let start = null;
  for (let i = from; i <= to; i++) {
    const good = i < to && ratings[i].rating === "good";
    if (good && start === null) start = i;
    if (!good && start !== null) {
      if (!best || i - start > best.end - best.start) best = { start, end: i };
      start = null;
    }
  }
  return best;
}

// The one or two things that most often spoil the daylight hours ahead
function sprayLimits(ratings, from) {
  const counts = {};
  ratings.slice(from).forEach(r => {
    if (r.reason) counts[r.reason] = (counts[r.reason] || 0) + 1;
  });
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 2)
    .map(reason => pick(SPRAY_REASONS[reason]));
}

let sprayRatings = [];

function sprayHourText(i) {
  const h = weather.hourly;
  const day = i < 24 ? tr("Today", "आज") : tr("Tomorrow", "कल");
  const word = pick(SPRAY_WORDS[sprayRatings[i].rating]);
  const temp = Math.round(h.temperature_2m[i]);
  const wind = Math.round(h.wind_speed_10m[i]);
  const rain = h.precipitation_probability[i] ?? 0;
  return tr(
    `${day} ${hourLabel(i)}: ${word}. ${temp}°C, wind ${wind} km/h, rain chance ${rain}%.`,
    `${day} ${hourLabel(i)}: ${word}। ${temp}°C, हवा ${wind} किमी/घंटा, बारिश की संभावना ${rain}%।`
  );
}

function renderSpray() {
  const now = hourIndexNow();
  sprayRatings = weather.hourly.time.slice(0, 48).map((_, i) => rateHour(i));

  const ticks = `<div class="hour-ticks" aria-hidden="true">` +
    [0, 6, 12, 18].map(h => `<span>${hourLabel(h)}</span>`).join("") + `</div>`;

  $("sprayBars").innerHTML = [tr("Today", "आज"), tr("Tomorrow", "कल")].map((label, day) => {
    const cells = sprayRatings.slice(day * 24, day * 24 + 24).map((r, hour) => {
      const i = day * 24 + hour;
      const state = (i < now ? " is-past" : "") + (i === now ? " is-now" : "");
      return `<button type="button" class="hour ${r.rating}${state}" style="--i:${hour}" data-hour="${i}" aria-label="${sprayHourText(i)}"></button>`;
    }).join("");
    return `
      <div class="spray-day">
        <span class="spray-label">${label}</span>
        <div>
          <div class="hours">${cells}</div>
          ${ticks}
        </div>
      </div>
    `;
  }).join("");

  const range = run => hourRange(run.start % 24, run.end % 24);
  const today = bestRun(sprayRatings, now, 24);
  const tomorrow = bestRun(sprayRatings, 24, 48);
  const fairLeft = sprayRatings.slice(now, 48).some(r => r.rating === "fair");

  let answer, tone;
  if (today) {
    answer = tr(`Best time today: ${range(today)}`, `आज सबसे अच्छा समय: ${range(today)}`);
    tone = "is-good";
  } else if (tomorrow) {
    answer = tr(`No good time left today. Tomorrow: ${range(tomorrow)}`, `आज अब अच्छा समय नहीं है। कल: ${range(tomorrow)}`);
    tone = "is-warn";
  } else if (fairLeft) {
    answer = tr("No really good time in the next 2 days", "अगले 2 दिन कोई बहुत अच्छा समय नहीं है");
    tone = "is-warn";
  } else {
    answer = tr("Do not spray in the next 2 days", "अगले 2 दिन छिड़काव न करें");
    tone = "is-bad";
  }
  $("sprayBest").className = "answer " + tone;
  setText("sprayBest", answer);

  const limits = sprayLimits(sprayRatings, now);
  setText("sprayWhy", limits.length ? tr(
    `Other hours are not good because of ${limits.join(" and ")}.`,
    `बाकी समय ${limits.join(" और ")} के कारण ठीक नहीं है।`
  ) : "");

  setText("sprayDetail", tr("Tap any hour to see its weather.", "किसी भी घंटे को दबाकर उसका मौसम देखें।"));
}

// Tap (or point at) an hour to read its weather
function initSprayDetail() {
  const show = e => {
    const cell = e.target.closest(".hour");
    if (!cell) return;
    document.querySelectorAll(".hour.is-picked").forEach(el => el.classList.remove("is-picked"));
    cell.classList.add("is-picked");
    setText("sprayDetail", sprayHourText(Number(cell.dataset.hour)));
  };
  $("sprayBars").addEventListener("click", show);
  $("sprayBars").addEventListener("mouseover", show);
  $("sprayBars").addEventListener("focusin", show);
}

/* ══════════════════════════════
   SHOULD I WATER?
   Compares the water crops will lose with the rain that is coming
══════════════════════════════ */
function renderWater() {
  const i = hourIndexNow();
  const h = weather.hourly;
  const d = weather.daily;
  const mm = tr("mm", "मिमी");

  const soilTemp = h.soil_temperature_6cm[i];
  const top = h.soil_moisture_3_to_9cm[i];
  const deep = h.soil_moisture_9_to_27cm[i];
  const moisture = top == null || deep == null ? null : (top + deep) / 2;   // share of water in the soil
  const use3 = sum(d.et0_fao_evapotranspiration.slice(0, 3));               // mm crops lose in 3 days
  const rain3 = sum(d.precipitation_sum.slice(0, 3));                       // mm of rain in 3 days
  const rain = num(rain3, 0);

  let soilWord = "--";
  if (moisture != null) {
    soilWord = moisture < 0.15 ? tr("Dry", "सूखी") : moisture < 0.3 ? tr("Moist", "नम") : tr("Wet", "गीली");
  }
  setText("soilState", soilWord);
  setText("soilRain", `${rain} ${mm}`);
  setText("soilTemp", soilTemp == null ? "--" : Math.round(soilTemp) + "°C");

  let answer, why, tone;
  if (rain3 >= use3) {
    answer = tr("Wait. Rain is coming.", "रुकें। बारिश आने वाली है।");
    why = tr(
      `About ${rain} mm of rain is expected in 3 days. No need to water now. Keep the drains open.`,
      `3 दिन में लगभग ${rain} मिमी बारिश की उम्मीद है। अभी सिंचाई की ज़रूरत नहीं। नालियाँ खुली रखें।`);
    tone = "is-wait";
  } else if (moisture != null && moisture < 0.15) {
    answer = tr("Yes. Water your crop now.", "हाँ। अभी सिंचाई करें।");
    why = tr(
      "The soil is dry and little rain is coming.",
      "मिट्टी सूखी है और बारिश कम आने वाली है।");
    tone = "is-bad";
  } else if (moisture != null && moisture >= 0.3) {
    answer = tr("No hurry to water", "सिंचाई की जल्दी नहीं");
    why = tr(
      "The soil still has plenty of water.",
      "मिट्टी में अभी काफ़ी नमी है।");
    tone = "is-good";
  } else if (use3 - rain3 >= 10) {
    answer = tr("Water in the next 2 to 3 days", "2 से 3 दिन में सिंचाई करें");
    why = tr(
      `Only ${rain} mm of rain is expected. Water sooner if the soil feels dry or the crop is flowering.`,
      `सिर्फ़ ${rain} मिमी बारिश की उम्मीद है। मिट्टी सूखी लगे या फ़सल में फूल आ रहे हों तो जल्दी सिंचाई करें।`);
    tone = "is-warn";
  } else {
    answer = tr("No hurry to water", "सिंचाई की जल्दी नहीं");
    why = tr(
      "The soil has enough water for now.",
      "अभी मिट्टी में नमी ठीक है।");
    tone = "is-good";
  }

  $("waterAnswer").className = "answer " + tone;
  setText("waterAnswer", answer);
  setText("waterWhy", why);
}

/* ══════════════════════════════
   ANY DANGER THIS WEEK?
   Looks through the 7-day forecast for weather that can hurt a crop
══════════════════════════════ */
const ALERT_LIMITS = {
  heavyRain: 50,   // mm in one day
  rain: 20,
  heat: 40,        // °C, hottest part of the day
  frost: 4,        // °C, coldest part of the night
  gust: 45,        // km/h
};

function weekAlerts() {
  const d = weather.daily;
  const L = ALERT_LIMITS;
  const alerts = [];
  const add = (level, icon, text) => alerts.push({ level, icon, text });

  d.time.forEach((date, i) => {
    const day = i === 0 ? tr("Today", "आज") : i === 1 ? tr("Tomorrow", "कल") : WEEKDAYS[lang][new Date(date + "T12:00").getDay()];
    const rain = Math.round(d.precipitation_sum[i] ?? 0);
    const max = Math.round(d.temperature_2m_max[i]);
    const min = Math.round(d.temperature_2m_min[i]);
    const gust = Math.round(d.wind_gusts_10m_max[i] ?? 0);

    if (d.weather_code[i] >= 95) add("bad", "⛈️", tr(
      `${day}: storm likely. Stay out of open fields and keep the harvest covered.`,
      `${day}: तूफ़ान आ सकता है। खुले खेत में न जाएँ और कटी फ़सल ढककर रखें।`));
    if (rain >= L.heavyRain) add("bad", "🌧️", tr(
      `${day}: heavy rain, about ${rain} mm. Open the drains and do not spray.`,
      `${day}: तेज़ बारिश, लगभग ${rain} मिमी। नालियाँ खोल दें और छिड़काव न करें।`));
    else if (rain >= L.rain) add("warn", "🌦️", tr(
      `${day}: rain, about ${rain} mm. Do not spray or put fertilizer that day.`,
      `${day}: बारिश, लगभग ${rain} मिमी। उस दिन छिड़काव या खाद न डालें।`));
    if (max >= L.heat) add("warn", "🌡️", tr(
      `${day}: very hot, ${max}°C. Water in the morning or evening.`,
      `${day}: बहुत गर्मी, ${max}°C। सुबह या शाम को सिंचाई करें।`));
    if (min <= L.frost) add("bad", "❄️", tr(
      `${day}: frost risk, ${min}°C at night. Give light water in the evening.`,
      `${day}: पाले का ख़तरा, रात में ${min}°C। शाम को हल्की सिंचाई करें।`));
    if (gust >= L.gust) add("warn", "💨", tr(
      `${day}: strong wind, up to ${gust} km/h. Do not spray. Tie up tall crops.`,
      `${day}: तेज़ हवा, ${gust} किमी/घंटा तक। छिड़काव न करें। ऊँची फ़सल को सहारा दें।`));
  });
  return alerts;
}

function renderAlerts() {
  const alerts = weekAlerts();
  const answer = $("alertAnswer");

  if (!alerts.length) {
    answer.className = "answer is-good";
    answer.textContent = tr("No weather danger in the next 7 days", "अगले 7 दिन मौसम का कोई ख़तरा नहीं");
  } else {
    const serious = alerts.some(a => a.level === "bad");
    answer.className = "answer " + (serious ? "is-bad" : "is-warn");
    answer.textContent = alerts.length === 1
      ? tr("1 thing to watch this week", "इस हफ़्ते 1 बात का ध्यान रखें")
      : tr(`${alerts.length} things to watch this week`, `इस हफ़्ते ${alerts.length} बातों का ध्यान रखें`);
  }

  $("alertList").innerHTML = alerts.slice(0, 5).map((a, i) => `
    <li class="alert alert-${a.level}" style="--i:${i}"><span class="alert-icon" aria-hidden="true">${a.icon}</span><span>${a.text}</span></li>
  `).join("");
}

/* ══════════════════════════════
   DAYS TO HARVEST AND DRY
   A day counts as dry when no rain is expected
══════════════════════════════ */
function renderDryDays() {
  const d = weather.daily;
  const mm = tr("mm", "मिमी");
  const days = d.time.map((date, i) => {
    const rain = d.precipitation_sum[i] ?? 0;
    const chance = d.precipitation_probability_max[i] ?? 0;
    return {
      name: i === 0 ? tr("Today", "आज") : dayName(date),
      icon: describeWeather(d.weather_code[i]).icon,
      dry: rain < 0.5 && chance < 30,
      note: rain >= 0.5 ? `${num(rain, 0)} ${mm}` : chance >= 30 ? tr("May rain", "बारिश संभव") : tr("Dry", "सूखा"),
    };
  });

  const dry = days.filter(day => day.dry);
  const answer = $("dryAnswer");
  if (dry.length === days.length) {
    answer.className = "answer is-good";
    answer.textContent = tr("All 7 days are dry. Good for harvest work.", "सातों दिन सूखे हैं। कटाई के काम के लिए अच्छे।");
  } else if (dry.length) {
    answer.className = "answer is-good";
    answer.textContent = tr(`Dry days: ${dry.map(day => day.name).join(", ")}`, `सूखे दिन: ${dry.map(day => day.name).join(", ")}`);
  } else {
    answer.className = "answer is-warn";
    answer.textContent = tr("No fully dry day this week. Keep the harvest covered.", "इस हफ़्ते कोई पूरा सूखा दिन नहीं। कटी फ़सल ढककर रखें।");
  }

  $("dryDays").innerHTML = days.map((day, i) => `
    <li class="daychip ${day.dry ? "is-dry" : "is-wet"}" style="--i:${i}">
      <span class="daychip-day">${day.name}</span>
      <span class="daychip-icon" aria-hidden="true">${day.icon}</span>
      <span class="daychip-note">${day.note}</span>
    </li>
  `).join("");
}

/* ══════════════════════════════
   TABS
══════════════════════════════ */
const tabState = {};

// Slides the white pill under the chosen tab
function moveTabPill(container) {
  const active = container.querySelector('.tab[aria-selected="true"]');
  if (!active) return;
  container.style.setProperty("--pill-x", active.offsetLeft + "px");
  container.style.setProperty("--pill-w", active.offsetWidth + "px");
}

function initTabs(containerId, dataKey, initial, onSelect) {
  const container = $(containerId);
  const tabs = [...container.querySelectorAll(".tab")];
  const select = value => {
    tabState[containerId] = value;
    tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset[dataKey] === value)));
    moveTabPill(container);
    onSelect(value);
  };
  tabs.forEach(tab => tab.addEventListener("click", () => select(tab.dataset[dataKey])));
  select(initial);
}

/* ══════════════════════════════
   WHAT TO SOW
   sow / harvest: [first month, last month] (1 to 12)
══════════════════════════════ */
const CROPS = {
  kharif: [
    { icon: "🌾", name: ["Rice (Dhan)", "धान"],            sow: [6, 7],   harvest: [10, 11],
      note: ["Grow seedlings in June. Plant them when the rains come.", "जून में पौध तैयार करें। बारिश आने पर रोपाई करें।"] },
    { icon: "🌽", name: ["Maize (Makka)", "मक्का"],         sow: [6, 7],   harvest: [9, 10],
      note: ["Do not let water stand in the field.", "खेत में पानी खड़ा न होने दें।"] },
    { icon: "🫘", name: ["Soybean", "सोयाबीन"],             sow: [6, 7],   harvest: [10, 10],
      note: ["Sow after good monsoon rain.", "मानसून की अच्छी बारिश के बाद बोएँ।"] },
    { icon: "🌿", name: ["Cotton (Kapas)", "कपास"],         sow: [4, 6],   harvest: [10, 1],
      note: ["April and May in the north, June in central India.", "उत्तर भारत में अप्रैल-मई, मध्य भारत में जून।"] },
    { icon: "🥜", name: ["Groundnut (Moongfali)", "मूँगफली"], sow: [6, 7],  harvest: [10, 11],
      note: ["Grows best in light, sandy soil.", "हल्की, रेतीली मिट्टी में अच्छी होती है।"] },
    { icon: "🌱", name: ["Bajra", "बाजरा"],                 sow: [6, 7],   harvest: [9, 10],
      note: ["Good for dry areas. Needs little water.", "सूखे इलाक़ों के लिए अच्छा। कम पानी चाहिए।"] },
  ],
  rabi: [
    { icon: "🌾", name: ["Wheat (Gehun)", "गेहूँ"],          sow: [11, 12], harvest: [3, 4],
      note: ["Sow before 25 November for the best crop.", "अच्छी पैदावार के लिए 25 नवंबर से पहले बोएँ।"] },
    { icon: "🌼", name: ["Mustard (Sarson)", "सरसों"],       sow: [10, 11], harvest: [2, 3],
      note: ["Sow early in October to avoid aphids.", "माहू से बचने के लिए अक्टूबर में जल्दी बोएँ।"] },
    { icon: "🫘", name: ["Gram (Chana)", "चना"],             sow: [10, 11], harvest: [2, 3],
      note: ["Needs little water. One or two waterings are enough.", "कम पानी चाहिए। एक या दो सिंचाई काफ़ी हैं।"] },
    { icon: "🥔", name: ["Potato (Aloo)", "आलू"],            sow: [10, 11], harvest: [1, 3],
      note: ["Use healthy, certified seed potatoes.", "स्वस्थ, प्रमाणित बीज आलू लगाएँ।"] },
    { icon: "🫛", name: ["Peas (Matar)", "मटर"],             sow: [10, 11], harvest: [1, 3],
      note: ["Quick crop. Sells as a vegetable and as dal.", "जल्दी तैयार। सब्ज़ी और दाल, दोनों में बिकती है।"] },
    { icon: "🌱", name: ["Lentil (Masoor)", "मसूर"],         sow: [10, 11], harvest: [2, 3],
      note: ["Grows well after rice, with little water.", "धान के बाद कम पानी में अच्छी होती है।"] },
    { icon: "🌾", name: ["Barley (Jau)", "जौ"],              sow: [11, 11], harvest: [3, 4],
      note: ["Grows in salty soil and with less water.", "खारी मिट्टी और कम पानी में भी हो जाता है।"] },
  ],
  zaid: [
    { icon: "🍉", name: ["Watermelon (Tarbooz)", "तरबूज़"],   sow: [2, 3],   harvest: [5, 6],
      note: ["Best in sandy soil and river beds.", "रेतीली मिट्टी और नदी किनारे सबसे अच्छा।"] },
    { icon: "🍈", name: ["Muskmelon (Kharbooza)", "खरबूजा"], sow: [2, 3],   harvest: [5, 6],
      note: ["Needs warm, dry weather when the fruit ripens.", "फल पकते समय गर्म, सूखा मौसम चाहिए।"] },
    { icon: "🥒", name: ["Cucumber (Kheera)", "खीरा"],       sow: [2, 3],   harvest: [4, 6],
      note: ["Quick crop. First picking in about 45 to 50 days.", "जल्दी तैयार। लगभग 45 से 50 दिन में पहली तुड़ाई।"] },
    { icon: "🫘", name: ["Moong", "मूँग"],                   sow: [3, 4],   harvest: [5, 6],
      note: ["Ready in 60 to 65 days. Fits between wheat and rice.", "60 से 65 दिन में तैयार। गेहूँ और धान के बीच लग जाती है।"] },
    { icon: "🥬", name: ["Summer vegetables", "गर्मी की सब्ज़ियाँ"], sow: [2, 3], harvest: [4, 6],
      note: ["Bhindi, lauki, tori and other gourds.", "भिंडी, लौकी, तोरई और दूसरी बेल वाली सब्ज़ियाँ।"] },
    { icon: "🌻", name: ["Sunflower (Surajmukhi)", "सूरजमुखी"], sow: [1, 2], harvest: [5, 6],
      note: ["Protect the flower heads from birds.", "फूलों को पक्षियों से बचाएँ।"] },
  ],
};

// "now" while the sowing window is open, "soon" if it opens within two months
function sowStatus([first, last], month) {
  const open = first <= last ? month >= first && month <= last : month >= first || month <= last;
  if (open) return "now";
  return (first - month + 12) % 12 <= 2 ? "soon" : "";
}

function renderCropList(season) {
  const month = new Date().getMonth() + 1;
  $("cropList").innerHTML = CROPS[season].map((crop, i) => {
    const status = sowStatus(crop.sow, month);
    const tag = status === "now"  ? `<span class="tag tag-now">${tr("Sow now", "अभी बोएँ")}</span>`
              : status === "soon" ? `<span class="tag tag-soon">${tr("Sow soon", "जल्द बोएँ")}</span>` : "";
    return `
      <li class="row" style="--i:${i}">
        <span class="row-icon" aria-hidden="true">${crop.icon}</span>
        <span class="row-main">
          <span class="row-title">${pick(crop.name)}</span>
          <span class="row-sub">${pick(crop.note)}</span>
        </span>
        <span class="row-side">
          <span>${tr("Sow", "बुवाई")}: ${monthRange(crop.sow)}</span>
          <span>${tr("Harvest", "कटाई")}: ${monthRange(crop.harvest)}</span>
          ${tag}
        </span>
      </li>
    `;
  }).join("");
}

function renderSowSummary() {
  const month = new Date().getMonth() + 1;
  const all = Object.values(CROPS).flat();
  const names = status => all
    .filter(crop => sowStatus(crop.sow, month) === status)
    .map(crop => pick(crop.name).split(" (")[0]);

  const now = names("now");
  const soon = names("soon");
  const parts = [];
  if (now.length)  parts.push(tr(`Sow now: ${now.join(", ")}.`, `अभी बोएँ: ${now.join(", ")}।`));
  if (soon.length) parts.push(tr(`Coming soon: ${soon.join(", ")}.`, `जल्द: ${soon.join(", ")}।`));
  setText("sowSummary", parts.join(" ") || tr("No main sowing this month.", "इस महीने कोई मुख्य बुवाई नहीं।"));
}

/* ══════════════════════════════
   MY CROP CALENDAR
   Pick a crop and the sowing date to see what to do and when.
   day: days after sowing. harvest: [earliest, latest] day.
══════════════════════════════ */
const PLANS = {
  wheat: {
    name: ["Wheat (Gehun)", "गेहूँ"],
    steps: [
      { day: 21,  text: ["First watering. This one matters most. Give half the urea after it.", "पहली सिंचाई। यह सबसे ज़रूरी है। इसके बाद आधा यूरिया डालें।"] },
      { day: 33,  text: ["Remove the weeds.", "खरपतवार निकालें।"] },
      { day: 42,  text: ["Second watering. Give the rest of the urea.", "दूसरी सिंचाई। बचा हुआ यूरिया डालें।"] },
      { day: 63,  text: ["Third watering, when the stem grows.", "तीसरी सिंचाई, जब तना बढ़ने लगे।"] },
      { day: 83,  text: ["Fourth watering, at flowering.", "चौथी सिंचाई, फूल आने पर।"] },
      { day: 103, text: ["Fifth watering, when the grain is milky.", "पाँचवीं सिंचाई, जब दाने में दूध भरे।"] },
      { day: 118, text: ["Last watering, only if the soil is dry.", "आख़िरी सिंचाई, सिर्फ़ तब जब मिट्टी सूखी हो।"] },
    ],
    harvest: [135, 150],
    harvestText: ["Harvest when the plants turn golden and the grain is hard.", "जब पौधे सुनहरे हो जाएँ और दाना सख़्त हो, तब कटाई करें।"],
  },
  mustard: {
    name: ["Mustard (Sarson)", "सरसों"],
    steps: [
      { day: 18, text: ["Thin the plants. Keep them 10 to 15 cm apart.", "घने पौधे निकालें। पौधों के बीच 10 से 15 सेमी जगह रखें।"] },
      { day: 35, text: ["First watering, before the flowers come. Give the rest of the urea.", "पहली सिंचाई, फूल आने से पहले। बचा हुआ यूरिया डालें।"] },
      { day: 55, text: ["Check the shoots for aphids (mahu) every few days.", "टहनियों पर माहू हर कुछ दिन में देखते रहें।"] },
      { day: 70, text: ["Second watering, when the pods are filling.", "दूसरी सिंचाई, जब फलियों में दाना भर रहा हो।"] },
    ],
    harvest: [115, 135],
    harvestText: ["Harvest when most pods turn yellow.", "जब ज़्यादातर फलियाँ पीली हो जाएँ, तब कटाई करें।"],
  },
  gram: {
    name: ["Gram (Chana)", "चना"],
    steps: [
      { day: 30, text: ["Remove the weeds.", "खरपतवार निकालें।"] },
      { day: 38, text: ["Pinch off the top shoots. The plant will grow more branches.", "ऊपर की कोपलें तोड़ दें। पौधे में ज़्यादा शाखाएँ आएँगी।"] },
      { day: 45, text: ["First watering before the flowers come, only if the soil is dry.", "फूल आने से पहले पहली सिंचाई, सिर्फ़ तब जब मिट्टी सूखी हो।"] },
      { day: 75, text: ["Second watering when pods form, if needed. Do not water during flowering.", "फलियाँ बनते समय दूसरी सिंचाई, ज़रूरत हो तो। फूल के समय सिंचाई न करें।"] },
    ],
    harvest: [110, 130],
    harvestText: ["Harvest when the leaves turn brown and fall.", "जब पत्तियाँ भूरी होकर गिरने लगें, तब कटाई करें।"],
  },
  potato: {
    name: ["Potato (Aloo)", "आलू"],
    steps: [
      { day: 25, text: ["Heap soil around the plants and give the rest of the urea.", "पौधों पर मिट्टी चढ़ाएँ और बचा हुआ यूरिया डालें।"] },
      { day: 40, text: ["Water lightly every 7 to 10 days. Watch for blight in foggy weather.", "हर 7 से 10 दिन में हल्की सिंचाई करें। कोहरे में झुलसा रोग पर नज़र रखें।"] },
      { day: 85, text: ["Cut the tops and stop watering.", "ऊपर की बेलें काट दें और सिंचाई बंद करें।"] },
    ],
    harvest: [95, 110],
    harvestText: ["Dig the potatoes 10 to 15 days after cutting the tops.", "बेलें काटने के 10 से 15 दिन बाद आलू खोदें।"],
  },
  maize: {
    name: ["Maize (Makka)", "मक्का"],
    steps: [
      { day: 18, text: ["Remove the weeds.", "खरपतवार निकालें।"] },
      { day: 30, text: ["Plants are knee high. Give urea and heap soil around them.", "पौधे घुटने तक हो गए। यूरिया डालें और मिट्टी चढ़ाएँ।"] },
      { day: 50, text: ["Tassels are coming. Give urea and water. Do not let the crop go dry now.", "ऊपर झंडे आ रहे हैं। यूरिया और पानी दें। अभी फ़सल सूखने न दें।"] },
      { day: 62, text: ["Silk is coming on the cobs. Water is needed most now.", "भुट्टों में रेशे आ रहे हैं। अभी पानी सबसे ज़रूरी है।"] },
    ],
    harvest: [95, 110],
    harvestText: ["Harvest when the cob cover is dry and the grain is hard.", "जब भुट्टे का छिलका सूख जाए और दाना सख़्त हो, तब तुड़ाई करें।"],
  },
  paddy: {
    name: ["Rice (Dhan), from nursery sowing", "धान, नर्सरी की बुवाई से"],
    steps: [
      { day: 25,  text: ["Move the seedlings to the main field.", "पौध को मुख्य खेत में रोपें।"] },
      { day: 46,  text: ["Give the first part of the remaining urea.", "बचे हुए यूरिया का पहला हिस्सा डालें।"] },
      { day: 70,  text: ["Give the last part of the urea, as the ears begin to form.", "बाली बनने के समय यूरिया का आख़िरी हिस्सा डालें।"] },
      { day: 110, text: ["Stop watering about 2 weeks before harvest.", "कटाई से लगभग 2 हफ़्ते पहले पानी बंद करें।"] },
    ],
    harvest: [125, 145],
    harvestText: ["Harvest when most of the grains turn golden.", "जब ज़्यादातर दाने सुनहरे हो जाएँ, तब कटाई करें।"],
  },
};

const shortDate = date => `${date.getDate()} ${MONTHS_SHORT[lang][date.getMonth()]}`;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function renderPlan() {
  const plan = PLANS[$("planCrop").value];
  const value = $("planDate").value;            // "2026-10-03"
  if (!plan || !value) return;
  writeStore("local", "km_plan", { crop: $("planCrop").value, date: value });

  const sown = new Date(value + "T12:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daysSince = Math.round((today - sown) / 86400000);

  const steps = plan.steps.map(step => ({ day: step.day, text: pick(step.text) }));
  steps.push({ day: plan.harvest[0], until: plan.harvest[1], text: pick(plan.harvestText) });

  const next = steps.find(step => (step.until ?? step.day) >= daysSince);
  const when = step => shortDate(addDays(sown, step.day)) + (step.until ? tr(" to ", " से ") + shortDate(addDays(sown, step.until)) : "");

  const answer = $("planNext");
  if (daysSince < 0) {
    answer.className = "answer";
    answer.textContent = tr(`Sowing is in ${-daysSince} days. Here is the plan after that.`, `बुवाई ${-daysSince} दिन बाद है। उसके बाद की योजना यह है।`);
  } else if (next) {
    answer.className = "answer is-good";
    answer.textContent = tr(`Next job, ${when(next)}: ${next.text}`, `अगला काम, ${when(next)}: ${next.text}`);
  } else {
    answer.className = "answer is-warn";
    answer.textContent = tr("This crop should be ready. Harvest time has come.", "यह फ़सल तैयार होनी चाहिए। कटाई का समय आ गया है।");
  }

  $("planList").innerHTML = steps.map((step, i) => {
    const wait = step.day - daysSince;
    const past = (step.until ?? step.day) < daysSince;
    const now = !past && wait <= 3;
    const tag = past ? ""
      : now ? `<span class="tag tag-now">${tr("Now", "अभी")}</span>`
      : `<span class="tag">${tr(`In ${wait} days`, `${wait} दिन बाद`)}</span>`;
    return `
      <li class="step${past ? " is-past" : ""}${step === next ? " is-next" : ""}" style="--i:${i}">
        <span class="step-date">${when(step)} ${tag}</span>
        <span class="step-text">${step.text}</span>
      </li>
    `;
  }).join("");
}

function initPlan() {
  const saved = readStore("local", "km_plan");
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const season = getSeason(today.getMonth());

  // Start with the main crop of the season that is about to be sown
  $("planCrop").value = saved?.crop && PLANS[saved.crop] ? saved.crop : season === "kharif" && today.getMonth() < 8 ? "paddy" : "wheat";
  $("planDate").value = saved?.date || iso;

  $("planForm").addEventListener("input", renderPlan);
  $("planForm").addEventListener("submit", e => e.preventDefault());
  renderPlan();
}

/* ══════════════════════════════
   PESTS AND DISEASE
══════════════════════════════ */
const PESTS = {
  kharif: {
    tip: ["After rain, walk through the field within 2 days. Disease spreads fast in warm, wet weather.",
          "बारिश के बाद 2 दिन के अंदर खेत घूमकर देखें। गर्म, गीले मौसम में रोग तेज़ी से फैलता है।"],
    items: [
      { name: ["Brown planthopper", "भूरा फुदका"], crop: ["Rice", "धान"],
        look: ["Brown insects at the base of the plant. Round patches dry up and look burnt.", "पौधे की जड़ के पास भूरे कीड़े। गोल घेरों में फ़सल सूखकर जली-सी दिखती है।"],
        act:  ["Drain the water for 3 to 4 days. Do not add extra urea.", "3 से 4 दिन खेत का पानी निकाल दें। ज़्यादा यूरिया न डालें।"] },
      { name: ["Fall armyworm", "फ़ॉल आर्मीवर्म"], crop: ["Maize", "मक्का"],
        look: ["Holes in the new leaves with sawdust-like droppings.", "नई पत्तियों में छेद और बुरादे जैसा मल।"],
        act:  ["Check the plants twice a week. Crush the eggs. Put up pheromone traps.", "हफ़्ते में दो बार पौधे देखें। अंडे कुचल दें। फेरोमोन ट्रैप लगाएँ।"] },
      { name: ["Blast disease", "झोंका रोग"], crop: ["Rice", "धान"],
        look: ["Eye-shaped spots with a grey centre on leaves. The neck of the ear turns black.", "पत्तियों पर आँख जैसे धब्बे, बीच में स्लेटी। बाली की गर्दन काली पड़ जाती है।"],
        act:  ["Do not use too much urea. Keep the water level steady.", "ज़्यादा यूरिया न डालें। खेत में पानी एक-सा रखें।"] },
      { name: ["Whitefly", "सफ़ेद मक्खी"], crop: ["Cotton", "कपास"],
        look: ["Tiny white insects under the leaves. Leaves turn sticky, then black.", "पत्तियों के नीचे छोटे सफ़ेद कीड़े। पत्तियाँ चिपचिपी, फिर काली हो जाती हैं।"],
        act:  ["Hang yellow sticky traps. Keep the field free of weeds.", "पीले चिपचिपे ट्रैप लगाएँ। खेत में खरपतवार न रहने दें।"] },
    ],
  },
  rabi: {
    tip: ["Fog and cloudy days bring disease. Check wheat, mustard and potato after such days.",
          "कोहरे और बादल वाले दिनों में रोग आता है। ऐसे दिनों के बाद गेहूँ, सरसों और आलू ज़रूर देखें।"],
    items: [
      { name: ["Aphids (mahu)", "माहू (चेपा)"], crop: ["Mustard, wheat", "सरसों, गेहूँ"],
        look: ["Groups of small green or black insects on new shoots. Leaves feel sticky.", "नई टहनियों पर छोटे हरे या काले कीड़ों के झुंड। पत्तियाँ चिपचिपी लगती हैं।"],
        act:  ["Break off and destroy the first affected twigs. Hang yellow sticky traps.", "शुरू में लगी टहनियाँ तोड़कर नष्ट करें। पीले चिपचिपे ट्रैप लगाएँ।"] },
      { name: ["Yellow rust", "पीला रतुआ"], crop: ["Wheat", "गेहूँ"],
        look: ["Yellow powder in lines on the leaves. It comes off on your hand.", "पत्तियों पर धारियों में पीला पाउडर। छूने पर हाथ पीला हो जाता है।"],
        act:  ["Check the crop from December to February. Tell the agriculture office at once.", "दिसंबर से फ़रवरी तक फ़सल देखते रहें। दिखते ही कृषि विभाग को बताएँ।"] },
      { name: ["Late blight", "पछेती झुलसा"], crop: ["Potato", "आलू"],
        look: ["Dark, wet-looking patches on leaves. White growth underneath in damp weather.", "पत्तियों पर गहरे, गीले-से धब्बे। नमी में नीचे सफ़ेद फफूँद।"],
        act:  ["Stop watering in foggy weather. Remove badly affected plants.", "कोहरे के मौसम में सिंचाई रोक दें। ज़्यादा बीमार पौधे हटा दें।"] },
      { name: ["Pod borer", "फली छेदक इल्ली"], crop: ["Gram", "चना"],
        look: ["Round holes in the pods. Green caterpillars inside.", "फलियों में गोल छेद। अंदर हरी इल्ली।"],
        act:  ["Put up pheromone traps and T-shaped bird perches. Pick caterpillars off by hand.", "फेरोमोन ट्रैप और पक्षियों के बैठने की T जैसी खूँटियाँ लगाएँ। इल्लियाँ हाथ से चुनें।"] },
    ],
  },
  zaid: {
    tip: ["Water early in the morning. Evening watering keeps leaves wet all night and brings disease.",
          "सुबह जल्दी सिंचाई करें। शाम की सिंचाई से पत्तियाँ रात भर गीली रहती हैं और रोग आता है।"],
    items: [
      { name: ["Fruit fly", "फल मक्खी"], crop: ["Melons, gourds", "तरबूज़-खरबूजा, लौकी-तोरई"],
        look: ["Small holes on the fruit. The fruit rots from inside.", "फल पर छोटे छेद। फल अंदर से सड़ जाता है।"],
        act:  ["Collect and bury damaged fruit every day. Put up fruit fly traps.", "ख़राब फल रोज़ इकट्ठा करके मिट्टी में दबाएँ। फल मक्खी ट्रैप लगाएँ।"] },
      { name: ["Whitefly and leaf curl", "सफ़ेद मक्खी और पत्ती मरोड़"], crop: ["Tomato, chilli, bhindi", "टमाटर, मिर्च, भिंडी"],
        look: ["Leaves curl, turn yellow and stay small. Tiny white flies rise when you shake the plant.", "पत्तियाँ मुड़कर पीली और छोटी रह जाती हैं। पौधा हिलाने पर छोटी सफ़ेद मक्खियाँ उड़ती हैं।"],
        act:  ["Pull out sick plants early. Hang yellow sticky traps.", "बीमार पौधे जल्दी उखाड़ दें। पीले चिपचिपे ट्रैप लगाएँ।"] },
      { name: ["Downy mildew", "डाउनी मिल्ड्यू (फफूँद)"], crop: ["Cucumber, gourds", "खीरा, लौकी-तोरई"],
        look: ["Yellow patches on top of the leaf, grey growth underneath.", "पत्ती के ऊपर पीले धब्बे, नीचे स्लेटी फफूँद।"],
        act:  ["Keep the vines off the ground. Do not wet the leaves.", "बेलों को ज़मीन से ऊपर चढ़ाएँ। पत्तियाँ गीली न करें।"] },
      { name: ["Heat damage", "गर्मी की मार"], crop: ["All summer crops", "गर्मी की सभी फ़सलें"],
        look: ["Plants droop at midday. Flowers and small fruit fall off.", "दोपहर में पौधे मुरझा जाते हैं। फूल और छोटे फल गिर जाते हैं।"],
        act:  ["Give light water often. Cover the soil with straw.", "हल्की सिंचाई बार-बार करें। मिट्टी को पुआल से ढकें।"] },
    ],
  },
};

function renderPests() {
  const key = getSeason(new Date().getMonth());
  const data = PESTS[key];
  setText("pestSeason", pick(SEASONS[key]));
  setText("pestTip", pick(data.tip));
  $("pestList").innerHTML = data.items.map((pest, i) => `
    <li class="row" style="--i:${i}">
      <span class="row-main">
        <span class="row-title">${pick(pest.name)} <span class="tag">${pick(pest.crop)}</span></span>
        <span class="row-sub"><strong>${tr("Sign", "पहचान")}:</strong> ${pick(pest.look)}</span>
        <span class="row-sub"><strong>${tr("Do", "क्या करें")}:</strong> ${pick(pest.act)}</span>
      </span>
    </li>
  `).join("");
}

/* ══════════════════════════════
   GOVERNMENT PRICE (MSP), ₹ per quintal
   Update once a year when the Union Cabinet announces new prices:
   Kharif around June, Rabi around October.
══════════════════════════════ */
const MSP = {
  kharif: {
    season: ["Kharif 2026-27", "खरीफ़ 2026-27"],
    announced: ["13 May 2026", "13 मई 2026"],
    crops: [
      { key: "paddy",     name: ["Paddy (common)", "धान (सामान्य)"],          price: 2441 },
      { key: "paddyA",    name: ["Paddy (Grade A)", "धान (ग्रेड ए)"],          price: 2461 },
      { key: "maize",     name: ["Maize", "मक्का"],                           price: 2410 },
      { key: "jowar",     name: ["Jowar (hybrid)", "ज्वार (हाइब्रिड)"],        price: 4023 },
      { key: "bajra",     name: ["Bajra", "बाजरा"],                           price: 2900 },
      { key: "ragi",      name: ["Ragi", "रागी"],                             price: 5205 },
      { key: "tur",       name: ["Tur / Arhar", "अरहर (तूर)"],                price: 8450 },
      { key: "moong",     name: ["Moong", "मूँग"],                            price: 8780 },
      { key: "urad",      name: ["Urad", "उड़द"],                             price: 8200 },
      { key: "groundnut", name: ["Groundnut", "मूँगफली"],                     price: 7517 },
      { key: "soybean",   name: ["Soybean (yellow)", "सोयाबीन (पीली)"],       price: 5708 },
      { key: "sunflower", name: ["Sunflower seed", "सूरजमुखी"],               price: 8343 },
      { key: "sesamum",   name: ["Sesamum (Til)", "तिल"],                     price: 10346 },
      { key: "cotton",    name: ["Cotton (medium)", "कपास (मध्यम रेशा)"],     price: 8267 },
      { key: "cottonL",   name: ["Cotton (long)", "कपास (लंबा रेशा)"],        price: 8667 },
    ],
  },
  rabi: {
    season: ["Rabi 2027-28", "रबी 2027-28"],
    announced: ["1 October 2026", "1 अक्टूबर 2026"],
    crops: [
      { key: "wheat",     name: ["Wheat", "गेहूँ"],                           price: 2610 },
      { key: "barley",    name: ["Barley", "जौ"],                             price: 2286 },
      { key: "gram",      name: ["Gram", "चना"],                              price: 5958 },
      { key: "lentil",    name: ["Lentil (Masoor)", "मसूर"],                  price: 7390 },
      { key: "mustard",   name: ["Mustard", "सरसों"],                         price: 6613 },
      { key: "safflower", name: ["Safflower", "कुसुम"],                       price: 7215 },
    ],
  },
};

const mspPrice = key => [...MSP.kharif.crops, ...MSP.rabi.crops].find(crop => crop.key === key).price;

function renderMsp(season) {
  const data = MSP[season];
  $("mspGrid").innerHTML = data.crops.map((crop, i) => `
    <div class="msp-item" style="--i:${i}"><dt>${pick(crop.name)}</dt><dd>${rupees(crop.price)}</dd></div>
  `).join("");
  $("mspNote").innerHTML = tr(
    `Price in ₹ for 1 quintal (100 kg). ${data.season[0]}, announced on ${data.announced[0]}. Onion, potato and tomato have no MSP. `,
    `1 क्विंटल (100 किलो) का भाव ₹ में। ${data.season[1]}, घोषणा ${data.announced[1]}। प्याज़, आलू और टमाटर का MSP नहीं होता। `
  ) + `<a href="https://cacp.da.gov.in" target="_blank" rel="noopener noreferrer">${tr("Official source", "सरकारी स्रोत")}</a>`;
}

/* ══════════════════════════════
   LAND UNITS (in square metres)
══════════════════════════════ */
const LAND_UNITS = {
  acre:    { name: ["Acre", "एकड़"],              sqm: 4046.856 },
  hectare: { name: ["Hectare", "हेक्टेयर"],        sqm: 10000 },
  guntha:  { name: ["Guntha", "गुंठा"],            sqm: 101.1714,   hint: ["40 = 1 acre", "40 = 1 एकड़"] },
  kanal:   { name: ["Kanal", "कनाल"],              sqm: 505.857,    hint: ["8 = 1 acre", "8 = 1 एकड़"] },
  marla:   { name: ["Marla", "मरला"],              sqm: 25.29285,   hint: ["20 = 1 kanal", "20 = 1 कनाल"] },
  cent:    { name: ["Cent", "सेंट"],               sqm: 40.46856,   hint: ["100 = 1 acre", "100 = 1 एकड़"] },
  sqm:     { name: ["Square metre", "वर्ग मीटर"],   sqm: 1 },
  sqft:    { name: ["Square foot", "वर्ग फुट"],     sqm: 0.09290304 },
};

// Units offered in the calculators
const AREA_UNITS = ["acre", "hectare", "guntha", "kanal"];

const unitLabel = (key, withHint = false) => {
  const unit = LAND_UNITS[key];
  return pick(unit.name) + (withHint && unit.hint ? ` (${pick(unit.hint)})` : "");
};

// Fills a dropdown, keeping whatever was already chosen
function fillSelect(id, options) {
  const select = $(id);
  const chosen = select.value;
  select.innerHTML = options.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join("");
  if (chosen) select.value = chosen;
}

// Reads a number box. Empty or wrong input counts as 0.
const fieldValue = id => Math.max(0, parseFloat($(id).value) || 0);

function renderLandConverter() {
  const sqm = fieldValue("landValue") * LAND_UNITS[$("landUnit").value].sqm;

  $("landResult").innerHTML = Object.keys(LAND_UNITS)
    .filter(key => key !== $("landUnit").value)
    .map(key => `
      <div><dt>${unitLabel(key, true)}</dt><dd>${(sqm / LAND_UNITS[key].sqm).toLocaleString("en-IN", { maximumSignificantDigits: 5 })}</dd></div>
    `).join("");
}

/* ══════════════════════════════
   FERTILIZER CALCULATOR
   General dose of N, P and K in kg for one hectare
══════════════════════════════ */
const FERTILIZER = {
  wheat:     { name: ["Wheat (Gehun)", "गेहूँ"],       n: 120, p: 60,  k: 40  },
  rice:      { name: ["Rice (Dhan)", "धान"],           n: 120, p: 60,  k: 60  },
  maize:     { name: ["Maize (Makka)", "मक्का"],       n: 150, p: 75,  k: 40  },
  cotton:    { name: ["Cotton (Kapas)", "कपास"],       n: 120, p: 60,  k: 60  },
  soybean:   { name: ["Soybean", "सोयाबीन"],           n: 20,  p: 80,  k: 40  },
  mustard:   { name: ["Mustard (Sarson)", "सरसों"],    n: 80,  p: 40,  k: 40  },
  sugarcane: { name: ["Sugarcane (Ganna)", "गन्ना"],   n: 250, p: 100, k: 120 },
  potato:    { name: ["Potato (Aloo)", "आलू"],         n: 180, p: 100, k: 150 },
};

// Urea is 46% N. DAP is 18% N and 46% P. MOP (potash) is 60% K.
const BAG_KG = { urea: 45, dap: 50, mop: 50 };

// Farmers buy whole or half bags
const bagCount = (kg, bagKg) => (kg < 5 ? 0 : Math.max(0.5, Math.round((kg / bagKg) * 2) / 2));

function renderFertilizer() {
  const crop = FERTILIZER[$("fertCrop").value];
  const hectares = fieldValue("fertArea") * LAND_UNITS[$("fertUnit").value].sqm / LAND_UNITS.hectare.sqm;

  // DAP covers the phosphorus and brings some nitrogen with it. Urea covers the rest.
  const dap = (crop.p * hectares) / 0.46;
  const urea = Math.max(0, (crop.n * hectares - dap * 0.18) / 0.46);
  const mop = (crop.k * hectares) / 0.60;

  const tile = (name, kg, bagKg) => {
    const bags = bagCount(kg, bagKg);
    return `
      <div class="tile">
        <div class="tile-name">${name}</div>
        <div class="tile-value">${num(bags, 1)}</div>
        <div class="tile-unit">${tr(bags === 1 ? "bag" : "bags", "बोरी")}</div>
        <div class="tile-sub">${num(kg)} ${tr("kg", "किलो")}</div>
      </div>
    `;
  };
  $("fertResult").innerHTML = `
    <div class="result-tiles">
      ${tile(tr("Urea", "यूरिया"), urea, BAG_KG.urea)}
      ${tile(tr("DAP", "डीएपी"), dap, BAG_KG.dap)}
      ${tile(tr("Potash", "पोटाश"), mop, BAG_KG.mop)}
    </div>
    <p class="advice">${tr(
      "Put all the DAP and potash at sowing. Give the urea in 2 or 3 parts, not all at once.",
      "डीएपी और पोटाश पूरी बुवाई के समय डालें। यूरिया 2 या 3 बार में दें, एक साथ नहीं।"
    )}</p>
  `;
}

/* ══════════════════════════════
   PROFIT CALCULATOR
   Example crop (quintal per acre), price (₹ per quintal) and cost (₹ per acre).
   The farmer replaces these with their own numbers.
══════════════════════════════ */
const PROFIT_CROPS = {
  wheat:   { name: ["Wheat", "गेहूँ"],     yield: 18,  cost: 16000, msp: mspPrice("wheat") },
  paddy:   { name: ["Paddy", "धान"],       yield: 24,  cost: 22000, msp: mspPrice("paddy") },
  maize:   { name: ["Maize", "मक्का"],     yield: 20,  cost: 15000, msp: mspPrice("maize") },
  cotton:  { name: ["Cotton", "कपास"],     yield: 8,   cost: 28000, msp: mspPrice("cotton") },
  soybean: { name: ["Soybean", "सोयाबीन"], yield: 6,   cost: 14000, msp: mspPrice("soybean") },
  mustard: { name: ["Mustard", "सरसों"],   yield: 7,   cost: 12000, msp: mspPrice("mustard") },
  gram:    { name: ["Gram", "चना"],        yield: 6,   cost: 12000, msp: mspPrice("gram") },
  onion:   { name: ["Onion", "प्याज़"],     yield: 100, cost: 60000, price: 1500 },
  potato:  { name: ["Potato", "आलू"],      yield: 100, cost: 65000, price: 1200 },
};

function loadProfitDefaults() {
  const crop = PROFIT_CROPS[$("profitCrop").value];
  $("profitYield").value = crop.yield;
  $("profitPrice").value = crop.msp || crop.price;
  $("profitCost").value = crop.cost;
}

function renderProfit() {
  const crop = PROFIT_CROPS[$("profitCrop").value];
  const acres = fieldValue("profitArea") * LAND_UNITS[$("profitUnit").value].sqm / LAND_UNITS.acre.sqm;
  const yieldPerAcre = fieldValue("profitYield");
  const price = fieldValue("profitPrice");
  const costPerAcre = fieldValue("profitCost");

  const income = yieldPerAcre * price * acres;
  const cost = costPerAcre * acres;
  const profit = income - cost;
  const loss = profit < 0;
  const perQuintal = tr("for 1 quintal", "प्रति क्विंटल");

  const rows = [
    [tr("Money from selling", "बिक्री से मिलेगा"), rupees(income)],
    [tr("Total cost", "कुल ख़र्च"), rupees(cost)],
  ];
  if (yieldPerAcre > 0) {
    rows.push([tr("No loss if you sell above", "इससे ऊपर बेचें तो घाटा नहीं"), `${rupees(costPerAcre / yieldPerAcre)} ${perQuintal}`]);
  }
  if (crop.msp) {
    rows.push([tr("Government price (MSP)", "सरकारी भाव (MSP)"), `${rupees(crop.msp)} ${perQuintal}`]);
  }

  $("profitResult").innerHTML = `
    <div class="profit-main${loss ? " is-loss" : ""}">
      <div class="profit-main-label">${loss ? tr("Loss", "घाटा") : tr("Profit", "मुनाफ़ा")}</div>
      <div class="profit-main-value">${rupees(Math.abs(profit))}</div>
    </div>
    <dl class="kv">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
  `;
}

/* ══════════════════════════════
   SEED CALCULATOR
   Usual seed needed, in kg for one acre
══════════════════════════════ */
const SEED = {
  wheat:     { name: ["Wheat (Gehun)", "गेहूँ"],                       kg: 40 },
  paddy:     { name: ["Rice (Dhan), for the nursery", "धान, नर्सरी के लिए"], kg: 8 },
  maize:     { name: ["Maize (Makka)", "मक्का"],                       kg: 8 },
  mustard:   { name: ["Mustard (Sarson)", "सरसों"],                    kg: 1.5 },
  gram:      { name: ["Gram (Chana)", "चना"],                          kg: 30 },
  soybean:   { name: ["Soybean", "सोयाबीन"],                           kg: 30 },
  groundnut: { name: ["Groundnut (Moongfali)", "मूँगफली"],             kg: 40 },
  potato:    { name: ["Potato (Aloo)", "आलू"],                         kg: 1000 },
  moong:     { name: ["Moong", "मूँग"],                                kg: 8 },
  bajra:     { name: ["Bajra", "बाजरा"],                               kg: 1.5 },
  barley:    { name: ["Barley (Jau)", "जौ"],                           kg: 40 },
  lentil:    { name: ["Lentil (Masoor)", "मसूर"],                      kg: 14 },
  peas:      { name: ["Peas (Matar)", "मटर"],                          kg: 35 },
};

function renderSeed() {
  const crop = SEED[$("seedCrop").value];
  const acres = fieldValue("seedArea") * LAND_UNITS[$("seedUnit").value].sqm / LAND_UNITS.acre.sqm;
  const kg = crop.kg * acres;

  // Large amounts (potato) read better in quintals
  const big = kg >= 100;
  const amount = big ? num(kg / 100, 1) : num(kg, 1);
  const unit = big ? tr("quintal", "क्विंटल") : tr("kg", "किलो");

  $("seedResult").innerHTML = `
    <div class="profit-main">
      <div class="profit-main-label">${tr("Seed you need", "इतना बीज चाहिए")}</div>
      <div class="profit-main-value">${amount} <small>${unit}</small></div>
    </div>
    <dl class="kv">
      <div><dt>${tr("For 1 acre", "1 एकड़ के लिए")}</dt><dd>${num(crop.kg, 1)} ${tr("kg", "किलो")}</dd></div>
    </dl>
    <p class="advice">${tr(
      "Treat the seed before sowing. Ask at the seed shop or your agriculture office.",
      "बुवाई से पहले बीज का उपचार करें। बीज की दुकान या कृषि कार्यालय से पूछें।"
    )}</p>
  `;
}

/* ══════════════════════════════
   CROP INSURANCE COST (PM Fasal Bima Yojana)
   The farmer pays a small share of the insured amount
══════════════════════════════ */
const INSURANCE = {
  kharif:     { name: ["Kharif crop (grains, pulses, oilseeds)", "खरीफ़ फ़सल (अनाज, दालें, तिलहन)"], rate: 2 },
  rabi:       { name: ["Rabi crop (grains, pulses, oilseeds)", "रबी फ़सल (अनाज, दालें, तिलहन)"],     rate: 1.5 },
  commercial: { name: ["Fruit, vegetable or cash crop", "फल, सब्ज़ी या नक़दी फ़सल"],                 rate: 5 },
};

function renderInsurance() {
  const kind = INSURANCE[$("insSeason").value];
  const amount = fieldValue("insAmount");
  const premium = amount * kind.rate / 100;

  $("insResult").innerHTML = `
    <div class="profit-main">
      <div class="profit-main-label">${tr("You pay", "आपको देना है")}</div>
      <div class="profit-main-value">${rupees(premium)}</div>
    </div>
    <dl class="kv">
      <div><dt>${tr("Your share", "आपका हिस्सा")}</dt><dd>${kind.rate}%</dd></div>
      <div><dt>${tr("Crop is insured for", "फ़सल का बीमा")}</dt><dd>${rupees(amount)}</dd></div>
    </dl>
    <p class="advice">${tr(
      "The government pays the rest of the premium. Tell the insurer within 72 hours if your crop is damaged.",
      "बाकी प्रीमियम सरकार देती है। फ़सल ख़राब हो तो 72 घंटे के अंदर बीमा कंपनी को बताएँ।"
    )}</p>
  `;
}

/* ══════════════════════════════
   CROP LOAN INTEREST (Kisan Credit Card)
   7% a year, or 4% when the loan is repaid on time
══════════════════════════════ */
const LOAN_RATES = { onTime: 4, late: 7 };

function renderLoan() {
  const amount = fieldValue("loanAmount");
  const months = Math.min(12, fieldValue("loanMonths"));
  const interest = rate => amount * (rate / 100) * (months / 12);
  const onTime = interest(LOAN_RATES.onTime);
  const late = interest(LOAN_RATES.late);

  $("loanResult").innerHTML = `
    <div class="profit-main">
      <div class="profit-main-label">${tr("Interest if you repay on time", "समय पर चुकाने पर ब्याज")}</div>
      <div class="profit-main-value">${rupees(onTime)}</div>
    </div>
    <dl class="kv">
      <div><dt>${tr("Interest if you repay late", "देर से चुकाने पर ब्याज")}</dt><dd>${rupees(late)}</dd></div>
      <div><dt>${tr("You save by paying on time", "समय पर चुकाने से बचत")}</dt><dd>${rupees(late - onTime)}</dd></div>
      <div><dt>${tr("Total to pay back on time", "समय पर कुल चुकाना है")}</dt><dd>${rupees(amount + onTime)}</dd></div>
    </dl>
  `;
}

// Dropdown labels depend on the language, so this runs again after a switch
function fillCalculatorOptions() {
  const areas = AREA_UNITS.map(key => [key, unitLabel(key)]);
  const names = list => Object.entries(list).map(([key, item]) => [key, pick(item.name)]);

  fillSelect("fertCrop", names(FERTILIZER));
  fillSelect("fertUnit", areas);
  fillSelect("seedCrop", names(SEED));
  fillSelect("seedUnit", areas);
  fillSelect("profitCrop", names(PROFIT_CROPS));
  fillSelect("profitUnit", areas);
  fillSelect("insSeason", Object.entries(INSURANCE).map(([key, kind]) => [key, `${pick(kind.name)}: ${kind.rate}%`]));
  fillSelect("landUnit", Object.keys(LAND_UNITS).map(key => [key, unitLabel(key, true)]));
  fillSelect("planCrop", names(PLANS));
}

function renderCalculators() {
  renderFertilizer();
  renderSeed();
  renderProfit();
  renderInsurance();
  renderLoan();
  renderLandConverter();
}

function initCalculators() {
  fillCalculatorOptions();

  // Offer the insurance rate of the season that is being sown now
  $("insSeason").value = getSeason(new Date().getMonth()) === "kharif" && new Date().getMonth() < 8 ? "kharif" : "rabi";

  $("fertForm").addEventListener("input", renderFertilizer);
  $("seedForm").addEventListener("input", renderSeed);
  $("insForm").addEventListener("input", renderInsurance);
  $("loanForm").addEventListener("input", renderLoan);
  $("landForm").addEventListener("input", renderLandConverter);
  $("profitCrop").addEventListener("change", loadProfitDefaults);
  $("profitForm").addEventListener("input", renderProfit);
  ["fertForm", "seedForm", "profitForm", "insForm", "loanForm", "landForm"]
    .forEach(id => $(id).addEventListener("submit", e => e.preventDefault()));

  loadProfitDefaults();
  renderCalculators();
}

/* ══════════════════════════════
   GOVERNMENT SCHEMES
   get: what the farmer gets. who: who can apply. how: how to get it.
   Check these once a year against the official sites.
══════════════════════════════ */
const SCHEME_GROUPS = {
  all:       ["All", "सभी"],
  money:     ["Money", "पैसा"],
  insurance: ["Insurance", "बीमा"],
  loan:      ["Loan", "ऋण"],
  water:     ["Water and solar", "पानी और सोलर"],
  machine:   ["Machines", "मशीन"],
  soil:      ["Soil and organic", "मिट्टी और जैविक"],
  sell:      ["Selling", "बिक्री"],
};

const SCHEMES = [
  { id: "pmkisan", group: "money", icon: "💵", link: "https://pmkisan.gov.in", phone: "155261",
    name: ["PM-KISAN", "पीएम-किसान"],
    get:  ["₹6,000 every year, in 3 parts of ₹2,000, straight to your bank account.", "हर साल ₹6,000, ₹2,000 की 3 किस्तों में, सीधे बैंक खाते में।"],
    who:  ["Farmer families who own farm land.", "जिन किसान परिवारों के नाम खेती की ज़मीन है।"],
    how:  ["Apply on the website or at a Common Service Centre (CSC). Keep Aadhaar, bank passbook and land papers ready. e-KYC is a must.", "वेबसाइट पर या जन सेवा केंद्र (CSC) पर आवेदन करें। आधार, बैंक पासबुक और ज़मीन के काग़ज़ साथ रखें। ई-केवाईसी ज़रूरी है।"] },
  { id: "pension", group: "money", icon: "🧓", link: "https://maandhan.in",
    name: ["Kisan pension (PM-KMY)", "किसान पेंशन (पीएम-केएमवाई)"],
    get:  ["₹3,000 pension every month after the age of 60.", "60 साल की उम्र के बाद हर महीने ₹3,000 पेंशन।"],
    who:  ["Farmers aged 18 to 40 with up to 2 hectares of land.", "18 से 40 साल के किसान, जिनके पास 2 हेक्टेयर तक ज़मीन है।"],
    how:  ["Pay ₹55 to ₹200 a month, depending on your age. The government adds the same amount. Join at a Common Service Centre (CSC).", "उम्र के हिसाब से हर महीने ₹55 से ₹200 जमा करें। सरकार भी उतना ही जोड़ती है। जन सेवा केंद्र (CSC) पर नाम लिखवाएँ।"] },
  { id: "pmfby", group: "insurance", icon: "🛡️", link: "https://pmfby.gov.in", phone: "14447",
    name: ["PM Fasal Bima (crop insurance)", "पीएम फ़सल बीमा"],
    get:  ["Money if your crop is lost to drought, flood, hail, pests or disease.", "सूखा, बाढ़, ओले, कीट या रोग से फ़सल ख़राब होने पर पैसा।"],
    who:  ["Any farmer growing a listed crop, on own or rented land.", "सूची में शामिल फ़सल उगाने वाला कोई भी किसान, अपनी या किराए की ज़मीन पर।"],
    how:  ["You pay only 2% for Kharif and 1.5% for Rabi crops. Enrol at your bank, a CSC or on the app before the last date. Report crop loss within 72 hours.", "खरीफ़ में सिर्फ़ 2% और रबी में 1.5% प्रीमियम। आख़िरी तारीख़ से पहले बैंक, CSC या ऐप से बीमा कराएँ। नुकसान की सूचना 72 घंटे के अंदर दें।"] },
  { id: "kcc", group: "loan", icon: "💳", link: "https://www.myscheme.gov.in/schemes/kcc",
    name: ["Kisan Credit Card", "किसान क्रेडिट कार्ड"],
    get:  ["Crop loan at 7% interest. Only 4% if you repay on time.", "7% ब्याज पर फ़सल ऋण। समय पर चुकाने पर सिर्फ़ 4%।"],
    who:  ["Farmers, tenant farmers and sharecroppers. Also for dairy and fish farming.", "किसान, किराएदार किसान और बटाईदार। पशुपालन और मछली पालन के लिए भी।"],
    how:  ["Apply at your bank or cooperative society with Aadhaar and land papers.", "आधार और ज़मीन के काग़ज़ लेकर अपने बैंक या सहकारी समिति में आवेदन करें।"] },
  { id: "aif", group: "loan", icon: "🏬", link: "https://agriinfra.dac.gov.in",
    name: ["Loan for godown and cold store", "गोदाम और कोल्ड स्टोर के लिए ऋण"],
    get:  ["3% less interest on loans up to ₹2 crore for a godown, cold store or sorting unit.", "गोदाम, कोल्ड स्टोर या छँटाई यूनिट के लिए ₹2 करोड़ तक के ऋण पर ब्याज में 3% की छूट।"],
    who:  ["Farmers, farmer groups (FPO), cooperatives and self-help groups.", "किसान, किसान उत्पादक संगठन (FPO), सहकारी समितियाँ और स्वयं सहायता समूह।"],
    how:  ["Apply online on the Agriculture Infrastructure Fund site. Your bank then checks the plan.", "एग्रीकल्चर इंफ़्रास्ट्रक्चर फ़ंड की वेबसाइट पर ऑनलाइन आवेदन करें। फिर बैंक आपकी योजना जाँचता है।"] },
  { id: "drip", group: "water", icon: "💧", link: "https://pmksy.gov.in",
    name: ["Drip and sprinkler subsidy", "ड्रिप और स्प्रिंकलर पर सब्सिडी"],
    get:  ["The government pays about half the cost: 55% for small farmers, 45% for others.", "सरकार लगभग आधा ख़र्च देती है: छोटे किसानों को 55%, बाकी को 45%।"],
    who:  ["Any farmer with a source of water.", "कोई भी किसान जिसके पास पानी का साधन है।"],
    how:  ["Apply at your district agriculture or horticulture office.", "अपने ज़िले के कृषि या उद्यान कार्यालय में आवेदन करें।"] },
  { id: "kusum", group: "water", icon: "☀️", link: "https://pmkusum.mnre.gov.in",
    name: ["Solar pump (PM-KUSUM)", "सोलर पंप (पीएम-कुसुम)"],
    get:  ["The government pays 60% of the cost of a solar pump.", "सोलर पंप की क़ीमत का 60% सरकार देती है।"],
    who:  ["Farmers who need a pump, mainly where there is no electricity line.", "जिन किसानों को पंप चाहिए, ख़ासकर जहाँ बिजली की लाइन नहीं है।"],
    how:  ["You pay 10% yourself. A bank loan can cover the other 30%. Apply only on your state's official portal. Beware of fake websites that ask for money.", "10% आपको देना है। बाकी 30% के लिए बैंक ऋण मिल सकता है। सिर्फ़ अपने राज्य के सरकारी पोर्टल पर आवेदन करें। पैसे माँगने वाली नक़ली वेबसाइटों से बचें।"] },
  { id: "smam", group: "machine", icon: "🚜", link: "https://agrimachinery.nic.in",
    name: ["Farm machine subsidy", "कृषि यंत्र पर सब्सिडी"],
    get:  ["40 to 50% help on tractors, tillers, seed drills and other machines.", "ट्रैक्टर, टिलर, सीड ड्रिल और दूसरी मशीनों पर 40 से 50% मदद।"],
    who:  ["All farmers. Small farmers, women and SC/ST farmers get the higher share.", "सभी किसान। छोटे किसानों, महिलाओं और अनुसूचित जाति/जनजाति के किसानों को ज़्यादा हिस्सा मिलता है।"],
    how:  ["Register on the farm machinery portal and choose your machine.", "कृषि यंत्र पोर्टल पर पंजीकरण करें और अपनी मशीन चुनें।"] },
  { id: "shc", group: "soil", icon: "🧪", link: "https://soilhealth.dac.gov.in",
    name: ["Soil Health Card", "मृदा स्वास्थ्य कार्ड"],
    get:  ["A free soil test and a card that tells how much fertilizer your field needs.", "मिट्टी की मुफ़्त जाँच और एक कार्ड जो बताता है कि खेत को कितनी खाद चाहिए।"],
    who:  ["Every farmer.", "हर किसान।"],
    how:  ["Give a soil sample at your agriculture office or Krishi Vigyan Kendra.", "अपने कृषि कार्यालय या कृषि विज्ञान केंद्र में मिट्टी का नमूना दें।"] },
  { id: "pkvy", group: "soil", icon: "🌿", link: "https://pgsindia-ncof.gov.in",
    name: ["Organic farming help (PKVY)", "जैविक खेती में मदद (PKVY)"],
    get:  ["₹31,500 for each hectare over 3 years. ₹15,000 of it comes to your bank for organic inputs.", "3 साल में प्रति हेक्टेयर ₹31,500। इसमें से ₹15,000 जैविक खाद-बीज के लिए सीधे खाते में।"],
    who:  ["Farmers who join a group (cluster) for organic farming.", "जो किसान जैविक खेती के समूह (क्लस्टर) में जुड़ते हैं।"],
    how:  ["Ask your block agriculture office about a cluster near you.", "अपने ब्लॉक कृषि कार्यालय से पास के क्लस्टर के बारे में पूछें।"] },
  { id: "natural", group: "soil", icon: "🐄", link: "https://naturalfarming.dac.gov.in",
    name: ["Natural farming mission", "प्राकृतिक खेती मिशन"],
    get:  ["₹4,000 for one acre every year, for 2 years, when you shift to natural farming.", "प्राकृतिक खेती अपनाने पर एक एकड़ के लिए हर साल ₹4,000, 2 साल तक।"],
    who:  ["Farmers ready to farm one acre without chemicals.", "जो किसान एक एकड़ में बिना रसायन खेती करने को तैयार हैं।"],
    how:  ["Join through the Krishi Sakhi of your village or your agriculture office.", "अपने गाँव की कृषि सखी या कृषि कार्यालय के ज़रिए जुड़ें।"] },
  { id: "enam", group: "sell", icon: "🏪", link: "https://enam.gov.in", phone: "18002700224",
    name: ["e-NAM (online mandi)", "ई-नाम (ऑनलाइन मंडी)"],
    get:  ["Sell your crop online to buyers in many mandis. The money comes to your bank.", "अपनी फ़सल कई मंडियों के ख़रीदारों को ऑनलाइन बेचें। पैसा सीधे बैंक में आता है।"],
    who:  ["Any farmer near an e-NAM mandi.", "ई-नाम मंडी के पास का कोई भी किसान।"],
    how:  ["Register on the website, on the app or at the mandi gate.", "वेबसाइट, ऐप या मंडी के गेट पर पंजीकरण करें।"] },
  { id: "msp", group: "sell", icon: "₹", link: "#msp", internal: true,
    name: ["Selling at the government price", "सरकारी भाव (MSP) पर बिक्री"],
    get:  ["The government buys wheat, paddy, pulses and oilseeds at the fixed price (MSP).", "सरकार गेहूँ, धान, दालें और तिलहन तय भाव (MSP) पर ख़रीदती है।"],
    who:  ["Farmers registered on their state's crop purchase portal.", "जो किसान अपने राज्य के फ़सल ख़रीद पोर्टल पर पंजीकृत हैं।"],
    how:  ["Register before harvest with Aadhaar, bank account and land papers. Take your crop to the centre on the date you are given.", "कटाई से पहले आधार, बैंक खाते और ज़मीन के काग़ज़ के साथ पंजीकरण कराएँ। दी गई तारीख़ पर फ़सल ख़रीद केंद्र ले जाएँ।"] },
];

// PM-KISAN pays in three fixed periods of the year
function pmKisanPeriod() {
  const month = new Date().getMonth();          // 0-indexed
  if (month >= 3 && month <= 6)  return tr("April to July", "अप्रैल से जुलाई");
  if (month >= 7 && month <= 10) return tr("August to November", "अगस्त से नवंबर");
  return tr("December to March", "दिसंबर से मार्च");
}

let schemeGroup = "all";
let schemesExpanded = false;      // "All" shows a first few until the farmer asks for the rest
const SCHEMES_SHOWN_FIRST = 6;

function renderSchemeFilters() {
  $("schemeFilters").innerHTML = Object.entries(SCHEME_GROUPS).map(([key, name]) => {
    const count = key === "all" ? SCHEMES.length : SCHEMES.filter(s => s.group === key).length;
    return `<button class="filter" type="button" data-group="${key}" aria-pressed="${key === schemeGroup}">${pick(name)} <span class="filter-count">${count}</span></button>`;
  }).join("");
}

function renderSchemes() {
  const matching = SCHEMES.filter(s => schemeGroup === "all" || s.group === schemeGroup);
  const short = schemeGroup === "all" && !schemesExpanded;
  const list = short ? matching.slice(0, SCHEMES_SHOWN_FIRST) : matching;

  const more = $("schemeAll");
  more.hidden = !short;
  more.textContent = tr(`Show all ${matching.length} schemes`, `सभी ${matching.length} योजनाएँ देखें`);

  const phoneText = number => number.length > 6 ? number.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3") : number;

  $("schemeList").innerHTML = list.map((s, i) => {
    const extra = s.id === "pmkisan"
      ? `<p class="scheme-extra">${tr("This instalment period", "इस किस्त का समय")}: <strong>${pmKisanPeriod()}</strong></p>` : "";
    const link = s.internal
      ? `<a class="link" href="${s.link}">${tr("See the prices", "भाव देखें")}</a>`
      : `<a class="link" href="${s.link}" target="_blank" rel="noopener noreferrer">${tr("Open site", "वेबसाइट खोलें")} <svg class="icon" aria-hidden="true"><use href="#i-external" /></svg></a>`;
    const call = s.phone
      ? `<a class="link" href="tel:${s.phone}"><svg class="icon" aria-hidden="true"><use href="#i-phone" /></svg> ${phoneText(s.phone)}</a>` : "";

    return `
      <article class="scheme" style="--i:${i}">
        <header class="scheme-head">
          <span class="card-icon${s.icon === "₹" ? " card-icon-text" : ""}" aria-hidden="true">${s.icon}</span>
          <div>
            <h3 class="scheme-name">${pick(s.name)}</h3>
            <span class="tag">${pick(SCHEME_GROUPS[s.group])}</span>
          </div>
        </header>
        <p class="scheme-get">${pick(s.get)}</p>
        ${extra}
        <button class="scheme-more" type="button" aria-expanded="false">
          <span>${tr("Who can get it and how", "किसे मिलेगा और कैसे")}</span>
          <svg class="icon chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <div class="scheme-details">
          <div>
            <p><strong>${tr("Who", "किसे")}:</strong> ${pick(s.who)}</p>
            <p><strong>${tr("How", "कैसे")}:</strong> ${pick(s.how)}</p>
          </div>
        </div>
        <footer class="scheme-foot">${link}${call}</footer>
      </article>
    `;
  }).join("");
}

function initSchemes() {
  renderSchemeFilters();
  renderSchemes();

  $("schemeFilters").addEventListener("click", e => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    schemeGroup = btn.dataset.group;
    $("schemeFilters").querySelectorAll(".filter").forEach(f => f.setAttribute("aria-pressed", String(f === btn)));
    smoothly(renderSchemes);
  });

  $("schemeAll").addEventListener("click", () => {
    schemesExpanded = true;
    renderSchemes();
  });

  // Open and close "who can get it and how"
  $("schemeList").addEventListener("click", e => {
    const btn = e.target.closest(".scheme-more");
    if (!btn) return;
    const open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    btn.closest(".scheme").classList.toggle("is-open", open);
  });
}

/* ══════════════════════════════
   PAPERS YOU NEED
   A small checklist the phone remembers
══════════════════════════════ */
function renderPaperCount() {
  const boxes = [...document.querySelectorAll("#paperList input")];
  const ready = boxes.filter(box => box.checked).length;
  setText("paperCount", ready === boxes.length
    ? tr("All papers are ready. You can apply.", "सारे काग़ज़ तैयार हैं। आप आवेदन कर सकते हैं।")
    : tr(`${ready} of ${boxes.length} ready`, `${boxes.length} में से ${ready} तैयार`));
}

function initPapers() {
  const saved = readStore("local", "km_papers") || [];
  const boxes = [...document.querySelectorAll("#paperList input")];
  boxes.forEach(box => { box.checked = saved.includes(box.dataset.paper); });

  $("paperList").addEventListener("change", () => {
    writeStore("local", "km_papers", boxes.filter(box => box.checked).map(box => box.dataset.paper));
    renderPaperCount();
  });
  renderPaperCount();
}

/* ══════════════════════════════
   CHAT WIDGET
══════════════════════════════ */
const chat = {
  open: false,
  busy: false,
  history: readStore("session", "km_chat") || [],   // [{ role, content }]
  warmed: false,
};

const welcomeText = () => tr(
  "**Namaste! I am Mitra**, your farm helper.\n\nAsk me anything about crops, pests, water, mandi or government schemes. You can write in Hindi or English.",
  "**नमस्ते! मैं मित्र हूँ**, आपका खेती साथी।\n\nफ़सल, कीट-रोग, सिंचाई, मंडी या सरकारी योजना, कुछ भी पूछिए।"
);

// Turns the assistant's simple markdown (bold, lists, headings) into safe HTML
function renderMarkdown(text) {
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  let html = "";
  let list = null;      // "ul" or "ol" while inside a list
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  const openList = type => { if (list !== type) { closeList(); html += `<${type}>`; list = type; } };

  for (const raw of esc(text).split(/\r?\n/)) {
    const line = raw.trim();
    let match;
    if (!line) {
      closeList();
    } else if ((match = line.match(/^[-*•]\s+(.*)$/))) {
      openList("ul");
      html += `<li>${inline(match[1])}</li>`;
    } else if ((match = line.match(/^(\d+)[.)]\s+(.*)$/))) {
      openList("ol");
      html += `<li value="${match[1]}">${inline(match[2])}</li>`;
    } else if ((match = line.match(/^#{1,6}\s+(.*)$/))) {
      closeList();
      html += `<p class="md-h">${inline(match[1])}</p>`;
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

function scrollChat() {
  const log = $("chatLog");
  log.scrollTop = log.scrollHeight;
}

function addMessage(role, text) {
  const log = $("chatLog");
  const el = document.createElement("div");
  el.className = "msg " + role;
  if (role === "user") el.textContent = text;
  else el.innerHTML = renderMarkdown(text);
  log.appendChild(el);

  // A long answer should start at the top of the window, not end at the bottom
  if (role === "bot") log.scrollTop = el.offsetTop - 12;
  else scrollChat();
  return el;
}

function addError(text, retryMessage) {
  const el = addMessage("error", text);
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "msg-retry";
  retry.textContent = tr("Try again", "फिर कोशिश करें");
  retry.addEventListener("click", () => {
    el.remove();
    sendMessage(retryMessage, { echo: false });
  });
  el.appendChild(retry);
  scrollChat();
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.id = "typingIndicator";
  el.innerHTML = `<span class="typing" role="img" aria-label="${tr("Mitra is writing", "मित्र लिख रहा है")}"><span></span><span></span><span></span></span>`;
  $("chatLog").appendChild(el);
  scrollChat();
}

function renderChatLog() {
  $("chatLog").innerHTML = "";
  addMessage("bot", welcomeText());
  chat.history.forEach(m => addMessage(m.role === "user" ? "user" : "bot", m.content));
  $("chatChips").hidden = chat.history.length > 0;
  scrollChat();
}

// Tells the assistant where the farmer is, the weather and the date
function chatContext() {
  const now = new Date();
  const parts = [`Location: ${placeLabel()}.`];
  if (weather) {
    const c = weather.current;
    parts.push(
      `Current weather: ${Math.round(c.temperature_2m)}°C, humidity ${c.relative_humidity_2m}%, ` +
      `wind ${Math.round(c.wind_speed_10m)} km/h, rain chance in the next 6 hours ${rainChanceAhead(6)}%.`
    );
  }
  parts.push(
    `Today is ${WEEKDAYS.en[now.getDay()]}, ${now.getDate()} ${MONTHS.en[now.getMonth()]} ${now.getFullYear()}. ` +
    `Current season: ${SEASONS[getSeason(now.getMonth())][0]}.`
  );
  return parts.join(" ");
}

async function callBackend(message) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.CHAT_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: chat.history.slice(-10),   // last 10 messages for context
        context: chatContext(),
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.reply) {
      const err = new Error(data.error || "Backend error: " + res.status);
      err.status = res.status;
      throw err;
    }
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

function chatErrorText(err) {
  if (err.status === 429) return tr(
    "Too many questions right now. Please wait one minute and try again.",
    "अभी बहुत सारे सवाल आ रहे हैं। एक मिनट रुककर फिर कोशिश करें।");
  if (err.status >= 500) return tr(
    "Mitra could not answer just now. Please try again in a moment.",
    "मित्र अभी जवाब नहीं दे पाया। थोड़ी देर में फिर कोशिश करें।");
  if (err.status) return tr(
    "This question could not be sent. Please make it shorter and try again.",
    "यह सवाल भेजा नहीं जा सका। इसे छोटा करके फिर कोशिश करें।");
  return tr(
    "Could not reach Mitra. Check your internet and try again. It can take up to a minute to start.",
    "मित्र से संपर्क नहीं हो पाया। इंटरनेट जाँचकर फिर कोशिश करें। शुरू होने में एक मिनट तक लग सकता है।");
}

async function sendMessage(text, { echo = true } = {}) {
  const message = text.trim();
  if (!message || chat.busy) return;

  chat.busy = true;
  $("chatSend").disabled = true;
  $("chatChips").hidden = true;
  if (echo) addMessage("user", message);
  showTyping();

  try {
    const reply = await callBackend(message);
    chat.history.push({ role: "user", content: message }, { role: "assistant", content: reply });
    writeStore("session", "km_chat", chat.history.slice(-30));
    $("typingIndicator")?.remove();
    addMessage("bot", reply);
  } catch (err) {
    console.error("Chat error:", err);
    $("typingIndicator")?.remove();
    addError(chatErrorText(err), message);
  } finally {
    chat.busy = false;
    $("chatSend").disabled = false;
  }
}

// Render's free server sleeps when idle, so wake it before the first question
function warmBackend() {
  if (chat.warmed) return;
  chat.warmed = true;
  fetch(`${BACKEND_URL}/health`).catch(() => { chat.warmed = false; });
}

function setChatOpen(open) {
  if (chat.open === open) return;
  chat.open = open;

  const panel = $("chatPanel");
  panel.classList.toggle("is-open", open);
  panel.inert = !open;
  document.body.classList.toggle("chat-open", open);
  $("chatFab").setAttribute("aria-expanded", String(open));

  if (open) {
    warmBackend();
    scrollChat();
    // On phones, opening the keyboard at once hides the welcome message
    if (window.matchMedia("(hover: hover)").matches) setTimeout(() => $("chatInput").focus(), 80);
  } else {
    $("chatFab").focus();
  }
}

// On phones the keyboard covers the bottom of the screen.
// Keep the chat exactly as tall as the part that is still visible.
function trackKeyboard() {
  const view = window.visualViewport;
  if (!view) return;
  const update = () => {
    const root = document.documentElement.style;
    root.setProperty("--vv-height", view.height + "px");
    root.setProperty("--vv-top", view.offsetTop + "px");
    if (chat.open) scrollChat();
  };
  view.addEventListener("resize", update);
  view.addEventListener("scroll", update);
  update();
}

function initChat() {
  const input = $("chatInput");
  renderChatLog();
  trackKeyboard();

  // Any "Ask Mitra" button opens the chat. The floating button also closes it.
  document.querySelectorAll("[data-open-chat]").forEach(btn => {
    btn.addEventListener("click", () => setChatOpen(btn.id === "chatFab" ? !chat.open : true));
  });

  // Ready-made questions, asked in the language on screen
  document.querySelectorAll("[data-ask]").forEach(btn => {
    btn.addEventListener("click", () => {
      setChatOpen(true);
      sendMessage(lang === "hi" ? btn.dataset.askHi : btn.dataset.ask);
    });
  });

  $("chatClose").addEventListener("click", () => setChatOpen(false));
  $("chatClear").addEventListener("click", () => {
    if (chat.busy) return;
    chat.history = [];
    writeStore("session", "km_chat", []);
    renderChatLog();
  });

  $("chatForm").addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value;
    if (!text.trim() || chat.busy) return;
    input.value = "";
    input.style.height = "auto";
    sendMessage(text);
  });

  // Enter sends, Shift+Enter makes a new line
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $("chatForm").requestSubmit();
    }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && chat.open) setChatOpen(false);
  });
}

/* ══════════════════════════════
   PAGE MOTION
══════════════════════════════ */
const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Counts a number up or down to its new value instead of jumping
function countTo(el, value, format) {
  const from = Number.isFinite(el._shown) ? el._shown : value - 8;
  el._shown = value;
  if (calmMotion || from === value) { el.textContent = format(value); return; }

  const started = performance.now();
  const step = now => {
    const t = Math.min(1, (now - started) / 700);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (value - from) * eased);
    if (t < 1 && el._shown === value) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Cross-fades the page while something big changes (language, scheme filter)
function smoothly(change) {
  if (calmMotion || !document.startViewTransition) change();
  else document.startViewTransition(change);
}

// Sections fade up as they scroll into view
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  // After the entrance, drop the classes so hover effects are free to move the card
  const settle = el => setTimeout(() => el.classList.remove("reveal", "is-visible"), 1200);

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => { el.classList.remove("reveal"); el.classList.add("is-seen"); });
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible", "is-seen");
      settle(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(el => observer.observe(el));
}

// A soft circle spreads from where a button is pressed
function initRipple() {
  if (calmMotion) return;
  const targets = ".btn, .chip, .tab, .filter, .lang-btn, .location-btn, .chat-fab, .helpline, .scheme-more";
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(targets);
    if (!el) return;
    const box = el.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - box.left - size / 2 + "px";
    ripple.style.top = e.clientY - box.top - size / 2 + "px";
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
}

// A faint light follows the mouse across a card
function initSpotlight() {
  if (calmMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.addEventListener("pointermove", e => {
    const card = e.target.closest(".card, .scheme");
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - box.left + "px");
    card.style.setProperty("--my", e.clientY - box.top + "px");
  }, { passive: true });
}

// Keeps the sliding pill under the right tab when sizes change
function refreshTabPills() {
  document.querySelectorAll(".tabs").forEach(moveTabPill);
}

// The header gets a soft shadow once the page is scrolled, a thin bar shows
// how far down you are, and the menu shows which part of the page you are in
function initHeader() {
  const header = document.querySelector(".site-header");
  const bar = document.querySelector(".scroll-progress");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    const room = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--scroll", room > 0 ? Math.min(1, window.scrollY / room) : 0);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refreshTabPills);
  onScroll();

  if (!("IntersectionObserver" in window)) return;
  const links = [...document.querySelectorAll(".site-nav a")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(link => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) observer.observe(section);
  });
}

/* ══════════════════════════════
   LANGUAGE SWITCH
══════════════════════════════ */
// Draws everything that contains words, in the current language
function renderAllText() {
  applyStaticText();
  renderDate();
  renderSowSummary();
  renderCropList(tabState.cropTabs);
  renderPests();
  renderMsp(tabState.mspTabs);
  fillCalculatorOptions();
  renderCalculators();
  renderPlan();
  renderSchemeFilters();
  renderSchemes();
  renderPaperCount();
  renderChatLog();
  if (weather) renderWeather();
  refreshTabPills();
}

function initLanguage() {
  $("langBtn").addEventListener("click", () => {
    lang = lang === "hi" ? "en" : "hi";
    writeStore("local", "km_lang", lang);
    smoothly(renderAllText);
  });
}

/* ══════════════════════════════
   INIT: runs on page load
══════════════════════════════ */
function init() {
  const season = getSeason(new Date().getMonth());

  // 1. Language first, so everything else is drawn in the right one
  applyStaticText();
  initLanguage();

  // 2. Date and season
  renderDate();

  // 3. Crops, pests, prices, calculators
  renderSowSummary();
  renderPests();
  initTabs("cropTabs", "season", season, renderCropList);
  initTabs("mspTabs", "msp", season === "kharif" ? "kharif" : "rabi", renderMsp);
  initCalculators();
  initPlan();

  // 4. Schemes and the papers checklist
  initSchemes();
  initPapers();

  // 5. Chat
  initChat();

  // 6. Place, then weather for it
  initLocation();
  initSprayDetail();
  loadWeather();
  $("refreshWeather").addEventListener("click", () => loadWeather({ force: true }));

  // 7. Keep the weather fresh while the page is being looked at
  setInterval(() => { if (!document.hidden) loadWeather({ force: true }); }, CONFIG.WEATHER_REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    const stale = weather && Date.now() - weather.fetchedAt > CONFIG.WEATHER_REFRESH_MS;
    if (!document.hidden && stale) loadWeather({ force: true });
  });

  // 8. Page motion
  initHeader();
  initReveal();
  initRipple();
  initSpotlight();
  refreshTabPills();
  document.fonts?.ready.then(refreshTabPills);     // tab widths change once the fonts arrive

  console.log("🌾 KrishiMitra loaded. Jai Kisan!");
}

init();
