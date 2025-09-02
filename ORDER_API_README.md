# Order API Documentation

## Overview
The Order API provides comprehensive order management functionality for the Maate food delivery platform. It handles order creation, status updates, cancellation, and retrieval with support for pagination and filtering.

## Base URL
```
https://api.mangiee.com/api/orders
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Create Order from Cart
**POST** `/create-from-cart`

Creates an order from the user's cart items.

**Request Body:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "restaurantId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "specialInstructions": "Extra spicy, no onions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "64f1a2b3c4d5e6f7a8b9c0d3",
    "orderNumber": "ORD123456789",
    "status": "pending",
    "totalAmount": 450.75
  }
}
```

### 2. Create Custom Order
**POST** `/create-custom`

Creates a custom order with specified items.

**Request Body:**
```json
{
  "customer": "64f1a2b3c4d5e6f7a8b9c0d1",
  "customerName": "John Doe",
  "restaurant": "64f1a2b3c4d5e6f7a8b9c0d2",
  "restaurantName": "Pizza Hut",
  "items": [
    {
      "itemId": "64f1a2b3c4d5e6f7a8b9c0d4",
      "name": "Margherita Pizza",
      "price": 299.99,
      "quantity": 2,
      "category": "Food"
    }
  ],
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001"
  },
  "estimatedDelivery": "20-25 min"
}
```

### 3. Get All Orders
**GET** `/`

Retrieves all orders with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status
- `customer` (optional): Filter by customer ID
- `restaurant` (optional): Filter by restaurant ID
- `startDate` (optional): Filter orders from date (YYYY-MM-DD)
- `endDate` (optional): Filter orders to date (YYYY-MM-DD)
- `sortBy` (optional): Sort field (default: orderDate)
- `sortOrder` (optional): Sort order - 'asc' or 'desc' (default: desc)

**Example:**
```
GET /api/orders?page=1&limit=20&status=pending&sortBy=orderDate&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 4. Get Order by ID
**GET** `/:orderId`

Retrieves a specific order by its ID.

**Response:**
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "orderNumber": "ORD123456789",
    "customer": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "restaurant": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Pizza Hut"
    },
    "items": [...],
    "status": "pending",
    "totalAmount": 450.75,
    "deliveryAddress": {...},
    "orderTime": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Get Orders by Customer
**GET** `/customer/:customerId`

Retrieves all orders for a specific customer.

**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /api/orders/customer/64f1a2b3c4d5e6f7a8b9c0d1?status=completed&page=1&limit=15
```

### 6. Get Orders by Restaurant
**GET** `/restaurant/:restaurantId`

Retrieves all orders for a specific restaurant.

**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### 7. Update Order Status
**PATCH** `/:orderId/status`

Updates the status of an order.

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending` - Order received
- `confirmed` - Restaurant accepted
- `preparing` - Food being prepared
- `ready` - Food ready for pickup
- `delivered` - Order delivered
- `cancelled` - Order cancelled

### 8. Cancel Order
**PATCH** `/:orderId/cancel`

Cancels an order with a reason.

**Request Body:**
```json
{
  "reason": "Changed my mind",
  "cancelledBy": "customer"
}
```

**Valid CancelledBy Values:**
- `customer` - Cancelled by customer
- `restaurant` - Cancelled by restaurant
- `system` - Cancelled by system

### 9. Delete Order
**DELETE** `/:orderId`

Soft deletes an order (marks as archived).

### 10. Get Order Statistics
**GET** `/stats/overview`

Retrieves order statistics and analytics.

**Query Parameters:**
- `customerId` (optional): Filter by customer
- `restaurantId` (optional): Filter by restaurant
- `startDate` (optional): Start date for range
- `endDate` (optional): End date for range

**Response:**
```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "statusCounts": {
      "pending": 15,
      "confirmed": 8,
      "preparing": 5,
      "ready": 3,
      "delivered": 45,
      "cancelled": 2
    },
    "totals": {
      "totalOrders": 78,
      "totalRevenue": 12500.75,
      "avgOrderValue": 160.27
    },
    "dailyOrders": [
      {
        "_id": "2024-01-15",
        "count": 12,
        "revenue": 1850.50
      }
    ]
  }
}
```

### 11. Health Check
**GET** `/health`

Checks if the order service is running.

**Response:**
```json
{
  "success": true,
  "message": "Order service is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "Order Service"
}
```

## Order Data Structure

### Order Schema
```javascript
{
  // Order Identification
  orderNumber: String,        // Required, unique
  orderDate: Date,           // Required
  
  // Customer Information
  customer: ObjectId,        // Required, ref: User
  customerName: String,      // Required
  
  // Restaurant Information
  restaurant: ObjectId,      // Required, ref: Restaurant
  restaurantName: String,    // Required
  
  // Order Items
  items: [OrderItem],        // Required
  
  // Pricing
  subtotal: Number,          // Required
  totalAmount: Number,       // Required
  
  // Delivery Information
  deliveryAddress: {         // Required
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Time Information
  estimatedDelivery: String, // Required, default: "N/A"
  orderTime: Date,          // Required
  
  // Order Status
  status: String,            // Required, enum values
  
  // Tracking Information (Set to "N/A")
  trackingStatus: String,    // Default: "N/A"
  driverName: String,        // Default: "N/A"
  driverPhone: String,       // Default: "N/A"
  currentLocation: String,   // Default: "N/A"
  
  // Payment Information (Set to "N/A")
  paymentMethod: String,     // Default: "N/A"
  paymentStatus: String,     // Default: "N/A"
  transactionId: String,     // Default: "N/A"
  
  // Additional Fields
  specialInstructions: String,
  cancellationReason: String,
  cancelledBy: String,
  cancellationTime: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### OrderItem Schema
```javascript
{
  itemId: ObjectId,          // Required, ref: Item
  name: String,              // Required
  description: String,
  price: Number,             // Required
  quantity: Number,          // Required
  image: String,
  category: String,
  itemTotal: Number          // Required, auto-calculated
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Usage Examples

### Frontend Integration (JavaScript)
```javascript
// Create order from cart
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders/create-from-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Order created:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get user orders
const getUserOrders = async (userId, status = null) => {
  try {
    let url = `/api/orders/customer/${userId}`;
    if (status) {
      url += `?status=${status}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};
```

### cURL Examples
```bash
# Create order from cart
curl -X POST https://api.mangiee.com/api/orders/create-from-cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "restaurantId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "deliveryAddress": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001"
    }
  }'

# Get all orders
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.mangiee.com/api/orders?page=1&limit=10&status=pending"

# Update order status
curl -X PATCH https://api.mangiee.com/api/orders/64f1a2b3c4d5e6f7a8b9c0d3/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "confirmed"}'
```

## Notes

1. **Tracking & Payment**: As requested, tracking and payment details are set to "N/A" by default
2. **Cart Integration**: Orders can be created directly from the user's cart
3. **Pagination**: All list endpoints support pagination with configurable page size
4. **Filtering**: Multiple filter options available for efficient data retrieval
5. **Soft Delete**: Orders are soft-deleted (archived) rather than permanently removed
6. **Status Management**: Comprehensive order status lifecycle management
7. **Statistics**: Built-in analytics and reporting capabilities

## Support

For API support or questions, please refer to the main project documentation or contact the development team.
