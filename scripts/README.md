# Demo Admin Script

This script adds demo admin users to the Maate database for testing purposes.

## 🚀 Usage

### Method 1: Using npm script
```bash
cd maateBackend
npm run add-demo-admin
```

### Method 2: Direct execution
```bash
cd maateBackend
node scripts/addDemoAdmin.js
```

## 📋 Demo Admin Credentials

The script creates 3 demo admin accounts:

### 1. Super Admin
- **Phone:** 9999999999
- **Password:** admin123
- **Name:** Super Admin
- **Role:** super_admin
- **Email:** superadmin@maate.com

### 2. Demo Admin
- **Phone:** 8888888888
- **Password:** admin123
- **Name:** Demo Admin
- **Role:** admin
- **Email:** admin@maate.com

### 3. Test Admin
- **Phone:** 7777777777
- **Password:** admin123
- **Name:** Test Admin
- **Role:** admin
- **Email:** test@maate.com

## 🔑 Login Instructions

1. **Start the backend server:**
   ```bash
   cd maateBackend
   npm start
   ```

2. **Start the admin frontend:**
   ```bash
   cd maate_admin
   npm start
   ```

3. **Login with any demo account:**
   - Use any of the phone numbers above
   - Password is always: `admin123`

## ⚙️ Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/maate`)

### Example .env file:
```env
MONGODB_URI=mongodb://localhost:27017/maate
JWT_SECRET=your_jwt_secret_here
```

## 🔧 Features

- ✅ Creates multiple admin accounts with different roles
- ✅ Checks for existing admins to avoid duplicates
- ✅ Provides detailed console output
- ✅ Includes proper error handling
- ✅ Sets up verified and active accounts
- ✅ Includes profile information
- ✅ Uses secure password hashing with bcrypt

## 🛠️ Customization

To add more demo admins, edit the `demoAdmins` array in `addDemoAdmin.js`:

```javascript
const demoAdmins = [
  {
    name: 'Your Admin Name',
    phone: '1234567890',
    password: 'yourpassword',
    role: 'admin', // or 'super_admin'
    profile: {
      email: 'your@email.com',
      address: 'Your Address',
      city: 'Your City',
      state: 'Your State',
      pincode: '123456',
      bio: 'Your bio'
    }
  }
];
```

## 📝 Notes

- All demo accounts use password: `admin123`
- Passwords are automatically hashed using bcrypt
- Accounts are created as verified and active
- The script is idempotent - running it multiple times won't create duplicates
- Make sure MongoDB is running before executing the script

## 🔐 Security Features

- **Password Hashing:** All passwords are hashed using bcrypt with salt rounds of 10
- **Input Validation:** Phone numbers and passwords are validated
- **Account Status:** Admins can be activated/deactivated
- **Role-based Access:** Different roles (admin, super_admin) with different permissions
