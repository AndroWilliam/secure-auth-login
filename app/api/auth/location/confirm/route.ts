import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { verifyOTP } from "@/lib/utils/otp-generator"
import { getClientIP } from "@/lib/utils/location-services"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { otpCode, verificationToken } = await request.json()

    // Verify OTP
    const isValidOTP = await verifyOTP(user.id, "location", user.email!, otpCode)
    if (!isValidOTP) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Update location verification as confirmed
    const { error: updateError } = await supabase
      .from("location_verifications")
      .update({ is_verified: true })
      .eq("user_id", user.id)
      .eq("verification_token", verificationToken)

    if (updateError) {
      console.error("Failed to update location verification:", updateError)
      return NextResponse.json({ error: "Failed to verify location" }, { status: 500 })
    }

    // Log successful location verification
    await supabase.from("security_logs").insert({
      user_id: user.id,
      event_type: "location_verified",
      event_details: {
        verification_token: verificationToken,
      },
      ip_address: getClientIP(request),
      user_agent: request.headers.get("user-agent"),
      success: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Location confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
