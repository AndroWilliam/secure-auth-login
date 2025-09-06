// Utility functions for Supabase queries that handle different column naming conventions

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get user profile with role, handling both 'id' and 'user_id' column names
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  // First try with 'id' column (most common in newer Supabase setups)
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_active, full_name, email, phone, last_active_at, created_at, updated_at")
    .eq("id", userId)
    .single();

  // If that fails, try with 'user_id' column (older setups)
  if (error && error.message?.includes('0 rows')) {
    const { data: profileById, error: errorById } = await supabase
      .from("profiles")
      .select("role, is_active, full_name, email, phone, last_active_at, created_at, updated_at")
      .eq("user_id", userId)
      .single();
    
    profile = profileById;
    error = errorById;
  }

  return { data: profile, error };
}

/**
 * Update user profile, handling both 'id' and 'user_id' column names
 */
export async function updateUserProfile(
  supabase: SupabaseClient, 
  userId: string, 
  updates: Record<string, any>
) {
  // First try with 'id' column
  let { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  // If that fails (0 rows updated), try with 'user_id' column
  if (error?.message?.includes('0 rows') || (!error && updates)) {
    const { error: errorById } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    
    error = errorById;
  }

  return { error };
}

/**
 * Get all profiles with pagination and filtering
 */
export async function getProfiles(
  supabase: SupabaseClient,
  options: {
    page: number;
    limit: number;
    search?: string;
    roleFilter?: string;
    statusFilter?: string;
  }
) {
  const { page, limit, search, roleFilter, statusFilter } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      is_active,
      last_active_at,
      created_at,
      updated_at
    `, { count: 'exact' });

  // Apply filters
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  if (statusFilter === "active") {
    query = query.eq("is_active", true);
  } else if (statusFilter === "inactive") {
    query = query.eq("is_active", false);
  }

  // Apply pagination
  const { data: users, error, count } = await query
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  return { data: users, error, count };
}
