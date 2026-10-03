/* ═══════════════════════════════════════════════════
   KRISHIMITRA — script.js
   Kisan ka Sachcha Mitra | Frontend Logic
   - Location (GPS, search, remembered choice)
   - Weather, 7-day forecast, spray window, soil
     (Open-Meteo — FREE, no key needed)
   - Crop calendar, pest watch, MSP
   - Calculators (fertilizer, profit, land units, soil pH)
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

  // Shown until the visitor shares or picks a location
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
   DATE & SEASON
══════════════════════════════ */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const SEASONS = {
  kharif: { name: "Kharif", period: "June – October" },
  rabi:   { name: "Rabi",   period: "November – February" },
  zaid:   { name: "Zaid",   period: "March – May" },
};

function getSeason(month) {
  // month is 0-indexed
  if (month >= 5 && month <= 9)  return "kharif";   // Jun–Oct
  if (month >= 10 || month <= 1) return "rabi";     // Nov–Feb
  return "zaid";                                     // Mar–May
}

// Open-Meteo sends local times as "2026-10-03T06:21" — read them as written
function clock(iso) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
const hourLabel = h => `${h % 12 || 12} ${h % 24 < 12 ? "am" : "pm"}`;
const dayName = isoDate => WEEKDAYS[new Date(isoDate + "T12:00").getDay()].slice(0, 3);

function renderDate() {
  const now = new Date();
  const season = SEASONS[getSeason(now.getMonth())];
  setText("heroDate", `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`);
  setText("heroSeason", `${season.name} season`);
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
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    return { name: data.city || data.locality || "Your location", region: data.principalSubdivision || "" };
  } catch {
    return { name: "Your location", region: "" };
  }
}

async function useDeviceLocation({ force = false } = {}) {
  const { latitude, longitude } = await locate();

  // Same spot as last time — nothing to update
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

  $("locationBtn").addEventListener("click", () => {
    status.textContent = "";
    results.innerHTML = "";
    dialog.showModal();
  });
  $("locationClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

  $("locationForm").addEventListener("submit", async e => {
    e.preventDefault();
    const query = $("locationQuery").value.trim();
    if (query.length < 2) return;

    status.textContent = "Searching…";
    results.innerHTML = "";
    try {
      const found = await searchPlaces(query);
      status.textContent = found.length ? "" : "No place found in India with that name. Try the nearest town.";
      results.innerHTML = found.map((p, i) => `
        <li><button class="result-btn" type="button" data-index="${i}">
          ${esc(p.name)}<span>${esc(p.region)}</span>
        </button></li>
      `).join("");
      results.querySelectorAll(".result-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const p = found[btn.dataset.index];
          setPlace({ name: p.name, region: p.region.split(", ").pop(), lat: p.lat, lon: p.lon, auto: false });
          dialog.close();
        });
      });
    } catch {
      status.textContent = "Search failed. Check your internet and try again.";
    }
  });

  $("useMyLocation").addEventListener("click", async () => {
    status.textContent = "Finding your location…";
    try {
      await useDeviceLocation({ force: true });
      dialog.close();
    } catch {
      status.textContent = "Location is blocked or unavailable. Search for your town instead.";
    }
  });

  // First visit, or last place came from GPS: quietly check where we are now
  if (place.auto) useDeviceLocation().catch(() => { /* keep the current place */ });
}

/* ══════════════════════════════
   WEATHER API (Open-Meteo)
   FREE — No API key needed
   One request brings current, hourly and daily data
══════════════════════════════ */
const WEATHER_CODES = {
  0:  ["Clear sky", "☀️", "🌙"],
  1:  ["Mostly clear", "🌤️", "🌙"],
  2:  ["Partly cloudy", "⛅", "☁️"],
  3:  ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Freezing fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌧️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Light showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️"],
};

function describeWeather(code, isDay = true) {
  const [label, day, night] = WEATHER_CODES[code] || ["Unknown", "🌡️"];
  return { label, icon: isDay ? day : night || day };
}

function farmAdvice({ code, temp, humidity, wind, rainChance }) {
  if (code >= 95)
    return "Thunderstorm risk. Stay out of open fields and keep harvested produce under cover.";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return "Rain today. Hold off spraying and fertilizer, and check that field drains are clear.";
  if (code >= 51 && code <= 57)
    return "Light drizzle. Good for germination, but a spray will wash off — wait for a dry spell.";
  if (rainChance >= 60)
    return `Rain is likely in the next few hours (${rainChance}%). Finish spraying and harvest work early, or wait.`;
  if (temp >= 40)
    return "Extreme heat. Irrigate early in the morning or in the evening, shade nurseries and rest in the afternoon.";
  if (temp >= 35)
    return "Hot afternoon ahead. Irrigate in the morning or evening and mulch to hold soil moisture.";
  if (temp <= 4)
    return "Frost risk. A light irrigation in the evening and covers on seedlings help protect the crop.";
  if (wind >= 25)
    return "Strong wind. Avoid spraying — it will drift — and support tall crops if you can.";
  if (code === 45 || code === 48)
    return "Foggy and damp. Watch wheat, mustard and potato for fungal disease.";
  if (humidity >= 85)
    return "Very humid. Fungal diseases spread fast — walk the field and look under the leaves.";
  if (code <= 2)
    return "Settled weather. A good day for spraying, weeding and harvest work — see the spray window below.";
  return "Fair conditions for field work. Check the forecast before you spray.";
}

