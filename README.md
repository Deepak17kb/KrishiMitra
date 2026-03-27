<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8,14&height=220&section=header&text=KrishiMitra&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Kisan%20ka%20Sachcha%20Mitra&descAlignY=62&descSize=20&descColor=f2d98a" width="100%"/>

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Georgia&size=20&pause=1200&color=5a7a3a&center=true&vCenter=true&width=620&lines=AI-powered+farming+companion+for+India;Live+weather+and+mandi+rates;Built+for+every+Indian+farmer;Hindi+and+English+support)

</div>

<br/>

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-4a7c3f?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-3d6b35?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-c8902a?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20JS-d4a843?style=for-the-badge&logo=javascript&logoColor=white)
![Free](https://img.shields.io/badge/100%25%20Free%20APIs-6b8f5e?style=for-the-badge)

</div>

---

<div align="center">
      Connecting farmers to the tools they deserve

</div>

---

## About

> "A farmer who has the right information at the right time can make decisions that change a season."

KrishiMitra started from a simple observation — Indian farmers have access to smartphones but rarely have access to timely, reliable farming guidance in their own language. This project is an attempt to bridge that gap with free, accessible technology.

It is a full-stack web application that brings together AI-powered advice, live weather, mandi prices, crop calendars, and government schemes — all under one roof, in Hindi and English.

<table>
<tr>
<td width="50%">

**AI at its core**

Gemini 2.5 Flash powers a chatbot that understands agriculture-specific questions about crops, pests, soil, irrigation, and government schemes — and answers in the farmer's preferred language.

</td>
<td width="50%">

**Always current**

Weather data updates in real time via Open-Meteo. The app auto-detects location and translates conditions into actionable farm advice — no manual input needed.

</td>
</tr>
<tr>
<td width="50%">

**Market aware**

Live mandi prices for Wheat, Rice, Maize, Cotton, Onion and more — so farmers can make informed decisions about when and where to sell.

</td>
<td width="50%">

**Built for Bharat**

Kharif, Rabi, and Zaid crop calendars. Guidance on PM-KISAN, Fasal Bima, Soil Health Card, and SMAM — with direct links to official portals.

</td>
</tr>
</table>

---

## Features

<div align="center">

| Feature | What it does | Type |
|---------|-------------|------|
| **AI Chatbot** | Answers crop, pest, irrigation and scheme questions in Hindi and English | ![Gemini](https://img.shields.io/badge/Gemini-c8902a?style=flat-square) |
| **Weather Dashboard** | Temperature, humidity, wind, rain probability with smart farm advice | ![Free](https://img.shields.io/badge/Free-6b8f5e?style=flat-square) |
| **Mandi Rates** | Daily crop prices for major commodities across India | ![Live](https://img.shields.io/badge/Live-4a7a9b?style=flat-square) |
| **Crop Calendar** | Sowing and harvest windows for Kharif, Rabi, and Zaid seasons | ![Built-in](https://img.shields.io/badge/Built--in-5a7a3a?style=flat-square) |
| **Government Schemes** | PM-KISAN, Fasal Bima, SMAM — explained simply with direct links | ![Gov](https://img.shields.io/badge/India%20Gov-b87333?style=flat-square) |
| **Agriculture News** | Latest farming news from India via NewsData.io | ![Live](https://img.shields.io/badge/Live-4a7a9b?style=flat-square) |

</div>

---

## Tech Stack

<div align="center">

| Layer | Technology | Notes |
|:-----:|-----------|-------|
| **Frontend** | HTML · CSS · Vanilla JS | No frameworks. Lightweight, runs anywhere. |
| **Backend** | Node.js + Express | REST API with CORS, rate limiting, error handling |
| **AI** | Gemini 2.5 Flash | Free tier — 250 requests per day |
| **Weather** | Open-Meteo | Completely free, no API key required |
| **News** | NewsData.io | Free tier — 200 calls per day |
| **Geocoding** | Nominatim OSM | Free reverse geocoding |

</div>

---

## File Structure
```
krishimitra/
│
├── index.html
├── style.css
├── script.js
│
└── backend/
    ├── server.js
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    └── .env                 ← never commit this
```

---

## Getting Started

**Clone the repository**
```bash
git clone https://github.com/yourusername/krishimitra.git
cd krishimitra/backend
```

**Install dependencies**
```bash
npm install
```

**Set up environment**
```bash
cp .env.example .env
```

Open `.env` and add your keys:
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

Then open `index.html` in your browser. That is all it takes.

---

> **Before you push** — make sure `.env` is listed in your `.gitignore`. API keys exposed in public repositories are found and abused within minutes by automated scanners. Keep yours private.

---

## Resources

<div align="center">

[![Gemini](https://img.shields.io/badge/Get%20Gemini%20Key-c8902a?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-4a7a9b?style=for-the-badge)](https://open-meteo.com)
[![NewsData](https://img.shields.io/badge/NewsData.io-6b8f5e?style=for-the-badge)](https://newsdata.io)
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
