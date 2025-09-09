// app/api/presence/beat/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const SERVICE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const svc = createServiceClient(SERVICE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    await svc.from("user_sessions").upsert(
      { user_id: user.id, last_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[presence/beat] error:", e?.message ?? e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
