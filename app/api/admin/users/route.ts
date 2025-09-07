export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { getUserProfile, getProfiles } from "@/lib/utils/supabase-helpers";

// GET - Get all users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Use server client to read auth session (cookies)
    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to bypass RLS for profile checks and listing
    const service = createServiceClient();
    
    // Check if user has permission to view users
    let profile;
    let profileError = null;
    if (user.email === "androa687@gmail.com") {
      profile = { role: "admin" } as any;
    } else {
      const result = await getUserProfile(service as any, user.id);
      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile || !['admin', 'moderator', 'viewer'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role_filter = url.searchParams.get("role") || "";
    const status_filter = url.searchParams.get("status") || "";

    // Use helper function to get profiles
    const { data: users, error, count } = await getProfiles(service as any, {
      page,
      limit,
      search,
      roleFilter: role_filter,
      statusFilter: status_filter
    });

    if (error) {
      console.error("[USERS_API] Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Filter sensitive data based on user role
    let filteredUsers = users;
    if (profile.role === 'viewer') {
      // Viewers can only see limited info
      filteredUsers = users?.map(user => ({
        id: user.id,
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
    // Use service client to avoid RLS recursion on profiles policies
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    let profile;
    let profileError = null;
    
    // Special case for admin user
    if (user.email === "androa687@gmail.com") {
      profile = { role: "admin" };
    } else {
      const result = await getUserProfile(supabase, user.id);
      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile || profile.role !== 'admin') {
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
    const { error: profileInsertError } = await supabase
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name,
        email,
        phone: phone || null,
        role,
        is_active: true,
        created_by: user.id
      });

    if (profileInsertError) {
      console.error("[USERS_API] Error creating profile:", profileInsertError);
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
