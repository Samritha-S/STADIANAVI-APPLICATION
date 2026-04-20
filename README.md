# StadiaNav: The Arena Digital Twin

**Live URL**: [https://stadianav-digital-twin.vercel.app](https://stadianav-digital-twin.vercel.app)

---

## 🏗️ 1. Chosen Vertical: Smart Venue & Arena Management
StadiaNav is a high-performance **Digital Twin** platform designed to solve the "Black Box" problem of massive live events. Typically, stadium operators have no real-time spatial awareness of crowd flow, and fans have no way to navigate complex tiers efficiently. StadiaNav bridges this gap.

## 🚀 2. Approach and Logic
Our approach focused on **Situational Intelligence**—transforming static 3D models into live, reactive environments.

### Core Architecture:
- **Spatial UI**: Built with `React Three Fiber`, using absolute world-space coordinates to map every stall, seat, and security post.
- **Occlusion Culling**: Implemented a custom proximity-based rendering logic where UI markers and HTML overlays disable themselves if they are behind the stadium mesh or too far from the camera, keeping performance at 60FPS even with hundreds of entities.
- **Nerve Centre (Admin)**: A dedicated command hub that simulates CCTV ingestion. It converts raw crowd counts into actionable "Queue Intelligence" using the formula:
  `Wait Time (mins) = (Fan Count × 45s Service Avg) / 2 Registers`.
- **The Sync Engine**: A Node.js socket server that broadcasts these calculated wait times to all fan devices instantly, allowing for "Dynamic Wayfinding" (rerouting fans to shorter lines).

## 🧠 3. How the Solution Works
1. **Onboarding**: Fans register with their seat number, which anchors them in the 3D space.
2. **Real-time Monitoring**: The Admin Hub performs "CV Scans" (simulated multi-modal analysis). These results update a central PostgreSQL database.
3. **Reactive UI**: The Fan App receives an immediate WebSocket ping. The 3D map highlights stalls in Green, Amber, or Red based on wait times.
4. **Emergency Bridge**: If a fan hits the SOS button, their exact 3D coordinates are dispatched to the nearest security/medical unit centroid using Euclidean distance calculations.

## 🤖 4. Gemini Situational Intelligence
We didn't just add a chatbot; we built a **Spatial Engine**. 
- When a fan asks the "Gemini Concierge" for food advice, the system quietly injects their **3D coordinates** and **real-time stadium metrics** into the prompt.
- **Result**: Gemini doesn't just say "Go to Stall 1"; it says "Go to Wow! Momo, it's 12 meters to your left and has a 3-minute wait, compared to Blue Tokai which is 50 meters away."

## 📝 5. Technical Assumptions
- **CCTV Availability**: We assume a base level of computer vision processing is available at stall entry points to provide crowd counts.
- **Device Support**: The application assumes a WebGL2 compatible browser for the 3D Digital Twin experience.
- **Database**: We chose **Neon (PostgreSQL)** to handle high-concurrency real-time location history writes without latency spikes.
- **Connectivity**: We assume stadium-wide Wi-Fi or 5G to maintain the WebSocket heartbeat for the Sync Engine.

---
*Created as part of the Advanced Agentic Coding Challenge.*
