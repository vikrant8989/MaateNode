# Plan API Documentation

This document describes the API endpoints for managing meal plans in the Maate application.

## Base URL
```
/api/restaurant/plans
```

## Authentication
All endpoints require restaurant authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Plan
**POST** `/api/restaurant/plans`

Create a new meal plan.

**Request Body:**
```json
{
  "name": "Weekly Vegetarian Plan",
  "description": "Healthy vegetarian meals for the entire week",
  "pricePerWeek": 1200,
  "originalPrice": 1500,
  "discountPercentage": 20,
  "features": [
    {
      "name": "Fresh Ingredients",
      "description": "All ingredients are fresh and locally sourced",
      "isActive": true
    }
  ],
  "weeklyMeals": {
    "monday": {
      "breakfast": {
        "name": "Oatmeal with Fruits",
        "description": "Healthy breakfast with fresh fruits",
        "calories": 300,
        "item": "item_id_here"
      },
      "lunch": {
        "name": "Vegetable Curry",
        "description": "Spicy vegetable curry with rice",
        "calories": 450,
        "item": "item_id_here"
      },
      "dinner": {
        "name": "Dal Khichdi",
        "description": "Light and nutritious dinner",
        "calories": 350,
        "item": "item_id_here"
      }
    }
  },
  "isRecommended": true,
  "isPopular": false,
  "maxSubscribers": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "_id": "plan_id",
    "name": "Weekly Vegetarian Plan",
    "description": "Healthy vegetarian meals for the entire week",
    "pricePerWeek": 1200,
    "originalPrice": 1500,
    "discountPercentage": 20,
    "status": "draft",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Plans
**GET** `/api/restaurant/plans`

Retrieve all plans for the authenticated restaurant with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (draft, active, inactive, archived)
- `isActive` (optional): Filter by active status (true/false)
- `isRecommended` (optional): Filter by recommended status (true/false)
- `isPopular` (optional): Filter by popular status (true/false)
- `search` (optional): Search in name and description

**Example:**
```
GET /api/restaurant/plans?page=1&limit=10&status=active&search=vegetarian
```

**Response:**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": {
    "docs": [
      {
        "_id": "plan_id",
        "name": "Weekly Vegetarian Plan",
        "description": "Healthy vegetarian meals",
        "pricePerWeek": 1200,
        "status": "active",
        "totalSubscribers": 5,
        "averageRating": 4.5
      }
    ],
    "totalDocs": 1,
    "limit": 10,
    "page": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 3. Get Plan by ID
**GET** `/api/restaurant/plans/:id`

Retrieve a specific plan by its ID.

**Response:**
```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "_id": "plan_id",
    "name": "Weekly Vegetarian Plan",
    "description": "Healthy vegetarian meals for the entire week",
    "image": "data:image/jpeg;base64,...",
    "pricePerWeek": 1200,
    "originalPrice": 1500,
    "discountPercentage": 20,
    "features": [...],
    "weeklyMeals": {...},
    "totalSubscribers": 5,
    "totalRevenue": 6000,
    "averageRating": 4.5,
    "totalRatings": 10,
    "isRecommended": true,
    "isPopular": false,
    "status": "active",
    "isActive": true
  }
}
```

### 4. Update Plan
**PUT** `/api/restaurant/plans/:id`

Update an existing plan.

**Request Body:** (Same as create, but all fields are optional)

**Response:**
```json
{
  "success": true,
  "message": "Plan updated successfully",
  "data": {
    "_id": "plan_id",
    "name": "Updated Plan Name",
    "pricePerWeek": 1300,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Delete Plan
**DELETE** `/api/restaurant/plans/:id`

Delete a plan (only if it has no active subscribers).

**Response:**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

### 6. Toggle Plan Status
**PUT** `/api/restaurant/plans/:id/toggle-status`

Toggle between active and inactive status.

**Response:**
```json
{
  "success": true,
  "message": "Plan status updated successfully",
  "data": {
    "_id": "plan_id",
    "status": "inactive"
  }
}
```

### 7. Update Meal
**PUT** `/api/restaurant/plans/:id/meals/:day/:mealType`

Update a specific meal for a day and meal type.

**Path Parameters:**
- `day`: sunday, monday, tuesday, wednesday, thursday, friday, saturday
- `mealType`: breakfast, lunch, dinner

**Request Body:**
```json
{
  "name": "Updated Meal Name",
  "description": "Updated meal description",
  "calories": 400,
  "item": "item_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meal updated successfully",
  "data": {
    "_id": "plan_id",
    "weeklyMeals": {
      "monday": {
        "breakfast": {
          "name": "Updated Meal Name",
          "description": "Updated meal description",
          "calories": 400,
          "item": "item_id_here"
        }
      }
    }
  }
}
```

### 8. Upload Plan Image
**POST** `/api/restaurant/plans/:id/upload-image`

Upload an image for the plan.

**Request:** Multipart form data with `image` field

**Response:**
```json
{
  "success": true,
  "message": "Plan image uploaded successfully",
  "data": {
    "image": "data:image/jpeg;base64,..."
  }
}
```

### 9. Get Plan Statistics
**GET** `/api/restaurant/plans/stats`

Get aggregated statistics for all plans.

**Response:**
```json
{
  "success": true,
  "message": "Plan statistics retrieved successfully",
  "data": {
    "totalPlans": 5,
    "activePlans": 3,
    "draftPlans": 2,
    "totalSubscribers": 25,
    "totalRevenue": 30000,
    "averageRating": 4.2,
    "recommendedPlans": 2,
    "popularPlans": 1
  }
}
```

### 10. Update Plan Rating
**PUT** `/api/restaurant/plans/:id/rating`

Update the rating for a plan.

**Request Body:**
```json
{
  "rating": 4.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan rating updated successfully",
  "data": {
    "averageRating": 4.3,
    "totalRatings": 15
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Plan name is required and must be at least 2 characters"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Plan not found"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Error creating plan",
  "error": "Error details"
}
```

## Data Models

### Plan Schema
```javascript
{
  name: String (required),
  description: String,
  image: String (base64),
  restaurant: ObjectId (required),
  pricePerWeek: Number (required),
  originalPrice: Number,
  discountPercentage: Number,
  isActive: Boolean,
  status: String (enum: draft, active, inactive, archived),
  features: [{
    name: String,
    description: String,
    isActive: Boolean
  }],
  weeklyMeals: {
    sunday: { breakfast: Meal, lunch: Meal, dinner: Meal },
    monday: { breakfast: Meal, lunch: Meal, dinner: Meal },
    // ... other days
  },
  totalSubscribers: Number,
  totalRevenue: Number,
  averageRating: Number,
  totalRatings: Number,
  isRecommended: Boolean,
  isPopular: Boolean,
  maxSubscribers: Number,
  isAvailable: Boolean
}
```

### Meal Schema
```javascript
{
  name: String,
  description: String,
  calories: Number,
  item: ObjectId (reference to Item)
}
```

## Notes

1. All monetary values are in the smallest currency unit (e.g., paise for INR)
2. Images are stored as base64 strings
3. Ratings are on a scale of 1-5
4. Calories are stored as integers
5. The API supports pagination for list endpoints
6. All timestamps are in ISO 8601 format
7. Plan status transitions: draft → active → inactive → archived 