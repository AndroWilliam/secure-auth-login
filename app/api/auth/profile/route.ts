import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, displayName, phoneNumber, securityQuestions, locationData } = await request.json()

    console.log("[v0] Profile API called with data:", {
      userId,
      displayName,
      phoneNumber,
      securityQuestions,
      locationData,
    })

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createServiceClient()
    console.log("[v0] Service client created for profile API")

    const profileData = {
      id: userId,
      display_name: displayName,
      phone_number: phoneNumber,
      phone_verified: true, // Since we verified via OTP
      email_verified: true, // Since we verified via OTP
      security_questions: securityQuestions,
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to upsert profile data:", profileData)

    // Create or update user profile
    const { data, error } = await supabase.from("profiles").upsert(profileData)

    console.log("[v0] Upsert result:", { data, error })

    if (error) {
      console.error("[v0] Profile creation error:", error)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    console.log("[v0] Profile created/updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
