
Readme · HTML
Copy

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>KrishiMitra — README</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet"/>
<style>
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
 
:root {
  --ink:     #0a0f07;
  --paper:   #f5f2e8;
  --grass:   #2a5c1e;
  --leaf:    #4a8c3a;
  --sprout:  #7cbf5c;
  --gold:    #c8922a;
  --sun:     #f0c040;
  --rust:    #8b3a1a;
  --cream:   #faf7ee;
  --smoke:   #e8e4d8;
  --mono:    'DM Mono', monospace;
  --display: 'Bebas Neue', sans-serif;
  --serif:   'Fraunces', serif;
}
 
html { scroll-behavior: smooth; }
 
body {
  background: var(--ink);
  color: var(--paper);
  font-family: var(--mono);
  font-size: 14px;
  line-height: 1.7;
  overflow-x: hidden;
  cursor: none;
}
 
/* ── CUSTOM CURSOR ── */
.cursor {
  width: 12px; height: 12px;
  background: var(--sprout);
  border-radius: 50%;
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%,-50%);
  transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease, background 0.2s ease;
  mix-blend-mode: screen;
}
.cursor-ring {
  width: 36px; height: 36px;
  border: 1px solid rgba(124,191,92,0.4);
  border-radius: 50%;
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 9998;
  transform: translate(-50%,-50%);
  transition: transform 0.18s ease, width 0.25s ease, height 0.25s ease;
}
 
/* ── GRAIN OVERLAY ── */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1000;
  opacity: 0.35;
}
 
/* ── CANVAS BACKGROUND ── */
#bgCanvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.15;
}
 
/* ── HERO ── */
.hero {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  overflow: hidden;
}
 
.hero-eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--sprout);
  opacity: 0;
  animation: riseIn 0.8s ease 0.2s forwards;
  margin-bottom: 20px;
}
 
.hero-eyebrow span {
  display: inline-block;
  width: 40px;
  height: 1px;
  background: var(--sprout);
  vertical-align: middle;
  margin: 0 12px;
  opacity: 0.5;
}
 
.hero-title {
  font-family: var(--display);
  font-size: clamp(80px, 16vw, 200px);
  line-height: 0.88;
  letter-spacing: -2px;
  color: var(--paper);
  opacity: 0;
  animation: riseIn 1s ease 0.4s forwards;
  position: relative;
}
 
.hero-title .accent {
  color: var(--sprout);
  display: block;
  -webkit-text-stroke: 1px var(--sprout);
  color: transparent;
  transition: color 0.3s ease;
}
.hero-title .accent:hover { color: var(--sprout); }
 
.hero-title .solid { display: block; }
 
.hero-subtitle {
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(16px, 2.5vw, 22px);
  font-weight: 300;
  color: rgba(245,242,232,0.55);
  margin-top: 24px;
  opacity: 0;
  animation: riseIn 0.8s ease 0.7s forwards;
  max-width: 480px;
}
 
.hero-divider {
  width: 1px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, var(--sprout), transparent);
  margin: 48px auto;
  opacity: 0;
  animation: riseIn 0.8s ease 1s forwards;
}
 
.hero-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  opacity: 0;
  animation: riseIn 0.8s ease 1.1s forwards;
}
 
.tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 16px;
  border: 1px solid rgba(124,191,92,0.25);
  border-radius: 2px;
  color: rgba(245,242,232,0.6);
  transition: all 0.25s ease;
}
.tag:hover {
  border-color: var(--sprout);
  color: var(--sprout);
  background: rgba(124,191,92,0.06);
}
 
.scroll-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: riseIn 0.8s ease 1.5s forwards;
}
.scroll-hint span {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(245,242,232,0.3);
}
.scroll-line {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, rgba(124,191,92,0.5), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
 
/* ── SECTIONS ── */
section {
  position: relative;
  z-index: 10;
  padding: 100px 24px;
  max-width: 960px;
  margin: 0 auto;
}
 
/* ── SECTION LABEL ── */
.section-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--sprout);
  margin-bottom: 48px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(124,191,92,0.15);
}
 
/* ── ABOUT ── */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}
 
