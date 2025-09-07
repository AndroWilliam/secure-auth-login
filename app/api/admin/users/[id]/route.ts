export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PUT - Update user (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    let profile;
    
    // Special case for admin user
    if (user.email === "androa687@gmail.com") {
      profile = { role: "admin" };
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      profile = data;
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { full_name, phone, role, is_active } = await req.json();
    const userId = params.id;

    // Prevent admin from deactivating themselves
    if (userId === user.id && is_active === false) {
      return NextResponse.json({ 
        error: "Cannot deactivate your own account" 
      }, { status: 400 });
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        role,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[USERS_API] Error updating user:", updateError);
      return NextResponse.json({ 
        error: "Failed to update user" 
      }, { status: 500 });
    }

    return NextResponse.json({ message: "User updated successfully" });

  } catch (error: any) {
    console.error("[USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    let profile;
    
    // Special case for admin user
    if (user.email === "androa687@gmail.com") {
      profile = { role: "admin" };
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      profile = data;
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ 
        error: "Cannot delete your own account" 
      }, { status: 400 });
    }

    // Delete from auth (this will cascade to profiles due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[USERS_API] Error deleting user:", deleteError);
      return NextResponse.json({ 
        error: "Failed to delete user" 
      }, { status: 500 });
    }

    return NextResponse.json({ message: "User deleted successfully" });

  } catch (error: any) {
    console.error("[USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
