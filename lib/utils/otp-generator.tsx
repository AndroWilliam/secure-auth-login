import { createServiceClient } from "@/lib/supabase/server"
import { Resend } from "resend"

function OtpEmail({ code, firstName }: { code: string; firstName: string }) {
  return (
    <div
      style={{
        fontFamily: "system-ui,-apple-system,Segoe UI,Roboto",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#333", textAlign: "center" }}>Your Verification Code</h1>
      <p>Hello {firstName},</p>
      <p>Use this code to continue your registration:</p>
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "2px solid #007bff",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          margin: "20px 0",
        }}
      >
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#007bff", letterSpacing: "4px" }}>{code}</div>
      </div>
      <p>
        <strong>This code expires in 10 minutes.</strong>
      </p>
      <p style={{ color: "#666", fontSize: "14px" }}>If you didn't request this code, please ignore this email.</p>
    </div>
  )
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function storeOTP(
  userId: string | null,
  type: "email" | "phone" | "device" | "location",
  contact: string,
  code: string,
): Promise<void> {
  const supabase = await createServiceClient()

  // Use contact+type as the de-dup key (sign-up has no user yet)
  await supabase.from("otp_verifications").delete().eq("type", type).eq("contact", contact).eq("verified", false)

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error } = await supabase.from("otp_verifications").insert({
    user_id: userId, // nullable in DB schema
    type,
    contact,
    code,
    verified: false,
    expires_at: expiresAt,
  })

  if (error) throw new Error(`storeOTP insert failed: ${error.message}`)
}

export async function sendOTPEmail(email: string, code: string): Promise<string | undefined> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || "Security <onboarding@resend.dev>"

  if (!apiKey) throw new Error("Email service not configured - missing RESEND_API_KEY")

  const resend = new Resend(apiKey)
  const firstName = email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Your Verification Code</h1>
        <p>Hello ${firstName},</p>
        <p>Use this code to continue your registration:</p>
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px;">${code}</div>
        </div>
        <p><strong>This code expires in 10 minutes.</strong></p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  })

  if (error) throw new Error(error.message)
  return data?.id
}

export async function sendOTPSMS(phone: string, code: string): Promise<void> {
  // SMS functionality not implemented yet
  console.log(`SMS OTP ${code} would be sent to ${phone}`)
  throw new Error("SMS functionality not implemented")
}

export async function verifyOTP(
  type: "email" | "phone" | "device" | "location",
  contact: string,
  code: string,
): Promise<boolean> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("type", type)
    .eq("contact", contact)
    .eq("code", code)
    .eq("verified", false)
    .gte("expires_at", new Date().toISOString())
    .single()

  if (error || !data) return false

  const { error: upErr } = await supabase.from("otp_verifications").update({ verified: true }).eq("id", data.id)

  if (upErr) return false
  return true
}
