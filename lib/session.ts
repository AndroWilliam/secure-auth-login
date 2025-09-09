/**
 * Session Helper
 * 
 * Server-side utilities for getting user session information.
 * Used in API routes and server components.
 */

import { createServerClient } from '@/lib/supabase/server';
import { resolveRole, UserRole } from '@/lib/roles';

export interface SessionInfo {
  user: {
    id: string;
    email: string;
  } | null;
  email: string | null;
  role: UserRole;
  isAuthenticated: boolean;
}

/**
 * Gets current user session information
 * @returns Promise<SessionInfo> - User session data
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        email: null,
        role: 'viewer',
        isAuthenticated: false
      };
    }

    const email = user.email || null;
    const role = resolveRole(email);

    return {
      user: {
        id: user.id,
        email: user.email || ''
      },
      email,
      role,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return {
      user: null,
      email: null,
      role: 'viewer',
      isAuthenticated: false
    };
  }
}

/**
 * Gets just the user's email from session
 * @returns Promise<string | null> - User's email or null
 */
export async function getSessionEmail(): Promise<string | null> {
  const session = await getSessionInfo();
  return session.email;
}

/**
 * Gets just the user's role from session
 * @returns Promise<UserRole> - User's role
 */
export async function getSessionRole(): Promise<UserRole> {
  const session = await getSessionInfo();
  return session.role;
}

/**
 * Checks if user is authenticated
 * @returns Promise<boolean> - true if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSessionInfo();
  return session.isAuthenticated;
}
