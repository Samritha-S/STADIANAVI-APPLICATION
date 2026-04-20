# Wankhede Digital Twin: Architecture Overview

This document outlines the core technical architecture and unique technical solutions built into the Wankhede Digital Twin application.

---

## 1. Simulated Computer Vision (CV) to Supabase Bridge

The application utilizes a mocked asynchronous architecture designed to emulate a real-world object detection stream bridging an arena's CCTV array:
- **State Flow**: `Python CV (Mock) → Supabase PostgreSQL → Next.js Real-time Socket` 
- **The Process**: 
  We structured a `stalls` database matching the physical arena map. A remote Python environment processes edge-feed frames, estimating queue density using `YOLO` bounding boxes multiplied by `average_service_time (45s)`.
- **Database Schema**:
  ```sql
  -- 4. Tickets Table (OTP Auth & Seat Mapping)
  CREATE TABLE public.tickets (
      phone_number text primary key,
      is_valid boolean default true,
      seat_label text not null,
      stand_name text not null,
      coord_x float not null,
      coord_y float not null,
      coord_z float not null
  );

  -- 5. Emergency Alerts (SOS)
  CREATE TABLE public.emergency_alerts (
      id uuid default uuid_generate_v4() primary key,
      user_id text,
      seat_label text,
      status text default 'ACTIVE', -- ACTIVE, RESPONDING, RESOLVED
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Set Up Real-time Triggers
  alter publication supabase_realtime add table stalls;
  alter publication supabase_realtime add table fan_posts;
  alter publication supabase_realtime add table emergency_alerts;
  ```
- **UI Reflection**: As the values dump into Supabase, the Next.js UI establishes a Websocket listener over `@supabase/supabase-js`. The payload updates our `realtimeStalls` context instantly. The front-end delta calculator checks the `newWaitTime > prevWaitTime` to seamlessly calculate gradient arrays (Trend Identifiers: ▲ Increasing or ▼ Clearing).

---

## 2. Gemini Situational Intelligence (EventState Hooks)

The Digital Twin goes beyond standard Chatbots by treating the Gemini LLM as an active Spatial Engine.
- **Parametric Injection**: When a user queries the "Gemini Concierge", the API intercepts the standard text prompt and quietly appends physical metrics bounding the user. 
- **The EventState System**: We parse `userSeatX/Y/Z` coordinates and real-time match pacing metrics (`eventState: OVER_BREAK`) dynamically into the hidden system instruction. 
- **The Result**: Instead of returning generic data, Gemini responds with tactical wayfinding derived precisely from the 3D map bounds ("Wait times are increasing... Go to Wow! Momo, it's exactly 15 meters down the stairs").

---

## 3. High-Performance 3D Occlusion Culling

Rendering an absolute 1:1 mapped stadium containing hundreds of dynamic HTML overlay nodes presents high CPU/GPU cost hurdles in typical `three.js` canvases. We deployed a highly optimized native Culling process over the `<Billboard>` tags.
- **The Logic**: Instead of allowing the browser to calculate DOM overlay positions for tags physically hidden behind the massive Wankhede Bowl mesh, the `UtilityMarker` implements `useFrame`.
- **Math**: `const dist = state.camera.position.distanceTo(meshRef.current.position);`
- **Result**: Markers and HTML text natively disable their `visible` boolean flag if distance exceeds our 120-unit threshold. This drops redundant redraws to virtually zero.

---

## 4. GSAP Broadcast Camera Kinematics

Standard OrbitControls break user immersion during programmatic sweeps. To create physical broadcasting weight:
- We ripped out explicit `useFrame` frame-locked camera lerps for event actions. 
- Replaced with GreenSock (`gsap.timeline`) logic executing `Drone to Seat` landing curves on initial mount.
- Executed sequential animated events resolving into "Camera Shakes" via `back.out(1.5)` easing during Map transitions, emulating a heavy broadcast lens landing and focusing.

---

## 5. Admin CV Pipeline & Queue Intelligence Engine *(NEW)*

### `/api/admin/process-cctv` — CCTV Ingestion API
- **Accepts**: An array of stall descriptors + optional `frameBase64` JPEG image.
- **Gemini Vision**: Each stall descriptor is sent to `gemini-1.5-flash` with a tactical stadium prompt. With a real frame, it performs multi-modal vision analysis. Without one, Gemini simulates realistic IPL-match queue density.
- **Queue Intelligence Formula**:
  ```
  Wait Time (mins) = (People Count × Avg Service Time) / Open Registers
  Wait Time (mins) = (People Count × 45s) / 2
  ```  
