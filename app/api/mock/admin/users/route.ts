export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getMockUsers, mockUserStats } from "@/lib/mock-data/users";

// GET - Get all users with pagination and filtering (using mock data)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (special case for androa687@gmail.com)
    if (user.email !== "androa687@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role_filter = url.searchParams.get("role") || "";
    const status_filter = url.searchParams.get("status") || "";

    // Get mock data
    const result = getMockUsers({
      page,
      limit,
      search,
      roleFilter: role_filter,
      statusFilter: status_filter
    });

    return NextResponse.json({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      },
      stats: mockUserStats,
      userRole: "admin"
    });

  } catch (error: any) {
    console.error("[MOCK_USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new user (Admin only) - Mock implementation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (user.email !== "androa687@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { email, password, full_name, phone, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ 
        error: "Email, password, full_name, and role are required" 
      }, { status: 400 });
    }

    // Mock user creation - in real implementation, this would create in database
    const newUser = {
      id: `user-${Date.now()}`,
      full_name,
      email,
      phone: phone || null,
      role: role || "viewer",
      is_active: true,
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: "User created successfully (mock)",
      user: newUser
    });

  } catch (error: any) {
    console.error("[MOCK_USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
