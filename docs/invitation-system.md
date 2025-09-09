# Invitation System Documentation

## Overview

The invitation system allows role-based user management with different workflows for Admins, Moderators, and Viewers. Currently running in **MOCK MODE** for development and testing.

## Features

### Role-Based Access Control

- **Admin**: Can directly invite users, approve/reject moderator requests
- **Moderator**: Can request to invite users (requires admin approval)
- **Viewer**: Cannot invite users (shows permission message)

### Invitation Statuses

- `inviting`: Moderator request pending admin approval
- `invited`: Admin-approved invitation sent to user
- `accepted`: User has completed signup
- `rejected`: Admin rejected the invitation
- `expired`: Invitation token has expired

## Mock Mode vs Real Mode

### Current State: Mock Mode
- All data stored in-memory
- Email sending logged to console
- No database writes
- Perfect for development and testing

### Future State: Real Mode
- Data stored in Supabase database
- Real email sending via SMTP/Resend
- Full audit trail and persistence

## How to Use

### 1. Add New User (Admin)
1. Click "Add New User" button
2. Fill in name, email, and role
3. Click "Create Invitation"
4. User receives invitation email (logged to console in mock mode)
5. User appears in table with "Invited" status

### 2. Add New User (Moderator)
1. Click "Add New User" button
2. Fill in name, email, and role
3. Click "Create Invitation"
4. Admin receives notification email (logged to console in mock mode)
5. User appears in table with "Inviting" status
6. Admin can approve (✓) or reject (✗) the request

### 3. Add New User (Viewer)
1. Click "Add New User" button
2. See permission denied message
3. Cannot create invitations

## API Endpoints

### POST /api/invitations/create
Creates a new invitation based on user role.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "viewer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation email sent to john@example.com",
  "invite": { ... }
}
```

### POST /api/invitations/approve
Approves a pending invitation (Admin only).

**Request:**
```json
{
  "id": "invite-id"
}
```

### POST /api/invitations/reject
Rejects a pending invitation (Admin only).

**Request:**
```json
{
  "id": "invite-id"
}
```

## Switching to Real Mode

### 1. Environment Variables
Add to `.env.local`:
```bash
INVITES_MOCK_MODE=false
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
# OR
RESEND_API_KEY=your-resend-key
```

### 2. Database Setup
Run the SQL migration:
```bash
psql -h your-db-host -U your-user -d your-db -f scripts/019_create_invitations_table.sql
```

### 3. Update Code
The system will automatically detect `INVITES_MOCK_MODE=false` and switch to real database operations.

## File Structure

```
lib/
├── types/admin.ts                 # Shared TypeScript types
├── invitations.ts                 # Email templates and utilities
└── admin/
    └── mockInviteStore.ts         # In-memory data store

components/admin/
├── AddUserButton.tsx              # Main button component
└── AddUserModal.tsx               # Modal with role-based forms

app/api/invitations/
├── create/route.ts                # Create invitation endpoint
├── approve/route.ts               # Approve invitation endpoint
└── reject/route.ts                # Reject invitation endpoint

scripts/
└── 019_create_invitations_table.sql  # Database migration

tests/admin/
└── invitations.test.ts            # Unit tests
```

## Testing

### Unit Tests
```bash
npm test tests/admin/invitations.test.ts
```

### Manual Testing
1. Login as different user roles
2. Test invitation creation flows
3. Test approval/rejection workflows
4. Check console logs for email content

## Email Templates

### User Invitation
**Subject:** `Welcome to the team, {name}!`
**Body:**
```
Welcome to the team {name}!
Please follow this link to sign up: {origin}/auth/signup?invite={token}
```

### Admin Request
**Subject:** `Moderator {modName} requested to invite {name}`
**Body:**
```
Moderator {modName} has requested to invite {name} ({email}).
Please review in User Management: {origin}/admin/users
```

## Future Enhancements

- [ ] Email template customization
- [ ] Bulk invitation support
- [ ] Invitation expiration handling
- [ ] Advanced role permissions
- [ ] Audit logging
- [ ] Email delivery tracking
