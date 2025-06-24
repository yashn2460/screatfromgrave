# Admin API Documentation

This document describes the Admin API endpoints for the Afternote application.

## Overview

The Admin API provides authentication and management functionality for administrators with the following features:
- Admin registration
- Admin login
- Password change
- Profile management

## Base URL

```
http://localhost:5000/api/admin
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Admin Register

**POST** `/api/admin/register`

Register a new admin account.

**Request Body:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400` - Missing required fields or admin already exists
- `500` - Server error

### 2. Admin Login

**POST** `/api/admin/login`

Authenticate an admin user.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

### 3. Change Password

**PUT** `/api/admin/change-password`

Change the admin's password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Missing fields or invalid new password
- `401` - Invalid current password
- `404` - Admin not found
- `500` - Server error

### 4. Get Admin Profile

**GET** `/api/admin/profile`

Get the current admin's profile information (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Invalid or missing token
- `404` - Admin not found
- `500` - Server error

## Data Models

### Admin Schema

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, min 6 characters),
  createdAt: Date (auto-generated),
  lastLogin: Date (auto-updated)
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Authentication**: Secure token-based authentication
3. **Input Validation**: Comprehensive validation for all inputs
4. **Error Handling**: Proper error responses without exposing sensitive information

## Testing

Run the test script to verify all endpoints:

```bash
node test-admin.js
```

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:5000/api-docs
```

## Environment Variables

Make sure the following environment variables are set:

```env
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-connection-string
```

## Example Usage

### Using cURL

**Register an admin:**
```bash
curl -X POST http://localhost:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Admin",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Get profile (with token):**
```bash
curl -X GET http://localhost:5000/api/admin/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Change password:**
```bash
curl -X PUT http://localhost:5000/api/admin/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "securepassword123",
    "newPassword": "newsecurepassword456"
  }'
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/admin';

// Register
const registerResponse = await axios.post(`${BASE_URL}/register`, {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'password123'
});

const token = registerResponse.data.token;

// Get profile
const profileResponse = await axios.get(`${BASE_URL}/profile`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Change password
await axios.put(`${BASE_URL}/change-password`, {
  currentPassword: 'password123',
  newPassword: 'newpassword456'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
``` 