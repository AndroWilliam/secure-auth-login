import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ApproveInviteRequest, InviteResponse } from "@/lib/types/admin";
import { sendEmail, getEmailTemplates, getOrigin, generateInviteToken } from "@/lib/invitations";
import { getInvite, updateInvite, initializeMockInvites } from "@/lib/admin/mockInviteStore";

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

    const body: ApproveInviteRequest = await request.json();
    const { id } = body;

    // Find the invitation
    const invite = getInvite(id);
    if (!invite) {
      return NextResponse.json({
        success: false,
        error: "Invitation not found"
      }, { status: 404 });
    }

    // Update invitation status
    const updatedInvite = updateInvite(id, {
      status: 'invited',
      token: generateInviteToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      approved_by: user.id
    });

    if (!updatedInvite) {
      return NextResponse.json({
        success: false,
        error: "Failed to update invitation"
      }, { status: 500 });
    }

    // Send invitation email to user
    const templates = getEmailTemplates();
    const origin = getOrigin();
    const subject = templates.userInvite.subject(invite.name);
    const body = templates.userInvite.body(invite.name, origin, updatedInvite.token);
    
    await sendEmail(subject, body, invite.email);

    const response: InviteResponse = {
      success: true,
      message: `Invitation approved and sent to ${updatedInvite.email}`,
      invite: updatedInvite
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error approving invitation:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
