import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Debug: Checking user profile")

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] Debug: No authenticated user", userError)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Debug: User ID:", user.id)
    console.log("[v0] Debug: User email:", user.email)

    // Check if profile exists by user ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    console.log("[v0] Debug: Profile query result:", { profile, profileError })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
      profileError,
    })
  } catch (error) {
    console.error("[v0] Debug: Profile check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
