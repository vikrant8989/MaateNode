# Address CRUD API Documentation

## Base URL
```
https://api.mangiee.com/api/user
```

## Authentication
All address endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Address Schema
```javascript
{
  type: "home" | "work" | "other",  // Required, defaults to "home"
  fullAddress: "string",             // Required, max 500 characters
  city: "string",                    // Required, max 100 characters
  pincode: "string",                 // Required, 6 digits only
  isDefault: boolean,                // Optional, defaults to false
  isActive: boolean,                 // Auto-managed, defaults to true
  createdAt: "date",                 // Auto-generated
  _id: "string"                      // Auto-generated MongoDB ObjectId
}
```

## API Endpoints

### 1. Get All Addresses
**GET** `/addresses`

Get all active addresses for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "type": "home",
      "fullAddress": "123 Main Street, Apartment 4B",
      "city": "Mumbai",
      "pincode": "400001",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. Add New Address
**POST** `/addresses`

Add a new address for the authenticated user.

**Request Body:**
```json
{
  "type": "work",
  "fullAddress": "456 Business Park, Floor 2",
  "city": "Delhi",
  "pincode": "110001",
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "type": "work",
    "fullAddress": "456 Business Park, Floor 2",
    "city": "Delhi",
    "pincode": "110001",
    "isDefault": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Validation Rules:**
- `fullAddress`: Required, max 500 characters
- `city`: Required, max 100 characters
- `pincode`: Required, exactly 6 digits
- `type`: Optional, must be "home", "work", or "other" (defaults to "home")
- `isDefault`: Optional boolean (defaults to false)

### 3. Get Address by ID
**GET** `/addresses/:addressId`

Get a specific address by its ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "type": "home",
    "fullAddress": "123 Main Street, Apartment 4B",
    "city": "Mumbai",
    "pincode": "400001",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Address
**PUT** `/addresses/:addressId`

Update an existing address.

**Request Body:**
```json
{
  "city": "New Delhi",
  "pincode": "110002",
  "isDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "type": "home",
    "fullAddress": "123 Main Street, Apartment 4B",
    "city": "New Delhi",
    "pincode": "110002",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notes:**
- Only provide the fields you want to update
- If setting `isDefault: true`, all other addresses will automatically become non-default
- `_id`, `createdAt`, and `isActive` cannot be updated

### 5. Delete Address
**DELETE** `/addresses/:addressId`

Soft delete an address (sets `isActive: false`).

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Notes:**
- Address is soft-deleted (not permanently removed)
- If the deleted address was default, another address will automatically become default
- Deleted addresses won't appear in GET requests

### 6. Set Default Address
**PUT** `/addresses/:addressId/default`

Set a specific address as the default address.

**Response:**
```json
{
  "success": true,
  "message": "Default address set successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "type": "work",
    "fullAddress": "456 Business Park, Floor 2",
    "city": "Delhi",
    "pincode": "110001",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Notes:**
- Only one address can be default at a time
- Setting a new default automatically removes default from other addresses

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Full address, city, and pincode are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Address not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error adding address",
  "error": "Detailed error message"
}
```

## Business Logic

### Default Address Management
- When adding a new address with `isDefault: true`, all existing addresses become non-default
- When setting an address as default via the `/default` endpoint, all other addresses become non-default
- When deleting a default address, the first available active address becomes default
- If no addresses exist, the first added address automatically becomes default

### Address Types
- **home**: Residential address
- **work**: Office/workplace address  
- **other**: Any other type of address

### Validation Rules
- **Pincode**: Must be exactly 6 digits (0-9)
- **Full Address**: Maximum 500 characters
- **City**: Maximum 100 characters
- **Type**: Must be one of: "home", "work", "other"

## Example Usage

### Frontend Integration
```javascript
// Get all addresses
const response = await fetch('/api/user/addresses', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Add new address
const newAddress = await fetch('/api/user/addresses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'home',
    fullAddress: '123 Main Street',
    city: 'Mumbai',
    pincode: '400001',
    isDefault: true
  })
});
```

## Testing

### Test with cURL
```bash
# Get all addresses
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.mangiee.com/api/user/addresses

# Add new address
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"home","fullAddress":"123 Test St","city":"Test City","pincode":"123456"}' \
  https://api.mangiee.com/api/user/addresses
```

## Notes
- All addresses are soft-deleted (isActive: false) rather than permanently removed
- The system automatically manages default address logic
- Address types are restricted to predefined values for consistency
- Pincode validation ensures Indian postal code format (6 digits)
