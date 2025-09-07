/**
 * Mock API for Admin User Management
 * 
 * Simulates API calls with realistic delays and error handling.
 * All functions match the expected Supabase API contract.
 */

import { UserRow, UserUpdateInput, UserListResponse, ApiResult, ConflictDetail } from './types';
import { getMockUsers, getMockUserById, mockUsers } from './test-data';

// In-memory store for user data (simulates database)
let userStore: UserRow[] = [...mockUsers];

/**
 * Simulate network delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate random network delay between 300-800ms
 */
function randomDelay(): Promise<void> {
  const delayMs = Math.random() * 500 + 300; // 300-800ms
  return delay(delayMs);
}

/**
 * List users with pagination and filtering
 * TODO(API): Replace with GET /api/admin/users
 */
export async function listUsers(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
} = {}): Promise<ApiResult<UserListResponse>> {
  try {
    await randomDelay();

    const result = getMockUsers(options);
    
    return {
      ok: true,
      data: result
    };
  } catch (error) {
    console.error('[MOCK_API] listUsers error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to fetch users',
      detail: error
    };
  }
}

/**
 * Get a single user by ID
 * TODO(API): Replace with GET /api/admin/users/[id]
 */
export async function getUser(id: string): Promise<ApiResult<UserRow>> {
  try {
    await randomDelay();

    const user = getMockUserById(id);
    if (!user) {
      return {
        ok: false,
        status: 404,
        error: 'User not found'
      };
    }

    return {
      ok: true,
      data: user
    };
  } catch (error) {
    console.error('[MOCK_API] getUser error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to fetch user',
      detail: error
    };
  }
}

/**
 * Update user with optimistic concurrency control
 * TODO(API): Replace with PATCH /api/admin/users/[id]
 */
export async function updateUser(id: string, input: UserUpdateInput): Promise<ApiResult<UserRow>> {
  try {
    await randomDelay();

    const userIndex = userStore.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return {
        ok: false,
        status: 404,
        error: 'User not found'
      };
    }

    const currentUser = userStore[userIndex];

    // Check for optimistic concurrency conflict
    if (input.prevUpdatedAt !== currentUser.updated_at) {
      const conflicts: ConflictDetail['conflicts'] = [];
      
      if (input.full_name !== undefined && input.full_name !== currentUser.full_name) {
        conflicts.push({
          field: 'full_name',
          serverValue: currentUser.full_name,
          clientValue: input.full_name
        });
      }
      
      if (input.phone !== undefined && input.phone !== currentUser.phone) {
        conflicts.push({
          field: 'phone',
          serverValue: currentUser.phone,
          clientValue: input.phone
        });
      }
      
      if (input.role !== undefined && input.role !== currentUser.role) {
        conflicts.push({
          field: 'role',
          serverValue: currentUser.role,
          clientValue: input.role
        });
      }

      return {
        ok: false,
        status: 409,
        error: 'CONFLICT',
        detail: {
          server: currentUser,
          client: input,
          conflicts
        }
      };
    }

    // Update user data
    const updatedUser: UserRow = {
      ...currentUser,
      full_name: input.full_name !== undefined ? input.full_name : currentUser.full_name,
      phone: input.phone !== undefined ? input.phone : currentUser.phone,
      role: input.role !== undefined ? input.role : currentUser.role,
      updated_at: new Date().toISOString()
    };

    // Update in-memory store
    userStore[userIndex] = updatedUser;

    return {
      ok: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('[MOCK_API] updateUser error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to update user',
      detail: error
    };
  }
}

/**
 * Create a new user
 * TODO(API): Replace with POST /api/admin/users
 */
export async function createUser(input: {
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: 'viewer' | 'moderator' | 'admin';
  password: string;
}): Promise<ApiResult<UserRow>> {
  try {
    await randomDelay();

    // Check if email already exists
    const existingUser = userStore.find(user => user.email === input.email);
    if (existingUser) {
      return {
        ok: false,
        status: 409,
        error: 'Email already exists'
      };
    }

    // Create new user
    const newUser: UserRow = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: input.email,
      full_name: input.full_name || null,
      phone: input.phone || null,
      role: input.role || 'viewer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to store
    userStore.push(newUser);

    return {
      ok: true,
      data: newUser
    };
  } catch (error) {
    console.error('[MOCK_API] createUser error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to create user',
      detail: error
    };
  }
}

/**
 * Delete a user
 * TODO(API): Replace with DELETE /api/admin/users/[id]
 */
export async function deleteUser(id: string): Promise<ApiResult<{ id: string }>> {
  try {
    await randomDelay();

    const userIndex = userStore.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return {
        ok: false,
        status: 404,
        error: 'User not found'
      };
    }

    // Prevent admin from deleting themselves
    if (id === 'admin-user-1') {
      return {
        ok: false,
        status: 400,
        error: 'Cannot delete your own account'
      };
    }

    // Remove from store
    userStore.splice(userIndex, 1);

    return {
      ok: true,
      data: { id }
    };
  } catch (error) {
    console.error('[MOCK_API] deleteUser error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to delete user',
      detail: error
    };
  }
}

/**
 * Get user statistics
 * TODO(API): Replace with GET /api/admin/users/stats
 */
export async function getUserStats(): Promise<ApiResult<{
  total: number;
  active: number;
  idle: number;
  inactive: number;
  admins: number;
  moderators: number;
  viewers: number;
}>> {
  try {
    await randomDelay();

    const stats = userStore.reduce((acc, user) => {
      acc.total++;
      
      if (user.status === 'active') acc.active++;
      else if (user.status === 'idle') acc.idle++;
      else if (user.status === 'inactive') acc.inactive++;
      
      if (user.role === 'admin') acc.admins++;
      else if (user.role === 'moderator') acc.moderators++;
      else if (user.role === 'viewer') acc.viewers++;
      
      return acc;
    }, {
      total: 0,
      active: 0,
      idle: 0,
      inactive: 0,
      admins: 0,
      moderators: 0,
      viewers: 0
    });

    return {
      ok: true,
      data: stats
    };
  } catch (error) {
    console.error('[MOCK_API] getUserStats error:', error);
    return {
      ok: false,
      status: 500,
      error: 'Failed to fetch user statistics',
      detail: error
    };
  }
}

/**
 * Reset mock data to initial state (for testing)
 */
export function resetMockData(): void {
  userStore = [...mockUsers];
}
