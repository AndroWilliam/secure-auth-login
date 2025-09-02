import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SecurityAssessment, SecurityFactor } from "@/lib/types/user-info"

// GET /api/user-info/security-score - Calculate current security score
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] Security Score API: GET request received")

    // Create Supabase client and get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication error:", authError)
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Get latest events for security assessment
    const { data: events, error: queryError } = await supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (queryError) {
      console.error("[v0] Database query error:", queryError)
      return NextResponse.json({ success: false, message: "Failed to retrieve security data" }, { status: 500 })
    }

    // Calculate security score based on available factors
    const factors: SecurityFactor[] = []
    let totalScore = 0
    const maxScore = 100

    // Check for successful login (25 points)
    const hasSuccessfulLogin = events?.some((e) => e.event_type === "login" && e.security_score && e.security_score > 0)
    factors.push({
      factor: "credentials",
      points: hasSuccessfulLogin ? 25 : 0,
      verified: !!hasSuccessfulLogin,
      description: "Valid email and password authentication",
    })
    if (hasSuccessfulLogin) totalScore += 25

    // Check for device verification (25 points)
    const hasDeviceVerification = events?.some(
      (e) => e.event_type === "device_verification" || e.device_info?.device_id,
    )
    factors.push({
      factor: "device",
      points: hasDeviceVerification ? 25 : 0,
      verified: !!hasDeviceVerification,
      description: "Trusted device verification",
    })
    if (hasDeviceVerification) totalScore += 25

    // Check for location verification (25 points)
    const hasLocationVerification = events?.some((e) => e.event_type === "location_verification" || e.location_data)
    factors.push({
      factor: "location",
      points: hasLocationVerification ? 25 : 0,
      verified: !!hasLocationVerification,
      description: "Recognized location verification",
    })
    if (hasLocationVerification) totalScore += 25

    // Check for security questions or OTP (25 points)
    const hasSecurityVerification = events?.some(
      (e) => e.event_type === "security_question_setup" || e.event_type === "otp_verification" || e.hashed_data,
    )
    factors.push({
      factor: "additional_verification",
      points: hasSecurityVerification ? 25 : 0,
      verified: !!hasSecurityVerification,
      description: "Security questions or OTP verification",
    })
    if (hasSecurityVerification) totalScore += 25

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical"
    if (totalScore >= 75) riskLevel = "low"
    else if (totalScore >= 50) riskLevel = "medium"
    else if (totalScore >= 25) riskLevel = "high"
    else riskLevel = "critical"

    const assessment: SecurityAssessment = {
      score: totalScore,
      max_score: maxScore,
      factors,
      risk_level: riskLevel,
      recommendations: generateRecommendations(factors),
    }

    console.log("[v0] Security assessment:", { score: totalScore, risk_level: riskLevel })

    return NextResponse.json({
      success: true,
      assessment,
    })
  } catch (error) {
    console.error("[v0] Security Score API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

function generateRecommendations(factors: SecurityFactor[]): string[] {
  const recommendations: string[] = []

  factors.forEach((factor) => {
    if (!factor.verified) {
      switch (factor.factor) {
        case "credentials":
          recommendations.push("Complete email and password verification")
          break
        case "device":
          recommendations.push("Verify your device for enhanced security")
          break
        case "location":
          recommendations.push("Enable location verification for your account")
          break
        case "additional_verification":
          recommendations.push("Set up security questions or enable OTP verification")
          break
      }
    }
  })

  if (recommendations.length === 0) {
    recommendations.push("Your account security is optimal!")
  }

  return recommendations
}
