import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export async function POST(req: Request) {
  try {
    const { prompt, userSeatX, userSeatY, userSeatZ, eventState } = await req.json();

    // 1. Fetch Real-time Stadium Context
    const { data: stalls } = await supabase.from('stalls').select('*');
    
    // 2. Identify Blocked Stalls (Panic Toggle results)
    const blockedStalls = stalls?.filter(s => s.status === 'BLOCKED') || [];
    const operationalStalls = stalls?.filter(s => s.status !== 'BLOCKED') || [];

    // 3. Build Augmented Prompt for Gemini
    const systemContext = `
      You are the StadiaNav Arena AI Concierge.
      Current Match State: ${eventState || 'LIVE'}
      User Location (Coordinates): X:${userSeatX}, Y:${userSeatY}, Z:${userSeatZ}
      
      STADIUM STATUS:
      ${blockedStalls.length > 0 
        ? `⚠️ DANGER/ALERT: The following stalls are CLOSED due to emergencies (spills/crowd issues): ${blockedStalls.map(s => s.stall_name).join(', ')}. WARN the fan to avoid these areas at all costs.` 
        : 'All concession stands are currently operational.'}
      
      CONCESSION OPTIONS:
      ${operationalStalls.map(s => `- ${s.stall_name} at ${s.location_id}: ${s.wait_time_mins} min wait`).join('\n')}

      INSTRUCTIONS:
      - Be tactical, concise, and helpful.
      - If the user asks for food, recommend the closest operational stall with the shortest wait time.
      - If they ask about a blocked stall, explain that it is currently inaccessible and recommend an alternative.
      - Use stadium terminology (Stands, Concourse, Levels).
    `;

    const result = await model.generateContent([
      { text: systemContext },
      { text: `Fan Query: ${prompt}` }
    ]);
    
    const responseText = result.response.text().trim();

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Concierge Error:", error);
    return NextResponse.json(
      { text: "I'm having trouble connecting to the stadium sensors. Please follow the illuminated exit signs or see a steward for immediate help." },
      { status: 500 }
    );
  }
}
