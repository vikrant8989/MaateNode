const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Plan = require('../restaurant/modal/plan');
const Restaurant = require('../restaurant/modal/restaurant');

// MongoDB connection
const connectDB = require('../config/database');

const addDemoPlans = async () => {
  try {
    console.log('🚀 [DEMO_PLANS] Starting demo plans creation...');
    
    // Connect to database
    await connectDB();
    console.log('✅ [DEMO_PLANS] Database connected successfully');
    
    // Find the restaurant (using the one from logs: 68a1d78c24d596276ade8612)
    const restaurant = await Restaurant.findById('68a1d78c24d596276ade8612');
    
    if (!restaurant) {
      console.log('❌ [DEMO_PLANS] Restaurant not found. Please create a restaurant first.');
      return;
    }
    
    console.log('✅ [DEMO_PLANS] Found restaurant:', restaurant.businessName);
    
    // Check if plans already exist
    const existingPlans = await Plan.find({ restaurant: restaurant._id });
    if (existingPlans.length > 0) {
      console.log('⚠️ [DEMO_PLANS] Plans already exist for this restaurant:', existingPlans.length);
      console.log('📋 [DEMO_PLANS] Existing plans:');
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.pricePerWeek} per week)`);
      });
      return;
    }
    
    // Demo plans data
    const demoPlans = [
      {
        name: 'Basic Plan',
        restaurant: restaurant._id,
        pricePerWeek: 440,
        features: [
          'Add Meal By your choice',
          'Customize Your Plan',
          'Weekly delivery'
        ],
        isActive: true,
        isAvailable: true,
        isPopular: false,
        isRecommended: false,
        totalWeeklyCalories: 14000,
        averageDailyCalories: 2000,
        weeklyMeals: {
          sunday: {
            breakfast: [
              { name: 'Masala Dosa', calories: 250, description: 'with coconut chutney' }
            ],
            lunch: [
              { name: 'Dal Khichdi', calories: 350, description: 'with ghee and pickle' }
            ],
            dinner: [
              { name: 'Roti Sabzi', calories: 300, description: 'with dal' }
            ]
          },
          monday: {
            breakfast: [
              { name: 'Poha', calories: 280, description: 'with peanuts and curry leaves' }
            ],
            lunch: [
              { name: 'Rice Dal', calories: 400, description: 'with papad' }
            ],
            dinner: [
              { name: 'Paratha', calories: 320, description: 'with aloo sabzi' }
            ]
          },
          tuesday: {
            breakfast: [
              { name: 'Idli Sambar', calories: 220, description: 'with coconut chutney' }
            ],
            lunch: [
              { name: 'Rajma Chawal', calories: 450, description: 'with onion salad' }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bharwa bhindi' }
            ]
          },
          wednesday: {
            breakfast: [
              { name: 'Upma', calories: 300, description: 'with vegetables' }
            ],
            lunch: [
              { name: 'Kadhi Chawal', calories: 380, description: 'with pakoda' }
            ],
            dinner: [
              { name: 'Missi Roti', calories: 260, description: 'with dal fry' }
            ]
          },
          thursday: {
            breakfast: [
              { name: 'Bread Omelette', calories: 320, description: 'with butter' }
            ],
            lunch: [
              { name: 'Chole Bhature', calories: 520, description: 'with onion salad' }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with mixed vegetables' }
            ]
          },
          friday: {
            breakfast: [
              { name: 'Aloo Paratha', calories: 380, description: 'with curd' }
            ],
            lunch: [
              { name: 'Jeera Rice', calories: 420, description: 'with dal tadka' }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bhindi masala' }
            ]
          },
          saturday: {
            breakfast: [
              { name: 'Dosa', calories: 250, description: 'with sambar' }
            ],
            lunch: [
              { name: 'Khichdi', calories: 400, description: 'with papad' }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with dal makhani' }
            ]
          }
        },
        totalSubscribers: 0,
        averageRating: 0,
        totalRatings: 0,
        maxSubscribers: 100
      },
      {
        name: 'Moderate Plan',
        restaurant: restaurant._id,
        pricePerWeek: 550,
        features: [
          'Add Meal Options',
          'Customize Your Plan',
          'Priority delivery',
          'Nutrition tracking'
        ],
        isActive: true,
        isAvailable: true,
        isPopular: true,
        isRecommended: true,
        totalWeeklyCalories: 15400,
        averageDailyCalories: 2200,
        weeklyMeals: {
          sunday: {
            breakfast: [
              { name: 'Masala Dosa', calories: 250, description: 'with coconut chutney' },
              { name: 'Filter Coffee', calories: 50 }
            ],
            lunch: [
              { name: 'Dal Khichdi', calories: 350, description: 'with ghee and pickle' },
              { name: 'Curd', calories: 80 }
            ],
            dinner: [
              { name: 'Roti Sabzi', calories: 300, description: 'with dal' },
              { name: 'Salad', calories: 40 }
            ]
          },
          monday: {
            breakfast: [
              { name: 'Poha', calories: 280, description: 'with peanuts and curry leaves' },
              { name: 'Tea', calories: 30 }
            ],
            lunch: [
              { name: 'Rice Dal', calories: 400, description: 'with papad' },
              { name: 'Raita', calories: 120 }
            ],
            dinner: [
              { name: 'Paratha', calories: 320, description: 'with aloo sabzi' },
              { name: 'Buttermilk', calories: 60 }
            ]
          },
          tuesday: {
            breakfast: [
              { name: 'Idli Sambar', calories: 220, description: 'with coconut chutney' },
              { name: 'Filter Coffee', calories: 50 }
            ],
            lunch: [
              { name: 'Rajma Chawal', calories: 450, description: 'with onion salad' },
              { name: 'Pickle', calories: 20 }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bharwa bhindi' },
              { name: 'Dal', calories: 100 }
            ]
          },
          wednesday: {
            breakfast: [
              { name: 'Upma', calories: 300, description: 'with vegetables' },
              { name: 'Tea', calories: 30 }
            ],
            lunch: [
              { name: 'Kadhi Chawal', calories: 380, description: 'with pakoda' },
              { name: 'Salad', calories: 40 }
            ],
            dinner: [
              { name: 'Missi Roti', calories: 260, description: 'with dal fry' },
              { name: 'Curd', calories: 80 }
            ]
          },
          thursday: {
            breakfast: [
              { name: 'Bread Omelette', calories: 320, description: 'with butter' },
              { name: 'Milk', calories: 120 }
            ],
            lunch: [
              { name: 'Chole Bhature', calories: 520, description: 'with onion salad' },
              { name: 'Pickle', calories: 20 }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with mixed vegetables' },
              { name: 'Dal', calories: 100 }
            ]
          },
          friday: {
            breakfast: [
              { name: 'Aloo Paratha', calories: 380, description: 'with curd' },
              { name: 'Tea', calories: 30 }
            ],
            lunch: [
              { name: 'Jeera Rice', calories: 420, description: 'with dal tadka' },
              { name: 'Raita', calories: 120 }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bhindi masala' },
              { name: 'Buttermilk', calories: 60 }
            ]
          },
          saturday: {
            breakfast: [
              { name: 'Dosa', calories: 250, description: 'with sambar' },
              { name: 'Filter Coffee', calories: 50 }
            ],
            lunch: [
              { name: 'Khichdi', calories: 400, description: 'with papad' },
              { name: 'Curd', calories: 80 }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with dal makhani' },
              { name: 'Salad', calories: 40 }
            ]
          }
        },
        totalSubscribers: 0,
        averageRating: 0,
        totalRatings: 0,
        maxSubscribers: 100
      },
      {
        name: 'Premium Plan',
        restaurant: restaurant._id,
        pricePerWeek: 660,
        features: [
          'Premium meal options',
          'Full customization',
          'Express delivery',
          'Nutrition consultation',
          'Progress monitoring'
        ],
        isActive: true,
        isAvailable: true,
        isPopular: false,
        isRecommended: true,
        totalWeeklyCalories: 16800,
        averageDailyCalories: 2400,
        weeklyMeals: {
          sunday: {
            breakfast: [
              { name: 'Masala Dosa', calories: 250, description: 'with coconut chutney' },
              { name: 'Filter Coffee', calories: 50 },
              { name: 'Fruit Bowl', calories: 80 }
            ],
            lunch: [
              { name: 'Dal Khichdi', calories: 350, description: 'with ghee and pickle' },
              { name: 'Curd', calories: 80 },
              { name: 'Papad', calories: 30 }
            ],
            dinner: [
              { name: 'Roti Sabzi', calories: 300, description: 'with dal' },
              { name: 'Salad', calories: 40 },
              { name: 'Raita', calories: 60 }
            ]
          },
          monday: {
            breakfast: [
              { name: 'Poha', calories: 280, description: 'with peanuts and curry leaves' },
              { name: 'Tea', calories: 30 },
              { name: 'Banana', calories: 90 }
            ],
            lunch: [
              { name: 'Rice Dal', calories: 400, description: 'with papad' },
              { name: 'Raita', calories: 120 },
              { name: 'Pickle', calories: 20 }
            ],
            dinner: [
              { name: 'Paratha', calories: 320, description: 'with aloo sabzi' },
              { name: 'Buttermilk', calories: 60 },
              { name: 'Salad', calories: 40 }
            ]
          },
          tuesday: {
            breakfast: [
              { name: 'Idli Sambar', calories: 220, description: 'with coconut chutney' },
              { name: 'Filter Coffee', calories: 50 },
              { name: 'Coconut Chutney', calories: 40 }
            ],
            lunch: [
              { name: 'Rajma Chawal', calories: 450, description: 'with onion salad' },
              { name: 'Pickle', calories: 20 },
              { name: 'Raita', calories: 80 }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bharwa bhindi' },
              { name: 'Dal', calories: 100 },
              { name: 'Salad', calories: 40 }
            ]
          },
          wednesday: {
            breakfast: [
              { name: 'Upma', calories: 300, description: 'with vegetables' },
              { name: 'Tea', calories: 30 },
              { name: 'Mixed Nuts', calories: 60 }
            ],
            lunch: [
              { name: 'Kadhi Chawal', calories: 380, description: 'with pakoda' },
              { name: 'Salad', calories: 40 },
              { name: 'Papad', calories: 30 }
            ],
            dinner: [
              { name: 'Missi Roti', calories: 260, description: 'with dal fry' },
              { name: 'Curd', calories: 80 },
              { name: 'Pickle', calories: 20 }
            ]
          },
          thursday: {
            breakfast: [
              { name: 'Bread Omelette', calories: 320, description: 'with butter' },
              { name: 'Milk', calories: 120 },
              { name: 'Orange Juice', calories: 70 }
            ],
            lunch: [
              { name: 'Chole Bhature', calories: 520, description: 'with onion salad' },
              { name: 'Pickle', calories: 20 },
              { name: 'Raita', calories: 80 }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with mixed vegetables' },
              { name: 'Dal', calories: 100 },
              { name: 'Salad', calories: 40 }
            ]
          },
          friday: {
            breakfast: [
              { name: 'Aloo Paratha', calories: 380, description: 'with curd' },
              { name: 'Tea', calories: 30 },
              { name: 'Mixed Fruits', calories: 70 }
            ],
            lunch: [
              { name: 'Jeera Rice', calories: 420, description: 'with dal tadka' },
              { name: 'Raita', calories: 120 },
              { name: 'Papad', calories: 30 }
            ],
            dinner: [
              { name: 'Bhakri', calories: 280, description: 'with bhindi masala' },
              { name: 'Buttermilk', calories: 60 },
              { name: 'Salad', calories: 40 }
            ]
          },
          saturday: {
            breakfast: [
              { name: 'Dosa', calories: 250, description: 'with sambar' },
              { name: 'Filter Coffee', calories: 50 },
              { name: 'Coconut Chutney', calories: 40 }
            ],
            lunch: [
              { name: 'Khichdi', calories: 400, description: 'with papad' },
              { name: 'Curd', calories: 80 },
              { name: 'Pickle', calories: 20 }
            ],
            dinner: [
              { name: 'Roti', calories: 240, description: 'with dal makhani' },
              { name: 'Salad', calories: 40 },
              { name: 'Raita', calories: 60 }
            ]
          }
        },
        totalSubscribers: 0,
        averageRating: 0,
        totalRatings: 0,
        maxSubscribers: 100
      }
    ];
    
    // Create plans
    const createdPlans = [];
    for (const planData of demoPlans) {
      const plan = new Plan(planData);
      const savedPlan = await plan.save();
      createdPlans.push(savedPlan);
      console.log(`✅ [DEMO_PLANS] Created plan: ${savedPlan.name} (ID: ${savedPlan._id})`);
    }
    
    console.log(`🎉 [DEMO_PLANS] Successfully created ${createdPlans.length} demo plans!`);
    console.log('📋 [DEMO_PLANS] Plan details:');
    createdPlans.forEach(plan => {
      console.log(`   - ${plan.name}: ₹${plan.pricePerWeek} per week`);
    });
    
    console.log('\n🚀 [DEMO_PLANS] You can now test the plan API endpoints:');
    console.log(`   GET /api/user/plans/restaurant/${restaurant._id}`);
    console.log(`   GET /api/user/plans/${createdPlans[0]._id}`);
    
  } catch (error) {
    console.error('❌ [DEMO_PLANS] Error creating demo plans:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 [DEMO_PLANS] Database connection closed');
    process.exit(0);
  }
};

// Run the script
addDemoPlans();
