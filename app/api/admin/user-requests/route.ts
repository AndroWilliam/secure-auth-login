export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET - Get user requests (Admin and Moderator)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status_filter = url.searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("user_requests")
      .select(`
        *,
        requester:requested_by(full_name, email),
        reviewer:reviewed_by(full_name, email)
      `, { count: 'exact' });

    // Moderators can only see their own requests
    if (profile.role === 'moderator') {
      query = query.eq("requested_by", user.id);
    }

    // Apply status filter
    if (status_filter) {
      query = query.eq("status", status_filter);
    }

    const { data: requests, error, count } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[USER_REQUESTS_API] Error fetching requests:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      userRole: profile.role
    });

  } catch (error: any) {
    console.error("[USER_REQUESTS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create user request (Moderator only)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is moderator or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: "Moderator or Admin access required" }, { status: 403 });
    }

    const { request_type, request_data } = await req.json();

    if (!request_type || !request_data) {
      return NextResponse.json({ 
        error: "Request type and data are required" 
      }, { status: 400 });
    }

    // Admins can directly perform actions, moderators create requests
    if (profile.role === 'admin') {
      return NextResponse.json({ 
        message: "Admins can perform actions directly. Use the users API instead." 
      }, { status: 400 });
    }

    // Create request
    const { error: insertError } = await supabase
      .from("user_requests")
      .insert({
        requested_by: user.id,
        request_type,
        request_data,
        status: 'pending'
      });

    if (insertError) {
      console.error("[USER_REQUESTS_API] Error creating request:", insertError);
      return NextResponse.json({ 
        error: "Failed to create request" 
      }, { status: 500 });
    }

    return NextResponse.json({ message: "Request submitted successfully" });

  } catch (error: any) {
    console.error("[USER_REQUESTS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