let weather = null;       // latest Open-Meteo response

function weatherUrl({ lat, lon }) {
  return "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation," +
      "weather_code,wind_speed_10m,wind_direction_10m,is_day" +
    "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation," +
      "wind_speed_10m,is_day,soil_temperature_6cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum," +
      "precipitation_probability_max,sunrise,sunset,uv_index_max,et0_fao_evapotranspiration" +
    "&timezone=auto&forecast_days=7";
}

async function loadWeather({ force = false } = {}) {
  const key = `${place.lat},${place.lon}`;
  const cached = readStore("session", "km_weather");
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

    weather = data;
    weather.fetchedAt = Date.now();
    writeStore("session", "km_weather", { key, at: weather.fetchedAt, data });
    renderWeather();
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
  renderForecast();
  renderSpray();
  renderSoil();
}

function showWeatherError() {
  const message = "Could not load the weather. Check your internet and press refresh.";
  setText("wxCond", "Weather unavailable");
  setText("wxAdvice", message);
  setText("heroCond", "Weather unavailable");
  setText("heroAdvice", message);
  setText("sprayBest", "Spray window unavailable without the forecast.");
  setText("soilVerdict", "Soil outlook unavailable without the forecast.");
  $("forecastList").innerHTML = `<li class="placeholder">Forecast unavailable.</li>`;
}

/* ── Weather now ── */
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function uvLabel(uv) {
  if (uv < 3)  return "Low";
  if (uv < 6)  return "Moderate";
  if (uv < 8)  return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function renderNow() {
  const c = weather.current;
  const d = weather.daily;
  const info = describeWeather(c.weather_code, c.is_day === 1);
  const temp = Math.round(c.temperature_2m);
  const rainChance = rainChanceAhead(6);
  const uv = d.uv_index_max[0];
  const advice = farmAdvice({
    code: c.weather_code,
    temp,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    rainChance,
  });

  setText("wxTemp", temp + "°");
  setText("wxCond", `${info.icon} ${info.label}`);
  setText("wxPlace", placeLabel());
  setText("wxFeels", Math.round(c.apparent_temperature) + "°C");
  setText("wxHumidity", c.relative_humidity_2m + "%");
  setText("wxWind", `${Math.round(c.wind_speed_10m)} km/h ${COMPASS[Math.round(c.wind_direction_10m / 45) % 8]}`);
  setText("wxRain", rainChance + "%");
  setText("wxUv", uv == null ? "—" : `${Math.round(uv)} · ${uvLabel(uv)}`);
  $("wxSun").innerHTML = `<span class="nowrap">${clock(d.sunrise[0])}</span> · <span class="nowrap">${clock(d.sunset[0])}</span>`;
  setText("wxAdvice", advice);
  setText("wxUpdated", `Updated ${clock(c.time)} · Open-Meteo`);

  // Hero snapshot
  setText("heroTemp", temp + "°");
  setText("heroCond", `${info.icon} ${info.label}`);
  setText("heroPlace", placeLabel());
  setText("heroAdvice", advice);
}

/* ── 7-day forecast ── */
function renderForecast() {
  const d = weather.daily;
  const low = Math.min(...d.temperature_2m_min);
  const high = Math.max(...d.temperature_2m_max);
  const span = Math.max(1, high - low);

  $("forecastList").innerHTML = d.time.map((date, i) => {
    const info = describeWeather(d.weather_code[i]);
    const min = d.temperature_2m_min[i];
    const max = d.temperature_2m_max[i];
    const rain = d.precipitation_sum[i] ?? 0;
    const chance = d.precipitation_probability_max[i] ?? 0;
    const wet = rain >= 0.5 || chance >= 30;

    // Bar shows where this day's range sits within the week's range
    const left = ((min - low) / span) * 100;
    const width = Math.max(6, ((max - min) / span) * 100);

    return `
      <li class="fc-row${i === 0 ? " is-today" : ""}">
        <span class="fc-day">${i === 0 ? "Today" : dayName(date)}</span>
        <span class="fc-icon" role="img" aria-label="${info.label}" title="${info.label}">${info.icon}</span>
        <span class="fc-rain${wet ? "" : " is-dry"}">${wet ? `${num(rain, 1)} mm · ${chance}%` : "Dry"}</span>
        <span class="fc-min">${Math.round(min)}°</span>
        <span class="fc-bar" aria-hidden="true"><span class="fc-fill" style="left:${left.toFixed(1)}%;width:${Math.min(width, 100 - left).toFixed(1)}%"></span></span>
        <span class="fc-max">${Math.round(max)}°</span>
      </li>
    `;
  }).join("");
}

/* ══════════════════════════════
   SPRAY & FIELD-WORK WINDOW
   Rates each daylight hour from wind, rain, heat and humidity
══════════════════════════════ */
const SPRAY_LIMITS = {
  windCalm: 3,      // km/h — below this, spray hangs in still air
  windFair: 15,     // above this, drift starts
  windAvoid: 20,
  tempFair: 30,     // °C — above this, spray evaporates fast
  tempAvoid: 35,
  humidityFair: 40, // % — below this, droplets dry before they land
  rainFair: 30,     // % chance within the next 4 hours
  rainAvoid: 55,
};

function rateHour(i) {
  const h = weather.hourly;
  if (h.is_day[i] !== 1) return { rating: "night", reason: "after dark" };

  // Rain in this hour or the three after it would wash the spray off
  const ahead = [i, i + 1, i + 2, i + 3].filter(k => k < h.time.length);
  const rainChance = Math.max(...ahead.map(k => h.precipitation_probability[k] ?? 0));
  const rain = Math.max(...ahead.map(k => h.precipitation[k] ?? 0));
  const wind = h.wind_speed_10m[i];
  const temp = h.temperature_2m[i];
  const humidity = h.relative_humidity_2m[i];
  const L = SPRAY_LIMITS;

  if (rain > 0.1 || rainChance >= L.rainAvoid) return { rating: "avoid", reason: "rain" };
  if (wind > L.windAvoid)                      return { rating: "avoid", reason: "strong wind" };
  if (temp > L.tempAvoid)                      return { rating: "avoid", reason: "heat" };

  if (rainChance >= L.rainFair)  return { rating: "fair", reason: "a chance of rain" };
  if (wind > L.windFair)         return { rating: "fair", reason: "a stiff breeze" };
  if (temp > L.tempFair)         return { rating: "fair", reason: "warmth" };
  if (humidity < L.humidityFair) return { rating: "fair", reason: "dry air" };
  if (wind < L.windCalm)         return { rating: "fair", reason: "still air" };

  return { rating: "good", reason: "light wind, mild and dry" };
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
    if (r.rating === "fair" || r.rating === "avoid") counts[r.reason] = (counts[r.reason] || 0) + 1;
  });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
}

