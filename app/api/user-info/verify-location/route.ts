import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/user-info/verify-location - Verify location
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] Location Verify API: POST request received")

    const body = await request.json()
    const { userId, currentLocation } = body

    console.log("[v0] Location verification request:", { userId, currentLocation })

    if (!userId || !currentLocation) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId, currentLocation" },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Get the signup event with location data
    const { data: events, error: queryError } = await supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", userId)
      .eq("event_type", "signup")
      .order("created_at", { ascending: false })
      .limit(1)

    if (queryError || !events || events.length === 0) {
      return NextResponse.json({ success: false, message: "Signup location not found" }, { status: 404 })
    }

    const signupEvent = events[0]
    if (!signupEvent.location_data) {
      return NextResponse.json({ success: false, message: "No location data stored" }, { status: 404 })
    }

    // Calculate distance between stored and current location
    const storedLat = signupEvent.location_data.latitude
    const storedLng = signupEvent.location_data.longitude
    const currentLat = currentLocation.latitude
    const currentLng = currentLocation.longitude

    if (!storedLat || !storedLng || !currentLat || !currentLng) {
      return NextResponse.json({ success: false, message: "Invalid location data" }, { status: 400 })
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(storedLat, storedLng, currentLat, currentLng)
    const maxAllowedDistance = 50 // 50km radius
    const verified = distance <= maxAllowedDistance

    console.log("[v0] Location verification result:", { distance, verified })

    // Store location verification event
    await supabase.from("user_info_events").insert({
      user_id: userId,
      event_type: "location_verification",
      event_data: {
        stored_location: signupEvent.location_data,
        current_location: currentLocation,
        distance_km: distance,
        verified,
      },
      location_data: currentLocation,
      security_score: verified ? 25 : 0,
    })

    return NextResponse.json({
      success: true,
      verified,
      distance: distance,
      message: verified ? "Location verified" : `Location verification failed - distance: ${distance.toFixed(2)}km`,
    })
  } catch (error) {
    console.error("[v0] Location Verify API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
