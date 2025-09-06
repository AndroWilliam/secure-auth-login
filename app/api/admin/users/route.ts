export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view users
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !['admin', 'moderator', 'viewer'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role_filter = url.searchParams.get("role") || "";
    const status_filter = url.searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    // Build query based on user role permissions
    let query = supabase
      .from("profiles")
      .select(`
        user_id,
        full_name,
        email,
        phone,
        role,
        is_active,
        last_active_at,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role_filter) {
      query = query.eq("role", role_filter);
    }

    if (status_filter === "active") {
      query = query.eq("is_active", true);
    } else if (status_filter === "inactive") {
      query = query.eq("is_active", false);
    }

    // Apply pagination
    const { data: users, error, count } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[USERS_API] Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Filter sensitive data based on user role
    let filteredUsers = users;
    if (profile.role === 'viewer') {
      // Viewers can only see limited info
      filteredUsers = users?.map(user => ({
        user_id: user.user_id,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        last_active_at: user.last_active_at
      })) || [];
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      userRole: profile.role
    });

  } catch (error: any) {
    console.error("[USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new user (Admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { email, password, full_name, phone, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ 
        error: "Email, password, full_name, and role are required" 
      }, { status: 400 });
    }

    // Create user in auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error("[USERS_API] Error creating user:", createError);
      return NextResponse.json({ 
        error: "Failed to create user: " + createError.message 
      }, { status: 500 });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        full_name,
        email,
        phone: phone || null,
        role,
        is_active: true,
        created_by: user.id
      });

    if (profileError) {
      console.error("[USERS_API] Error creating profile:", profileError);
      // Try to delete the created auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ 
        error: "Failed to create user profile" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "User created successfully",
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role
      }
    });

  } catch (error: any) {
    console.error("[USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
