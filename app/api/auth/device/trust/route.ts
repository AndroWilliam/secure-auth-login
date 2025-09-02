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

    const { deviceFingerprint, otpCode, trustDevice } = await request.json()

    // Verify OTP if provided
    if (otpCode) {
      const isValidOTP = await verifyOTP(user.id, "device", user.email!, otpCode)
      if (!isValidOTP) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
      }
    }

    // If user wants to trust this device, save it
    if (trustDevice) {
      const userAgent = request.headers.get("user-agent") || ""
      const ip = getClientIP(request)

      // Get location data for the device record
      let locationInfo = {}
      try {
        const { getLocationFromIP } = await import("@/lib/utils/location-services")
        const location = await getLocationFromIP(ip)
        locationInfo = {
          city: location.city,
          country: location.country,
        }
      } catch (error) {
        console.error("Failed to get location:", error)
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90) // 90 days

      const { error: insertError } = await supabase.from("trusted_devices").insert({
        user_id: user.id,
        device_fingerprint: deviceFingerprint,
        device_name: `Trusted Device`,
        device_type: userAgent.includes("Mobile") ? "mobile" : "desktop",
        browser_info: { userAgent },
        ip_address: ip,
        location_info: locationInfo,
        is_trusted: true,
        expires_at: expiresAt.toISOString(),
      })

      if (insertError) {
        console.error("Failed to save trusted device:", insertError)
      }
    }

    // Log successful device verification
    await supabase.from("security_logs").insert({
      user_id: user.id,
      event_type: "device_trusted",
      event_details: {
        device_fingerprint: deviceFingerprint,
        trust_device: trustDevice,
      },
      ip_address: getClientIP(request),
      user_agent: request.headers.get("user-agent"),
      success: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Device trust error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
