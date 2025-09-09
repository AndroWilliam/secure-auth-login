/**
 * Admin Types for User Management
 * 
 * Shared types for user management, invitations, and role-based access control.
 */

export type UserRole = 'admin' | 'moderator' | 'viewer';

export type UserStatus = 'active' | 'idle' | 'inactive' | 'inviting' | 'invited' | 'rejected';

export type InvitationStatus = 'inviting' | 'pending_admin' | 'invited' | 'accepted' | 'rejected' | 'expired';

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface InviteRow {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: InvitationStatus;
  token?: string;
  expires_at?: string;
  requested_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInviteRequest {
  name: string;
  email: string;
  role: UserRole;
}

export interface ApproveInviteRequest {
  id: string;
}

export interface RejectInviteRequest {
  id: string;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  invite?: InviteRow;
  error?: string;
}
