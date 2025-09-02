const mongoose = require('mongoose');
const Review = require('../restaurant/modal/review');
const User = require('../user/modal/user');
const Restaurant = require('../restaurant/modal/restaurant');
const Order = require('../order/modal/order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/maate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Get a sample user, restaurant, and order
    const user = await User.findOne();
    const restaurant = await Restaurant.findOne();
    const order = await Order.findOne();
    
    if (!user || !restaurant || !order) {
      console.log('❌ Need at least one user, restaurant, and order to create reviews');
      return;
    }
    
    console.log('📝 Creating demo reviews...');
    
    // Sample review data
    const demoReviews = [
      {
        reviewDate: new Date('2024-01-15'),
        customer: user._id,
        customerName: `${user.firstName} ${user.lastName}`,
        customerImage: user.profileImage,
        restaurant: restaurant._id,
        restaurantName: restaurant.businessName,
        restaurantLocation: `${restaurant.address}, ${restaurant.city}`,
        order: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        rating: 5,
        review: "Amazing food! The quality and taste exceeded my expectations. Will definitely order again.",
        helpfulCount: 3,
        unhelpfulCount: 0,
        reportCount: 0,
        viewCount: 12,
        isVisible: true,
        isFlagged: false,
        tags: ['delicious', 'quality', 'recommended'],
        sentiment: 'positive',
        sentimentScore: 1.0
      },
      {
        reviewDate: new Date('2024-01-10'),
        customer: user._id,
        customerName: `${user.firstName} ${user.lastName}`,
        customerImage: user.profileImage,
        restaurant: restaurant._id,
        restaurantName: restaurant.businessName,
        restaurantLocation: `${restaurant.address}, ${restaurant.city}`,
        order: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        rating: 4,
        review: "Good food and timely delivery. The portions were generous and the taste was authentic.",
        helpfulCount: 2,
        unhelpfulCount: 1,
        reportCount: 0,
        viewCount: 8,
        isVisible: true,
        isFlagged: false,
        tags: ['good', 'timely', 'generous'],
        sentiment: 'positive',
        sentimentScore: 0.8
      },
      {
        reviewDate: new Date('2024-01-05'),
        customer: user._id,
        customerName: `${user.firstName} ${user.lastName}`,
        customerImage: user.profileImage,
        restaurant: restaurant._id,
        restaurantName: restaurant.businessName,
        restaurantLocation: `${restaurant.address}, ${restaurant.city}`,
        order: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        rating: 3,
        review: "Food was okay, but delivery took longer than expected. Taste was average.",
        helpfulCount: 1,
        unhelpfulCount: 2,
        reportCount: 0,
        viewCount: 5,
        isVisible: true,
        isFlagged: false,
        tags: ['average', 'slow-delivery'],
        sentiment: 'neutral',
        sentimentScore: 0.0
      }
    ];
    
    // Clear existing reviews for this restaurant
    await Review.deleteMany({ restaurant: restaurant._id });
    console.log('🗑️ Cleared existing reviews for restaurant');
    
    // Insert demo reviews
    const insertedReviews = await Review.insertMany(demoReviews);
    console.log(`✅ Created ${insertedReviews.length} demo reviews`);
    
    // Display the created reviews
    insertedReviews.forEach((review, index) => {
      console.log(`\n📝 Review ${index + 1}:`);
      console.log(`   Rating: ${review.rating}/5`);
      console.log(`   Review: ${review.review.substring(0, 50)}...`);
      console.log(`   Date: ${review.reviewDate.toDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating demo reviews:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
});
