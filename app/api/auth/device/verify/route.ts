import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateDeviceFingerprint, getDeviceInfo } from "@/lib/utils/device-fingerprint"
import { generateOTP, storeOTP, sendOTPEmail } from "@/lib/utils/otp-generator"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deviceFingerprint: clientFingerprint } = await request.json()

    // Generate server-side fingerprint for comparison
    const serverFingerprint = generateDeviceFingerprint(request)
    const userAgent = request.headers.get("user-agent") || ""
    const deviceInfo = getDeviceInfo(userAgent)

    // Check if device is already trusted
    const { data: trustedDevice } = await supabase
      .from("trusted_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_fingerprint", clientFingerprint || serverFingerprint)
      .eq("is_trusted", true)
      .gt("expires_at", new Date().toISOString())
      .single()

    const isTrusted = !!trustedDevice

    // If device is not trusted, send OTP
    if (!isTrusted) {
      const otpCode = generateOTP()
      await storeOTP(user.id, "device", user.email!, otpCode)
      await sendOTPEmail(user.email!, otpCode, "device verification")
    }

    // Log the device verification attempt
    await supabase.from("security_logs").insert({
      user_id: user.id,
      event_type: "device_verification",
      event_details: {
        device_fingerprint: clientFingerprint || serverFingerprint,
        device_info: deviceInfo,
        is_trusted: isTrusted,
      },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1",
      user_agent: userAgent,
      success: true,
    })

    return NextResponse.json({
      deviceInfo: {
        fingerprint: clientFingerprint || serverFingerprint,
        name: deviceInfo.name,
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        isTrusted,
      },
      requiresOTP: !isTrusted,
    })
  } catch (error) {
    console.error("Device verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
