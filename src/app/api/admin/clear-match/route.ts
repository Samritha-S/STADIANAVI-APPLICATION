import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key"
);

export async function POST() {
  try {
    const results = await Promise.allSettled([
      // Reset all stall queue data
      supabaseAdmin
        .from("stalls")
        .update({ wait_time_mins: 1, queue_length: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000"), // match all rows

      // Mark all active SOS alerts as resolved
      supabaseAdmin
        .from("emergency_alerts")
        .update({ status: "RESOLVED" })
        .eq("status", "ACTIVE"),

      // Also resolve RESPONDING alerts
      supabaseAdmin
        .from("emergency_alerts")
        .update({ status: "RESOLVED" })
        .eq("status", "RESPONDING"),
    ]);

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message);

    return NextResponse.json({
      success: true,
      message: "Match data cleared. Queue counts and SOS logs reset.",
      cleared_at: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[clear-match] Error:", error);
    return NextResponse.json({ error: "Clear failed" }, { status: 500 });
  }
}