- **Broadcast**: Results are immediately written to `stalls` table via Supabase service-role client. PostgreSQL Realtime fires an `UPDATE` event that the fan app's `StadiumContext` receives via WebSocket — triggering a live Wayfinder re-render with zero user action.

### `/api/admin/dispatch-sos` — SOS Dispatch Logic
- **Input**: `alert_id`, `seat_label`, `user_id`.
- **Spatial Engine**: Uses the `seat_label` to extract the stand name (e.g., `"Garware-C12"` → `"Garware"`). Maps the stand to a world-space centroid and runs Euclidean distance against a static index of 6 security posts and 4 medical stations around the stadium.
- **Gemini Narrative**: Calls `gemini-1.5-flash` to generate a natural-language dispatch instruction with specific gate/concourse references and distance-based ETA.
- **Status Update**: Updates the alert to `RESPONDING` in Supabase immediately.

### `/api/admin/clear-match` — Demo Data Reset
- Bulk-updates all stall rows: `wait_time_mins = 1`, `queue_length = 0`.
- Resolves all `ACTIVE` and `RESPONDING` alerts.
- Used between demo pitches for a clean slate.

---

## 6. Admin Hub UI — Nerve Center

Located at `/admin`. A full command dashboard with:
- **Live CCTV Grid**: HTML Canvas-rendered mock video feeds using `requestAnimationFrame`. Each feed shows animated crowd particles color-coded by density (green → amber → red). Simulated scanlines and broadcast timestamps add realism.
- **Panic Toggle**: Each stall has a one-click "PANIC" button that marks the stall as `BLOCKED` in Supabase and switches the feed to a red-bordered lockout overlay. Fans routed via Gemini Concierge are warned away automatically.
- **SOS Dispatch Panel**: Real-time cards for each active emergency. Auto-dispatches after 3 seconds. Shows intervention route generated by Gemini, nearest security/medical unit names, and estimated response distance.
- **Queue Intelligence Summary**: Post-scan summary bar showing Gemini-computed wait times with formula transparency.
- **System Log**: Chronological event tape (last 30 entries) for all CV scans, dispatches, panic toggles, and clears.
- **Emergency Mode**: Full-screen red pulse border + animated status dot when any SOS is `ACTIVE`.

---

## 7. Venue Management System (VMS) — Unified Bridge *(NEW)*

The platform has been expanded from a single-stadium twin to a universal **Venue Management System**, allowing stadium operators to onboard new arenas dynamically.

### `/admin/venues` — The Data-to-Model Bridge
- **GLB/GLTF Uploader**: Administrators can upload raw 3D stadium models directly. These are stored on-cloud and distributed to thousands of fan devices via dynamic URL injection.
- **Interactive Anchor Point Tool**: A specialized 3D editor (React Three Fiber + Raycasting) allows admins to click any surface of the uploaded model to drop "Anchor Pins":
    - **Stall Nodes**: Binds a coordinate to a food stall entity.
    - **Utility Nodes**: Maps Restrooms and Water stations.
    - **SOS Nodes**: Places First Aid and Security response posts.
- **Node Syncing**: Saving an anchor instantly pushes its world-space coordinates (`coord_x`, `coord_y`, `coord_z`) to the Supabase schema, making that venue "Operational" without a single line of code change.

### 8. The Cross-App Emergency Bridge
The Admin and Fan applications are now vertically integrated via a single **Broadcast Channel**:
- **Global Lockdown**: If an incident occurs, the Admin Hub triggers a `LOCKDOWN` state for the specific `venue_id`.
- **Fan App Safety Overlay**: Within milliseconds, every Fan device in that venue renders a high-intensity red "Safety Pulse" in the 3D environment, bypassing the standard UI to provide an undeniable tactical alert to look up for immediate steward directions.
- **Dynamic CCTV Binding**: In the Nerve Center, camera feeds are no longer hardcoded to "Stall 1". Admins use a dynamic dropdown to "Bind" a live feed index to a specific Stall ID produced by the Anchor Point tool. CV results only propagate to the bound node.

---

## 9. Dynamic Fan Experience
- **useGLTF Runtime Loading**: The Fan App now fetches `active_venue` on startup. Instead of loading a local file, it pulls the `model_url` from Supabase and initializes the Three.js scene dynamically.
- **Fluid Snap-to-Seat**: The onboarding logic calculates the entry vector using the `venue_config` scale, ensuring "Hero Fan" perspective works flawlessly across different stadium sizes.