.about-block {
  border: 1px solid rgba(245,242,232,0.06);
  padding: 40px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.about-block:hover { border-color: rgba(124,191,92,0.2); }
 
.about-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(124,191,92,0.04), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.about-block:hover::before { opacity: 1; }
 
.about-num {
  font-family: var(--display);
  font-size: 80px;
  color: rgba(124,191,92,0.08);
  line-height: 1;
  position: absolute;
  top: 16px;
  right: 24px;
}
 
.about-icon { font-size: 28px; margin-bottom: 16px; display: block; }
 
.about-title {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--paper);
  margin-bottom: 10px;
}
 
.about-desc {
  font-size: 13px;
  color: rgba(245,242,232,0.5);
  line-height: 1.8;
}
 
/* ── FEATURES ── */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
 
.feature-row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid rgba(245,242,232,0.06);
  transition: all 0.25s ease;
  cursor: default;
}
.feature-row:last-child { border-bottom: none; }
.feature-row:hover { padding-left: 12px; }
.feature-row:hover .feature-num { color: var(--sprout); }
 
.feature-num {
  font-family: var(--display);
  font-size: 36px;
  color: rgba(245,242,232,0.1);
  transition: color 0.25s ease;
  line-height: 1;
}
 
.feature-info {}
.feature-name {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--paper);
  margin-bottom: 4px;
}
.feature-detail {
  font-size: 12px;
  color: rgba(245,242,232,0.4);
  letter-spacing: 0.5px;
}
 
.feature-badge {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 2px;
}
.badge-free { border: 1px solid rgba(124,191,92,0.3); color: var(--sprout); }
.badge-ai   { border: 1px solid rgba(200,146,42,0.3); color: var(--gold); }
.badge-live { border: 1px solid rgba(240,192,64,0.3); color: var(--sun); }
 
/* ── TECH STACK ── */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
 
.stack-card {
  background: rgba(245,242,232,0.02);
  border: 1px solid rgba(245,242,232,0.06);
  padding: 32px 28px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.stack-card:hover {
  background: rgba(124,191,92,0.04);
  border-color: rgba(124,191,92,0.18);
  transform: translateY(-2px);
}
 
.stack-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--sprout), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.stack-card:hover::after { opacity: 1; }
 
.stack-layer {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--sprout);
  margin-bottom: 12px;
  opacity: 0.7;
}
.stack-name {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--paper);
  margin-bottom: 6px;
}
.stack-detail {
  font-size: 11px;
  color: rgba(245,242,232,0.35);
  line-height: 1.7;
}
 
/* ── SETUP / TERMINAL ── */
.terminal {
  background: #0d1208;
  border: 1px solid rgba(124,191,92,0.15);
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--mono);
}
 
