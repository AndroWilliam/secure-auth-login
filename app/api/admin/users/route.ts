import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail, getSessionRole } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string | null;
  lastLoginAt?: string | null;
  role: 'admin' | 'viewer';
  status: 'Active' | 'Idle' | 'Inactive';
  displayName?: string;
  phoneNumber?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totals: {
    total: number;
    active: number;
    idle: number;
    admins: number;
  };
}

function calculateStatus(lastSignInAt: string | null | undefined): 'Active' | 'Idle' | 'Inactive' {
  if (!lastSignInAt) return 'Inactive';
  
  const now = new Date();
  const lastSignIn = new Date(lastSignInAt);
  const diffMinutes = (now.getTime() - lastSignIn.getTime()) / (1000 * 60);
  
  if (diffMinutes <= 5) return 'Active';
  if (diffMinutes <= 30) return 'Idle';
  return 'Inactive';
}

function getDisplayName(email: string, profilesData?: any): string {
  // If we have profile data with display_name, use it
  if (profilesData?.display_name) {
    return profilesData.display_name;
  }
  
  // Otherwise, extract name from email local part
  const localPart = email.split('@')[0];
  return localPart
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const email = await getSessionEmail();
    if (!email) {
      console.log('GET /api/admin/users: No authenticated user');
      return NextResponse.json({ 
        ok: false, 
        error: "UNAUTHORIZED" 
      }, { status: 401 });
    }

    // Check if user is admin
    const role = resolveRole(email);
    if (role !== 'admin') {
      console.log(`GET /api/admin/users: User ${email} is not admin (role: ${role})`);
      return NextResponse.json({
        ok: false,
        error: "FORBIDDEN"
      }, { status: 403 });
    }

    // Get service client for admin operations
    const serviceClient = createServiceClient();
    
    // Fetch all users using pagination
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 200;
    let hasMore = true;

    while (hasMore) {
      const { data: users, error } = await serviceClient.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to fetch users"
        }, { status: 500 });
      }

      if (users && users.users.length > 0) {
        allUsers.push(...users.users);
        page++;
      } else {
        hasMore = false;
      }
    }

    // Get profiles data for all users
    const userIds = allUsers.map(u => u.id);
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, display_name, phone_number, role')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get latest login events for each user
    const { data: loginEvents } = await serviceClient
      .from('user_info_events')
      .select('user_id, created_at, event_data')
      .in('user_id', userIds)
      .in('event_type', ['login_completed', 'login_attempt'])
      .order('created_at', { ascending: false });

    // Group events by user_id and get the latest for each
    const latestEvents = new Map<string, any>();
    loginEvents?.forEach(event => {
      if (!latestEvents.has(event.user_id)) {
        latestEvents.set(event.user_id, event);
      }
    });

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = allUsers.map(user => {
      const profile = profileMap.get(user.id);
      const latestEvent = latestEvents.get(user.id);
      
      // Use profile role if available, otherwise resolve from email
      const role: 'admin' | 'viewer' = profile?.role || (user.email === 'androa687@gmail.com' ? 'admin' : 'viewer');
      const status = calculateStatus(user.last_sign_in_at);
      const displayName = profile?.display_name || getDisplayName(user.email);
      
      // Prefer login_completed event timestamp, fallback to last_sign_in_at
      const lastLoginAt = latestEvent?.event_type === 'login_completed' 
        ? latestEvent.created_at 
        : user.last_sign_in_at;

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        lastLoginAt,
        role,
        status,
        displayName,
        phoneNumber: profile?.phone_number || null
      };
    });

    // Calculate totals
    const totals = {
      total: adminUsers.length,
      active: adminUsers.filter(user => user.status === 'Active').length,
      idle: adminUsers.filter(user => user.status === 'Idle').length,
      admins: adminUsers.filter(user => user.role === 'admin').length
    };

    const response: AdminUsersResponse = {
      users: adminUsers,
      totals
    };

    return NextResponse.json({
      ok: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR"
    }, { status: 500 });
  }
}