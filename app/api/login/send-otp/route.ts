export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { genOtp, renderOtp, sendEmailHTML } from "@/lib/email";
import { saveOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || body.contact || "").toString().trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "PAYLOAD_INVALID" }, { status: 400 });

    const code = genOtp();
    try { await saveOtp(email, code, "email"); } catch {}

    const html = renderOtp(code);
    const r = await sendEmailHTML(email, "Your login verification code", html);
    return NextResponse.json({ sent: true, messageId: r.id || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "SEND_FAILED" }, { status: 500 });
  }
}


