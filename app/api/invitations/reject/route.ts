import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { RejectInviteRequest, InviteResponse } from "@/lib/types/admin";
import { getInvite, removeInvite, initializeMockInvites } from "@/lib/admin/mockInviteStore";

// Initialize mock data
initializeMockInvites();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Check if user is admin
    const userRole = user.email === 'androa687@gmail.com' ? 'admin' : 'moderator';
    if (userRole !== 'admin') {
      return NextResponse.json({
        success: false,
        error: "Admin access required"
      }, { status: 403 });
    }

    const body: RejectInviteRequest = await request.json();
    const { id } = body;

    // Find the invitation
    const invite = getInvite(id);
    if (!invite) {
      return NextResponse.json({
        success: false,
        error: "Invitation not found"
      }, { status: 404 });
    }

    // Remove the invitation
    const removed = removeInvite(id);
    if (!removed) {
      return NextResponse.json({
        success: false,
        error: "Failed to remove invitation"
      }, { status: 500 });
    }

    const response: InviteResponse = {
      success: true,
      message: `Invitation for ${invite.email} has been rejected`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
