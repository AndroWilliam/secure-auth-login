/**
 * React Query Keys for Admin User Management
 * 
 * Centralized query key management for consistent caching and invalidation.
 */

export const adminQueryKeys = {
  // User queries
  users: {
    all: ['admin', 'users'] as const,
    lists: () => [...adminQueryKeys.users.all, 'list'] as const,
    list: (filters: {
      page?: number;
      pageSize?: number;
      search?: string;
      roleFilter?: string;
      statusFilter?: string;
    }) => [...adminQueryKeys.users.lists(), filters] as const,
    details: () => [...adminQueryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...adminQueryKeys.users.details(), id] as const,
  },
  
  // Statistics queries
  stats: {
    all: ['admin', 'stats'] as const,
    users: () => [...adminQueryKeys.stats.all, 'users'] as const,
  },
  
  // Presence queries (if needed)
  presence: {
    all: ['admin', 'presence'] as const,
    user: (id: string) => [...adminQueryKeys.presence.all, id] as const,
  }
} as const;

// Helper functions for query invalidation
export const invalidateUserQueries = () => [
  adminQueryKeys.users.lists(),
  adminQueryKeys.stats.users()
];

export const invalidateUserDetail = (id: string) => [
  adminQueryKeys.users.detail(id),
  adminQueryKeys.users.lists()
];

export const invalidateAllAdminQueries = () => [
  adminQueryKeys.users.all,
  adminQueryKeys.stats.all,
  adminQueryKeys.presence.all
];
