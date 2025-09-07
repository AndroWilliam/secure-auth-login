// Mock user data for development and testing
export interface MockUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'moderator' | 'viewer';
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "admin-user-1",
    full_name: "Admin User",
    email: "androa687@gmail.com",
    phone: "+201234567890",
    role: "admin",
    is_active: true,
    last_active_at: new Date().toISOString(),
    created_at: "2024-01-01T00:00:00Z",
    updated_at: new Date().toISOString()
  },
  {
    id: "user-1",
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone: "+201234567891",
    role: "viewer",
    is_active: true,
    last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "user-2",
    full_name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+201234567892",
    role: "viewer",
    is_active: true,
    last_active_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_at: "2024-01-20T14:15:00Z",
    updated_at: "2024-01-20T14:15:00Z"
  },
  {
    id: "user-3",
    full_name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    phone: "+201234567893",
    role: "viewer",
    is_active: false,
    last_active_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    created_at: "2024-01-10T09:45:00Z",
    updated_at: "2024-01-25T16:20:00Z"
  },
  {
    id: "user-4",
    full_name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+201234567894",
    role: "viewer",
    is_active: true,
    last_active_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    created_at: "2024-01-22T11:00:00Z",
    updated_at: "2024-01-22T11:00:00Z"
  },
  {
    id: "user-5",
    full_name: "Mohamed Ali",
    email: "mohamed.ali@example.com",
    phone: "+201234567895",
    role: "viewer",
    is_active: true,
    last_active_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: "2024-01-28T08:30:00Z",
    updated_at: "2024-01-28T08:30:00Z"
  }
];

export const mockUserStats = {
  total_users: mockUsers.length,
  active_users: mockUsers.filter(user => user.is_active).length,
  admins: mockUsers.filter(user => user.role === 'admin').length,
  moderators: mockUsers.filter(user => user.role === 'moderator').length,
  viewers: mockUsers.filter(user => user.role === 'viewer').length
};

// Helper functions for filtering and pagination
export function getMockUsers(options: {
  page: number;
  limit: number;
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
}) {
  const { page, limit, search, roleFilter, statusFilter } = options;
  
  let filteredUsers = [...mockUsers];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply role filter
  if (roleFilter) {
    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
  }
  
  // Apply status filter
  if (statusFilter === "active") {
    filteredUsers = filteredUsers.filter(user => user.is_active);
  } else if (statusFilter === "inactive") {
    filteredUsers = filteredUsers.filter(user => !user.is_active);
  }
  
  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);
  
  return {
    users: paginatedUsers,
    total: filteredUsers.length,
    totalPages: Math.ceil(filteredUsers.length / limit)
  };
}
