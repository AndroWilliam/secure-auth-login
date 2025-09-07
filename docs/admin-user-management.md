# Admin User Management System

## Overview

The Admin User Management system provides a comprehensive interface for managing users with role-based access control, real-time presence tracking, and optimistic concurrency control. The system is designed to be 100% compatible with future Supabase integration while currently using mock data.

## Architecture

### Core Components

- **`lib/admin/types.ts`** - TypeScript types matching future Supabase schema
- **`lib/admin/validators.ts`** - Zod schemas for client-side validation
- **`lib/admin/mockApi.ts`** - Mock API with realistic delays and error handling
- **`lib/admin/presenceMock.ts`** - Real-time presence simulation system
- **`lib/admin/test-data.ts`** - Mock user data and helpers
- **`lib/admin/queryKeys.ts`** - React Query key management

### UI Components

- **`app/admin/users/page.tsx`** - Main admin page with stats and table
- **`components/admin/AdminUsersTable.tsx`** - User table with filtering and actions
- **`components/admin/EditUserDialog.tsx`** - User editing with conflict resolution

## Features

### ✅ User Management
- **CRUD Operations**: Create, read, update, delete users
- **Role-based Access**: Admin, Moderator, Viewer permissions
- **Search & Filtering**: By name, email, role, and status
- **Pagination**: Efficient handling of large user lists

### ✅ Real-time Presence
- **Status Tracking**: Active, Idle, Inactive based on activity
- **Live Updates**: Status changes reflect immediately in UI
- **Heartbeat System**: Automatic presence updates every 30 seconds
- **Dev Controls**: Simulate idle/logout for testing

### ✅ Optimistic Concurrency
- **Conflict Detection**: Prevents overwriting concurrent changes
- **Diff Display**: Shows exactly what changed on server vs client
- **Resolution Options**: Overwrite or cancel and refresh

### ✅ Validation & Error Handling
- **Client-side Validation**: Zod schemas for all inputs
- **Server Error Handling**: Proper HTTP status codes and messages
- **User Feedback**: Toast notifications for all actions

## Usage

### Running Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to admin page:**
   ```
   http://localhost:3000/admin/users
   ```

3. **Login as admin:**
   - Email: `androa687@gmail.com`
   - Any password (mock authentication)

### Presence Simulation

In development mode, you can simulate different user states:

1. **Set User Active**: Click the ellipsis menu → "Set Active"
2. **Simulate Idle**: Click the ellipsis menu → "Simulate Idle" (last seen > 5 minutes ago)
3. **Force Logout**: Click the ellipsis menu → "Force Logout" (marks as inactive)

### Testing User Updates

1. **Open Edit Dialog**: Click the gear icon next to any user
2. **Make Changes**: Update name, phone, or role
3. **Handle Conflicts**: If another user modified the same record, you'll see a conflict dialog
4. **Resolve**: Choose to overwrite or cancel and refresh

## API Contract

### Mock API Endpoints

```typescript
// List users with filtering and pagination
GET /api/mock/admin/users?page=1&pageSize=10&search=john&roleFilter=admin&statusFilter=active

// Get single user
GET /api/mock/admin/users/{id}

// Update user with optimistic concurrency
PUT /api/mock/admin/users/{id}
{
  "full_name": "Updated Name",
  "phone": "+1234567890",
  "role": "moderator",
  "prevUpdatedAt": "2024-01-01T00:00:00.000Z"
}

// Create new user
POST /api/mock/admin/users
{
  "email": "newuser@example.com",
  "full_name": "New User",
  "phone": "+1234567890",
  "role": "viewer",
  "password": "password123"
}

// Delete user
DELETE /api/mock/admin/users/{id}
```

### Response Format

```typescript
// Success Response
{
  "ok": true,
  "data": { /* UserRow or UserListResponse */ }
}

// Error Response
{
  "ok": false,
  "status": 409,
  "error": "CONFLICT",
  "detail": {
    "server": { /* UserRow */ },
    "client": { /* UserUpdateInput */ },
    "conflicts": [
      {
        "field": "full_name",
        "serverValue": "Server Name",
        "clientValue": "Client Name"
      }
    ]
  }
}
```

