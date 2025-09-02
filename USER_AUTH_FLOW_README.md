# User Authentication Flow Documentation

## Overview
The user authentication system now uses the `isProfile` field to determine user routing after successful OTP verification.

## Authentication Flow

### 1. Initial Authentication (Phone + OTP)
- **Endpoint**: `POST /api/user/auth`
- **Required**: Only `phone` number
- **OTP**: Automatically set to `123456` (hardcoded for testing)

### 2. User Routing Logic
After successful OTP verification, the system checks the `isProfile` field:

#### If `isProfile` is `false`:
- **Action**: User is sent to **Personal Info/Profile Completion** screen
- **Reason**: Profile is incomplete (missing firstName, lastName, etc.)
- **Route**: `/(user)/personalinfo`

#### If `isProfile` is `true`:
- **Action**: User is sent to **Dashboard**
- **Reason**: Profile is complete
- **Route**: `/(user)`

## User Model Fields

### Required Fields (for initial auth):
- `phone` (10 digits)

### Optional Fields (collected during profile completion):
- `firstName`
- `lastName`
- `email`
- `dateOfBirth`
- `gender`
- `address`, `city`, `state`, `pincode`
- `profileImage`

### Status Fields:
- `isVerified`: Set to `true` after OTP verification
- `isProfile`: Set to `true` when profile is complete
- `isActive`: Account status

## API Responses

### Send OTP Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "9876543210",
    "message": "Use OTP: 123456 for testing",
    "isNewUser": true,
    "needsProfileCompletion": true
  }
}
```

### Verify OTP Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user profile data */ },
    "token": "jwt_token_here",
    "isNewUser": true,
    "needsProfileCompletion": true
  }
}
```

## Profile Completion

### Automatic Profile Marking:
When a user updates their profile via `PUT /api/user/profile`:
- If `firstName` and `lastName` are provided
- AND `isProfile` is currently `false`
- THEN `isProfile` is automatically set to `true`

### Manual Profile Marking:
You can also manually mark a profile as complete:
```javascript
await user.markProfileComplete();
```

## Frontend Integration

### Navigation Logic:
```typescript
if (needsProfileCompletion) {
  // Navigate to personal info/profile completion screen
  router.push("/(user)/personalinfo");
} else {
  // Navigate to user dashboard
  router.push("/(user)");
}
```

## Testing

### Test Script:
Run `node test-auth-simple.js` to test the complete flow:
1. Send OTP with phone number
2. Verify OTP
3. Check routing based on `isProfile` status

### Test Scenarios:
- **New User**: `isProfile` will be `false`, routes to personal info
- **Existing User with Complete Profile**: `isProfile` will be `true`, routes to dashboard
- **Existing User with Incomplete Profile**: `isProfile` will be `false`, routes to personal info

## Benefits

1. **Simplified Initial Auth**: Only phone number required
2. **Clear User Routing**: Based on explicit `isProfile` field
3. **Automatic Status Updates**: Profile completion automatically updates status
4. **Flexible Profile Building**: Users can complete profiles at their own pace
5. **Consistent User Experience**: Same flow for new and existing users

## Future Enhancements

- Add profile completion percentage
- Implement progressive profile building
- Add profile completion reminders
- Support for partial profile saves
