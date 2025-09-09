/**
 * Mock Invitation Store
 * 
 * In-memory store for invitation data during development.
 * This will be replaced with Supabase database calls later.
 */

import { InviteRow } from '@/lib/types/admin';

// In-memory store for invitations
let mockInvites: InviteRow[] = [];

export function addInvite(invite: InviteRow): void {
  mockInvites.push(invite);
}

export function getInvite(id: string): InviteRow | undefined {
  return mockInvites.find(invite => invite.id === id);
}

export function updateInvite(id: string, updates: Partial<InviteRow>): InviteRow | null {
  const index = mockInvites.findIndex(invite => invite.id === id);
  if (index === -1) return null;
  
  mockInvites[index] = { ...mockInvites[index], ...updates, updated_at: new Date().toISOString() };
  return mockInvites[index];
}

export function removeInvite(id: string): boolean {
  const index = mockInvites.findIndex(invite => invite.id === id);
  if (index === -1) return false;
  
  mockInvites.splice(index, 1);
  return true;
}

export function getAllInvites(): InviteRow[] {
  return [...mockInvites];
}

export function getInvitesByStatus(status: string): InviteRow[] {
  return mockInvites.filter(invite => invite.status === status);
}

export function getInvitesByEmail(email: string): InviteRow[] {
  return mockInvites.filter(invite => invite.email === email);
}

// Initialize with some sample data
export function initializeMockInvites(): void {
  if (mockInvites.length === 0) {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    mockInvites = [
      {
        id: 'invite-sample-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'viewer',
        status: 'inviting',
        requested_by: 'admin-user-1',
        created_at: thirtyMinutesAgo.toISOString(),
        updated_at: thirtyMinutesAgo.toISOString()
      },
      {
        id: 'invite-sample-2',
        email: 'invited@example.com',
        name: 'Invited User',
        role: 'moderator',
        status: 'invited',
        token: 'mock_token_12345',
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        requested_by: 'admin-user-1',
        approved_by: 'admin-user-1',
        created_at: fifteenMinutesAgo.toISOString(),
        updated_at: fifteenMinutesAgo.toISOString()
      }
    ];
  }
}
