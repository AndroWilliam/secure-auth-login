/**
 * Role Resolution System
 * 
 * Centralized role management for user permissions.
 * Currently uses hard-coded admin email, but can be extended
 * to use database roles in the future.
 */

export type UserRole = 'admin' | 'moderator' | 'viewer';

/**
 * Resolves user role based on email address
 * @param email - User's email address
 * @returns UserRole - 'admin', 'moderator', or 'viewer'
 */
export function resolveRole(email?: string): UserRole {
  if (!email) return 'viewer';
  
  // Hard-coded admin email
  if (email === 'androa687@gmail.com') return 'admin';
  
  // Future: Add moderator emails here
  // if (moderatorEmails.includes(email)) return 'moderator';
  
  // Default to viewer
  return 'viewer';
}

/**
 * Checks if user has admin privileges
 * @param email - User's email address
 * @returns boolean - true if admin
 */
export function isAdmin(email?: string): boolean {
  return resolveRole(email) === 'admin';
}

/**
 * Checks if user has moderator or admin privileges
 * @param email - User's email address
 * @returns boolean - true if moderator or admin
 */
export function isModeratorOrAdmin(email?: string): boolean {
  const role = resolveRole(email);
  return role === 'moderator' || role === 'admin';
}

/**
 * Checks if user can manage users
 * @param email - User's email address
 * @returns boolean - true if can manage users
 */
export function canManageUsers(email?: string): boolean {
  return isModeratorOrAdmin(email);
}

/**
 * Checks if user can delete users
 * @param email - User's email address
 * @returns boolean - true if can delete users
 */
export function canDeleteUsers(email?: string): boolean {
  return isAdmin(email);
}
