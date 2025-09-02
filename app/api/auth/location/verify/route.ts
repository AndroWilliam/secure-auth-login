import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getLocationFromIP, calculateLocationRisk, getClientIP } from "@/lib/utils/location-services"
import { generateOTP, storeOTP, sendOTPEmail } from "@/lib/utils/otp-generator"

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

    const ip = getClientIP(request)
    const currentLocation = await getLocationFromIP(ip)

    // Get user's previous locations for risk assessment
    const { data: previousLocations } = await supabase
      .from("location_verifications")
      .select("location_data")
      .eq("user_id", user.id)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(10)

    const locationHistory =
      previousLocations?.map((loc) => ({
        ip: loc.location_data.ip,
        city: loc.location_data.city,
        country: loc.location_data.country,
      })) || []

    const riskScore = calculateLocationRisk(currentLocation, locationHistory)
    const requiresVerification = riskScore > 70

    // Store location verification record
    const verificationToken = Math.random().toString(36).substring(2, 15)

    const { error: insertError } = await supabase.from("location_verifications").insert({
      user_id: user.id,
      ip_address: ip,
      location_data: currentLocation,
      verification_method: "ip_geolocation",
      is_verified: !requiresVerification,
      risk_score: riskScore,
      verification_token: verificationToken,
    })

    if (insertError) {
      console.error("Failed to store location verification:", insertError)
    }

    // Send OTP if verification is required
    if (requiresVerification) {
      const otpCode = generateOTP()
      await storeOTP(user.id, "location", user.email!, otpCode)
      await sendOTPEmail(user.email!, otpCode, "location verification")
    }

    // Log location verification attempt
    await supabase.from("security_logs").insert({
      user_id: user.id,
      event_type: "location_verification",
      event_details: {
        location: currentLocation,
        risk_score: riskScore,
        requires_verification: requiresVerification,
      },
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      location_data: currentLocation,
      success: true,
      risk_score: riskScore,
    })

    return NextResponse.json({
      locationInfo: {
        city: currentLocation.city,
        country: currentLocation.country,
        isRecognized: riskScore <= 50,
        riskScore,
        ipAddress: ip,
      },
      requiresVerification,
      verificationToken,
    })
  } catch (error) {
    console.error("Location verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
