const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Restaurant = require('../restaurant/modal/restaurant');
const Plan = require('../restaurant/modal/plan');

// MongoDB connection
const connectDB = require('../config/database');

const checkRestaurantStatus = async () => {
  try {
    console.log('🔍 [RESTAURANT_CHECK] Starting restaurant status check...');
    
    // Connect to database
    await connectDB();
    console.log('✅ [RESTAURANT_CHECK] Database connected successfully');
    
    // Check the specific restaurant from logs
    const restaurantId = '68a1d78c24d596276ade8612';
    console.log('🔍 [RESTAURANT_CHECK] Checking restaurant ID:', restaurantId);
    
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      console.log('❌ [RESTAURANT_CHECK] Restaurant not found!');
      return;
    }
    
    console.log('✅ [RESTAURANT_CHECK] Restaurant found:', restaurant.businessName);
    console.log('📊 [RESTAURANT_CHECK] Restaurant details:');
    console.log('   - ID:', restaurant._id);
    console.log('   - Name:', restaurant.businessName);
    console.log('   - isApproved:', restaurant.isApproved);
    console.log('   - isActive:', restaurant.isActive);
    console.log('   - Category:', restaurant.category);
    console.log('   - City:', restaurant.city);
    console.log('   - State:', restaurant.state);
    
    // Check if restaurant meets plan API requirements
    if (!restaurant.isApproved) {
      console.log('⚠️ [RESTAURANT_CHECK] Restaurant is NOT approved! This will cause plan API to fail.');
    }
    
    if (!restaurant.isActive) {
      console.log('⚠️ [RESTAURANT_CHECK] Restaurant is NOT active! This will cause plan API to fail.');
    }
    
    if (restaurant.isApproved && restaurant.isActive) {
      console.log('✅ [RESTAURANT_CHECK] Restaurant meets all requirements for plan API.');
    }
    
    // Check existing plans
    const existingPlans = await Plan.find({ restaurant: restaurant._id });
    console.log('📋 [RESTAURANT_CHECK] Existing plans:', existingPlans.length);
    
    if (existingPlans.length > 0) {
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name} (ID: ${plan._id}) - Active: ${plan.isActive}, Available: ${plan.isAvailable}`);
      });
    } else {
      console.log('⚠️ [RESTAURANT_CHECK] No plans found for this restaurant.');
    }
    
    // List all restaurants for reference
    console.log('\n📋 [RESTAURANT_CHECK] All restaurants in system:');
    const allRestaurants = await Restaurant.find({}).select('businessName isApproved isActive city state');
    allRestaurants.forEach((r, index) => {
      console.log(`   ${index + 1}. ${r.businessName} - Approved: ${r.isApproved}, Active: ${r.isActive}, Location: ${r.city}, ${r.state}`);
    });
    
  } catch (error) {
    console.error('❌ [RESTAURANT_CHECK] Error checking restaurant status:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 [RESTAURANT_CHECK] Database connection closed');
    process.exit(0);
  }
};

// Run the script
checkRestaurantStatus();