function renderSpray() {
  const h = weather.hourly;
  const now = hourIndexNow();
  const ratings = h.time.slice(0, 48).map((_, i) => rateHour(i));
  const ticks = `<div class="hour-ticks" aria-hidden="true"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span></div>`;

  $("sprayBars").innerHTML = ["Today", "Tomorrow"].map((label, day) => {
    const cells = ratings.slice(day * 24, day * 24 + 24).map((r, hour) => {
      const i = day * 24 + hour;
      const state = (i < now ? " is-past" : "") + (i === now ? " is-now" : "");
      const tip = `${hourLabel(hour)} · ${r.rating === "night" ? "Night" : r.rating[0].toUpperCase() + r.rating.slice(1) + " — " + r.reason}` +
        ` · ${Math.round(h.temperature_2m[i])}°C, wind ${Math.round(h.wind_speed_10m[i])} km/h, rain ${h.precipitation_probability[i] ?? 0}%`;
      return `<span class="hour ${r.rating}${state}" title="${tip}"></span>`;
    }).join("");
    return `
      <div class="spray-day">
        <span class="spray-label">${label}</span>
        <div>
          <div class="hours" role="img" aria-label="Hour-by-hour spray rating, ${label.toLowerCase()}">${cells}</div>
          ${ticks}
        </div>
      </div>
    `;
  }).join("");

  const range = run => `${hourLabel(run.start % 24)} – ${hourLabel(run.end % 24)}`;
  const today = bestRun(ratings, now, 24);
  const tomorrow = bestRun(ratings, 24, 48);
  const fairLeft = ratings.slice(now, 48).some(r => r.rating === "fair");

  let verdict;
  if (today)         verdict = `Best window today: ${range(today)}.`;
  else if (tomorrow) verdict = `No good window left today. Next: tomorrow ${range(tomorrow)}.`;
  else if (fairLeft) verdict = "No ideal hours in the next two days — only fair ones. Spray only if you must, in the calmest, coolest hour.";
  else               verdict = "Not suitable for spraying in the next two days.";
  setText("sprayBest", verdict);

  const limits = sprayLimits(ratings, now);
  setText("sprayWhy", limits.length ? `The other daylight hours are held back mostly by ${limits.join(" and ")}.` : "");
}

