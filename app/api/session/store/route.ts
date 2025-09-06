export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface SessionData {
  key: string;
  value: any;
  expires_at?: string; // Optional expiry
}

export async function POST(req: NextRequest) {
  try {
    const { key, value, expires_in_hours = 24 }: { 
      key: string; 
      value: any; 
      expires_in_hours?: number;
    } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    console.log("[SESSION_STORE] Storing data for key:", key);
    
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Calculate expiry
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + expires_in_hours);

    // Store or update session data
    const { error: upsertError } = await supabase
      .from("user_sessions")
      .upsert({
        user_id: user.id,
        session_key: key,
        session_value: value,
        expires_at: expires_at.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,session_key"
      });

    if (upsertError) {
      console.error("[SESSION_STORE] Database error:", upsertError);
      return NextResponse.json({ error: "Failed to store session data" }, { status: 500 });
    }

    console.log("[SESSION_STORE] Successfully stored data for key:", key);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[SESSION_STORE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

