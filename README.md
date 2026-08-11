# 🎬 Adaptive Video Streaming & WebRTC Co-Watching Platform

> **A high-performance enterprise video streaming application featuring dynamic adaptive bitrate simulation, client-side IndexedDB binary offline storage, real-time WebRTC co-watching lounges, and live telemetry analytics.**

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/RealTime-WebRTC_|_Socket.io-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![IndexedDB](https://img.shields.io/badge/Storage-Client--Side_IndexedDB-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![License](https://img.shields.io/badge/License-MIT-009B4D?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)

---

## 📖 Overview

**Video Streaming Platform** is a full-stack media streaming web application built for seamless content delivery, real-time user interaction, and client-side offline viewing. 

The architecture combines adaptive bitrate streaming simulation with a robust browser storage layer (IndexedDB), enabling zero-data flight-mode video playback. It features low-latency WebRTC video conference lounges with synchronized chat, paired with a real-time playback telemetry engine that logs buffer stall metrics and resolution distribution across concurrent clients.

---

## ✨ Key Modules & Features

### 📺 1. High-Performance Catalog & Adaptive Bitrate Engine
* **Dynamic Bitrate Allocation:** Automatic stream quality adjustment ranging up to **5.0 Mbps (1080p)** with near-zero buffer latency ($0.02\text{s}$).
* **System Health Widget:** Live playback diagnostic widget tracking bitrate throughput, buffer latency, and IndexedDB pool status in real time.
* **Content Catalog:** Interactive media catalog featuring genre categorization (*Action, Sci-Fi, Drama, Documentary, Thriller*), instant search, and rating metadata.

### 💾 2. Client-Side Offline Vault (IndexedDB Storage)
* **Binary Blob Storage:** Direct download and caching of HD video payloads into the client's browser sandbox via the HTML5 IndexedDB API.
* **Zero-Data Playback:** Flight-mode ready offline media viewing without ongoing network connectivity.
* **Storage Inspector:** Real-time quota indicator tracking localized storage consumption (e.g., `2.2 MB` taken).

### 🎥 3. Low-Latency WebRTC Live Rooms & Co-Watching
* **Video Conference Lounges:** Multi-peer WebRTC video channels supporting local webcam loopbacks, creator feeds, and participant tile grids.
* **Synchronized Live Chat:** Real-time chat feed with auto-scroll and timestamped messages across session participants.
* **Community Directory:** Live directory showing active discussion lounges (*Sci-Fi Fanatics Hangout, Action Movie Watch-Along, Tech & AI Film Discussion*) with real-time active user counts.

### 📊 4. Real-Time Telemetry & Analytics Dashboard
* **Performance Telemetry:** Ingests live playback events, buffer stalls, and stream sessions with configurable auto-polling intervals ($4\text{s}$).
* **Activity Timeline Chart:** Visualizes stream throughput vs. buffering delays to identify network bottlenecks.
* **Resolution Distribution Breakdown:** Donut chart breakdown tracking resolution telemetry across $360\text{p}$, $720\text{p}$, and $1080\text{p}$ profiles.

---

## 🖼️ Application Showcase

<div align="center">

### 1. Catalog & Adaptive Bitrate Player Diagnostic
![Adaptive Bitrate Streaming Catalog](./docs/screenshots/catalog-view.png)

---

### 2. Live Watch Room & Real-Time Chat
![WebRTC Multi-Peer Live Room](./docs/screenshots/live-room-session.png)

---

### 3. Community Live Rooms Directory
![Live Rooms Directory](./docs/screenshots/live-rooms-directory.png)

---

### 4. Real-Time Analytics & Telemetry Dashboard
![Real-Time Analytics Dashboard](./docs/screenshots/analytics-dashboard.png)

---

### 5. Offline Media Vault (IndexedDB Sandbox)
![Offline Vault Download Manager](./docs/screenshots/offline-vault.png)

</div>

---

## 🛠️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SYSTEM ARCHITECTURE TOPOLOGY                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   CLIENT / BROWSER   │   SIGNALING & API    │   TELEMETRY & MEDIA           │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ • React 18 UI Layer  │ • Express.js REST    │ • Telemetry Event Parser      │
│ • HTML5 Video Player │ • Socket.io WebRTC   │ • HLS / DASH Segment Mock     │
│ • IndexedDB Vault    │   Signaling Server   │ • Log Aggregator Engine       │
└──────────────────────┴──────────────────────┴───────────────────────────────┘

🚀 Quick Start & Installation
Prerequisites
Node.js v18.0.0 or higher

npm v9.0.0 or higher

1. Clone the Repository

git clone [https://github.com/Fanuel-Dev/video-streaming-platform.git](https://github.com/Fanuel-Dev/video-streaming-platform.git)
cd video-streaming-platform

2. Install Dependencies
# Install root, client, and server dependencies
npm run install-all

3. Environment Setup
Create a .env file in the root directory:

PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

4. Start Development Server

# Starts both frontend (React) and backend (Express/Socket.io) concurrently
npm run dev

# Starts both frontend (React) and backend (Express/Socket.io) concurrently
npm run dev

Navigate to http://localhost:3000 in your web browser.
