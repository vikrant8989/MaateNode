const mongoose = require('mongoose');
const Review = require('../restaurant/modal/review');
const Restaurant = require('../restaurant/modal/restaurant');

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
    // Check total reviews count
    const totalReviews = await Review.countDocuments();
    console.log(`📊 Total reviews in database: ${totalReviews}`);
    
    if (totalReviews === 0) {
      console.log('❌ No reviews found in database');
      console.log('💡 You need to add some reviews first');
      return;
    }
    
    // Get all reviews
    const reviews = await Review.find().populate('restaurant', 'businessName');
    console.log('\n📝 Found reviews:');
    
    reviews.forEach((review, index) => {
      console.log(`\n   Review ${index + 1}:`);
      console.log(`   ID: ${review._id}`);
      console.log(`   Restaurant: ${review.restaurant?.businessName || 'Unknown'}`);
      console.log(`   Rating: ${review.rating}/5`);
      console.log(`   Customer: ${review.customerName}`);
      console.log(`   Review: ${review.review.substring(0, 50)}...`);
      console.log(`   Date: ${review.reviewDate.toDateString()}`);
      console.log(`   Visible: ${review.isVisible}`);
    });
    
    // Check review statistics manually
    const stats = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalRating: { $sum: '$rating' },
          ratingCounts: { $push: '$rating' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📈 Review Statistics:');
      console.log(`   Total Reviews: ${stat.totalReviews}`);
      console.log(`   Average Rating: ${stat.averageRating ? stat.averageRating.toFixed(2) : 'N/A'}`);
      console.log(`   Total Rating: ${stat.totalRating}`);
      
      // Rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      stat.ratingCounts.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
      
      console.log('   Rating Distribution:');
      Object.entries(ratingDistribution).forEach(([rating, count]) => {
        console.log(`     ${rating} star: ${count}`);
      });
    } else {
      console.log('\n❌ No review statistics found');
    }
    
  } catch (error) {
    console.error('❌ Error checking reviews:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
});
