# Super Admin Setup Documentation

This document explains the automatic super admin creation system for the Afternote application.

## Overview

The system automatically creates a default super admin account if no admin exists in the database. This ensures that there's always at least one admin account available for system management.

## Default Super Admin Credentials

When no admin exists, the system automatically creates a super admin with these credentials:

- **Email**: `superadmin@afternote.com`
- **Password**: `SuperAdmin@123`
- **Name**: `Super Admin`

⚠️ **Important**: Change the default password immediately after first login!

## Automatic Setup

### Server Startup
The super admin is automatically created when the server starts if no admin exists. You'll see these messages in the console:

```
Connected to MongoDB successfully
Checking for existing admins...
No admin found. Creating default super admin...
✅ Super Admin created successfully!
📧 Email: superadmin@afternote.com
🔑 Password: SuperAdmin@123
⚠️  Please change the password after first login!
🔗 Login URL: http://localhost:5000/api-docs
```

### Manual Setup Script

You can also create super admins manually using the provided script:

```bash
# Navigate to the scripts directory
cd scripts

# Create default super admin
node createSuperAdmin.js default

# Create custom super admin
node createSuperAdmin.js custom "John Admin" "john@example.com" "password123"

# View admin statistics
node createSuperAdmin.js stats
```

## API Endpoints for Super Admin

Once logged in, the super admin can access all admin endpoints:

### Authentication
- `POST /api/admin/register` - Register new admin
- `POST /api/admin/login` - Admin login
- `PUT /api/admin/change-password` - Change password
- `GET /api/admin/profile` - Get admin profile

### Dashboard
- `GET /api/admin/dashboard/overview` - Dashboard overview
- `GET /api/admin/dashboard/user-analytics` - User analytics
- `GET /api/admin/dashboard/video-analytics` - Video analytics
- `GET /api/admin/dashboard/system-health` - System health
- `GET /api/admin/dashboard/recent-activity` - Recent activity
- `GET /api/admin/dashboard/user-management` - User management

### Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/video-messages` - List all video messages
- `GET /api/admin/recipients` - List all recipients
- `GET /api/admin/trusted-contacts` - List all trusted contacts
- `GET /api/admin/users/:userId` - Get user details

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Minimum password length of 6 characters
- Passwords are never stored in plain text

### Authentication
- JWT token-based authentication
- Tokens expire after 7 days
- Secure token verification

### Access Control
- All admin endpoints require authentication
- Admin-only access to sensitive operations
- Proper error handling without exposing sensitive information

## First Time Setup

### 1. Start the Server
```bash
npm start
# or
node server.js
```

### 2. Check Console Output
Look for the super admin creation message in the console.

### 3. Login to Admin Panel
- Go to: `http://localhost:5000/api-docs`
- Use the default credentials:
  - Email: `superadmin@afternote.com`
  - Password: `SuperAdmin@123`

### 4. Change Default Password
Immediately change the default password using the change password endpoint:
```bash
curl -X PUT http://localhost:5000/api/admin/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "SuperAdmin@123",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

## Environment Variables

Make sure these environment variables are set:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/afternote

# JWT Secret
JWT_SECRET=your-secret-key

# Server Port
PORT=5000
```

## Troubleshooting

### No Super Admin Created
If the super admin is not created automatically:

1. Check MongoDB connection
2. Verify the database is accessible
3. Run the manual setup script:
   ```bash
   node scripts/createSuperAdmin.js default
   ```

### Can't Login
If you can't login with the default credentials:

1. Check if the admin was created successfully
2. Verify the email and password
3. Check for any console errors
4. Use the stats command to verify admin exists:
   ```bash
   node scripts/createSuperAdmin.js stats
   ```

### Password Reset (Emergency)
For emergency password reset:

```javascript
const { resetSuperAdminPassword } = require('./utils/superAdminSetup');

// Reset password for specific admin
await resetSuperAdminPassword('superadmin@afternote.com', 'NewPassword123!');
```

## Best Practices

### Security
1. **Always change the default password** immediately after first login
2. **Use strong passwords** with a mix of letters, numbers, and special characters
3. **Keep JWT_SECRET secure** and unique for each environment
4. **Regular password updates** for admin accounts
5. **Monitor admin access** through logs

### Management
1. **Create additional admin accounts** for team members
2. **Use different admin accounts** for different purposes
3. **Regular backup** of admin data
4. **Monitor system health** through dashboard
5. **Keep admin contact information** updated

### Development
1. **Use different credentials** for development and production
2. **Test admin functionality** thoroughly
3. **Document any custom admin setup** procedures
4. **Version control** admin setup scripts
5. **Regular security audits** of admin access

## API Documentation

For complete API documentation, visit:
```
http://localhost:5000/api-docs
```

This interactive documentation includes all admin endpoints with examples and testing capabilities. 