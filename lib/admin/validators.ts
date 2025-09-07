/**
 * Admin User Management Validators
 * 
 * Zod schemas for client-side validation that match future Supabase constraints.
 */

import { z } from 'zod';

// Phone number validation - supports international formats
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const userRoleSchema = z.enum(['viewer', 'moderator', 'admin'], {
  errorMap: () => ({ message: 'Role must be viewer, moderator, or admin' })
});

export const userUpdateInputSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .nullable()
    .optional(),
  
  phone: z.string()
    .regex(phoneRegex, 'Phone number must be in valid international format (e.g., +1234567890)')
    .nullable()
    .optional(),
  
  role: userRoleSchema.optional(),
  
  prevUpdatedAt: z.string()
    .min(1, 'Previous updated timestamp is required for concurrency control')
});

export const userCreateInputSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .nullable()
    .optional(),
  
  phone: z.string()
    .regex(phoneRegex, 'Phone number must be in valid international format')
    .nullable()
    .optional(),
  
  role: userRoleSchema.default('viewer'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
});

// Validation helper functions
export function validateUserUpdate(input: unknown): { success: true; data: any } | { success: false; errors: string[] } {
  try {
    const data = userUpdateInputSchema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

export function validateUserCreate(input: unknown): { success: true; data: any } | { success: false; errors: string[] } {
  try {
    const data = userCreateInputSchema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}
