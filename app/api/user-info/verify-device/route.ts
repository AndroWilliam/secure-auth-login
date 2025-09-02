import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// POST /api/user-info/verify-device - Verify device ID
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] Device Verify API: POST request received")

    const body = await request.json()
    const { userId, deviceId } = body

    console.log("[v0] Device verification request:", { userId, deviceId })

    if (!userId || !deviceId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId, deviceId" },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    // Get the signup event with device info
    const { data: events, error: queryError } = await supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", userId)
      .eq("event_type", "signup_completed")
      .order("created_at", { ascending: false })
      .limit(1)

    if (queryError || !events || events.length === 0) {
      return NextResponse.json({ success: false, message: "Signup device not found" }, { status: 404 })
    }

    const signupEvent = events[0]
    
    // Get device_id from event_data (signup flow stores it there)
    const storedDeviceId = signupEvent.event_data?.device_id
    
    if (!storedDeviceId) {
      return NextResponse.json({ success: false, message: "No device data stored" }, { status: 404 })
    }

    // Compare device IDs
    const verified = storedDeviceId === deviceId

    console.log("[v0] Device verification result:", { storedDeviceId, currentDeviceId: deviceId, verified })

    // Store device verification event
    await supabase.from("user_info_events").insert({
      user_id: userId,
      event_type: "device_verification",
      event_data: {
        stored_device_id: storedDeviceId,
        current_device_id: deviceId,
        verified,
      },
      device_info: {
        device_id: deviceId,
        browser: request.headers.get("user-agent") || "unknown",
      },
      security_score: verified ? 25 : 0,
    })

    return NextResponse.json({
      success: true,
      verified,
      message: verified ? "Device verified" : "Device verification failed - unrecognized device",
    })
  } catch (error) {
    console.error("[v0] Device Verify API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
