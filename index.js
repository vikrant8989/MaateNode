const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();
const admin = require('../backend/config/firebase'); 
console.log('✅ [SERVER] Firebase initialized successfully');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = require('./config/database');
let firebaseInitialized = false;

// Initialize Firebase for serverless if not already done
const initializeFirebaseForServerless = () => {
  if (!firebaseInitialized) {
    console.log('🔥 [SERVERLESS] Initializing Firebase for serverless environment...');
    try {
      // Firebase is already initialized above, just verify it's working
      const auth = admin.auth();
      console.log('✅ [SERVERLESS] Firebase Auth verified successfully');
      firebaseInitialized = true;
    } catch (error) {
      console.error('❌ [SERVERLESS] Firebase initialization error:', error);
      throw error;
    }
  }
};
// Import routes with error handling
let adminRoutes, adminRestaurantRoutes, adminUserRoutes, adminUserActivityRoutes, adminUserAddressRoutes, adminUserPaymentRoutes, adminUserSubscriptionRoutes, adminUserOrderHistoryRoutes, adminUserProfileRoutes, adminUserReviewRoutes, adminDriverRoutes, adminRestaurantPlanRoutes, adminRestaurantOfferRoutes, adminRestaurantItemRoutes, adminRestaurantCategoryRoutes, adminRestaurantReviewRoutes, adminOrderRoutes, userRoutes, userPlanRoutes, restaurantRoutes, restaurantItemRoutes, restaurantCategoryRoutes, restaurantPlanRoutes, restaurantOfferRoutes, driverRoutes, orderRoutes, reviewRoutes;

try {
  // Admin routes
  adminRoutes = require('./admin/routes/adminRoutes');
  adminRestaurantRoutes = require('./admin/routes/restaurantRoutes/restaurantRoutes');
  
  // Admin user management routes
  adminUserRoutes = require('./admin/routes/userRoutes/userRoutes'); // Fixed the problematic routes
  adminUserActivityRoutes = require('./admin/routes/userRoutes/activityRoutes');
  adminUserAddressRoutes = require('./admin/routes/userRoutes/addressRoutes');
  adminUserPaymentRoutes = require('./admin/routes/userRoutes/paymentRoutes');
  adminUserSubscriptionRoutes = require('./admin/routes/userRoutes/subscriptionRoutes');
  adminUserOrderHistoryRoutes = require('./admin/routes/userRoutes/orderHistoryRoutes');
  adminUserProfileRoutes = require('./admin/routes/userRoutes/profileRoutes');
  adminUserReviewRoutes = require('./admin/routes/userRoutes/reviewRoutes');
  
  adminDriverRoutes = require('./admin/routes/driverRoutes/driverRoutes');
  adminRestaurantPlanRoutes = require('./admin/routes/restaurantRoutes/planRoutes');
  adminRestaurantOfferRoutes = require('./admin/routes/restaurantRoutes/offerRoutes');
  adminRestaurantItemRoutes = require('./admin/routes/restaurantRoutes/itemRoutes');
  adminRestaurantCategoryRoutes = require('./admin/routes/restaurantRoutes/categoryRoutes');
  adminRestaurantReviewRoutes = require('./admin/routes/restaurantRoutes/reviewRoutes');
  adminOrderRoutes = require('./admin/routes/orderRoutes/orderRoutes');
  
  // User routes
  userRoutes = require('./user/routes/userRoutes');
  userPlanRoutes = require('./restaurant/routes/userPlanRoutes');
  
  // Restaurant routes
  restaurantRoutes = require('./restaurant/routes/restaurantRoutes');
  restaurantItemRoutes = require('./restaurant/routes/itemRoutes');
  restaurantCategoryRoutes = require('./restaurant/routes/categoryRoutes');
  restaurantPlanRoutes = require('./restaurant/routes/planRoutes');
  restaurantOfferRoutes = require('./restaurant/routes/offerRoutes');
  
  // Driver routes
  driverRoutes = require('./driver/routes/driverRoutes');
  
  // Order routes
  orderRoutes = require('./order/routes/orderRoutes');
  
  // Review routes
  reviewRoutes = require('./restaurant/routes/reviewRoutes');
  
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  process.exit(1);
}

