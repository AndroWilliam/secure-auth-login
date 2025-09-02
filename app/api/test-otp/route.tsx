import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    console.log("[v0] Testing OTP email sending...")

    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || "Security <onboarding@resend.dev>"

    console.log("[v0] API Key exists:", !!apiKey)
    console.log("[v0] From address:", from)

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "RESEND_API_KEY not found",
          env: Object.keys(process.env).filter((k) => k.includes("RESEND")),
        },
        { status: 500 },
      )
    }

    // Test Resend client creation
    const resend = new Resend(apiKey)
    console.log("[v0] Resend client created successfully")

    // Generate test OTP
    const testCode = Math.floor(100000 + Math.random() * 900000).toString()
    const testEmail = "test@example.com"

    console.log("[v0] Sending test email to:", testEmail)
    console.log("[v0] Test code:", testCode)

    // Send test email
    const { data, error } = await resend.emails.send({
      from,
      to: testEmail,
      subject: "Test OTP Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Test Email</h1>
          <p>Your test verification code is: <strong>${testCode}</strong></p>
          <p>This is a test email to verify the email sending functionality.</p>
        </div>
      `,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json(
        {
          error: "Email sending failed",
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Email sent successfully:", data)

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      testCode,
      testEmail,
      from,
    })
  } catch (error: any) {
    console.error("[v0] Test endpoint error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
