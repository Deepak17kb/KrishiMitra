<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8,14&height=220&section=header&text=KrishiMitra&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Kisan%20ka%20Sachcha%20Mitra&descAlignY=62&descSize=20&descColor=f2d98a" width="100%"/>

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Georgia&size=20&pause=1200&color=5a7a3a&center=true&vCenter=true&width=620&lines=AI-powered+farming+companion+for+India;Live+weather%2C+spray+timing+and+soil+outlook;Built+for+every+Indian+farmer;Hindi+and+English+support)

</div>

<br/>

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-4a7c3f?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-3d6b35?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini%203.8%20Flash-c8902a?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20JS-d4a843?style=for-the-badge&logo=javascript&logoColor=white)
![Free](https://img.shields.io/badge/100%25%20Free%20APIs-6b8f5e?style=for-the-badge)

</div>

<div align="center">

**[Open the live site →](https://krishi-mitra-silk-nine.vercel.app)**

</div>

---

<div align="center">
      Connecting farmers to the tools they deserve

</div>

---

## About

> "A farmer who has the right information at the right time can make decisions that change a season."

KrishiMitra started from a simple observation — Indian farmers have access to smartphones but rarely have access to timely, reliable farming guidance in their own language. This project is an attempt to bridge that gap with free, accessible technology.

It is a full-stack web application that brings together an AI assistant, live weather, spray timing, soil and irrigation outlook, a crop calendar, support prices, farm calculators and government schemes — on one calm page, in Hindi and English.

<table>
<tr>
<td width="50%">

**AI at its core**

Mitra, the built-in assistant, answers questions about crops, pests, soil, irrigation and schemes in the farmer's own language. It already knows the farmer's location, weather and season.

</td>
<td width="50%">

**Real data only**

Weather, hourly forecast and soil estimates come live from Open-Meteo. Nothing on the page is simulated — where live data is not available, the page links to the official source instead.

</td>
</tr>
<tr>
<td width="50%">

**Decisions, not just numbers**

The forecast is turned into answers: which hours are safe to spray, whether to irrigate in the next three days, what to sow this month.

</td>
<td width="50%">

**Built for Bharat**

Kharif, Rabi and Zaid calendars, MSP as announced by the Government of India, local land units (guntha, kanal, marla, cent) and tap-to-call helplines.

</td>
</tr>
</table>

---

## Features

<div align="center">

| Feature | What it does | Source |
|---------|-------------|--------|
| **Mitra — AI assistant** | Answers crop, pest, irrigation and scheme questions in Hindi, Hinglish and English | Google Gemini |
| **Weather now** | Temperature, humidity, wind, rain chance, UV, sunrise and sunset with plain farm advice | Open-Meteo |
| **7-day forecast** | Daily rain and temperature range for the week ahead | Open-Meteo |
| **Spray & field-work window** | Rates every daylight hour for the next two days from wind, rain, heat and humidity | Open-Meteo |
| **Soil & irrigation** | Soil temperature and moisture, crop water use and a 3-day irrigation outlook | Open-Meteo |
| **Crop calendar** | Sowing and harvest windows for Kharif, Rabi and Zaid, with "sow now" markers | Built-in |
| **Pest & disease watch** | What to look for this season and the first step to take | Built-in |
| **Minimum Support Price** | Kharif 2026-27 and Rabi 2027-28 prices | Government of India |
| **Calculators** | Fertilizer dose, profit estimate, land unit converter, soil pH guide | Built-in |
| **Schemes & helplines** | PM-KISAN, Fasal Bima, KCC, Soil Health Card and more, with official links | Government of India |

</div>

---

## Tech Stack

<div align="center">

| Layer | Technology | Notes |
|:-----:|-----------|-------|
| **Frontend** | HTML · CSS · Vanilla JS | No frameworks, no build step. One page, three files. |
| **Backend** | Node.js + Express | REST API with CORS, rate limiting, error handling |
| **AI** | Gemini 3.8 Flash | Falls back automatically to other Gemini models if one is busy |
| **Weather & soil** | Open-Meteo | Free, no API key required |
| **Place search** | Open-Meteo Geocoding | Free, no API key required |
| **Place names** | BigDataCloud | Free reverse geocoding for the browser |

</div>

---

## File Structure
```
KrishiMitra/
│
├── index.html               ← page structure
├── style.css                ← design
├── script.js                ← weather, widgets, calculators, chat
│
└── backend/
    ├── server.js            ← chat API (talks to Gemini)
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    └── .env                 ← never commit this
```

---

## Getting Started

**Clone the repository**
```bash
git clone https://github.com/Deepak17kb/KrishiMitra.git
cd KrishiMitra/backend
```

**Install dependencies**
```bash
npm install
```

**Set up environment**
```bash
cp .env.example .env
```

Open `.env` and add your key:
```env
# Get your free key at aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

**Start the server**
```bash
npm start
```

**Open the site**

Serve the project folder with any static server on port 5500 — for example the *Live Server* extension in VS Code — and open:

```
http://localhost:5500/?backend=local
```

`?backend=local` makes the page talk to the backend on your computer. Without it, the page uses the live backend on Render.

---

## Deployment

| Part | Where | How it updates |
|------|-------|----------------|
| Website | [Vercel](https://krishi-mitra-silk-nine.vercel.app) and [GitHub Pages](https://deepak17kb.github.io/KrishiMitra/) | Automatically on every push to `main` |
| Backend | [Render](https://krishimitra-backend-6spu.onrender.com/health) web service running the `backend` folder with `npm start` | Deploys from `main` — automatic if auto-deploy is on in Render, otherwise use *Manual Deploy* |

The backend needs one environment variable on Render: `GEMINI_API_KEY`.

If the website moves to a new address, add that address to the `cors` list in `backend/server.js`, or the chat will be blocked.

---

## Keeping it current

Two things in `script.js` need a look once a year:

- **`MSP`** — support prices. The Union Cabinet announces Kharif prices around June and Rabi prices around October.
- **`PROFIT_CROPS`** — the example yields and costs in the profit estimate.

The Gemini models the chat uses are listed in `GEMINI_MODELS` at the top of `backend/server.js`.

---

> **Before you push** — make sure `.env` is listed in your `.gitignore`. API keys exposed in public repositories are found and abused within minutes by automated scanners. Keep yours private.

---

## Resources

<div align="center">

[![Gemini](https://img.shields.io/badge/Get%20Gemini%20Key-c8902a?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-4a7a9b?style=for-the-badge)](https://open-meteo.com)
[![PM-KISAN](https://img.shields.io/badge/PM--KISAN-b87333?style=for-the-badge)](https://pmkisan.gov.in)
[![Node.js](https://img.shields.io/badge/Node.js-4a7c3f?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)

</div>

---

<div align="center">


*Made with* ❤️ *for Indian Farmers*

**जय किसान 🌾**

![Profile Views](https://komarev.com/ghpvc/?username=Deepak17kb&color=3a7d44&style=flat-square&label=README+Views)
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8,14&height=140&section=footer&animation=fadeIn" width="100%"/>


</div>
