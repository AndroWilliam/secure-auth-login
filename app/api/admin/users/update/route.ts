import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserUpdateRequest {
  id: string;
  email?: string;
  display_name?: string;
  phone_number?: string;
  role?: 'admin' | 'viewer';
}

export interface UserUpdateResponse {
  ok: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: 'admin' | 'viewer';
    createdAt: string;
    lastSignInAt?: string;
    lastLoginAt?: string;
    status: 'Active' | 'Idle' | 'Inactive';
  };
  error?: string;
}

function calculateStatus(lastSignInAt: string | null | undefined): 'Active' | 'Idle' | 'Inactive' {
  if (!lastSignInAt) return 'Inactive';
  
  const now = Date.now();
  const lastSignIn = new Date(lastSignInAt).getTime();
  const deltaMinutes = (now - lastSignIn) / 60000;
  
  if (deltaMinutes <= 5) return 'Active';
  if (deltaMinutes <= 30) return 'Idle';
  return 'Inactive';
}

function getDisplayName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ 
        ok: false, 
        error: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const role = resolveRole(email);
    if (role !== 'admin') {
      return NextResponse.json({
        ok: false,
        error: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body: UserUpdateRequest = await request.json();
    const { id, email: newEmail, display_name, phone_number, role: newRole } = body;

    if (!id) {
      return NextResponse.json({
        ok: false,
        error: 'USER_ID_REQUIRED'
      }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Get current user data
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(id);
    if (authError || !authUser) {
      return NextResponse.json({
        ok: false,
        error: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Update email if provided
    if (newEmail && newEmail !== authUser.email) {
      const { error: emailError } = await serviceClient.auth.admin.updateUserById(id, {
        email: newEmail
      });
      
      if (emailError) {
        return NextResponse.json({
          ok: false,
          error: 'EMAIL_UPDATE_FAILED'
        }, { status: 400 });
      }
    }

    // Update profile data
    const profileData: any = {};
    if (display_name !== undefined) profileData.display_name = display_name;
    if (phone_number !== undefined) profileData.phone_number = phone_number;
    if (newRole !== undefined) profileData.role = newRole;

    if (Object.keys(profileData).length > 0) {
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert({
          id,
          ...profileData
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json({
          ok: false,
          error: 'PROFILE_UPDATE_FAILED'
        }, { status: 400 });
      }
    }

    // Get updated user data
    const { data: updatedAuthUser } = await serviceClient.auth.admin.getUserById(id);
    const { data: updatedProfile } = await serviceClient
      .from('profiles')
      .select('display_name, phone_number, role')
      .eq('id', id)
      .single();

    // Get latest login events for lastLoginAt
    const { data: loginEvents } = await serviceClient
      .from('user_info_events')
      .select('created_at, event_type')
      .eq('user_id', id)
      .in('event_type', ['login_completed', 'login_attempt'])
      .order('created_at', { ascending: false })
      .limit(1);

    const latestEvent = loginEvents?.[0];
    const lastLoginAt = latestEvent?.event_type === 'login_completed' 
      ? latestEvent.created_at 
      : updatedAuthUser?.last_sign_in_at;

    const updatedUser = {
      id: updatedAuthUser!.id,
      email: updatedAuthUser!.email,
      displayName: updatedProfile?.display_name || getDisplayName(updatedAuthUser!.email),
      phoneNumber: updatedProfile?.phone_number || null,
      role: updatedProfile?.role || resolveRole(updatedAuthUser!.email),
      createdAt: updatedAuthUser!.created_at,
      lastSignInAt: updatedAuthUser!.last_sign_in_at,
      lastLoginAt,
      status: calculateStatus(updatedAuthUser!.last_sign_in_at)
    };

    return NextResponse.json({
      ok: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in user update API:', error);
    return NextResponse.json({
      ok: false,
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
