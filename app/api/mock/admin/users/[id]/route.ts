export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PUT - Update user (Admin only) - Mock implementation
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
    if (user.email !== "androa687@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { full_name, phone, role, is_active } = await req.json();
    const userId = params.id;

    // Prevent admin from deactivating themselves
    if (userId === "admin-user-1" && is_active === false) {
      return NextResponse.json({ 
        error: "Cannot deactivate your own account" 
      }, { status: 400 });
    }

    // Mock user update - in real implementation, this would update database
    const updatedUser = {
      id: userId,
      full_name: full_name || "Updated User",
      phone: phone || null,
      role: role || "viewer",
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: "User updated successfully (mock)",
      user: updatedUser
    });

  } catch (error: any) {
    console.error("[MOCK_USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete user (Admin only) - Mock implementation
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
    if (user.email !== "androa687@gmail.com") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === "admin-user-1") {
      return NextResponse.json({ 
        error: "Cannot delete your own account" 
      }, { status: 400 });
    }

    // Mock user deletion - in real implementation, this would delete from database
    return NextResponse.json({ 
      message: "User deleted successfully (mock)",
      userId
    });

  } catch (error: any) {
    console.error("[MOCK_USERS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
