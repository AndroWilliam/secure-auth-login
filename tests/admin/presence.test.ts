/**
 * Unit Tests for Presence Mock System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { presenceMock, computeStatus, initPresence, heartbeat, simulateIdle, forceLogout, resetToActive } from '@/lib/admin/presenceMock';
import { UserRow } from '@/lib/admin/types';

describe('Presence Mock System', () => {
  const mockUsers: UserRow[] = [
    {
      id: 'user-1',
      email: 'test1@example.com',
      full_name: 'Test User 1',
      phone: '+1234567890',
      role: 'viewer',
      status: 'active',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      email: 'test2@example.com',
      full_name: 'Test User 2',
      phone: '+1234567891',
      role: 'moderator',
      status: 'active',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    presenceMock.clear();
    initPresence(mockUsers);
  });

  afterEach(() => {
    presenceMock.clear();
  });

  describe('Status Computation', () => {
    it('should return active for recent last_seen', () => {
      const now = new Date();
      const status = computeStatus({
        last_seen: now,
        last_logout_at: undefined
      });
      expect(status).toBe('active');
    });

    it('should return idle for last_seen > 5 minutes ago', () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      const status = computeStatus({
        last_seen: sixMinutesAgo,
        last_logout_at: undefined
      });
      expect(status).toBe('idle');
    });

    it('should return inactive for last_seen > 30 minutes ago', () => {
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      const status = computeStatus({
        last_seen: thirtyOneMinutesAgo,
        last_logout_at: undefined
      });
      expect(status).toBe('inactive');
    });

    it('should return inactive when user has logged out', () => {
      const now = new Date();
      const status = computeStatus({
        last_seen: now,
        last_logout_at: now
      });
      expect(status).toBe('inactive');
    });
  });

  describe('Presence Operations', () => {
    it('should initialize presence for users', () => {
      const status1 = getStatus('user-1');
      const status2 = getStatus('user-2');
      
      expect(status1).toBe('active');
      expect(status2).toBe('active');
    });

    it('should update status when user goes idle', () => {
      simulateIdle('user-1');
      const status = getStatus('user-1');
      expect(status).toBe('idle');
    });

    it('should update status when user logs out', () => {
      forceLogout('user-1');
      const status = getStatus('user-1');
      expect(status).toBe('inactive');
    });

    it('should reset user to active', () => {
      forceLogout('user-1');
      expect(getStatus('user-1')).toBe('inactive');
      
      resetToActive('user-1');
      expect(getStatus('user-1')).toBe('active');
    });

    it('should trigger heartbeat updates', () => {
      const statusChanges: Array<{ userId: string; status: string }> = [];
      
      const unsubscribe = presenceMock.subscribe((userId, status) => {
        statusChanges.push({ userId, status });
      });

      simulateIdle('user-1');
      forceLogout('user-2');

      expect(statusChanges).toHaveLength(2);
      expect(statusChanges[0]).toEqual({ userId: 'user-1', status: 'idle' });
      expect(statusChanges[1]).toEqual({ userId: 'user-2', status: 'inactive' });

      unsubscribe();
    });
  });
});
