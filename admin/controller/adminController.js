const Admin = require('../modal/admin');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');

// Generate JWT Token
const generateToken = (adminId) => {
  console.log('Generating JWT for adminId:', adminId);
  const token = jwt.sign({ id: adminId }, process.env.JWT_SECRET || 'maate_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
  console.log('Generated JWT:', token);
  return token;
};

// Validation middleware functions
const validateLogin = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be 10 digits')
    .isNumeric()
    .withMessage('Phone number must contain only numbers'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be 10 digits')
    .isNumeric()
    .withMessage('Phone number must contain only numbers'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('profile.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('profile.address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters')
    .trim(),
  body('profile.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters')
    .trim(),
  body('profile.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters')
    .trim(),
  body('profile.pincode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be 6 digits')
    .isNumeric()
    .withMessage('Pincode must contain only numbers'),
  body('profile.bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters')
    .trim()
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation Errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  console.log('Validation Passed for Request:', req.body);
  next();
};

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Register Request Body:', req.body);
    const { name, phone, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ phone });
    console.log('Existing Admin Check:', { phone, exists: !!existingAdmin });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this phone number already exists'
      });
    }

    // Create new admin
    const admin = new Admin({
      name: name.trim(),
      phone,
      password
    });
    console.log('Creating Admin:', { name: admin.name, phone: admin.phone });

    await admin.save();
    console.log('Admin Saved:', admin._id);

    // Generate JWT token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: admin.fullProfile,
        token
      }
    });

  } catch (error) {
    console.error('Register Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error registering admin',
      error: error.message
    });
  }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('Login Request Body:', req.body);
    const { phone, password } = req.body;

    // Validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('Login Validation Failed: Invalid phone number');
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    if (!password || password.length < 6) {
      console.log('Login Validation Failed: Invalid password length');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Find admin by phone
    const admin = await Admin.findOne({ phone });
    console.log('Admin Lookup:', { phone, found: !!admin });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if admin is active
    console.log('Admin Status:', { phone, isActive: admin.isActive });
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    try {
      const isPasswordValid = await admin.comparePassword(password);
      console.log('Password Verification:', { phone, isValid: isPasswordValid });
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password'
        });
      }
    } catch (error) {
      console.error('Password Verification Error:', { message: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Update last login
    await admin.updateLastLogin();
    console.log('Last Login Updated:', { adminId: admin._id });

    // Generate JWT token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: admin.fullProfile,
        token
      }
    });

  } catch (error) {
    console.error('Login Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getProfile = async (req, res) => {
  try {
    console.log('Get Profile Request:', { userId: req.user.id });
    const admin = await Admin.findById(req.user.id).select('-password');
    
    if (!admin) {
      console.log('Admin Not Found:', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    console.log('Profile Retrieved:', { adminId: admin._id });
    res.status(200).json({
      success: true,
      data: admin.fullProfile
    });

  } catch (error) {
    console.error('Get Profile Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateProfile = async (req, res) => {
  try {
    console.log('Update Profile Request:', { userId: req.user.id, body: req.body });
    const { name, profile } = req.body;

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      console.log('Admin Not Found:', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Validation for name
    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 50) {
        console.log('Name Validation Failed:', { name });
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters'
        });
      }
      admin.name = name.trim();
    }

    // Validation for profile fields
    if (profile) {
      console.log('Profile Update Fields:', profile);
      if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        console.log('Email Validation Failed:', { email: profile.email });
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email'
        });
      }

      if (profile.address && profile.address.length > 200) {
        console.log('Address Validation Failed:', { address: profile.address });
        return res.status(400).json({
          success: false,
          message: 'Address cannot exceed 200 characters'
        });
      }

      if (profile.city && profile.city.length > 50) {
        console.log('City Validation Failed:', { city: profile.city });
        return res.status(400).json({
          success: false,
          message: 'City cannot exceed 50 characters'
        });
      }

      if (profile.state && profile.state.length > 50) {
        console.log('State Validation Failed:', { state: profile.state });
        return res.status(400).json({
          success: false,
          message: 'State cannot exceed 50 characters'
        });
      }

      if (profile.pincode && (profile.pincode.length !== 6 || !/^\d+$/.test(profile.pincode))) {
        console.log('Pincode Validation Failed:', { pincode: profile.pincode });
        return res.status(400).json({
          success: false,
          message: 'Pincode must be 6 digits'
        });
      }

      if (profile.bio && profile.bio.length > 200) {
        console.log('Bio Validation Failed:', { bio: profile.bio });
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 200 characters'
        });
      }

      // Update profile fields
      admin.profile = { ...admin.profile, ...profile };
    }

    await admin.save();
    console.log('Profile Updated:', { adminId: admin._id });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: admin.fullProfile
    });

  } catch (error) {
    console.error('Update Profile Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
const changePassword = async (req, res) => {
  try {
    console.log('Change Password Request:', { userId: req.user.id, body: req.body });
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log('Change Password Validation Failed: Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      console.log('Change Password Validation Failed: New password too short');
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      console.log('Admin Not Found:', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    console.log('Current Password Verification:', { isValid: isCurrentPasswordValid });
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();
    console.log('Password Changed:', { adminId: admin._id });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change Password Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    console.log('Get Dashboard Request:', { userId: req.user.id });
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      console.log('Admin Not Found:', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Dashboard statistics
    const dashboardData = {
      totalUsers: 0,
      totalRestaurants: 0,
      totalDrivers: 0,
      totalOrders: 0,
      recentActivity: [],
      adminInfo: {
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    };
    console.log('Dashboard Data Prepared:', dashboardData);

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

// @desc    Get all admins (Super Admin only)
// @route   GET /api/admin/all
// @access  Private (Super Admin)
const getAllAdmins = async (req, res) => {
  try {
    console.log('Get All Admins Request:', { userId: req.user.id });
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    console.log('Admins Retrieved:', { count: admins.length });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins.map(admin => admin.fullProfile)
    });

  } catch (error) {
    console.error('Get All Admins Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error.message
    });
  }
};

// @desc    Update admin role (Super Admin only)
// @route   PUT /api/admin/:id/role
// @access  Private (Super Admin)
const updateAdminRole = async (req, res) => {
  try {
    console.log('Update Admin Role Request:', { userId: req.user.id, params: req.params, body: req.body });
    const { role } = req.body;
    const { id } = req.params;

    if (!['admin', 'super_admin'].includes(role)) {
      console.log('Role Validation Failed:', { role });
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or super_admin'
      });
    }

    const admin = await Admin.findById(id);
    
    if (!admin) {
      console.log('Admin Not Found:', { adminId: id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.role = role;
    await admin.save();
    console.log('Admin Role Updated:', { adminId: id, newRole: role });

    res.status(200).json({
      success: true,
      message: 'Admin role updated successfully',
      data: admin.fullProfile
    });

  } catch (error) {
    console.error('Update Admin Role Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating admin role',
      error: error.message
    });
  }
};

// @desc    Toggle admin status (Super Admin only)
// @route   PUT /api/admin/:id/status
// @access  Private (Super Admin)
const toggleAdminStatus = async (req, res) => {
  try {
    console.log('Toggle Admin Status Request:', { userId: req.user.id, params: req.params });
    const { id } = req.params;

    const admin = await Admin.findById(id);
    
    if (!admin) {
      console.log('Admin Not Found:', { adminId: id });
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deactivating self
    if (admin._id.toString() === req.user.id) {
      console.log('Self-Deactivation Attempted:', { adminId: id });
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();
    console.log('Admin Status Toggled:', { adminId: id, isActive: admin.isActive });

    res.status(200).json({
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      data: admin.fullProfile
    });

  } catch (error) {
    console.error('Toggle Admin Status Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error toggling admin status',
      error: error.message
    });
  }
};

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private (Admin)
const logout = async (req, res) => {
  try {
    console.log('Logout Request:', { userId: req.user.id });
    // In a real application, you might want to blacklist the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout Error:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
  getAllAdmins,
  updateAdminRole,
  toggleAdminStatus,
  logout,
  validateLogin,
  validateRegister,
  validateUpdateProfile,
  handleValidationErrors
};