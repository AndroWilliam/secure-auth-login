/**
 * Mock Presence System
 * 
 * Simulates real-time user presence with status computation.
 * This will be replaced with Supabase Realtime subscriptions later.
 */

import { UserRow, UserStatus, PresenceData } from './types';

type PresenceStore = Map<string, PresenceData>;
type PresenceCallback = (userId: string, status: UserStatus) => void;

class PresenceMock {
  private store: PresenceStore = new Map();
  private callbacks: Set<PresenceCallback> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize presence data for a list of users
   */
  initPresence(users: UserRow[]): void {
    users.forEach(user => {
      if (!this.store.has(user.id)) {
        this.store.set(user.id, {
          last_seen: new Date(),
          last_logout_at: undefined
        });
      }
    });
  }

  /**
   * Compute user status based on presence data
   */
  computeStatus(presence: PresenceData): UserStatus {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // If user has explicitly logged out
    if (presence.last_logout_at) {
      return 'inactive';
    }

    // If last seen is more than 30 minutes ago (failsafe)
    if (presence.last_seen < thirtyMinutesAgo) {
      return 'inactive';
    }

    // If last seen is more than 5 minutes ago but less than 30 minutes
    if (presence.last_seen < fiveMinutesAgo) {
      return 'idle';
    }

    // If last seen within 5 minutes
    return 'active';
  }

  /**
   * Get current status for a user
   */
  getStatus(userId: string): UserStatus {
    const presence = this.store.get(userId);
    if (!presence) {
      return 'inactive';
    }
    return this.computeStatus(presence);
  }

  /**
   * Update last seen timestamp (heartbeat)
   */
  heartbeat(userId: string): void {
    const presence = this.store.get(userId);
    if (presence) {
      presence.last_seen = new Date();
      this.notifyStatusChange(userId, this.computeStatus(presence));
    }
  }

  /**
   * Simulate user going idle (last seen > 5 minutes ago)
   */
  simulateIdle(userId: string): void {
    const presence = this.store.get(userId);
    if (presence) {
      presence.last_seen = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      this.notifyStatusChange(userId, this.computeStatus(presence));
    }
  }

  /**
   * Force user logout
   */
  forceLogout(userId: string): void {
    const presence = this.store.get(userId);
    if (presence) {
      presence.last_logout_at = new Date();
      this.notifyStatusChange(userId, this.computeStatus(presence));
    }
  }

  /**
   * Reset user to active (clear logout, update last seen)
   */
  resetToActive(userId: string): void {
    const presence = this.store.get(userId);
    if (presence) {
      presence.last_seen = new Date();
      presence.last_logout_at = undefined;
      this.notifyStatusChange(userId, this.computeStatus(presence));
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: PresenceCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Start automatic heartbeat for all users
   */
  startHeartbeat(intervalMs: number = 30000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.store.forEach((_, userId) => {
        this.heartbeat(userId);
      });
    }, intervalMs);
  }

  /**
   * Stop automatic heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Notify all subscribers of status change
   */
  private notifyStatusChange(userId: string, status: UserStatus): void {
    this.callbacks.forEach(callback => {
      try {
        callback(userId, status);
      } catch (error) {
        console.error('Error in presence callback:', error);
      }
    });
  }

  /**
   * Get all presence data (for debugging)
   */
  getAllPresence(): Record<string, PresenceData> {
    const result: Record<string, PresenceData> = {};
    this.store.forEach((presence, userId) => {
      result[userId] = { ...presence };
    });
    return result;
  }

  /**
   * Clear all presence data
   */
  clear(): void {
    this.store.clear();
    this.callbacks.clear();
    this.stopHeartbeat();
  }
}

// Export singleton instance
export const presenceMock = new PresenceMock();

// Export helper functions for easier usage
export const initPresence = (users: UserRow[]) => presenceMock.initPresence(users);
export const heartbeat = (userId: string) => presenceMock.heartbeat(userId);
export const simulateIdle = (userId: string) => presenceMock.simulateIdle(userId);
export const forceLogout = (userId: string) => presenceMock.forceLogout(userId);
export const resetToActive = (userId: string) => presenceMock.resetToActive(userId);
export const getStatus = (userId: string) => presenceMock.getStatus(userId);
export const subscribe = (callback: PresenceCallback) => presenceMock.subscribe(callback);
export const startHeartbeat = (intervalMs?: number) => presenceMock.startHeartbeat(intervalMs);
export const stopHeartbeat = () => presenceMock.stopHeartbeat();
