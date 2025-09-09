/**
 * Unit Tests for Invitation System
 * 
 * Tests the invitation creation, approval, and rejection flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInviteRow, sendEmail, getEmailTemplates } from '@/lib/invitations';
import { addInvite, getInvite, updateInvite, removeInvite, initializeMockInvites } from '@/lib/admin/mockInviteStore';

// Mock the email sending
vi.mock('@/lib/invitations', async () => {
  const actual = await vi.importActual('@/lib/invitations');
  return {
    ...actual,
    sendEmail: vi.fn()
  };
});

describe('Invitation System', () => {
  beforeEach(() => {
    // Reset mock data
    vi.clearAllMocks();
    initializeMockInvites();
  });

  describe('createInviteRow', () => {
    it('should create a valid invitation row', () => {
      const invite = createInviteRow({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'inviting',
        requestedBy: 'admin-1'
      });

      expect(invite).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'inviting',
        requested_by: 'admin-1'
      });
      expect(invite.id).toBeDefined();
      expect(invite.created_at).toBeDefined();
      expect(invite.updated_at).toBeDefined();
    });

    it('should generate token for invited status', () => {
      const invite = createInviteRow({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'invited',
        requestedBy: 'admin-1'
      });

      expect(invite.token).toBeDefined();
      expect(invite.expires_at).toBeDefined();
    });
  });

  describe('Mock Invite Store', () => {
    it('should add and retrieve invitations', () => {
      const invite = createInviteRow({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'inviting',
        requestedBy: 'admin-1'
      });

      addInvite(invite);
      const retrieved = getInvite(invite.id);

      expect(retrieved).toEqual(invite);
    });

    it('should update invitation status', () => {
      const invite = createInviteRow({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'inviting',
        requestedBy: 'admin-1'
      });

      addInvite(invite);
      const updated = updateInvite(invite.id, { status: 'invited' });

      expect(updated?.status).toBe('invited');
      expect(updated?.updated_at).not.toBe(invite.updated_at);
    });

    it('should remove invitations', () => {
      const invite = createInviteRow({
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        status: 'inviting',
        requestedBy: 'admin-1'
      });

      addInvite(invite);
      const removed = removeInvite(invite.id);
      const retrieved = getInvite(invite.id);

      expect(removed).toBe(true);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Email Templates', () => {
    it('should generate correct user invite email', () => {
      const templates = getEmailTemplates();
      const subject = templates.userInvite.subject('John Doe');
      const body = templates.userInvite.body('John Doe', 'https://example.com', 'token123');

      expect(subject).toBe('Welcome to the team, John Doe!');
      expect(body).toContain('Welcome to the team John Doe!');
      expect(body).toContain('https://example.com/auth/signup?invite=token123');
    });

    it('should generate correct admin request email', () => {
      const templates = getEmailTemplates();
      const subject = templates.adminRequest.subject('Moderator', 'Jane Smith');
      const body = templates.adminRequest.body('Moderator', 'Jane Smith', 'jane@example.com', 'https://example.com');

      expect(subject).toBe('Moderator Moderator requested to invite Jane Smith');
      expect(body).toContain('Moderator Moderator has requested to invite Jane Smith (jane@example.com)');
      expect(body).toContain('https://example.com/admin/users');
    });
  });
});
