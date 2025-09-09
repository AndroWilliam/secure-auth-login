// app/api/user-info/store-event/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Payload = { event_type?: string; event_data?: unknown };

export async function POST(req: NextRequest) {
  if (!URL || !SERVICE_ROLE) {
    return NextResponse.json(
      { ok: false, error: "MISCONFIGURED_ENV" },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "BAD_JSON" },
      { status: 400 }
    );
  }

  const { event_type, event_data } = body;
  if (!event_type || typeof event_type !== "string") {
    return NextResponse.json(
      { ok: false, error: "PAYLOAD_INVALID" },
      { status: 400 }
    );
  }

  const supabase = createClient(URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Extract user_id from event_data if present
  const user_id = (event_data as any)?.userId || null;

  const { data, error } = await supabase
    .from("user_info_events")
    .insert([{ event_type, event_data, user_id }])
    // your table has `created_at`, not `occurred_at`
    .select("id, event_type, event_data, user_id, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "STORE_FAILED", detail: error.message },
      { status: 500 }
    );
  }

  // If login completed, also upsert session snapshot
  try {
    if (event_type === "login_completed" && (event_data as any)?.userId) {
      const user_id = (event_data as any).userId as string;
      const ipAddress = (event_data as any)?.ipAddress ?? null;
      const deviceFingerprint = (event_data as any)?.device_id ?? null;
      const locationData = (event_data as any)?.locationData ?? null;

      await supabase
        .from("user_sessions")
        .upsert(
          {
            user_id,
            last_login_at: new Date().toISOString(),
            last_ip: ipAddress,
            last_device_fingerprint: deviceFingerprint,
            last_location: locationData ? locationData : null,
          },
          { onConflict: "user_id" }
        );
    }
  } catch (e) {
    console.warn("[STORE_EVENT] Failed to update user_sessions:", e);
  }

  return NextResponse.json(
    { ok: true, inserted: data },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}