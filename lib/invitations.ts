/**
 * Invitation Utilities
 * 
 * Helper functions for invitation management, email templates, and token generation.
 */

import { InviteRow, UserRole } from './types/admin';

// Mock mode flag
export const isMockMode = process.env.INVITES_MOCK_MODE !== 'false';

/**
 * Generate a mock invitation token
 */
export function generateMockToken(): string {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a real invitation token (for future use)
 */
export function generateInviteToken(): string {
  if (isMockMode) {
    return generateMockToken();
  }
  
  // TODO: Implement real token generation with crypto
  return generateMockToken();
}

/**
 * Get email templates for different invitation types
 */
export function getEmailTemplates() {
  return {
    userInvite: {
      subject: (name: string) => `Welcome to the team, ${name}!`,
      body: (name: string, origin: string, token: string) => 
        `Welcome to the team ${name}!\n\nPlease follow this link to sign up: ${origin}/auth/signup?invite=${token}`
    },
    adminRequest: {
      subject: (modName: string, userName: string) => `Moderator ${modName} requested to invite ${userName}`,
      body: (modName: string, userName: string, userEmail: string, origin: string) =>
        `Moderator ${modName} has requested to invite ${userName} (${userEmail}).\n\nPlease review in User Management: ${origin}/admin/users`
    }
  };
}

/**
 * Send mock email (logs to console)
 */
export function sendMockEmail(subject: string, body: string, to: string) {
  console.log('📧 MOCK EMAIL SENT:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', body);
  console.log('---');
}

/**
 * Send real email (for future implementation)
 */
export async function sendRealEmail(subject: string, body: string, to: string) {
  // TODO: Implement real email sending with your email service
  console.log('📧 REAL EMAIL SENT:', { to, subject, body });
}

/**
 * Send email (mock or real based on environment)
 */
export async function sendEmail(subject: string, body: string, to: string) {
  if (isMockMode) {
    sendMockEmail(subject, body, to);
  } else {
    await sendRealEmail(subject, body, to);
  }
}

/**
 * Get the origin URL for links
 */
export function getOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Create a new invitation row
 */
export function createInviteRow(data: {
  email: string;
  name: string;
  role: UserRole;
  status: InvitationStatus;
  requestedBy?: string;
}): InviteRow {
  const now = new Date().toISOString();
  
  return {
    id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email,
    name: data.name,
    role: data.role,
    status: data.status,
    token: data.status === 'invited' ? generateInviteToken() : undefined,
    expires_at: data.status === 'invited' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    requested_by: data.requestedBy,
    approved_by: undefined,
    created_at: now,
    updated_at: now
  };
}
