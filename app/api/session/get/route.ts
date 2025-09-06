export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { key }: { key: string } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    console.log("[SESSION_GET] Retrieving data for key:", key);
    
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get session data and check expiry
    const { data: sessionData, error: queryError } = await supabase
      .from("user_sessions")
      .select("session_value, expires_at")
      .eq("user_id", user.id)
      .eq("session_key", key)
      .gt("expires_at", new Date().toISOString()) // Only get non-expired data
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        // No data found or expired
        console.log("[SESSION_GET] No data found for key:", key);
        return NextResponse.json({ value: null });
      }
      console.error("[SESSION_GET] Database error:", queryError);
      return NextResponse.json({ error: "Failed to retrieve session data" }, { status: 500 });
    }

    console.log("[SESSION_GET] Successfully retrieved data for key:", key);
    return NextResponse.json({ value: sessionData.session_value });

  } catch (error) {
    console.error("[SESSION_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

