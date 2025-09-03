export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || body.contact || "").toString().trim().toLowerCase();
    const otp = (body.otp || body.code || "").toString().trim();
    if (!email || !otp) return NextResponse.json({ ok: false, error: "PAYLOAD_INVALID" }, { status: 400 });

    const ok = await verifyOtp(email, otp, "email");
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "VERIFY_FAILED" }, { status: 500 });
  }
}


