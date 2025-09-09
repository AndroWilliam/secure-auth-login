import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { CreateInviteRequest, InviteResponse } from "@/lib/types/admin";
import { createInviteRow, sendEmail, getEmailTemplates, getOrigin } from "@/lib/invitations";
import { addInvite, getInvitesByEmail, initializeMockInvites } from "@/lib/admin/mockInviteStore";

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

    // Get user role (simplified for now)
    const userRole = user.email === 'androa687@gmail.com' ? 'admin' : 'moderator';

    const body: CreateInviteRequest = await request.json();
    const { name, email, role } = body;

    // Validate input
    if (!name || !email || !role) {
      return NextResponse.json({
        success: false,
        error: "Name, email, and role are required"
      }, { status: 400 });
    }

    // Check if invitation already exists
    const existingInvites = getInvitesByEmail(email);
    if (existingInvites.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Invitation already exists for this email"
      }, { status: 409 });
    }

    // Create invitation based on user role
    let invite;
    let message;

    if (userRole === 'admin') {
      // Admin can directly invite
      invite = createInviteRow({
        email,
        name,
        role,
        status: 'invited',
        requestedBy: user.id
      });

      // Send invitation email
      const templates = getEmailTemplates();
      const origin = getOrigin();
      const subject = templates.userInvite.subject(name);
      const body = templates.userInvite.body(name, origin, invite.token!);
      
      await sendEmail(subject, body, email);
      
      message = `Invitation email sent to ${email}`;
    } else {
      // Moderator needs approval
      invite = createInviteRow({
        email,
        name,
        role,
        status: 'inviting',
        requestedBy: user.id
      });

      // Send request email to admins
      const templates = getEmailTemplates();
      const origin = getOrigin();
      const subject = templates.adminRequest.subject('Moderator', name);
      const body = templates.adminRequest.body('Moderator', name, email, origin);
      
      // TODO: Get admin emails from environment or database
      const adminEmails = ['androa687@gmail.com']; // For now, hardcoded
      for (const adminEmail of adminEmails) {
        await sendEmail(subject, body, adminEmail);
      }
      
      message = `Request sent to admins for ${email}`;
    }

    // Store in mock data
    addInvite(invite);

    const response: InviteResponse = {
      success: true,
      message,
      invite
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}

// GET endpoint to retrieve invitations (for debugging)
export async function GET() {
  const { getAllInvites } = await import("@/lib/admin/mockInviteStore");
  return NextResponse.json({ invites: getAllInvites() });
}
