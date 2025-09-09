import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail, getSessionRole } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserListItem {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string | null;
  role: 'admin' | 'viewer';
  status: 'Active' | 'Idle' | 'Inactive';
  displayName?: string;
}

export interface UserListResponse {
  ok: boolean;
  users?: UserListItem[];
  totals?: {
    total: number;
    active: number;
    idle: number;
    admins: number;
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

export async function GET() {
  try {
    // Check authentication
    const email = await getSessionEmail();
    if (!email) {
      console.log('GET /api/users/list: No authenticated user');
      return NextResponse.json({ 
        ok: false, 
        error: 'UNAUTHORIZED' 
      }, { status: 401 });
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
        console.error('Error fetching users in /api/users/list:', error);
        return NextResponse.json({
          ok: false,
          error: 'FAILED_TO_FETCH_USERS'
        }, { status: 500 });
      }

      if (users && users.users.length > 0) {
        allUsers.push(...users.users);
        page++;
      } else {
        hasMore = false;
      }
    }

    // Transform users to sanitized format
    const userList: UserListItem[] = allUsers.map(user => {
      const role = resolveRole(user.email);
      const status = calculateStatus(user.last_sign_in_at);
      const displayName = getDisplayName(user.email);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        role,
        status,
        displayName
      };
    });

    // Calculate totals
    const totals = {
      total: userList.length,
      active: userList.filter(user => user.status === 'Active').length,
      idle: userList.filter(user => user.status === 'Idle').length,
      admins: userList.filter(user => user.role === 'admin').length
    };

    return NextResponse.json({
      ok: true,
      users: userList,
      totals
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error in /api/users/list:', error);
    return NextResponse.json({
      ok: false,
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
