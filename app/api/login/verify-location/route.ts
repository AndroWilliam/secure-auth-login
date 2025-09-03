export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id || body.userId;
    const geo = body.geo || {};
    if (!userId) return NextResponse.json({ error: "PAYLOAD_INVALID" }, { status: 400 });

    // For now just accept; your real logic can compare with stored signup location
    return NextResponse.json({ geo_ok: true, verified: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "VERIFY_FAILED" }, { status: 500 });
  }
}


