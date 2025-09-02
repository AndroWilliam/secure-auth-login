import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log("[v0] Security questions API called with email:", email)

    if (!email) {
      console.log("[v0] No email provided")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    console.log("[v0] Getting user from auth by email:", email)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] User not authenticated:", userError)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Authenticated user ID:", user.id)
    console.log("[v0] Querying profiles table for user ID:", user.id)

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("security_questions")
      .eq("id", user.id)
      .single()

    console.log("[v0] Profile query result:", { profileData, profileError })

    if (profileError || !profileData) {
      console.log("[v0] Profile not found or error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const securityQuestions = profileData.security_questions || []
    console.log("[v0] Security questions found:", securityQuestions.length)

    if (securityQuestions.length === 0) {
      console.log("[v0] No security questions in profile")
      return NextResponse.json({ error: "No security questions found" }, { status: 404 })
    }

    // Return only the questions (not the answers for security)
    const questionsOnly = securityQuestions.map((sq: any) => ({
      question: sq.question,
      // Don't send the answer to the client
    }))

    console.log("[v0] Returning questions:", questionsOnly)
    return NextResponse.json({ questions: questionsOnly })
  } catch (error) {
    console.error("[v0] Security questions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
