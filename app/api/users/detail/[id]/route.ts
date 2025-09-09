import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserDetail {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  role: 'admin' | 'viewer' | 'moderator';
  createdAt: string;
  lastSignInAt?: string;
  lastLoginAt?: string;
  status: 'Active' | 'Idle' | 'Inactive';
  lastLoginIp?: string | null;
  lastLoginDeviceId?: string | null;
  lastLoginLocation?: {
    city?: string | null;
    country?: string | null;
  } | null;
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ 
        ok: false, 
        error: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userId = params.id;
    const serviceClient = createServiceClient();

    // Get user from auth.users
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
    if (authError || !authUser) {
      return NextResponse.json({
        ok: false,
        error: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Get profile data and latest login events
    const [{ data: profile }, { data: latestLogins }] = await Promise.all([
      serviceClient.from('profiles').select('display_name, phone_number, role').eq('id', userId).single(),
      serviceClient.rpc('get_latest_login_events', { user_ids: [userId] })
    ]);

    const login = latestLogins?.[0];
    
    // Use profile role if available, otherwise resolve from email
    const role = profile?.role || resolveRole(authUser.email);
    const status = calculateStatus(login?.last_login_at || authUser.last_sign_in_at);
    const displayName = profile?.display_name || getDisplayName(authUser.email);
    
    // Prefer login event timestamp, fallback to last_sign_in_at
    const lastLoginAt = login?.last_login_at || authUser.last_sign_in_at;

    const userDetail: UserDetail = {
      id: authUser.id,
      email: authUser.email,
      displayName,
      phone: profile?.phone_number || null,
      role,
      createdAt: authUser.created_at,
      lastSignInAt: authUser.last_sign_in_at,
      lastLoginAt,
      status,
      lastLoginIp: login?.last_ip || null,
      lastLoginDeviceId: login?.last_device_id || null,
      lastLoginLocation: login?.last_city || login?.last_country ? {
        city: login?.last_city || null,
        country: login?.last_country || null,
      } : null,
    };

    return NextResponse.json({
      ok: true,
      user: userDetail
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error in user detail API:', error);
    return NextResponse.json({
      ok: false,
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
