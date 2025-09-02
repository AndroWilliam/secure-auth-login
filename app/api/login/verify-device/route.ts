export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id || body.userId;
    const deviceId = body.device_id || body.deviceId;
    const email = body.email;

    if (!userId || !deviceId) {
      return NextResponse.json({ error: "PAYLOAD_INVALID" }, { status: 400 });
    }

    // Proxy to existing user-info endpoint which requires authenticated session
    const res = await fetch(new URL("/api/user-info/verify-device", req.nextUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceId }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "VERIFY_FAILED" }, { status: res.status });
    }

    const device_ok = !!data.verified;
    if (!device_ok) {
      return NextResponse.json({ device_ok, action: "send_email_otp", email: email || undefined });
    }
    return NextResponse.json({ device_ok });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "VERIFY_FAILED" }, { status: 500 });
  }
}


