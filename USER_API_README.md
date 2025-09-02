# User API Documentation

## Overview
The User API provides authentication, profile management, and user-related functionality for the Maate application. It uses a single endpoint for login/signup with OTP verification.

## Base URL
```
https://api.mangiee.com/api/user
```

## Authentication Flow
The API uses a single endpoint `/auth` that handles both user registration and login:

1. **First Request**: Send phone number + user details (for new users) → Receive OTP
2. **Second Request**: Send phone number + OTP → Receive JWT token

## API Endpoints

### 1. Authentication (Login/Signup)
**POST** `/auth`

**Request Body:**
```json
{
  "phone": "9876543210",
  "firstName": "John",     // Required for new users
  "lastName": "Doe",       // Required for new users
  "email": "john@example.com",  // Optional
  "otp": "123456"          // Optional - include for login
}
```

**Response (OTP Request):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "9876543210",
    "message": "Use OTP: 123456 for testing",
    "isNewUser": true
  }
}
```

**Response (Login Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      // ... other user fields
    },
    "token": "jwt_token_here",
    "isNewUser": false
  }
}
```

### 2. Get User Profile
**GET** `/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "addresses": [],
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "profileImage": null,
    "gender": "male",
    "isActive": true,
    "lastActive": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Update User Profile
**PUT** `/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "johnsmith@example.com",
  "gender": "male",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated user profile
  }
}
```

### 4. Upload Profile Image
**POST** `/upload-image`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form data with image file
```

**Response:**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "profileImage": "base64_encoded_image"
  }
}
```

### 5. Get User Dashboard
**GET** `/dashboard`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userInfo": {
      "name": "John Doe",
      "phone": "9876543210",
      "lastActive": "2024-01-01T00:00:00.000Z"
    },
    "stats": {
      "totalAddresses": 0,
      "activeAddresses": 0
    },
    "preferences": {
      "gender": "male",
      "email": "john@example.com"
    }
  }
}
```

### 6. Logout
**POST** `/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Hardcoded OTP
For testing purposes, the OTP is hardcoded to `123456`. This should be replaced with a proper SMS service in production.

## Error Responses
All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (account blocked/deactivated)
- `404` - Not Found
- `500` - Internal Server Error

## Testing
Use the provided test script to verify API functionality:

```bash
node test-user-api.js
```

## Security Notes
- JWT tokens expire in 24 hours by default
- OTP expires in 10 minutes
- Phone numbers are validated for 10-digit format
- All user inputs are sanitized and validated
- Profile images are converted to base64 for storage

## Debugging
The API includes comprehensive console logging with emojis for easy debugging:
- 🚀 Request received
- 🔍 Database lookups
- ✅ Success operations
- ❌ Error conditions
- 📱 OTP operations
- 👤 Profile operations
- 📊 Dashboard operations
- �� Logout operations