/* ══════════════════════════════
   SOIL & IRRIGATION
══════════════════════════════ */
function renderSoil() {
  const i = hourIndexNow();
  const h = weather.hourly;
  const d = weather.daily;

  const soilTemp = h.soil_temperature_6cm[i];
  const moisture = h.soil_moisture_3_to_9cm[i];
  const rootMoisture = h.soil_moisture_9_to_27cm[i];
  const use3 = sum(d.et0_fao_evapotranspiration.slice(0, 3));   // mm crops lose in 3 days
  const rain3 = sum(d.precipitation_sum.slice(0, 3));           // mm expected in 3 days

  setText("soilTemp", soilTemp == null ? "—" : Math.round(soilTemp) + "°C");
  setText("soilMoisture", moisture == null ? "—" : Math.round(moisture * 100) + "%");
  setText("soilEt0", num(d.et0_fao_evapotranspiration[0] ?? 0, 1) + " mm");
  setText("soilRain", num(rain3, 1) + " mm");

  const used = num(use3, 0);
  const rained = num(rain3, 0);
  let tag, tone, verdict;

  if (rain3 >= use3) {
    tag = "Hold irrigation"; tone = "pill-sky";
    verdict = `About ${rained} mm of rain is expected in the next 3 days — more than the ${used} mm crops will use. Hold irrigation and keep drains open.`;
  } else if (rootMoisture != null && rootMoisture < 0.15) {
    tag = "Irrigation due"; tone = "pill-clay";
    verdict = `The soil is dry and little rain is coming: crops will use about ${used} mm in 3 days against ${rained} mm of rain. Plan an irrigation.`;
  } else if (use3 - rain3 >= 10) {
    tag = "Plan irrigation"; tone = "pill-amber";
    verdict = `Crops will use about ${used} mm in the next 3 days and only ${rained} mm of rain is expected. Irrigate if the topsoil is dry or the crop is flowering or filling grain.`;
  } else {
    tag = "Moisture steady"; tone = "pill-green";
    verdict = `Crop water use (${used} mm) and expected rain (${rained} mm) are close over the next 3 days. No rush to irrigate.`;
  }

  const pill = $("soilTag");
  pill.className = "pill " + tone;
  pill.textContent = tag;
  pill.hidden = false;
  setText("soilVerdict", verdict);
}

/* ══════════════════════════════
   TABS
══════════════════════════════ */
function initTabs(containerId, dataKey, initial, onSelect) {
  const tabs = [...$(containerId).querySelectorAll(".tab")];
  const select = value => {
    tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset[dataKey] === value)));
    onSelect(value);
  };
  tabs.forEach(tab => tab.addEventListener("click", () => select(tab.dataset[dataKey])));
  select(initial);
}

