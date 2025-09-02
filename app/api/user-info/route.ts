import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SecureHash } from "@/lib/utils/crypto"
import type {
  StoreUserInfoRequest,
  StoreUserInfoResponse,
  GetUserInfoResponse,
  UserInfoEvent,
  EventType,
} from "@/lib/types/user-info"

// POST /api/user-info - Store user information event
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] User Info API: POST request received")

    // Parse request body
    const body: StoreUserInfoRequest = await request.json()
    console.log("[v0] Request body:", {
      event_type: body.event_type,
      has_event_data: !!body.event_data,
      has_sensitive_data: !!body.sensitive_data,
    })

    // Validate required fields
    if (!body.event_type || !body.event_data) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: event_type, event_data" },
        { status: 400 },
      )
    }

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

    console.log("[v0] Authenticated user:", user.id)

    // Hash sensitive data if provided
    let hashed_data: Record<string, any> | undefined
    if (body.sensitive_data && Object.keys(body.sensitive_data).length > 0) {
      console.log("[v0] Hashing sensitive data fields:", Object.keys(body.sensitive_data))
      hashed_data = {}

      for (const [key, value] of Object.entries(body.sensitive_data)) {
        if (typeof value === "string" && value.length > 0) {
          const { hash, salt } = SecureHash.hashSensitiveData(value)
          hashed_data[key] = { hash, salt }
        }
      }
    }

    // Get client IP and user agent
    const ip_address = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const user_agent = request.headers.get("user-agent") || "unknown"

    // Prepare event data for database
    const eventData = {
      user_id: user.id,
      event_type: body.event_type,
      event_data: body.event_data,
      hashed_data,
      ip_address,
      user_agent,
      location_data: body.location_data,
      device_info: body.device_info,
      security_score: body.security_score || 0,
      risk_factors: body.risk_factors || [],
      metadata: body.metadata || {},
    }

    console.log("[v0] Inserting event data:", {
      user_id: eventData.user_id,
      event_type: eventData.event_type,
      security_score: eventData.security_score,
    })

    // Insert into database
    const { data: insertedEvent, error: insertError } = await supabase
      .from("user_info_events")
      .insert(eventData)
      .select("event_id")
      .single()

    if (insertError) {
      console.error("[v0] Database insert error:", insertError)
      return NextResponse.json({ success: false, message: "Failed to store user information" }, { status: 500 })
    }

    console.log("[v0] Event stored successfully:", insertedEvent.event_id)

    const response: StoreUserInfoResponse = {
      success: true,
      event_id: insertedEvent.event_id,
      message: "User information stored successfully",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] User Info API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// GET /api/user-info - Retrieve user information events
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] User Info API: GET request received")

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const event_types = searchParams.get("event_types")?.split(",") as EventType[] | undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    console.log("[v0] Query params:", { event_types, limit, offset, start_date, end_date })

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

    console.log("[v0] Authenticated user:", user.id)

    // Build query
    let query = supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (event_types && event_types.length > 0) {
      query = query.in("event_type", event_types)
    }

    if (start_date) {
      query = query.gte("created_at", start_date)
    }

    if (end_date) {
      query = query.lte("created_at", end_date)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("user_info_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: events, error: queryError } = await query

    if (queryError) {
      console.error("[v0] Database query error:", queryError)
      return NextResponse.json({ success: false, message: "Failed to retrieve user information" }, { status: 500 })
    }

    console.log("[v0] Retrieved events:", events?.length || 0)

    // Remove sensitive hashed data from response (keep only metadata about what was hashed)
    const sanitizedEvents = events?.map((event) => ({
      ...event,
      hashed_data: event.hashed_data ? Object.keys(event.hashed_data) : undefined,
    })) as UserInfoEvent[]

    const response: GetUserInfoResponse = {
      success: true,
      events: sanitizedEvents || [],
      total_count: count || 0,
      has_more: offset + limit < (count || 0),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] User Info API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