.terminal-bar {
  background: rgba(124,191,92,0.06);
  border-bottom: 1px solid rgba(124,191,92,0.1);
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.t-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}
.t-dot:nth-child(1) { background: #ff5f57; }
.t-dot:nth-child(2) { background: #febc2e; }
.t-dot:nth-child(3) { background: #28c840; }
.t-title {
  font-size: 11px;
  color: rgba(245,242,232,0.3);
  margin-left: 8px;
  letter-spacing: 1px;
}
 
.terminal-body { padding: 28px; }
 
.t-line {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
  opacity: 0;
  animation: typeIn 0.4s ease forwards;
}
 
.t-prompt { color: var(--sprout); user-select: none; flex-shrink: 0; }
.t-cmd    { color: var(--paper); }
.t-comment{ color: rgba(245,242,232,0.25); font-style: italic; }
.t-output { color: rgba(245,242,232,0.5); padding-left: 20px; }
.t-success{ color: var(--sprout); padding-left: 20px; }
.t-warn   { color: var(--gold); padding-left: 20px; }
 
/* ── ENV BLOCK ── */
.env-block {
  background: #0a0e08;
  border: 1px solid rgba(200,146,42,0.2);
  border-left: 3px solid var(--gold);
  padding: 24px 28px;
  border-radius: 2px;
  margin-top: 24px;
}
 
.env-title {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 14px;
  opacity: 0.8;
}
 
.env-line { margin-bottom: 6px; }
.env-key  { color: var(--sprout); }
.env-val  { color: rgba(245,242,232,0.4); }
.env-comment { color: rgba(245,242,232,0.2); font-style: italic; }
 
/* ── WARNING BOX ── */
.warning-box {
  border: 1px solid rgba(139,58,26,0.4);
  background: rgba(139,58,26,0.08);
  border-left: 3px solid var(--rust);
  padding: 20px 24px;
  border-radius: 2px;
  margin-top: 24px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.warning-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.warning-text { font-size: 12px; color: rgba(245,242,232,0.6); line-height: 1.8; }
.warning-text strong { color: #e87050; }
 
/* ── FILE TREE ── */
.file-tree {
  background: #090d06;
  border: 1px solid rgba(245,242,232,0.06);
  padding: 28px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 13px;
}
 
.tree-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  color: rgba(245,242,232,0.55);
  transition: color 0.2s ease;
}
.tree-line:hover { color: var(--paper); }
.tree-indent-1 { padding-left: 20px; }
.tree-indent-2 { padding-left: 40px; }
.tree-folder   { color: var(--gold); }
.tree-file-html{ color: #e06b4c; }
.tree-file-css { color: #6baee0; }
.tree-file-js  { color: #e0c04c; }
.tree-file-json{ color: #8ce0a0; }
.tree-file-env { color: var(--rust); }
.tree-file-ex  { color: rgba(245,242,232,0.3); }
.tree-ok   { margin-left: auto; color: var(--sprout); font-size: 10px; }
.tree-no   { margin-left: auto; color: var(--rust); font-size: 10px; }
 
/* ── FOOTER ── */
footer {
  position: relative;
  z-index: 10;
  padding: 80px 24px 60px;
  text-align: center;
  border-top: 1px solid rgba(245,242,232,0.06);
}
 
.footer-title {
  font-family: var(--display);
  font-size: clamp(48px, 10vw, 120px);
  color: rgba(245,242,232,0.04);
  line-height: 1;
  margin-bottom: 32px;
  letter-spacing: -2px;
}
 
.footer-links {
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}
 
.footer-link {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(245,242,232,0.35);
  text-decoration: none;
  transition: color 0.2s ease;
  position: relative;
}
.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 1px;
  background: var(--sprout);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}
.footer-link:hover { color: var(--sprout); }
.footer-link:hover::after { transform: scaleX(1); }
 
.footer-copy {
  font-size: 11px;
  color: rgba(245,242,232,0.2);
  letter-spacing: 1px;
}
.footer-copy span { color: var(--sprout); }
 
/* ── DIVIDER ── */
.full-divider {
  position: relative;
  z-index: 10;
  height: 1px;
  background: rgba(245,242,232,0.05);
  max-width: 960px;
  margin: 0 auto;
}
 
/* ── ANIMATIONS ── */
@keyframes riseIn {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
 
@keyframes scrollPulse {
  0%,100% { transform:scaleY(1); opacity:0.5; }
  50%     { transform:scaleY(0.6); opacity:1; }
}
 
@keyframes typeIn {
  from { opacity:0; transform:translateX(-8px); }
  to   { opacity:1; transform:translateX(0); }
}
 
@keyframes float {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-8px); }
}
 
/* stagger terminal lines */
.t-line:nth-child(1)  { animation-delay: 0.1s; }
.t-line:nth-child(2)  { animation-delay: 0.3s; }
.t-line:nth-child(3)  { animation-delay: 0.5s; }
.t-line:nth-child(4)  { animation-delay: 0.7s; }
.t-line:nth-child(5)  { animation-delay: 0.9s; }
.t-line:nth-child(6)  { animation-delay: 1.1s; }
.t-line:nth-child(7)  { animation-delay: 1.3s; }
.t-line:nth-child(8)  { animation-delay: 1.5s; }
.t-line:nth-child(9)  { animation-delay: 1.7s; }
.t-line:nth-child(10) { animation-delay: 1.9s; }
.t-line:nth-child(11) { animation-delay: 2.1s; }
 
/* scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
 
@media (max-width: 768px) {
  .about-grid  { grid-template-columns: 1fr; }
  .stack-grid  { grid-template-columns: 1fr 1fr; }
  .feature-row { grid-template-columns: 36px 1fr; }
  .feature-badge { display: none; }
}
@media (max-width: 480px) {
  .stack-grid { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
 
<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>
 
<canvas id="bgCanvas"></canvas>
 
<!-- ═══ HERO ═══ -->
<div class="hero">
  <p class="hero-eyebrow"><span></span> Agriculture AI · India <span></span></p>
  <h1 class="hero-title">
    <span class="solid">KRISHI</span>
    <span class="accent">MITRA</span>
  </h1>
  <p class="hero-subtitle">Kisan ka Sachcha Mitra — an AI-powered digital companion built for the Indian farmer.</p>
  <div class="hero-divider"></div>
  <div class="hero-tags">
    <span class="tag">Node.js</span>
    <span class="tag">Google Gemini</span>
    <span class="tag">Open-Meteo</span>
    <span class="tag">Express.js</span>
    <span class="tag">Vanilla JS</span>
    <span class="tag">Free Tier</span>
  </div>
  <div class="scroll-hint">
    <div class="scroll-line"></div>
    <span>Scroll</span>
  </div>
</div>
 
<div class="full-divider"></div>
 
<!-- ═══ ABOUT ═══ -->
<section>
  <div class="section-label reveal">01 — About</div>
  <div class="about-grid reveal">
    <div class="about-block">
      <span class="about-num">01</span>
      <span class="about-icon">🌾</span>
      <div class="about-title">What is KrishiMitra?</div>
      <div class="about-desc">A full-stack web application that gives Indian farmers instant access to AI farming advice, live weather, mandi rates, government schemes, and crop calendars — all in one place. Works in Hindi and English.</div>
    </div>
    <div class="about-block">
      <span class="about-num">02</span>
      <span class="about-icon">🤖</span>
      <div class="about-title">Powered by Gemini</div>
      <div class="about-desc">The chatbot uses Google Gemini 2.5 Flash — a fast, free-tier AI model trained to answer agriculture-specific questions with deep knowledge of Indian crops, seasons, soils, and government schemes.</div>
    </div>
    <div class="about-block">
      <span class="about-num">03</span>
      <span class="about-icon">🌤️</span>
      <div class="about-title">Live Data, Zero Cost</div>
      <div class="about-desc">Weather data comes from Open-Meteo (free, no API key). Location is auto-detected. Farm advice updates dynamically based on temperature, humidity, wind speed, and rain probability.</div>
    </div>
    <div class="about-block">
      <span class="about-num">04</span>
      <span class="about-icon">🇮🇳</span>
      <div class="about-title">Built for Bharat</div>
      <div class="about-desc">Designed specifically for Indian farmers with Kharif/Rabi/Zaid crop calendars, real mandi rates, PM-KISAN and Fasal Bima scheme guidance, and a Hindi-first chatbot experience.</div>
    </div>
  </div>
</section>
 
<div class="full-divider"></div>
 
<!-- ═══ FEATURES ═══ -->
<section>
  <div class="section-label reveal">02 — Features</div>
  <div class="features-list reveal">
    <div class="feature-row">
      <div class="feature-num">01</div>
      <div class="feature-info">
        <div class="feature-name">AI Chatbot — KrishiMitra Assistant</div>
        <div class="feature-detail">Answers crop, pest, irrigation, scheme questions in Hindi & English</div>
      </div>
      <span class="feature-badge badge-ai">Gemini AI</span>
    </div>
    <div class="feature-row">
      <div class="feature-num">02</div>
      <div class="feature-info">
        <div class="feature-name">Live Weather Dashboard</div>
        <div class="feature-detail">Temperature, humidity, wind, rain chance + smart farm advice</div>
      </div>
      <span class="feature-badge badge-free">Free API</span>
    </div>
    <div class="feature-row">
      <div class="feature-num">03</div>
      <div class="feature-info">
        <div class="feature-name">Mandi Rates</div>
        <div class="feature-detail">Today's crop prices for Wheat, Rice, Maize, Cotton, Onion & more</div>
      </div>
      <span class="feature-badge badge-live">Live</span>
    </div>
    <div class="feature-row">
      <div class="feature-num">04</div>
      <div class="feature-info">
        <div class="feature-name">Crop Season Calendar</div>
        <div class="feature-detail">Kharif, Rabi, Zaid — sowing windows, harvest time, crop details</div>
      </div>
      <span class="feature-badge badge-free">Built-in</span>
    </div>
    <div class="feature-row">
      <div class="feature-num">05</div>
      <div class="feature-info">
        <div class="feature-name">Government Schemes Guide</div>
        <div class="feature-detail">PM-KISAN, Fasal Bima, Soil Health Card, SMAM — with direct links</div>
      </div>
      <span class="feature-badge badge-free">India Gov</span>
    </div>
    <div class="feature-row">
      <div class="feature-num">06</div>
      <div class="feature-info">
        <div class="feature-name">Agriculture News Feed</div>
        <div class="feature-detail">Latest farming news from India via NewsData.io</div>
      </div>
      <span class="feature-badge badge-live">Live</span>
    </div>
  </div>
</section>
 
<div class="full-divider"></div>
 
<!-- ═══ TECH STACK ═══ -->
<section>
  <div class="section-label reveal">03 — Tech Stack</div>
  <div class="stack-grid reveal">
    <div class="stack-card">
      <div class="stack-layer">Frontend</div>
      <div class="stack-name">HTML · CSS · JS</div>
      <div class="stack-detail">Vanilla stack. No frameworks. Fast, lightweight, runs anywhere.</div>
    </div>
    <div class="stack-card">
      <div class="stack-layer">Backend</div>
      <div class="stack-name">Node.js + Express</div>
      <div class="stack-detail">REST API server with CORS, rate limiting, and error handling.</div>
    </div>
    <div class="stack-card">
      <div class="stack-layer">AI Model</div>
      <div class="stack-name">Gemini 2.5 Flash</div>
      <div class="stack-detail">Google's free-tier model. 250 requests/day. Fast responses.</div>
    </div>
    <div class="stack-card">
      <div class="stack-layer">Weather</div>
      <div class="stack-name">Open-Meteo</div>
      <div class="stack-detail">100% free weather API. No key needed. Auto location detect.</div>
    </div>
    <div class="stack-card">
      <div class="stack-layer">News</div>
      <div class="stack-name">NewsData.io</div>
      <div class="stack-detail">Free tier — 200 calls/day. India agriculture category.</div>
    </div>
    <div class="stack-card">
      <div class="stack-layer">Geocoding</div>
      <div class="stack-name">Nominatim OSM</div>
      <div class="stack-detail">Free reverse geocoding. Converts coords to city name.</div>
    </div>
  </div>
</section>
 
<div class="full-divider"></div>
 
<!-- ═══ FILE STRUCTURE ═══ -->
<section>
  <div class="section-label reveal">04 — File Structure</div>
  <div class="file-tree reveal">
    <div class="tree-line"><span class="tree-folder">📁 krishimitra/</span></div>
    <div class="tree-line tree-indent-1"><span class="tree-file-html">📄 index.html</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-1"><span class="tree-file-css">📄 style.css</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-1"><span class="tree-file-js">📄 script.js</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-1"><span class="tree-folder">📁 backend/</span></div>
    <div class="tree-line tree-indent-2"><span class="tree-file-js">📄 server.js</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-2"><span class="tree-file-json">📄 package.json</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-2"><span class="tree-file-json">📄 package-lock.json</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-2"><span class="tree-file-ex">📄 .env.example</span><span class="tree-ok">✓ upload</span></div>
    <div class="tree-line tree-indent-2"><span class="tree-file-env">🔒 .env</span><span class="tree-no">✗ never</span></div>
  </div>
</section>
 
<div class="full-divider"></div>
 
<!-- ═══ SETUP ═══ -->
<section>
  <div class="section-label reveal">05 — Setup</div>
 
  <div class="terminal reveal">
    <div class="terminal-bar">
      <div class="t-dot"></div>
      <div class="t-dot"></div>
      <div class="t-dot"></div>
      <span class="t-title">bash — krishimitra/backend</span>
    </div>
    <div class="terminal-body">
      <div class="t-line"><span class="t-prompt">$</span><span class="t-comment"># 1. Clone the repository</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-cmd">git clone https://github.com/yourusername/krishimitra.git</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-comment"># 2. Go into backend folder</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-cmd">cd krishimitra/backend</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-comment"># 3. Install dependencies</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-cmd">npm install</span></div>
      <div class="t-line"><span class="t-prompt"> </span><span class="t-output">added 4 packages in 2.8s ✓</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-comment"># 4. Add your Gemini API key to .env</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-cmd">cp .env.example .env</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-comment"># 5. Start the server</span></div>
      <div class="t-line"><span class="t-prompt">$</span><span class="t-cmd">npm start</span></div>
    </div>
  </div>
 
  <div class="env-block reveal">
    <div class="env-title">backend/.env</div>
    <div class="env-line"><span class="t-comment env-comment"># Get your free key at aistudio.google.com</span></div>
    <div class="env-line"><span class="env-key">GEMINI_API_KEY</span><span class="env-val">=your_gemini_api_key_here</span></div>
    <div class="env-line"><span class="env-key">PORT</span><span class="env-val">=3000</span></div>
    <div class="env-line"><span class="env-key">NODE_ENV</span><span class="env-val">=development</span></div>
  </div>
 
  <div class="warning-box reveal">
    <span class="warning-icon">⚠️</span>
    <div class="warning-text">
      <strong>Never commit your .env file to GitHub.</strong> Add <code>.env</code> to your <code>.gitignore</code> before pushing. Your API key is a secret — bots scan public repos every minute looking for exposed keys.
    </div>
  </div>
</section>
 
<div class="full-divider"></div>
 
<!-- ═══ FOOTER ═══ -->
<footer>
  <div class="footer-title">KRISHIMITRA</div>
  <div class="footer-links">
    <a class="footer-link" href="https://aistudio.google.com" target="_blank">Get Gemini Key</a>
    <a class="footer-link" href="https://newsdata.io" target="_blank">NewsData.io</a>
    <a class="footer-link" href="https://open-meteo.com" target="_blank">Open-Meteo</a>
    <a class="footer-link" href="https://pmkisan.gov.in" target="_blank">PM-KISAN</a>
    <a class="footer-link" href="https://nodejs.org" target="_blank">Node.js</a>
  </div>
  <p class="footer-copy">Made with <span>♥</span> for Indian Farmers · जय किसान 🌾</p>
</footer>
 
<script>
/* ── CUSTOM CURSOR ── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
 
function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();
 
document.querySelectorAll('a, button, .feature-row, .stack-card, .about-block, .tag').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width  = '20px';
    cursor.style.height = '20px';
    ring.style.width    = '52px';
    ring.style.height   = '52px';
    cursor.style.background = '#f0c040';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width  = '12px';
    cursor.style.height = '12px';
    ring.style.width    = '36px';
    ring.style.height   = '36px';
    cursor.style.background = '#7cbf5c';
  });
});
 
/* ── CANVAS BACKGROUND — floating field particles ── */
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');
let W, H, particles = [];
 
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
 
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -Math.random() * 0.5 - 0.2;
    this.size   = Math.random() * 2 + 0.5;
    this.alpha  = Math.random() * 0.5 + 0.1;
    this.color  = Math.random() > 0.5 ? '#4a8c3a' : '#c8922a';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
 
for (let i = 0; i < 80; i++) particles.push(new Particle());
 
function drawCanvas() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(drawCanvas);
}
drawCanvas();
 
/* ── SCROLL REVEAL ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
 
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
 
/* ── HERO TITLE TILT ── */
const heroTitle = document.querySelector('.hero-title');
document.addEventListener('mousemove', e => {
  if (!heroTitle) return;
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  heroTitle.style.transform = `perspective(800px) rotateY(${dx * 4}deg) rotateX(${-dy * 2}deg)`;
});
</script>
</body>
</html>
 
