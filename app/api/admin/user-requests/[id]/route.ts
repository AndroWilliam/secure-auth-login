export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PUT - Approve/Reject user request (Admin only)
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { status, review_notes } = await req.json();
    const requestId = params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be 'approved' or 'rejected'" 
      }, { status: 400 });
    }

    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from("user_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ 
        error: "Request not found" 
      }, { status: 404 });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("user_requests")
      .update({
        status,
        reviewed_by: user.id,
        review_notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("[USER_REQUESTS_API] Error updating request:", updateError);
      return NextResponse.json({ 
        error: "Failed to update request" 
      }, { status: 500 });
    }

    // If approved, execute the requested action
    if (status === 'approved') {
      try {
        await executeRequestAction(supabase, request, user.id);
      } catch (actionError: any) {
        console.error("[USER_REQUESTS_API] Error executing action:", actionError);
        // Update request status to indicate execution failure
        await supabase
          .from("user_requests")
          .update({
            status: 'rejected',
            review_notes: `Action execution failed: ${actionError.message}`
          })
          .eq("id", requestId);
        
        return NextResponse.json({ 
          error: "Failed to execute requested action" 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: `Request ${status} successfully` 
    });

  } catch (error: any) {
    console.error("[USER_REQUESTS_API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to execute the requested action
async function executeRequestAction(supabase: any, request: any, adminId: string) {
  const { request_type, request_data } = request;

  switch (request_type) {
    case 'add_user':
      const { email, password, full_name, phone, role } = request_data;
      
      // Create user in auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
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
          created_by: adminId
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
      break;

    case 'delete_user':
      const { user_id } = request_data;
      
      // Prevent deletion of admin who is approving
      if (user_id === adminId) {
        throw new Error("Cannot delete your own account");
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
      if (deleteError) {
        throw new Error(`Failed to delete user: ${deleteError.message}`);
      }
      break;

    case 'edit_user':
      const { user_id: editUserId, updates } = request_data;
      
      // Prevent admin from deactivating themselves
      if (editUserId === adminId && updates.is_active === false) {
        throw new Error("Cannot deactivate your own account");
      }

      const { error: editError } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", editUserId);

      if (editError) {
        throw new Error(`Failed to update user: ${editError.message}`);
      }
      break;

    default:
      throw new Error(`Unknown request type: ${request_type}`);
  }
}
