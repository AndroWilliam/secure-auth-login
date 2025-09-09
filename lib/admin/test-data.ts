/**
 * Test Data for Admin User Management
 * 
 * Mock user data that matches the UserRow type structure.
 * This will be replaced with real Supabase queries later.
 */

import { UserRow, UserStatus } from './types';

export const mockUsers: UserRow[] = [
  {
    id: 'admin-user-1',
    email: 'androa687@gmail.com',
    full_name: 'Admin User',
    phone: '+201234567890',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'user-john-doe',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    phone: '+1234567890',
    role: 'viewer',
    status: 'active',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z'
  },
  {
    id: 'user-jane-smith',
    email: 'jane.smith@example.com',
    full_name: 'Jane Smith',
    phone: '+1987654321',
    role: 'moderator',
    status: 'idle',
    created_at: '2024-01-20T14:15:00.000Z',
    updated_at: '2024-01-20T14:15:00.000Z'
  },
  {
    id: 'user-ahmed-hassan',
    email: 'ahmed.hassan@example.com',
    full_name: 'Ahmed Hassan',
    phone: '+201234567891',
    role: 'viewer',
    status: 'inactive',
    created_at: '2024-02-01T09:00:00.000Z',
    updated_at: '2024-02-01T09:00:00.000Z'
  },
  {
    id: 'user-sarah-johnson',
    email: 'sarah.johnson@example.com',
    full_name: 'Sarah Johnson',
    phone: '+1555123456',
    role: 'viewer',
    status: 'active',
    created_at: '2024-02-10T16:45:00.000Z',
    updated_at: '2024-02-10T16:45:00.000Z'
  },
  {
    id: 'user-mohamed-ali',
    email: 'mohamed.ali@example.com',
    full_name: 'Mohamed Ali',
    phone: '+201987654321',
    role: 'moderator',
    status: 'active',
    created_at: '2024-02-15T11:20:00.000Z',
    updated_at: '2024-02-15T11:20:00.000Z'
  },
  // Add some invitation examples
  {
    id: 'invite-1',
    email: 'newuser@example.com',
    full_name: 'New User',
    phone: null,
    role: 'viewer',
    status: 'inviting',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'invite-2',
    email: 'invited@example.com',
    full_name: 'Invited User',
    phone: null,
    role: 'moderator',
    status: 'invited',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  }
];

export const mockUserStats = {
  total: 8,
  active: 4,
  idle: 1,
  inactive: 1,
  admins: 1,
  moderators: 2,
  viewers: 3,
  inviting: 1,
  invited: 1
};

// Helper to get a user by ID
export function getMockUserById(id: string): UserRow | undefined {
  return mockUsers.find(user => user.id === id);
}

// Helper to get users with pagination and filtering
export function getMockUsers(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
} = {}): { rows: UserRow[]; total: number; page: number; pageSize: number } {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    roleFilter = 'all',
    statusFilter = 'all'
  } = options;

  let filteredUsers = [...mockUsers];

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  // Apply role filter
  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    rows: paginatedUsers,
    total: filteredUsers.length,
    page,
    pageSize
  };
}
