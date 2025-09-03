// app/api/user-info/store-event/route.ts
export const runtime = "nodejs20";
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
  const user_id = event_data?.userId || null;

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

  return NextResponse.json(
    { ok: true, inserted: data },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}