## Supabase Readiness

### Database Schema

When ready to integrate with Supabase, use this schema:

```sql
-- User roles enum
CREATE TYPE user_role AS ENUM ('viewer', 'moderator', 'admin');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User presence table
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_logout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User management view
CREATE VIEW user_management_view AS
SELECT 
  u.id,
  u.email,
  p.display_name as full_name,
  p.phone_number as phone,
  p.role,
  CASE 
    WHEN up.last_logout_at IS NOT NULL THEN 'inactive'
    WHEN up.last_seen < NOW() - INTERVAL '30 minutes' THEN 'inactive'
    WHEN up.last_seen < NOW() - INTERVAL '5 minutes' THEN 'idle'
    ELSE 'active'
  END as status,
  u.created_at,
  p.updated_at,
  up.last_seen,
  up.last_logout_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_presence up ON u.id = up.user_id;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Presence policies
CREATE POLICY "Users can view all presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update own presence" ON user_presence FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can manage presence" ON user_presence FOR ALL USING (true);
```

### Migration Steps

1. **Replace Mock API Calls:**
   ```typescript
   // TODO(API): Replace mockApi.listUsers with GET /api/admin/users
   // TODO(API): Replace mockApi.updateUser with PATCH /api/admin/users/[id]
   // TODO(API): Replace presenceMock with Realtime presence (heartbeat + logout)
   ```

2. **Update API Routes:**
   - Create `/api/admin/users/route.ts` using Supabase client
   - Create `/api/admin/users/[id]/route.ts` for individual operations
   - Implement real-time presence with Supabase Realtime

3. **Add Authentication:**
   - Use Supabase Auth for user authentication
   - Implement proper role-based access control
   - Add session management

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run specific test file
npm test tests/admin/presence.test.ts
```

### E2E Tests

```bash
# Run E2E tests (when implemented)
npm run test:e2e
```

### Test Scenarios

1. **User CRUD Operations**
   - Create user with valid data
   - Update user with conflict resolution
   - Delete user (with admin protection)

2. **Presence System**
   - Status computation based on timestamps
   - Real-time status updates
   - Heartbeat functionality

3. **Validation**
   - Form validation with Zod
   - API error handling
   - Conflict resolution UI

## Development Notes

### TODOs for Supabase Integration

- [ ] Replace `mockApi.listUsers` with Supabase query
- [ ] Replace `mockApi.updateUser` with Supabase update
- [ ] Replace `presenceMock` with Supabase Realtime
- [ ] Add proper authentication middleware
- [ ] Implement RLS policies
- [ ] Add database migrations
- [ ] Set up real-time subscriptions

### Performance Considerations

- **Pagination**: Large user lists are paginated (10 users per page)
- **Debounced Search**: Search input is debounced to prevent excessive API calls
- **Optimistic Updates**: UI updates immediately, then syncs with server
- **Efficient Re-renders**: Only affected components re-render on status changes

### Security Features

- **Input Validation**: All inputs validated with Zod schemas
- **Role-based Access**: Different permissions for admin/moderator/viewer
- **Conflict Prevention**: Optimistic concurrency prevents data loss
- **XSS Protection**: All user inputs are properly escaped
- **CSRF Protection**: API calls include proper authentication headers

## Troubleshooting

### Common Issues

1. **"Update User" button not working**
   - Check browser console for API errors
   - Verify mock API endpoints are accessible
   - Ensure proper authentication

2. **Status not updating in real-time**
   - Check if presence system is initialized
   - Verify heartbeat is running
   - Check browser console for subscription errors

3. **Conflict dialog not showing**
   - Ensure `prevUpdatedAt` is being passed correctly
   - Check if another user modified the same record
   - Verify conflict detection logic

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables. This will show:
- API call logs
- Presence system events
- Validation errors
- Conflict detection details
