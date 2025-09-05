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

    console.log("[SESSION_REMOVE] Removing data for key:", key);
    
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Remove session data
    const { error: deleteError } = await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("session_key", key);

    if (deleteError) {
      console.error("[SESSION_REMOVE] Database error:", deleteError);
      return NextResponse.json({ error: "Failed to remove session data" }, { status: 500 });
    }

    console.log("[SESSION_REMOVE] Successfully removed data for key:", key);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[SESSION_REMOVE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
