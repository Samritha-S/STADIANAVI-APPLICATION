import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Server-side Supabase with service role for writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key"
);

// --- Queue Intelligence Engine ---
// Formula: Wait Time (mins) = (People Count × Avg Service Time) / Open Registers
const AVG_SERVICE_TIME_SECS = 45; // 45 seconds per customer
const OPEN_REGISTERS = 2;

function computeWaitTime(peopleCount: number): number {
  const waitSecs = (peopleCount * AVG_SERVICE_TIME_SECS) / OPEN_REGISTERS;
  return Math.max(1, Math.round(waitSecs / 60));
}

// --- Mock CCTV Analysis ---
async function analyzeFrameWithGemini(
  stallName: string,
  locationId: string,
  frameBase64?: string
): Promise<{ people_count: number; queue_length: number; analysis: string }> {
  // If no real frame provided, build a vivid simulation prompt
  const prompt = frameBase64
    ? `You are a CCTV queue analysis system for ${stallName} at ${locationId}. 
       Analyze this image and return a JSON object with:
       { "people_count": <integer>, "queue_length": <integer>, "analysis": "<one-sentence situation summary>" }
       Only return the JSON, no markdown.`
    : `You are simulating a stadium CCTV queue analysis AI for a food stall called "${stallName}" 
       located at stadium zone "${locationId}" during a live IPL T20 match (mid-overs, high attendance).
       
       Simulate realistic crowd data. Return ONLY a JSON object:
       { "people_count": <integer 5-60>, "queue_length": <integer 3-45>, "analysis": "<one-sentence situation summary>" }`;

  try {
    const parts: any[] = [{ text: prompt }];
    if (frameBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: frameBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    // Graceful fallback — pure simulation
    const people_count = Math.floor(Math.random() * 55) + 5;
    const queue_length = Math.floor(people_count * 0.7);
    return {
      people_count,
      queue_length,
      analysis: `Simulated analysis: ${people_count} fans detected near ${stallName}.`,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stalls, frameBase64 } = body as {
      stalls: Array<{ id: string; stall_name: string; location_id: string }>;
      frameBase64?: string;
    };

    if (!stalls || stalls.length === 0) {
      return NextResponse.json({ error: "No stalls provided" }, { status: 400 });
    }

    // Analyze all stalls concurrently
    const analyses = await Promise.all(
      stalls.map(async (stall) => {
        const cv = await analyzeFrameWithGemini(
          stall.stall_name,
          stall.location_id,
          frameBase64
        );
        const wait_time_mins = computeWaitTime(cv.people_count);
        return {
          id: stall.id,
          stall_name: stall.stall_name,
          location_id: stall.location_id,
          people_count: cv.people_count,
          queue_length: cv.queue_length,
          wait_time_mins,
          analysis: cv.analysis,
        };
      })
    );

    // Broadcast to Supabase → triggers Realtime for Fan App Wayfinder
    const dbUpdates = analyses.map((a) =>
      supabaseAdmin
        .from("stalls")
        .update({
          wait_time_mins: a.wait_time_mins,
          queue_length: a.queue_length,
        })
        .eq("id", a.id)
    );

    await Promise.allSettled(dbUpdates); // Non-blocking on DB errors

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: analyses,
      formula: `Wait = (People × ${AVG_SERVICE_TIME_SECS}s) / ${OPEN_REGISTERS} registers`,
    });
  } catch (error) {
    console.error("[process-cctv] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
