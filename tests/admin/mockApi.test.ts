/**
 * Unit Tests for Mock API
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { listUsers, getUser, updateUser, createUser, deleteUser, resetMockData } from '@/lib/admin/mockApi';
import { UserUpdateInput } from '@/lib/admin/types';

describe('Mock API', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const result = await listUsers({ page: 1, pageSize: 2 });
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.rows).toHaveLength(2);
        expect(result.data.total).toBeGreaterThan(0);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(2);
      }
    });

    it('should filter users by search term', async () => {
      const result = await listUsers({ search: 'admin' });
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.rows.every(user => 
          user.full_name?.toLowerCase().includes('admin') || 
          user.email.toLowerCase().includes('admin')
        )).toBe(true);
      }
    });

    it('should filter users by role', async () => {
      const result = await listUsers({ roleFilter: 'admin' });
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.rows.every(user => user.role === 'admin')).toBe(true);
      }
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const result = await getUser('admin-user-1');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe('admin-user-1');
        expect(result.data.email).toBe('androa687@gmail.com');
      }
    });

    it('should return 404 for non-existent user', async () => {
      const result = await getUser('non-existent');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error).toBe('User not found');
      }
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateInput: UserUpdateInput = {
        full_name: 'Updated Name',
        phone: '+9876543210',
        role: 'moderator',
        prevUpdatedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await updateUser('admin-user-1', updateInput);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.full_name).toBe('Updated Name');
        expect(result.data.phone).toBe('+9876543210');
        expect(result.data.role).toBe('moderator');
        expect(result.data.updated_at).not.toBe('2024-01-01T00:00:00.000Z');
      }
    });

    it('should return conflict when prevUpdatedAt mismatches', async () => {
      const updateInput: UserUpdateInput = {
        full_name: 'Updated Name',
        prevUpdatedAt: '2024-01-01T00:00:00.000Z' // Old timestamp
      };

      const result = await updateUser('admin-user-1', updateInput);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(409);
        expect(result.error).toBe('CONFLICT');
        expect(result.detail).toBeDefined();
      }
    });

    it('should return 404 for non-existent user', async () => {
      const updateInput: UserUpdateInput = {
        full_name: 'Updated Name',
        prevUpdatedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await updateUser('non-existent', updateInput);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error).toBe('User not found');
      }
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        full_name: 'New User',
        phone: '+1234567890',
        role: 'viewer' as const,
        password: 'password123'
      };

      const result = await createUser(newUser);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.email).toBe('newuser@example.com');
        expect(result.data.full_name).toBe('New User');
        expect(result.data.role).toBe('viewer');
        expect(result.data.id).toBeDefined();
      }
    });

    it('should return conflict for duplicate email', async () => {
      const newUser = {
        email: 'androa687@gmail.com', // Existing email
        full_name: 'Duplicate User',
        phone: '+1234567890',
        role: 'viewer' as const,
        password: 'password123'
      };

      const result = await createUser(newUser);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(409);
        expect(result.error).toBe('Email already exists');
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const result = await deleteUser('user-john-doe');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe('user-john-doe');
      }
    });

    it('should prevent admin from deleting themselves', async () => {
      const result = await deleteUser('admin-user-1');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toBe('Cannot delete your own account');
      }
    });

    it('should return 404 for non-existent user', async () => {
      const result = await deleteUser('non-existent');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error).toBe('User not found');
      }
    });
  });
});
