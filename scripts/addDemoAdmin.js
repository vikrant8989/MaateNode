const mongoose = require('mongoose');
const Admin = require('../admin/modal/admin.js');
const bcrypt = require('bcryptjs');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/maate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Demo admin data
const demoAdmins = [
  {
    name: 'Super Admin',
    phone: '9999999999',
    password: 'admin123', // Same password for all
    profile: {
      email: 'superadmin@maate.com',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      bio: 'Super Administrator for Maate platform'
    },
    role: 'super_admin',
    isActive: true
  },
  {
    name: 'Admin Manager',
    phone: '8888888888',
    password: 'admin123', // Same password for all
    profile: {
      email: 'adminmanager@maate.com',
      address: '456 Business Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      bio: 'Admin Manager for restaurant operations'
    },
    role: 'admin',
    isActive: true
  },
  {
    name: 'Support Admin',
    phone: '7777777777',
    password: 'admin123', // Same password for all
    profile: {
      email: 'supportadmin@maate.com',
      address: '789 Support Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      bio: 'Customer support administrator'
    },
    role: 'admin',
    isActive: true
  },
  {
    name: 'Operations Admin',
    phone: '6666666666',
    password: 'admin123', // Same password for all
    profile: {
      email: 'operations@maate.com',
      address: '321 Operations Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      bio: 'Operations administrator for delivery management'
    },
    role: 'admin',
    isActive: true
  },
  {
    name: 'Content Admin',
    phone: '5555555555',
    password: 'admin123', // Same password for all
    profile: {
      email: 'contentadmin@maate.com',
      address: '654 Content Street',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      bio: 'Content and menu management administrator'
    },
    role: 'admin',
    isActive: true
  }
];

// Function to add demo admins
const addDemoAdmins = async () => {
  try {
    console.log('Starting to add demo admin data...');
    
    // Clear existing demo admins (optional - comment out if you want to keep existing)
    // await Admin.deleteMany({ phone: { $in: demoAdmins.map(admin => admin.phone) } });
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const adminData of demoAdmins) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ phone: adminData.phone });
        
        if (existingAdmin) {
          console.log(`Admin with phone ${adminData.phone} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create new admin
        const newAdmin = new Admin(adminData);
        await newAdmin.save();
        
        console.log(`✅ Added admin: ${adminData.name} (${adminData.phone})`);
        addedCount++;
        
      } catch (error) {
        console.error(`❌ Error adding admin ${adminData.name}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${addedCount} admins`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} admins`);
    console.log(`🔑 All admins use password: admin123`);
    console.log('\n📱 Demo Admin Phone Numbers:');
    demoAdmins.forEach(admin => {
      console.log(`   ${admin.name}: ${admin.phone}`);
    });
    
  } catch (error) {
    console.error('❌ Error in addDemoAdmins:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await addDemoAdmins();
    console.log('\n🎉 Demo admin data creation completed!');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addDemoAdmins, demoAdmins };
