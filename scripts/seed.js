const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models with correct paths
const Admin = require('../admin/modal/admin.js');
const Driver = require('../driver/modal/driver.js');
const Order = require('../order/modal/order.js');
const Category = require('../restaurant/modal/category.js');
const Item = require('../restaurant/modal/item.js');
const Offer = require('../restaurant/modal/offer.js');
const Plan = require('../restaurant/modal/plan.js');
const Restaurant = require('../restaurant/modal/restaurant.js');
const Review = require('../restaurant/modal/review.js');
const SubCategory = require('../restaurant/modal/subCategory.js');
const Cart = require('../user/modal/cart.js');
const User = require('../user/modal/user.js');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/maate').then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Sample image URL
const itemImageUrl = 'https://maatebucket.s3.ap-south-1.amazonaws.com/restaurants/1755880138013_image_1755880055847_0.jpg';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-6)}${random}`;
};

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random number between min and max
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random date within last 30 days
const getRandomRecentDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
};

async function seedDatabase() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      Driver.deleteMany({}),
      Order.deleteMany({}),
      Category.deleteMany({}),
      Item.deleteMany({}),
      Offer.deleteMany({}),
      Plan.deleteMany({}),
      Restaurant.deleteMany({}),
      Review.deleteMany({}),
      SubCategory.deleteMany({}),
      Cart.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('✅ Existing data cleared');

    // Create Admins (5 different types)
    console.log('👑 Creating comprehensive admin data...');
    const admins = [
      {
        name: 'Super Admin',
        phone: '9999999999',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        profile: {
          email: 'superadmin@maate.com',
          address: '123 Main Street, Corporate Office',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          profileImage: itemImageUrl,
          bio: 'Super Administrator with full platform access'
        },
        role: 'super_admin',
        isActive: true,
        lastLogin: new Date()
      },
      {
        name: 'Admin Manager',
        phone: '8888888888',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        profile: {
          email: 'adminmanager@maate.com',
          address: '456 Business Avenue, Admin Block',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          profileImage: itemImageUrl,
          bio: 'Admin Manager for restaurant operations'
        },
        role: 'admin',
        isActive: true,
        lastLogin: new Date()
      },
      {
        name: 'Support Admin',
        phone: '7777777777',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        profile: {
          email: 'supportadmin@maate.com',
          address: '789 Support Lane, Help Center',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          profileImage: itemImageUrl,
          bio: 'Customer support administrator'
        },
        role: 'admin',
        isActive: true,
        lastLogin: new Date()
      },
      {
        name: 'Operations Admin',
        phone: '6666666666',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        profile: {
          email: 'operations@maate.com',
          address: '321 Operations Road, Ops Center',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          profileImage: itemImageUrl,
          bio: 'Operations administrator for delivery management'
        },
        role: 'admin',
        isActive: true,
        lastLogin: new Date()
      },
      {
        name: 'Content Admin',
        phone: '5555555555',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        profile: {
          email: 'contentadmin@maate.com',
          address: '654 Content Street, Media Center',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          profileImage: itemImageUrl,
          bio: 'Content and menu management administrator'
        },
        role: 'admin',
        isActive: true,
        lastLogin: new Date()
      }
    ];
    const savedAdmins = await Admin.insertMany(admins);
    console.log(`✅ Created ${savedAdmins.length} admins`);

    // Create Restaurants (10 different types with various statuses)
    console.log('🍽️ Creating comprehensive restaurant data...');
    const restaurantData = [
      {
        phone: '9876543201',
        businessName: 'Spice Garden',
        firstName: 'Rajesh',
        lastName: 'Verma',
        email: 'spicegarden@restaurant.com',
        address: '123 Food Street, Bandra West',
        city: 'Mumbai',
        pinCode: '400050',
        state: 'Maharashtra',
        category: 'Mix',
        specialization: 'North Indian, Chinese, Continental',
        dateOfBirth: new Date('1980-03-15'),
        bankName: 'HDFC Bank',
        bankBranch: 'Bandra West',
        accountNumber: '123456789012',
        accountHolder: 'Rajesh Verma',
        ifscCode: 'HDFC0001234',
        bankPhoneNumber: '9876543201',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543202',
        businessName: 'Healthy Bites',
        firstName: 'Sunita',
        lastName: 'Singh',
        email: 'healthybites@restaurant.com',
        address: '456 Wellness Road, Andheri East',
        city: 'Mumbai',
        pinCode: '400069',
        state: 'Maharashtra',
        category: 'Veg',
        specialization: 'Healthy, Organic, Vegan',
        dateOfBirth: new Date('1985-07-20'),
        bankName: 'ICICI Bank',
        bankBranch: 'Andheri East',
        accountNumber: '987654321098',
        accountHolder: 'Sunita Singh',
        ifscCode: 'ICIC0009876',
        bankPhoneNumber: '9876543202',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543203',
        businessName: 'Tandoor House',
        firstName: 'Vikram',
        lastName: 'Malhotra',
        email: 'tandoorhouse@restaurant.com',
        address: '789 Tandoor Lane, Juhu',
        city: 'Mumbai',
        pinCode: '400049',
        state: 'Maharashtra',
        category: 'Non Veg',
        specialization: 'Tandoori, Mughlai, Biryani',
        dateOfBirth: new Date('1982-11-08'),
        bankName: 'SBI Bank',
        bankBranch: 'Juhu',
        accountNumber: '456789123456',
        accountHolder: 'Vikram Malhotra',
        ifscCode: 'SBIN0004567',
        bankPhoneNumber: '9876543203',
        status: 'pending',
        isActive: false
      },
      {
        phone: '9876543204',
        businessName: 'South Indian Delights',
        firstName: 'Lakshmi',
        lastName: 'Iyer',
        email: 'southindian@restaurant.com',
        address: '101 Dosa Street, Powai',
        city: 'Mumbai',
        pinCode: '400076',
        state: 'Maharashtra',
        category: 'Veg',
        specialization: 'South Indian, Dosa, Idli',
        dateOfBirth: new Date('1988-04-12'),
        bankName: 'Axis Bank',
        bankBranch: 'Powai',
        accountNumber: '789123456789',
        accountHolder: 'Lakshmi Iyer',
        ifscCode: 'UTIB0007890',
        bankPhoneNumber: '9876543204',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543205',
        businessName: 'Chinese Wok',
        firstName: 'Chen',
        lastName: 'Wang',
        email: 'chinesewok@restaurant.com',
        address: '202 Wok Street, Andheri West',
        city: 'Mumbai',
        pinCode: '400058',
        state: 'Maharashtra',
        category: 'Non Veg',
        specialization: 'Chinese, Szechuan, Cantonese',
        dateOfBirth: new Date('1983-09-25'),
        bankName: 'Kotak Bank',
        bankBranch: 'Andheri West',
        accountNumber: '321654987321',
        accountHolder: 'Chen Wang',
        ifscCode: 'KKBK0003210',
        bankPhoneNumber: '9876543205',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543206',
        businessName: 'Pizza Palace',
        firstName: 'Marco',
        lastName: 'Rossi',
        email: 'pizzapalace@restaurant.com',
        address: '303 Pizza Road, Bandra East',
        city: 'Mumbai',
        pinCode: '400051',
        state: 'Maharashtra',
        category: 'Mix',
        specialization: 'Italian, Pizza, Pasta',
        dateOfBirth: new Date('1987-12-03'),
        bankName: 'Yes Bank',
        bankBranch: 'Bandra East',
        accountNumber: '147258369147',
        accountHolder: 'Marco Rossi',
        ifscCode: 'YESB0001470',
        bankPhoneNumber: '9876543206',
        status: 'rejected',
        isActive: false
      },
      {
        phone: '9876543207',
        businessName: 'Street Food Hub',
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'streetfood@restaurant.com',
        address: '404 Street Food Lane, Dadar',
        city: 'Mumbai',
        pinCode: '400028',
        state: 'Maharashtra',
        category: 'Mix',
        specialization: 'Street Food, Fast Food, Snacks',
        dateOfBirth: new Date('1990-06-18'),
        bankName: 'PNB Bank',
        bankBranch: 'Dadar',
        accountNumber: '963852741963',
        accountHolder: 'Amit Kumar',
        ifscCode: 'PUNB0009630',
        bankPhoneNumber: '9876543207',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543208',
        businessName: 'Dessert Paradise',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'dessertparadise@restaurant.com',
        address: '505 Sweet Street, Worli',
        city: 'Mumbai',
        pinCode: '400018',
        state: 'Maharashtra',
        category: 'Veg',
        specialization: 'Desserts, Cakes, Pastries',
        dateOfBirth: new Date('1986-01-30'),
        bankName: 'Canara Bank',
        bankBranch: 'Worli',
        accountNumber: '852963741852',
        accountHolder: 'Priya Sharma',
        ifscCode: 'CNRB0008520',
        bankPhoneNumber: '9876543208',
        status: 'approved',
        isActive: true
      },
      {
        phone: '9876543209',
        businessName: 'Seafood Special',
        firstName: 'Rahul',
        lastName: 'Patil',
        email: 'seafoodspecial@restaurant.com',
        address: '606 Fish Market Road, Colaba',
        city: 'Mumbai',
        pinCode: '400001',
        state: 'Maharashtra',
        category: 'Non Veg',
        specialization: 'Seafood, Fish, Prawns',
        dateOfBirth: new Date('1984-08-14'),
        bankName: 'Union Bank',
        bankBranch: 'Colaba',
        accountNumber: '741852963741',
        accountHolder: 'Rahul Patil',
        ifscCode: 'UBIN0007410',
        bankPhoneNumber: '9876543209',
        status: 'suspended',
        isActive: false
      },
      {
        phone: '9876543210',
        businessName: 'Organic Kitchen',
        firstName: 'Neha',
        lastName: 'Gupta',
        email: 'organickitchen@restaurant.com',
        address: '707 Organic Lane, Bandra West',
        city: 'Mumbai',
        pinCode: '400050',
        state: 'Maharashtra',
        category: 'Veg',
        specialization: 'Organic, Gluten-Free, Healthy',
        dateOfBirth: new Date('1989-05-22'),
        bankName: 'Federal Bank',
        bankBranch: 'Bandra West',
        accountNumber: '369258147369',
        accountHolder: 'Neha Gupta',
        ifscCode: 'FED0003690',
        bankPhoneNumber: '9876543210',
        status: 'approved',
        isActive: true
      }
    ];

    // Add common fields to all restaurants
    const restaurants = restaurantData.map(restaurant => ({
      ...restaurant,
      otp: '1234',
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: true,
      profileImage: itemImageUrl,
      messImages: [itemImageUrl, itemImageUrl],
      qrCode: itemImageUrl,
      passbook: itemImageUrl,
      aadharCard: itemImageUrl,
      panCard: itemImageUrl,
      isApproved: restaurant.status === 'approved',
      approvedBy: restaurant.status === 'approved' ? savedAdmins[0]._id : null,
      approvedAt: restaurant.status === 'approved' ? new Date() : null,
      isProfile: true,
      lastLogin: new Date()
    }));

    const savedRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`✅ Created ${savedRestaurants.length} restaurants`);

    // Create Categories (6 per restaurant)
    console.log('📂 Creating comprehensive categories...');
    const categoryNames = [
      'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts',
      'Appetizers', 'Main Course', 'Side Dishes', 'Salads', 'Soups', 'Breads'
    ];
    
    const categories = [];
    for (const restaurant of savedRestaurants) {
      const restaurantCategories = categoryNames.slice(0, 6).map(name => ({
        name,
        description: `${name} items from ${restaurant.businessName}`,
        image: itemImageUrl,
        restaurant: restaurant._id,
        isActive: true,
        itemCount: 0
      }));
      categories.push(...restaurantCategories);
    }
    const savedCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${savedCategories.length} categories`);

    // Create SubCategories (3 per category)
    console.log('📁 Creating comprehensive sub-categories...');
    const subCategoryData = {
      'Breakfast': ['Continental', 'Indian', 'American'],
      'Lunch': ['North Indian', 'South Indian', 'Chinese'],
      'Dinner': ['Fine Dining', 'Casual', 'Family Style'],
      'Snacks': ['Street Food', 'Finger Food', 'Quick Bites'],
      'Beverages': ['Hot Drinks', 'Cold Drinks', 'Smoothies'],
      'Desserts': ['Traditional', 'Western', 'Fusion']
    };

    const subCategories = [];
    for (const category of savedCategories) {
      const subCategoryNames = subCategoryData[category.name] || ['Standard', 'Premium', 'Special'];
      for (const subName of subCategoryNames) {
        subCategories.push({
          name: subName,
          description: `${subName} ${category.name.toLowerCase()} items`,
          image: itemImageUrl,
          icon: `${subName.toLowerCase()}-icon`,
          restaurant: category.restaurant,
          category: category._id,
          isActive: true,
          sortOrder: Math.floor(Math.random() * 5) + 1,
          itemCount: 0
        });
      }
    }
    const savedSubCategories = await SubCategory.insertMany(subCategories);
    console.log(`✅ Created ${savedSubCategories.length} sub-categories`);

    // Create Items (8-12 per restaurant)
    console.log('🍕 Creating comprehensive menu items...');
    const itemNames = [
      'Paneer Butter Masala', 'Chicken Tikka', 'Veg Biryani', 'Masala Dosa',
      'Butter Chicken', 'Dal Makhani', 'Gulab Jamun', 'Rasgulla',
      'Masala Chai', 'Lassi', 'Samosa', 'Pakora', 'Naan', 'Roti',
      'Pulao', 'Curry', 'Kebab', 'Tandoori', 'Tikka', 'Biryani',
      'Dosa', 'Idli', 'Vada', 'Upma', 'Poha', 'Paratha',
      'Pizza', 'Pasta', 'Burger', 'Sandwich', 'Salad', 'Soup'
    ];

    const items = [];
    for (const restaurant of savedRestaurants) {
      const restaurantCategories = savedCategories.filter(cat => cat.restaurant.equals(restaurant._id));
      const itemsPerRestaurant = getRandomNumber(8, 12);
      
      for (let i = 0; i < itemsPerRestaurant; i++) {
        const category = getRandomElement(restaurantCategories);
        const itemName = getRandomElement(itemNames);
        
        items.push({
          name: `${itemName} - ${restaurant.businessName}`,
          description: `Delicious ${itemName.toLowerCase()} prepared with authentic recipes`,
          image: itemImageUrl,
          category: category._id,
          itemCategory: category.name,
          price: getRandomNumber(50, 500),
          availability: getRandomElement(['in-stock', 'out-of-stock', 'limited']),
          isActive: true,
          isDietMeal: Math.random() > 0.7,
          calories: getRandomNumber(100, 800),
          restaurant: restaurant._id,
          rating: (Math.random() * 5).toFixed(1),
          totalRatings: getRandomNumber(10, 200),
          totalReviews: getRandomNumber(5, 100),
          totalOrder: getRandomNumber(20, 500)
        });
      }
    }
    const savedItems = await Item.insertMany(items);
    console.log(`✅ Created ${savedItems.length} menu items`);

    // Update category and subcategory item counts
    console.log('📊 Updating category and subcategory item counts...');
    for (const category of savedCategories) {
      await category.updateItemCount();
    }
    for (const subCategory of savedSubCategories) {
      await subCategory.updateItemCount();
    }
    console.log('✅ Category and SubCategory item counts updated');

    // Create Users (15 different types)
    console.log('👥 Creating comprehensive user data...');
    const userData = [
      { firstName: 'Rahul', lastName: 'Sharma', phone: '9876543211', city: 'Mumbai', gender: 'male' },
      { firstName: 'Priya', lastName: 'Patel', phone: '9876543212', city: 'Mumbai', gender: 'female' },
      { firstName: 'Amit', lastName: 'Kumar', phone: '9876543213', city: 'Delhi', gender: 'male' },
      { firstName: 'Sneha', lastName: 'Mehta', phone: '9876543214', city: 'Delhi', gender: 'female' },
      { firstName: 'Vikram', lastName: 'Singh', phone: '9876543215', city: 'Bangalore', gender: 'male' },
      { firstName: 'Anjali', lastName: 'Verma', phone: '9876543216', city: 'Bangalore', gender: 'female' },
      { firstName: 'Rajesh', lastName: 'Yadav', phone: '9876543217', city: 'Chennai', gender: 'male' },
      { firstName: 'Pooja', lastName: 'Gupta', phone: '9876543218', city: 'Chennai', gender: 'female' },
      { firstName: 'Suresh', lastName: 'Malhotra', phone: '9876543219', city: 'Hyderabad', gender: 'male' },
      { firstName: 'Kavita', lastName: 'Joshi', phone: '9876543220', city: 'Hyderabad', gender: 'female' },
      { firstName: 'Manoj', lastName: 'Tiwari', phone: '9876543221', city: 'Pune', gender: 'male' },
      { firstName: 'Rekha', lastName: 'Chopra', phone: '9876543222', city: 'Pune', gender: 'female' },
      { firstName: 'Deepak', lastName: 'Reddy', phone: '9876543223', city: 'Kolkata', gender: 'male' },
      { firstName: 'Sunita', lastName: 'Iyer', phone: '9876543224', city: 'Kolkata', gender: 'female' },
      { firstName: 'Arun', lastName: 'Nair', phone: '9876543225', city: 'Ahmedabad', gender: 'male' }
    ];

    const users = userData.map((user, index) => ({
      ...user,
      otp: '123456',
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: true,
      isProfile: true,
      dateOfBirth: new Date(1990 + (index % 10), (index % 12) + 1, (index % 28) + 1),
      email: `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@email.com`,
      addresses: [{
        type: 'home',
        fullAddress: `${100 + index} ${user.lastName} Street, ${user.city}`,
        city: user.city,
        pincode: `${400000 + index}`,
        isDefault: true,
        isActive: true
      }],
      address: `${100 + index} ${user.lastName} Street, ${user.city}`,
      state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat']),
      pincode: `${400000 + index}`,
      profileImage: itemImageUrl,
      isActive: true,
      lastActive: new Date()
    }));

    const savedUsers = await User.insertMany(users);
    console.log(`✅ Created ${savedUsers.length} users`);

    // Create Drivers (8 different types)
    console.log('🚗 Creating comprehensive driver data...');
    const driverData = [
      { firstName: 'Suresh', lastName: 'Yadav', phone: '9876543301', city: 'Mumbai' },
      { firstName: 'Ramesh', lastName: 'Kumar', phone: '9876543302', city: 'Mumbai' },
      { firstName: 'Vikram', lastName: 'Singh', phone: '9876543303', city: 'Delhi' },
      { firstName: 'Amit', lastName: 'Patel', phone: '9876543304', city: 'Delhi' },
      { firstName: 'Rajesh', lastName: 'Sharma', phone: '9876543305', city: 'Bangalore' },
      { firstName: 'Manoj', lastName: 'Verma', phone: '9876543306', city: 'Bangalore' },
      { firstName: 'Deepak', lastName: 'Gupta', phone: '9876543307', city: 'Chennai' },
      { firstName: 'Arun', lastName: 'Malhotra', phone: '9876543308', city: 'Chennai' }
    ];

    const drivers = driverData.map((driver, index) => ({
      ...driver,
      otp: '123456',
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: true,
      registrationStep: 7,
      isRegistrationComplete: true,
      isApproved: Math.random() > 0.2, // 80% approved
      isActive: Math.random() > 0.3, // 70% active
      profileImage: itemImageUrl,
      email: `${driver.firstName.toLowerCase()}.${driver.lastName.toLowerCase()}@driver.com`,
      dob: new Date(1985 + (index % 10), (index % 12) + 1, (index % 28) + 1),
      state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu']),
      pincode: `${400000 + index}`,
      address: `${100 + index} Driver Road, ${driver.city}`,
      bankName: getRandomElement(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank']),
      accountNumber: `${100000000000 + index}`,
      ifscCode: `HDFC000${1000 + index}`,
      branch: 'Main Branch',
      passbookImage: itemImageUrl,
      panCardImage: itemImageUrl,
      aadharNumber: `${100000000000 + index}`,
      fullName: `${driver.firstName} ${driver.lastName}`,
      dateOfBirth: `${1985 + (index % 10)}-${(index % 12) + 1}-${(index % 28) + 1}`,
      gender: 'Male',
      aadharFrontImage: itemImageUrl,
      aadharBackImage: itemImageUrl,
      dlNumber: `MH${100000000 + index}`,
      dlFullName: `${driver.firstName} ${driver.lastName}`,
      dlDateOfIssue: new Date(2018, 0, 1),
      dlDateOfExpiry: new Date(2028, 0, 1),
      dlIssuingAuthority: `${driver.city} RTO`,
      dlAddress: `${100 + index} Driver Road, ${driver.city}`,
      dlFrontImage: itemImageUrl,
      dlBackImage: itemImageUrl,
      vehicleNumber: `MH${10 + index}AB${1000 + index}`,
      vehicleOwnerName: `${driver.firstName} ${driver.lastName}`,
      vehicleType: getRandomElement(['Bike', 'Car', 'Scooter']),
      vehicleRegistrationDate: new Date(2017, 0, 1),
      rcFrontImage: itemImageUrl,
      rcBackImage: itemImageUrl,
      isOnline: Math.random() > 0.5, // 50% online
      lastActive: new Date()
    }));

    const savedDrivers = await Driver.insertMany(drivers);
    console.log(`✅ Created ${savedDrivers.length} drivers`);

    // Create Orders (50 different orders)
    console.log('📦 Creating comprehensive order data...');
    const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const paymentMethods = ['online', 'cod', 'wallet', 'upi'];
    const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];

    const orders = [];
    for (let i = 0; i < 50; i++) {
      const user = getRandomElement(savedUsers);
      const restaurant = getRandomElement(savedRestaurants);
      const driver = getRandomElement(savedDrivers);
      const restaurantItems = savedItems.filter(item => item.restaurant.equals(restaurant._id));
      
      if (restaurantItems.length > 0) {
        const selectedItems = restaurantItems.slice(0, getRandomNumber(1, 4));
        const orderItems = selectedItems.map(item => {
          const quantity = getRandomNumber(1, 3);
          return {
            itemId: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: quantity,
            image: item.image,
            category: item.itemCategory,
            itemTotal: item.price * quantity
          };
        });

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = getRandomNumber(30, 80);
        const totalAmount = subtotal + deliveryFee;

        orders.push({
          orderNumber: generateOrderNumber(),
          orderDate: getRandomRecentDate(),
          customer: user._id,
          customerName: `${user.firstName} ${user.lastName}`,
          restaurant: restaurant._id,
          restaurantName: restaurant.businessName,
          items: orderItems,
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          totalAmount: totalAmount,
          deliveryAddress: {
            street: user.addresses[0]?.fullAddress || 'Default Address',
            city: user.addresses[0]?.city || 'Mumbai',
            state: user.state || 'Maharashtra',
            postalCode: user.addresses[0]?.pincode || '400001',
            country: 'India'
          },
          estimatedDelivery: `${getRandomNumber(20, 60)} minutes`,
          orderTime: getRandomRecentDate(),
          status: getRandomElement(orderStatuses),
          trackingStatus: getRandomElement(['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered']),
          driverName: driver.firstName + ' ' + driver.lastName,
          driverPhone: driver.phone,
          currentLocation: getRandomElement(['Restaurant', 'On the way', 'Near destination', 'Delivered']),
          paymentMethod: getRandomElement(paymentMethods),
          paymentStatus: getRandomElement(paymentStatuses),
          transactionId: `TXN${Date.now()}${i}`,
          specialInstructions: getRandomElement([
            'Please pack carefully',
            'Deliver at main gate',
            'Call before delivery',
            'Leave at doorstep',
            'Ring doorbell twice'
          ])
        });
      }
    }
    const savedOrders = await Order.insertMany(orders);
    console.log(`✅ Created ${savedOrders.length} orders`);

    // Create Reviews (3-5 per restaurant)
    console.log('⭐ Creating comprehensive review data...');
    const reviewComments = [
      'Amazing food and quick delivery!',
      'Great taste and reasonable prices',
      'Excellent service and quality food',
      'Highly recommended, will order again',
      'Good food but delivery was slow',
      'Tasty food, good portion size',
      'Nice restaurant, food was fresh',
      'Average experience, could be better',
      'Fantastic food, exceeded expectations',
      'Good value for money'
    ];

    const reviews = [];
    for (const restaurant of savedRestaurants) {
      const reviewCount = getRandomNumber(3, 5);
      for (let i = 0; i < reviewCount; i++) {
        const user = getRandomElement(savedUsers);
        const order = getRandomElement(savedOrders.filter(o => o.restaurant.equals(restaurant._id)));
        
        reviews.push({
          reviewDate: getRandomRecentDate(),
          customer: user._id,
          customerName: `${user.firstName} ${user.lastName}`,
          customerImage: itemImageUrl,
          restaurant: restaurant._id,
          restaurantName: restaurant.businessName,
          restaurantLocation: `${restaurant.address}, ${restaurant.city}`,
          order: order?._id || null,
          orderNumber: order?.orderNumber || 'N/A',
          orderDate: order?.orderDate || new Date(),
          rating: getRandomNumber(1, 5),
          review: getRandomElement(reviewComments),
          helpfulCount: getRandomNumber(0, 10),
          unhelpfulCount: getRandomNumber(0, 3),
          reportCount: getRandomNumber(0, 1),
          viewCount: getRandomNumber(5, 50),
          tags: getRandomElement([
            ['delicious', 'quick'],
            ['tasty', 'fresh'],
            ['good', 'value'],
            ['excellent', 'service'],
            ['average', 'okay']
          ]),
          sentiment: getRandomElement(['positive', 'neutral', 'negative']),
          sentimentScore: Math.random()
        });
      }
    }
    await Review.insertMany(reviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    // Create Offers (2-3 per restaurant)
    console.log('🎉 Creating comprehensive offer data...');
    const offerTitles = [
      'First Order Discount',
      'Weekend Special',
      'Lunch Combo Offer',
      'Dinner Special',
      'Student Discount',
      'Senior Citizen Offer',
      'Bulk Order Discount',
      'Referral Bonus'
    ];

    const offers = [];
    for (const restaurant of savedRestaurants) {
      const offerCount = getRandomNumber(2, 3);
      for (let i = 0; i < offerCount; i++) {
        offers.push({
          offerImage: itemImageUrl,
          offerTitle: getRandomElement(offerTitles),
          discountAmount: getRandomNumber(10, 50),
          startDate: new Date(),
          endDate: new Date(Date.now() + getRandomNumber(7, 30) * 24 * 60 * 60 * 1000),
          restaurantId: restaurant._id
        });
      }
    }
    await Offer.insertMany(offers);
    console.log(`✅ Created ${offers.length} offers`);

    // Create Plans (2-3 per restaurant)
    console.log('📋 Creating comprehensive meal plan data...');
    const planNames = [
      'Basic Weekly Plan',
      'Premium Weekly Plan',
      'Healthy Monthly Plan',
      'Weight Loss Plan',
      'Gain Weight Plan',
      'Diabetic Friendly Plan',
      'Vegan Weekly Plan',
      'Protein Rich Plan'
    ];

    const plans = [];
    for (const restaurant of savedRestaurants) {
      const planCount = getRandomNumber(2, 3);
      for (let i = 0; i < planCount; i++) {
        const planName = getRandomElement(planNames);
        plans.push({
          name: `${planName} - ${restaurant.businessName}`,
          restaurant: restaurant._id,
          pricePerWeek: getRandomNumber(800, 3000),
          isActive: true,
          features: [
            'Fresh ingredients',
            'Daily delivery',
            'Customizable menu',
            'Nutritional guidance',
            'Flexible timing'
          ],
          weeklyMeals: {
            sunday: {
              breakfast: [{ name: 'Healthy Breakfast', calories: getRandomNumber(200, 400) }],
              lunch: [{ name: 'Nutritious Lunch', calories: getRandomNumber(300, 600) }],
              dinner: [{ name: 'Light Dinner', calories: getRandomNumber(250, 500) }]
            },
            monday: {
              breakfast: [{ name: 'Protein Breakfast', calories: getRandomNumber(250, 450) }],
              lunch: [{ name: 'Balanced Lunch', calories: getRandomNumber(350, 650) }],
              dinner: [{ name: 'Healthy Dinner', calories: getRandomNumber(300, 550) }]
            }
          },
          totalSubscribers: getRandomNumber(5, 50),
          totalRevenue: getRandomNumber(5000, 50000),
          averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          totalRatings: getRandomNumber(10, 100),
          isRecommended: Math.random() > 0.5,
          isPopular: Math.random() > 0.6,
          maxSubscribers: getRandomNumber(50, 200),
          isAvailable: true
        });
      }
    }
    await Plan.insertMany(plans);
    console.log(`✅ Created ${plans.length} meal plans`);

    // Create Carts (1 per user)
    console.log('🛒 Creating comprehensive shopping cart data...');
    const carts = [];
    for (const user of savedUsers) {
      const restaurant = getRandomElement(savedRestaurants);
      const restaurantItems = savedItems.filter(item => item.restaurant.equals(restaurant._id));
      
      if (restaurantItems.length > 0) {
        const selectedItems = restaurantItems.slice(0, getRandomNumber(1, 3));
        const cartItems = selectedItems.map(item => ({
          itemId: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: getRandomNumber(1, 2),
          image: item.image,
          category: item.itemCategory,
          itemTotal: item.price * getRandomNumber(1, 2)
        }));

        const subtotal = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);

        carts.push({
          userId: user._id,
          restaurantId: restaurant._id,
          items: cartItems,
          subtotal: subtotal,
          total: subtotal
        });
      }
    }
    await Cart.insertMany(carts);
    console.log(`✅ Created ${carts.length} shopping carts`);

    console.log('🎉 Comprehensive database seeding completed successfully!');
    
    // Print summary
    console.log('\n�� Final Summary:');
    console.log(`   👑 Admins: ${savedAdmins.length}`);
    console.log(`   👥 Users: ${savedUsers.length}`);
    console.log(`   🍽️ Restaurants: ${savedRestaurants.length}`);
    console.log(`   �� Drivers: ${savedDrivers.length}`);
    console.log(`   📂 Categories: ${savedCategories.length}`);
    console.log(`   �� Sub-categories: ${savedSubCategories.length}`);
    console.log(`   🍕 Menu Items: ${savedItems.length}`);
    console.log(`   📋 Meal Plans: ${plans.length}`);
    console.log(`   🎉 Offers: ${offers.length}`);
    console.log(`   ⭐ Reviews: ${reviews.length}`);
    console.log(`   📦 Orders: ${savedOrders.length}`);
    console.log(`   �� Shopping Carts: ${carts.length}`);

    console.log('\n�� Admin Credentials:');
    savedAdmins.forEach(admin => {
      console.log(`   ${admin.name}: Phone: ${admin.phone}, Password: admin123`);
    });

    console.log('\n�� Sample User Phones:');
    savedUsers.slice(0, 5).forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName}: ${user.phone}`);
    });

    console.log('\n��️ Sample Restaurant Phones:');
    savedRestaurants.slice(0, 5).forEach(restaurant => {
      console.log(`   ${restaurant.businessName}: ${restaurant.phone}`);
    });

    console.log('\n🚗 Sample Driver Phones:');
    savedDrivers.slice(0, 5).forEach(driver => {
      console.log(`   ${driver.firstName} ${driver.lastName}: ${driver.phone}`);
    });

    mongoose.connection.close();
    console.log('\n📴 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase();