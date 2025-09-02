import { type NextRequest, NextResponse } from "next/server"
import { sendOTPEmail } from "@/lib/utils/otp-generator"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("[v0] Testing email send to:", email)
    await sendOTPEmail(email, "123456", "test")

    return NextResponse.json({ success: true, message: "Test email sent" })
  } catch (error) {
    console.error("[v0] Test email error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
