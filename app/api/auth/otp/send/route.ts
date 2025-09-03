export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { ENV, missingEnv } from "@/env"
import { genOtp, renderOtp, sendEmailHTML } from "@/lib/email"
import { saveOtp } from "@/lib/otp"

function bad(status: number, code: string, detail?: string) {
  return NextResponse.json({ error: code, detail }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = body?.email ?? body?.contact
    const email = typeof raw === "string" ? raw.trim().toLowerCase() : ""
    if (!email) return bad(400, "PAYLOAD_INVALID", "email/contact is required")

    const code = genOtp()

    // Ensure Supabase is available OR explicitly allow dev bypass
    const miss = missingEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"])

    if (miss.length > 0) {
      if (!ENV.DEV_OTP_MODE) {
        return bad(500, "ENV_MISSING", miss.join(", "))
      }
      // Dev mode: skip DB insert
      console.warn("[SEND_OTP] DEV_OTP_MODE=true & Supabase env missing; skipping DB insert")
    } else {
      // Supabase available: persist OTP
      // NOTE: if your saveOtp signature is (contact, code, type='email'), drop the 4th arg
      await saveOtp(email, code, "email")
      // If your saveOtp expects (contact, code, type, userId?), use:
      // await saveOtp(email, code, "email", null)
    }

    // Ensure we can send (or are in dev mode)
    if (!ENV.RESEND_API_KEY && !ENV.SMTP_HOST && !ENV.DEV_OTP_MODE) {
      return bad(500, "NO_PROVIDER", "Configure RESEND_* or SMTP_* or set DEV_OTP_MODE=true")
    }

    const html = renderOtp(code)
    const res = await sendEmailHTML(email, "Your verification code", html)

    return NextResponse.json({
      sent: true,
      messageId: res.id ?? null,
      ...(ENV.DEV_OTP_MODE ? { devOtp: code } : {}),
    })
  } catch (e: any) {
    const msg = e?.message || (typeof e === "object" ? JSON.stringify(e) : String(e))
    console.error("[SEND_OTP_ERROR]", msg)
    return bad(502, "SEND_FAILED", msg)
  }
}