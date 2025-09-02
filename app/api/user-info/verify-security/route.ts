import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SecureHash } from "@/lib/utils/crypto"

// POST /api/user-info/verify-security - Verify security questions
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] Security Questions Verify API: POST request received")

    const body = await request.json()
    const { userId, answers } = body

    console.log("[v0] Security verification request:", { userId, answersCount: answers?.length })

    if (!userId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, message: "Missing required fields: userId, answers" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Get the signup event with security questions
    const { data: events, error: queryError } = await supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", userId)
      .eq("event_type", "signup")
      .order("created_at", { ascending: false })
      .limit(1)

    if (queryError || !events || events.length === 0) {
      return NextResponse.json({ success: false, message: "Security questions not found" }, { status: 404 })
    }

    const signupEvent = events[0]
    if (!signupEvent.hashed_data) {
      return NextResponse.json({ success: false, message: "No security questions stored" }, { status: 404 })
    }

    // Verify each security question answer
    let allCorrect = true
    for (let i = 0; i < answers.length; i++) {
      const fieldName = `security_answer_${i + 1}`
      const hashedField = signupEvent.hashed_data[fieldName]

      if (!hashedField || !hashedField.hash || !hashedField.salt) {
        allCorrect = false
        break
      }

      const isValid = SecureHash.verifySensitiveData(answers[i].answer, hashedField.hash, hashedField.salt)
      if (!isValid) {
        allCorrect = false
        break
      }
    }

    console.log("[v0] Security questions verification result:", { verified: allCorrect })

    return NextResponse.json({
      success: true,
      verified: allCorrect,
      message: allCorrect ? "Security questions verified" : "Security questions verification failed",
    })
  } catch (error) {
    console.error("[v0] Security Questions Verify API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