// Route middleware
// Admin routes - organized under /api/admin with logical grouping
app.use('/api/admin', adminRoutes); // Main admin routes (auth, profile, dashboard)

// Admin restaurant management routes - specific routes must come BEFORE general restaurant routes
app.use('/api/admin/restaurants/plans', adminRestaurantPlanRoutes); // Restaurant plans management
app.use('/api/admin/restaurants/offers', adminRestaurantOfferRoutes); // Restaurant offers management
app.use('/api/admin/restaurants/items', adminRestaurantItemRoutes); // Restaurant items management
app.use('/api/admin/restaurants/categories', adminRestaurantCategoryRoutes); // Restaurant categories management
app.use('/api/admin/restaurants/reviews', adminRestaurantReviewRoutes); // Restaurant reviews management
app.use('/api/admin/restaurants', adminRestaurantRoutes); // Restaurant management - must come LAST

// Admin user management routes - organized under /api/admin/users
// More specific routes must come BEFORE the general user routes
app.use('/api/admin/users/activities', adminUserActivityRoutes); // User activities
app.use('/api/admin/users/addresses', adminUserAddressRoutes); // User addresses
app.use('/api/admin/users/payments', adminUserPaymentRoutes); // User payments
app.use('/api/admin/users/subscriptions', adminUserSubscriptionRoutes); // User subscriptions
app.use('/api/admin/users/orders', adminUserOrderHistoryRoutes); // User order history
app.use('/api/admin/users/profiles', adminUserProfileRoutes); // User profiles
app.use('/api/admin/users/reviews', adminUserReviewRoutes); // User reviews
app.use('/api/admin/users', adminUserRoutes); // Main user management - must come LAST

app.use('/api/admin/drivers', adminDriverRoutes); // Driver management
app.use('/api/admin/orders', adminOrderRoutes); // Order management

// User routes
app.use('/api/user/cart', require('./user/routes/cartRoutes')); // Cart routes must come BEFORE general user routes
app.use('/api/user', userRoutes);
app.use('/api/user/plans', userPlanRoutes);

// Restaurant routes
app.use('/api/restaurant/items', restaurantItemRoutes);
app.use('/api/restaurant/categories', restaurantCategoryRoutes);
app.use('/api/restaurant/plans', restaurantPlanRoutes);
app.use('/api/restaurant/offers', restaurantOfferRoutes);
app.use('/api/restaurant', restaurantRoutes);

// Driver routes
app.use('/api/driver', driverRoutes);

// Order and review routes
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Maate API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Maate API',
    version: '1.0.0',
    endpoints: {
      admin: {
        main: '/api/admin',
        restaurants: '/api/admin/restaurants',
        users: {
          main: '/api/admin/users', // Now working after fixing the routes
          activities: '/api/admin/users/activities',
          addresses: '/api/admin/users/addresses',
          payments: '/api/admin/users/payments',
          subscriptions: '/api/admin/users/subscriptions',
          orders: '/api/admin/users/orders',
          profiles: '/api/admin/users/profiles',
          reviews: '/api/admin/users/reviews'
        },
        drivers: '/api/admin/drivers',
        orders: '/api/admin/orders',
        'restaurant-plans': '/api/admin/restaurants/plans',
        'restaurant-offers': '/api/admin/restaurants/offers',
        'restaurant-items': '/api/admin/restaurants/items',
        'restaurant-categories': '/api/admin/restaurants/categories',
        'restaurant-reviews': '/api/admin/restaurants/reviews'
      },
      user: '/api/user',
      restaurant: '/api/restaurant',
      driver: '/api/driver',
      orders: '/api/orders',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
const startServer = async () => {
  try {
    const auth = admin.auth();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();

const handler = async (req, res) => {
  initializeFirebaseForServerless();
  // Connect to database on each request (serverless)
  await connectDB();
  
  return app(req, res);
};
module.exports = handler;