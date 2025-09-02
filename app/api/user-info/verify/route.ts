import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SecureHash } from "@/lib/utils/crypto"

// POST /api/user-info/verify - Verify sensitive data against stored hashes
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] User Info Verify API: POST request received")

    // Parse request body
    const body = await request.json()
    const { event_id, field_name, value } = body

    console.log("[v0] Verification request:", { event_id, field_name, has_value: !!value })

    // Validate required fields
    if (!event_id || !field_name || !value) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: event_id, field_name, value" },
        { status: 400 },
      )
    }

    // Create Supabase client and get authenticated user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication error:", authError)
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Get the event with hashed data
    const { data: event, error: queryError } = await supabase
      .from("user_info_events")
      .select("hashed_data")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .single()

    if (queryError || !event) {
      console.log("[v0] Event not found:", queryError)
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Check if the field exists in hashed data
    if (!event.hashed_data || !event.hashed_data[field_name]) {
      return NextResponse.json({ success: false, message: "Field not found in hashed data" }, { status: 404 })
    }

    const hashedField = event.hashed_data[field_name]
    if (!hashedField.hash || !hashedField.salt) {
      return NextResponse.json({ success: false, message: "Invalid hashed data format" }, { status: 400 })
    }

    // Verify the value
    const isValid = SecureHash.verifySensitiveData(value, hashedField.hash, hashedField.salt)

    console.log("[v0] Verification result:", { field_name, isValid })

    return NextResponse.json({
      success: true,
      verified: isValid,
      message: isValid ? "Verification successful" : "Verification failed",
    })
  } catch (error) {
    console.error("[v0] User Info Verify API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
