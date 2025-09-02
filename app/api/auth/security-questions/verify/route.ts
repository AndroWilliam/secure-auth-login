import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, questionIndex, answer } = await request.json()

    if (!email || questionIndex === undefined || !answer) {
      return NextResponse.json({ error: "Email, question index, and answer are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("security_questions")
      .eq("email", email)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const securityQuestions = profileData.security_questions || []

    if (!securityQuestions[questionIndex]) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Simple case-insensitive comparison (in production, use proper hashing)
    const storedAnswer = securityQuestions[questionIndex].answer
    const isCorrect = answer.toLowerCase().trim() === storedAnswer.toLowerCase().trim()

    return NextResponse.json({ correct: isCorrect })
  } catch (error) {
    console.error("Security questions verify API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