/* ══════════════════════════════
   CROP CALENDAR
   sow: [first month, last month] of the sowing window (1–12)
══════════════════════════════ */
const CROPS = {
  kharif: [
    { icon: "🌾", name: "Rice (Dhan)",           note: "Raise the nursery in June, transplant with the monsoon",   sow: [6, 7],   harvest: "Oct – Nov" },
    { icon: "🌽", name: "Maize (Makka)",         note: "Needs good drainage — it cannot stand waterlogging",       sow: [6, 7],   harvest: "Sep – Oct" },
    { icon: "🫘", name: "Soybean",               note: "Sow once about 100 mm of monsoon rain has fallen",         sow: [6, 7],   harvest: "Oct" },
    { icon: "🌿", name: "Cotton (Kapas)",        note: "April–May in the north, with the monsoon in central India", sow: [4, 6],   harvest: "Oct – Jan" },
    { icon: "🥜", name: "Groundnut (Moongfali)", note: "Does best in light, sandy loam soil",                      sow: [6, 7],   harvest: "Oct – Nov" },
    { icon: "🌱", name: "Bajra",                 note: "Hardy millet for dry areas",                               sow: [6, 7],   harvest: "Sep – Oct" },
  ],
  rabi: [
    { icon: "🌾", name: "Wheat (Gehun)",         note: "Sowing by 25 November gives the best yield",               sow: [11, 12], harvest: "Mar – Apr" },
    { icon: "🌼", name: "Mustard (Sarson)",      note: "Early sowing in October escapes aphid attack",             sow: [10, 11], harvest: "Feb – Mar" },
    { icon: "🫘", name: "Gram (Chana)",          note: "Needs little water — one or two irrigations",              sow: [10, 11], harvest: "Feb – Mar" },
    { icon: "🥔", name: "Potato (Aloo)",         note: "Use certified, disease-free seed tubers",                  sow: [10, 11], harvest: "Jan – Mar" },
    { icon: "🫛", name: "Peas (Matar)",          note: "Short-duration vegetable and pulse crop",                  sow: [10, 11], harvest: "Jan – Mar" },
    { icon: "🌱", name: "Lentil (Masoor)",       note: "Suits rice fallows and light irrigation",                  sow: [10, 11], harvest: "Feb – Mar" },
    { icon: "🌾", name: "Barley (Jau)",          note: "Tolerates saline soil and less water",                     sow: [11, 11], harvest: "Mar – Apr" },
  ],
  zaid: [
    { icon: "🍉", name: "Watermelon (Tarbooz)",  note: "Sandy loam and river beds suit it best",                   sow: [2, 3],   harvest: "May – Jun" },
    { icon: "🍈", name: "Muskmelon (Kharbooza)", note: "Needs warm, dry weather while fruit ripens",               sow: [2, 3],   harvest: "May – Jun" },
    { icon: "🥒", name: "Cucumber (Kheera)",     note: "Quick crop — first picking in about 45–50 days",           sow: [2, 3],   harvest: "Apr – Jun" },
    { icon: "🫘", name: "Moong",                 note: "A 60–65 day crop that fits between wheat and rice",        sow: [3, 4],   harvest: "May – Jun" },
    { icon: "🥬", name: "Summer vegetables",     note: "Bhindi, lauki, tori and other gourds",                     sow: [2, 3],   harvest: "Apr – Jun" },
    { icon: "🌻", name: "Sunflower (Surajmukhi)", note: "Spring crop — protect the heads from birds",              sow: [1, 2],   harvest: "May – Jun" },
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
  $("cropList").innerHTML = CROPS[season].map(crop => {
    const [first, last] = crop.sow;
    const sowWindow = MONTHS_SHORT[first - 1] + (last !== first ? " – " + MONTHS_SHORT[last - 1] : "");
    const status = sowStatus(crop.sow, month);
    const tag = status === "now"  ? `<span class="tag tag-now">Sow now</span>`
              : status === "soon" ? `<span class="tag tag-soon">Sowing soon</span>` : "";
    return `
      <li class="row">
        <span class="row-icon" aria-hidden="true">${crop.icon}</span>
        <span class="row-main">
          <span class="row-title">${crop.name}</span>
          <span class="row-sub">${crop.note}</span>
        </span>
        <span class="row-side">
          <span>Sow ${sowWindow}</span>
          <span>Harvest ${crop.harvest}</span>
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
    .map(crop => crop.name.split(" (")[0]);

  const now = names("now");
  const soon = names("soon");
  const parts = [];
  if (now.length)  parts.push(`Sowing now: ${now.join(", ")}.`);
  if (soon.length) parts.push(`Coming up: ${soon.join(", ")}.`);
  setText("sowSummary", parts.join(" ") || "No major sowing window is open this month.");
}

/* ══════════════════════════════
   PEST & DISEASE WATCH
══════════════════════════════ */
const PESTS = {
  kharif: {
    tip: "After rain, walk the field within two days. Fungal diseases spread fastest in warm, wet weather.",
    items: [
      { name: "Brown planthopper", crop: "Rice",   look: "Brown insects at the base of the plant; round patches that dry up and look burnt.", act: "Drain the field for 3–4 days and avoid extra urea." },
      { name: "Fall armyworm",     crop: "Maize",  look: "Ragged holes in the whorl leaves with sawdust-like droppings.", act: "Check whorls twice a week, crush egg masses and set pheromone traps." },
      { name: "Blast",             crop: "Rice",   look: "Spindle-shaped spots with a grey centre on leaves; the neck of the ear turns black.", act: "Avoid heavy nitrogen and keep water steady in the field." },
      { name: "Whitefly",          crop: "Cotton", look: "Tiny white insects under the leaves; leaves turn sticky, then black with mould.", act: "Hang yellow sticky traps and keep the field free of weeds." },
    ],
  },
  rabi: {
    tip: "Fog and cloudy, humid days favour rust and blight. Check wheat, mustard and potato closely after such spells.",
    items: [
      { name: "Aphids (mahu / chepa)", crop: "Mustard, wheat", look: "Clusters of small green or black insects on tender shoots and pods; sticky leaves.", act: "Clip and destroy the first infested twigs and hang yellow sticky traps." },
      { name: "Yellow rust",           crop: "Wheat",          look: "Yellow powdery stripes on leaves; yellow dust comes off on your hand.", act: "Inspect from December to February and report the first patches at once." },
      { name: "Late blight",           crop: "Potato",         look: "Dark, water-soaked patches on leaves with white growth underneath in damp weather.", act: "Stop irrigation in foggy spells and remove badly affected plants." },
      { name: "Pod borer",             crop: "Gram",           look: "Round holes in pods with green caterpillars feeding inside.", act: "Set pheromone traps and T-shaped bird perches; hand-pick larvae." },
    ],
  },
  zaid: {
    tip: "Irrigate in the early morning. Evening watering in hot weather keeps leaves wet overnight and invites disease.",
    items: [
      { name: "Fruit fly",          crop: "Melons, gourds",         look: "Small punctures on the fruit, which then rots from inside.", act: "Collect and bury damaged fruit every day and set cue-lure traps." },
      { name: "Whitefly and leaf curl", crop: "Tomato, chilli, bhindi", look: "Leaves curl, yellow and stay small; tiny white flies rise when the plant is shaken.", act: "Pull out infected plants early and hang yellow sticky traps." },
      { name: "Downy mildew",       crop: "Cucumber, gourds",       look: "Yellow angular patches on top of the leaf, grey growth underneath.", act: "Train vines off the ground and avoid wetting the leaves." },
      { name: "Heat stress",        crop: "All summer crops",       look: "Wilting at midday, flowers and small fruit dropping.", act: "Give light, frequent irrigation and mulch the soil." },
    ],
  },
};

function renderPests() {
  const key = getSeason(new Date().getMonth());
  const data = PESTS[key];
  setText("pestSeason", `${SEASONS[key].name} season`);
  setText("pestTip", data.tip);
  $("pestList").innerHTML = data.items.map(pest => `
    <li class="row">
      <span class="row-main">
        <span class="row-title">${pest.name} <span class="tag">${pest.crop}</span></span>
        <span class="row-sub">${pest.look}</span>
        <span class="row-sub"><strong>First step:</strong> ${pest.act}</span>
      </span>
    </li>
  `).join("");
}

/* ══════════════════════════════
   MINIMUM SUPPORT PRICE (₹ per quintal)
   Update once a year when the Union Cabinet announces new prices:
   Kharif around June, Rabi around October.
══════════════════════════════ */
const MSP = {
  kharif: {
    label: "Kharif marketing season 2026-27",
    approved: "13 May 2026",
    crops: {
      "Paddy (common)": 2441,
      "Paddy (Grade A)": 2461,
      "Maize": 2410,
      "Jowar (hybrid)": 4023,
      "Bajra": 2900,
      "Ragi": 5205,
      "Tur / Arhar": 8450,
      "Moong": 8780,
      "Urad": 8200,
      "Groundnut": 7517,
      "Soybean (yellow)": 5708,
      "Sunflower seed": 8343,
      "Sesamum": 10346,
      "Cotton (medium staple)": 8267,
      "Cotton (long staple)": 8667,
    },
  },
  rabi: {
    label: "Rabi marketing season 2027-28",
    approved: "1 October 2026",
    crops: {
      "Wheat": 2610,
      "Barley": 2286,
      "Gram": 5958,
      "Lentil (Masur)": 7390,
      "Rapeseed & mustard": 6613,
      "Safflower": 7215,
    },
  },
};

function renderMsp(season) {
  const data = MSP[season];
  $("mspGrid").innerHTML = Object.entries(data.crops).map(([crop, price]) => `
    <div class="msp-item"><dt>${esc(crop)}</dt><dd>${rupees(price)}</dd></div>
  `).join("");
  $("mspNote").innerHTML =
    `₹ per quintal · ${data.label}, approved by the Union Cabinet on ${data.approved}. ` +
    `Onion, potato and tomato have no MSP. ` +
    `<a href="https://cacp.da.gov.in" target="_blank" rel="noopener noreferrer">Official source: CACP</a>`;
}

/* ══════════════════════════════
   LAND UNITS (in square metres)
══════════════════════════════ */
const LAND_UNITS = {
  acre:    { label: "Acre",                  sqm: 4046.856 },
  hectare: { label: "Hectare",               sqm: 10000 },
  guntha:  { label: "Guntha (40 = 1 acre)",  sqm: 101.1714 },
  kanal:   { label: "Kanal (8 = 1 acre)",    sqm: 505.857 },
  marla:   { label: "Marla (20 = 1 kanal)",  sqm: 25.29285 },
  cent:    { label: "Cent (100 = 1 acre)",   sqm: 40.46856 },
  sqm:     { label: "Square metre",          sqm: 1 },
  sqft:    { label: "Square foot",           sqm: 0.09290304 },
};

// Units offered in the calculators
const AREA_UNITS = ["acre", "hectare", "guntha", "kanal"];

function fillSelect(id, options) {
  $(id).innerHTML = options.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join("");
}

const areaOptions = keys => keys.map(key => [key, LAND_UNITS[key].label.split(" (")[0]]);

// Reads a number field; empty or invalid input counts as 0
const fieldValue = id => Math.max(0, parseFloat($(id).value) || 0);

function renderLandConverter() {
  const value = fieldValue("landValue");
  const from = $("landUnit").value;
  const sqm = value * LAND_UNITS[from].sqm;

  $("landResult").innerHTML = Object.entries(LAND_UNITS)
    .filter(([key]) => key !== from)
    .map(([, unit]) => `
      <div><dt>${unit.label}</dt><dd>${(sqm / unit.sqm).toLocaleString("en-IN", { maximumSignificantDigits: 5 })}</dd></div>
    `).join("");
}

/* ══════════════════════════════
   FERTILIZER DOSE CALCULATOR
   General recommended dose of N – P₂O₅ – K₂O in kg per hectare
══════════════════════════════ */
const FERTILIZER = {
  wheat:     { label: "Wheat (Gehun)",     n: 120, p: 60,  k: 40  },
  rice:      { label: "Rice (Dhan)",       n: 120, p: 60,  k: 60  },
  maize:     { label: "Maize (Makka)",     n: 150, p: 75,  k: 40  },
  cotton:    { label: "Cotton (Kapas)",    n: 120, p: 60,  k: 60  },
  soybean:   { label: "Soybean",           n: 20,  p: 80,  k: 40  },
  mustard:   { label: "Mustard (Sarson)",  n: 80,  p: 40,  k: 40  },
  sugarcane: { label: "Sugarcane (Ganna)", n: 250, p: 100, k: 120 },
  potato:    { label: "Potato (Aloo)",     n: 180, p: 100, k: 150 },
};

// Urea = 46% N · DAP = 18% N + 46% P₂O₅ · MOP = 60% K₂O
const BAG_KG = { urea: 45, dap: 50, mop: 50 };

function renderFertilizer() {
  const crop = FERTILIZER[$("fertCrop").value];
  const hectares = fieldValue("fertArea") * LAND_UNITS[$("fertUnit").value].sqm / LAND_UNITS.hectare.sqm;

  // DAP covers the phosphorus and brings some nitrogen with it; urea covers the rest
  const dap = (crop.p * hectares) / 0.46;
  const urea = Math.max(0, (crop.n * hectares - dap * 0.18) / 0.46);
  const mop = (crop.k * hectares) / 0.60;

  const tile = (name, kg, bag) => `
    <div class="tile">
      <div class="tile-name">${name}</div>
      <div class="tile-value">${num(kg)} <small>kg</small></div>
      <div class="tile-sub">≈ ${num(kg / bag, 1)} bags</div>
    </div>
  `;
  $("fertResult").innerHTML = `
    <div class="result-tiles">
      ${tile("Urea", urea, BAG_KG.urea)}${tile("DAP", dap, BAG_KG.dap)}${tile("MOP", mop, BAG_KG.mop)}
    </div>
    <dl class="kv">
      <div><dt>Nitrogen (N)</dt><dd>${num(crop.n * hectares)} kg</dd></div>
      <div><dt>Phosphorus (P₂O₅)</dt><dd>${num(crop.p * hectares)} kg</dd></div>
      <div><dt>Potash (K₂O)</dt><dd>${num(crop.k * hectares)} kg</dd></div>
    </dl>
    <p class="advice">Give all the DAP and MOP at sowing. Split the urea into two or three doses rather than applying it all at once.</p>
  `;
  setText("fertBasis",
    `General dose of N–P–K ${crop.n}–${crop.p}–${crop.k} kg per hectare. Bags: urea 45 kg, DAP and MOP 50 kg. ` +
    `The dose on your Soil Health Card is more accurate.`);
}

/* ══════════════════════════════
   PROFIT ESTIMATE
   Example yield (qtl/acre), price (₹/qtl) and cost (₹/acre) —
   the farmer replaces these with their own figures
══════════════════════════════ */
const PROFIT_CROPS = {
  wheat:   { label: "Wheat",   yield: 18,  cost: 16000, msp: MSP.rabi.crops["Wheat"] },
  paddy:   { label: "Paddy",   yield: 24,  cost: 22000, msp: MSP.kharif.crops["Paddy (common)"] },
  maize:   { label: "Maize",   yield: 20,  cost: 15000, msp: MSP.kharif.crops["Maize"] },
  cotton:  { label: "Cotton",  yield: 8,   cost: 28000, msp: MSP.kharif.crops["Cotton (medium staple)"] },
  soybean: { label: "Soybean", yield: 6,   cost: 14000, msp: MSP.kharif.crops["Soybean (yellow)"] },
  mustard: { label: "Mustard", yield: 7,   cost: 12000, msp: MSP.rabi.crops["Rapeseed & mustard"] },
  gram:    { label: "Gram",    yield: 6,   cost: 12000, msp: MSP.rabi.crops["Gram"] },
  onion:   { label: "Onion",   yield: 100, cost: 60000, price: 1500 },
  potato:  { label: "Potato",  yield: 100, cost: 65000, price: 1200 },
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

  const rows = [
    ["Income", rupees(income)],
    ["Total cost", rupees(cost)],
  ];
  if (cost > 0) rows.push(["Return on cost", num((profit / cost) * 100, 0) + "%"]);
  if (yieldPerAcre > 0) rows.push(["Break-even price", rupees(costPerAcre / yieldPerAcre) + " per qtl"]);
  if (crop.msp) {
    const gap = price - crop.msp;
    rows.push(["MSP " + rupees(crop.msp), gap === 0 ? "Your price is at MSP" : `Your price is ${rupees(Math.abs(gap))} ${gap > 0 ? "above" : "below"}`]);
  }

  $("profitResult").innerHTML = `
    <div class="profit-main${loss ? " is-loss" : ""}">
      <div class="profit-main-label">${loss ? "Estimated loss" : "Estimated profit"}</div>
      <div class="profit-main-value">${rupees(Math.abs(profit))}</div>
    </div>
    <dl class="kv">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
  `;
}

/* ══════════════════════════════
   SOIL pH GUIDE
══════════════════════════════ */
const PH_BANDS = [
  { below: 5.5, level: "bad",  label: "Strongly acidic",
    crops: "Tea, potato and rice tolerate it. Most other crops struggle.",
    fix: "Apply agricultural lime at the rate on your soil test, a few weeks before sowing." },
  { below: 6.5, level: "good", label: "Slightly acidic — good",
    crops: "Good for rice, maize, potato, groundnut and most vegetables.",
    fix: "No correction needed. Keep adding compost or farmyard manure." },
  { below: 7.6, level: "good", label: "Neutral — ideal",
    crops: "Suits almost every crop: wheat, rice, maize, pulses, oilseeds and vegetables.",
    fix: "Nothing to correct. Maintain it with organic matter and balanced fertilizer." },
  { below: 8.6, level: "warn", label: "Alkaline",
    crops: "Wheat, barley, mustard, cotton and sugarcane cope. Pulses and vegetables may show zinc or iron deficiency.",
    fix: "Add compost or green manure, and zinc sulphate if deficiency shows. Use gypsum only if your soil test recommends it." },
  { below: Infinity, level: "bad", label: "Strongly alkaline (sodic)",
    crops: "Only salt-tolerant crops such as barley do well until the soil is reclaimed.",
    fix: "The field needs reclamation — gypsum as per the soil test, then flooding and green manuring. Ask your KVK." },
];

function renderPh() {
  const value = parseFloat($("phSlider").value);
  const band = PH_BANDS.find(b => value < b.below);
  setText("phValue", value.toFixed(1));
  $("phResult").innerHTML = `
    <span class="ph-status" data-level="${band.level}">${band.label}</span>
    <p><strong>Crops:</strong> ${band.crops}</p>
    <p><strong>What to do:</strong> ${band.fix}</p>
  `;
}

function initCalculators() {
  fillSelect("fertCrop", Object.entries(FERTILIZER).map(([key, crop]) => [key, crop.label]));
  fillSelect("fertUnit", areaOptions(AREA_UNITS));
  fillSelect("profitCrop", Object.entries(PROFIT_CROPS).map(([key, crop]) => [key, crop.label]));
  fillSelect("profitUnit", areaOptions(AREA_UNITS));
  fillSelect("landUnit", Object.entries(LAND_UNITS).map(([key, unit]) => [key, unit.label]));

  $("fertForm").addEventListener("input", renderFertilizer);
  $("landForm").addEventListener("input", renderLandConverter);
  $("phSlider").addEventListener("input", renderPh);
  $("profitCrop").addEventListener("change", loadProfitDefaults);
  $("profitForm").addEventListener("input", renderProfit);
  ["fertForm", "profitForm", "landForm"].forEach(id => $(id).addEventListener("submit", e => e.preventDefault()));

  loadProfitDefaults();
  renderFertilizer();
  renderProfit();
  renderLandConverter();
  renderPh();
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

const WELCOME =
  "**Namaste! Main Mitra hoon** — aapka farm assistant.\n\n" +
  "Fasal, keet-rog, sinchai, mandi ya sarkari yojana — kuch bhi poochhiye, Hindi ya English mein.";

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
  retry.textContent = "Try again";
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
  el.innerHTML = `<span class="typing" role="img" aria-label="Mitra is typing"><span></span><span></span><span></span></span>`;
  $("chatLog").appendChild(el);
  scrollChat();
}

function renderChatLog() {
  $("chatLog").innerHTML = "";
  addMessage("bot", WELCOME);
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
    `Today is ${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}. ` +
    `Current season: ${SEASONS[getSeason(now.getMonth())].name}.`
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
  if (err.status === 429)
    return "Mitra ke paas abhi bahut sawal aa rahe hain. Please wait a minute and try again.";
  if (err.status >= 500)
    return "Mitra abhi jawab nahi de paya. The AI service is busy — please try again in a moment.";
  if (err.status)
    return "Yeh sawal bheja nahi ja saka. Please shorten it and try again.";
  return "Mitra se sampark nahi ho paya. Check your internet and try again — the server can take up to a minute to wake up.";
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

// Render's free server sleeps when idle — wake it before the first question
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
    setTimeout(() => $("chatInput").focus(), 80);
  } else {
    $("chatFab").focus();
  }
}

function initChat() {
  const input = $("chatInput");
  renderChatLog();

  // Any "Ask Mitra" button opens the chat; the floating button also closes it
  document.querySelectorAll("[data-open-chat]").forEach(btn => {
    btn.addEventListener("click", () => setChatOpen(btn.id === "chatFab" ? !chat.open : true));
  });

  // Ready-made questions
  document.querySelectorAll("[data-ask]").forEach(btn => {
    btn.addEventListener("click", () => {
      setChatOpen(true);
      sendMessage(btn.dataset.ask);
    });
  });

  $("chatClose").addEventListener("click", () => setChatOpen(false));
  $("chatClear").addEventListener("click", () => {
    if (chat.busy) return;
    chat.history = [];
    writeStore("session", "km_chat", []);
    renderChatLog();
    input.focus();
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
   REVEAL ON SCROLL
══════════════════════════════ */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(el => observer.observe(el));
}

/* ══════════════════════════════
   INIT — Run on page load
══════════════════════════════ */
function init() {
  const season = getSeason(new Date().getMonth());

  // 1. Date & season
  renderDate();

  // 2. Static widgets
  renderSowSummary();
  renderPests();
  initTabs("cropTabs", "season", season, renderCropList);
  initTabs("mspTabs", "msp", season === "kharif" ? "kharif" : "rabi", renderMsp);
  initCalculators();

  // 3. Chat
  initChat();

  // 4. Location, then weather for it
  initLocation();
  loadWeather();
  $("refreshWeather").addEventListener("click", () => loadWeather({ force: true }));

  // 5. Keep the weather fresh while the page is being looked at
  setInterval(() => { if (!document.hidden) loadWeather({ force: true }); }, CONFIG.WEATHER_REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    const stale = weather && Date.now() - weather.fetchedAt > CONFIG.WEATHER_REFRESH_MS;
    if (!document.hidden && stale) loadWeather({ force: true });
  });

  // 6. Smooth entrance of sections
  initReveal();

  console.log("🌾 KrishiMitra loaded — Jai Kisan!");
}

init();
