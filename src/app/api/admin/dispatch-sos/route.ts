import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key"
);

// --- StadiaNav static resource map (approximate 3D coordinates) ---
const SECURITY_UNITS: Array<{ id: string; name: string; x: number; z: number; stand: string }> = [
  { id: "sec-1", name: "Security Post GS-1", x: 110, z: 0, stand: "Grand Stand" },
  { id: "sec-2", name: "Security Post NV-1", x: 77, z: 77, stand: "North Stand" },
  { id: "sec-3", name: "Security Post VM-1", x: -77, z: 77, stand: "Vijay Merchant" },
  { id: "sec-4", name: "Security Post ST-1", x: -110, z: 0, stand: "Sachin Tendulkar" },
  { id: "sec-5", name: "Security Post GA-1", x: -77, z: -77, stand: "Garware" },
  { id: "sec-6", name: "Security Post MCA-1", x: 0, z: -110, stand: "MCA" },
];

const MEDICAL_STATIONS: Array<{ id: string; name: string; x: number; z: number; stand: string }> = [
  { id: "med-1", name: "First Aid GS", x: 95, z: 20, stand: "Grand Stand" },
  { id: "med-2", name: "First Aid NV", x: 65, z: 65, stand: "North Stand" },
  { id: "med-3", name: "First Aid VD", x: 20, z: 95, stand: "Vitthal Divecha" },
  { id: "med-4", name: "First Aid MCA", x: 0, z: -90, stand: "MCA" },
];

const STAND_CENTERS: Record<string, { x: number; z: number }> = {
  "Grand Stand":       { x: 90,  z: 0   },
  "North Stand":       { x: 65,  z: 65  },
  "Vijay Merchant":    { x: -65, z: 65  },
  "Sachin Tendulkar":  { x: -90, z: 0   },
  "Garware":           { x: -65, z: -65 },
  "MCA":               { x: 0,   z: -90 },
  "Vitthal Divecha":   { x: 65,  z: -65 },
  "Sunil Gavaskar":    { x: 90,  z: -30 },
};

function dist2D(ax: number, az: number, bx: number, bz: number) {
  return Math.sqrt((ax - bx) ** 2 + (az - bz) ** 2);
}

function extractStand(seatLabel: string): string {
  const parts = seatLabel.split("-");
  return parts.length > 1 ? parts.slice(0, -1).join("-").trim() : seatLabel;
}

export async function POST(req: Request) {
  try {
    const { alertId, userId, seatLabel } = await req.json();

    const stand = extractStand(seatLabel || "Grand Stand");
    const center = STAND_CENTERS[stand] || { x: 0, z: 0 };

    let nearestSecurity = SECURITY_UNITS[0];
    let minSecDist = Infinity;
    for (const sec of SECURITY_UNITS) {
      const d = dist2D(center.x, center.z, sec.x, sec.z);
      if (d < minSecDist) { minSecDist = d; nearestSecurity = sec; }
    }

    let nearestMedical = MEDICAL_STATIONS[0];
    let minMedDist = Infinity;
    for (const med of MEDICAL_STATIONS) {
      const d = dist2D(center.x, center.z, med.x, med.z);
      if (d < minMedDist) { minMedDist = d; nearestMedical = med; }
    }

    let interventionRoute = `Dispatch ${nearestSecurity.name} + ${nearestMedical.name}. Navigate via concourse level to ${stand}.`;
    try {
      const prompt = `You are the StadiaNav Arena Emergency Response AI.
      An SOS alert was triggered from seat "${seatLabel}" in the "${stand}" stand.
      
      Nearest Security: ${nearestSecurity.name} (~${Math.round(minSecDist)}m away)
      Nearest Medical: ${nearestMedical.name} (~${Math.round(minMedDist)}m away)
      
      Generate a concise 2-sentence tactical dispatch instruction for the security team.
      Include which gate/concourse to use and ETA estimate. Be specific to StadiaNav Arena.
      Return only the 2 sentences, no JSON, no markdown.`;
      
      const result = await model.generateContent(prompt);
      interventionRoute = result.response.text().trim();
    } catch { /* fallback */ }

    // 1. Update status in DB
    if (alertId) {
      await supabaseAdmin
        .from("emergency_alerts")
        .update({ status: "RESPONDING" })
        .eq("id", alertId);
    }

    // 2. Proactively tunnel to Sync Server (Port 3002) for real-time socket emit
    try {
        await fetch("http://127.0.0.1:3002/api/admin/dispatch-sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alertId, userId, action: 'DISPATCH', message: interventionRoute })
        });
    } catch (e) { console.error("[SOS-Proxy] Failed to reach Sync Server:", e); }

    return NextResponse.json({
      success: true,
      alertId,
      intervention_route: interventionRoute,
      dispatched_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[dispatch-sos] Error:", error);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
