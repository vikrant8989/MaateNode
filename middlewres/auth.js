const jwt = require('jsonwebtoken');
const Admin = require('../admin/modal/admin');
const User = require('../user/modal/user');
const Restaurant = require('../restaurant/modal/restaurant');
const Driver = require('../driver/modal/driver');

function authMiddleware(allowedRoles = []) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header:', authHeader); // Log the header

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token); // Log the token

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'maate_secret_key');
      console.log('Decoded Token:', decoded); // Log decoded payload

      let user = null;
      let userType = null;

      user = await Admin.findById(decoded.id).select('-otp -otpExpiry');
      if (user) userType = 'admin';
      console.log('Admin Check:', user ? 'Found' : 'Not found');

      if (!user) {
        user = await User.findById(decoded.id).select('-otp -otpExpiry');
        if (user) userType = 'user';
        console.log('User Check:', user ? 'Found' : 'Not found');
      }

      if (!user) {
        user = await Restaurant.findById(decoded.id).select('-otp -otpExpiry');
        if (user) userType = 'restaurant';
        console.log('Restaurant Check:', user ? 'Found' : 'Not found');
      }

      if (!user) {
        user = await Driver.findById(decoded.id).select('-otp -otpExpiry');
        if (user) userType = 'driver';
        console.log('Driver Check:', user ? 'Found' : 'Not found');
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      console.log('User:', user); // Log user details
      console.log('User Type:', userType); // Log user type

      // Check account status
      if (userType === 'admin') {
        if (user.isActive === false) {
          return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }
      } else if (userType === 'user') {
        if (user.isBlocked) {
          return res.status(401).json({ success: false, message: 'Account is blocked', reason: user.blockedReason });
        }
        if (!user.isActive) {
          return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }
      } else if (userType === 'restaurant') {
        // Allow unapproved restaurants to access profile update endpoints
        // This enables them to complete their profile setup
        if (!user.isActive) {
          return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }
        // Note: isApproved check is removed to allow profile completion
        // Restaurant will be approved by admin after profile is complete
      } else if (userType === 'driver') {
        if (!user.isActive) {
          return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }
      
      }

      user.userType = userType;
      req.user = user;

      if (allowedRoles.length > 0) {
        const userRole = userType === 'admin' ? user.role : userType;
        console.log('User Role:', userRole, 'Allowed Roles:', allowedRoles); // Log role check
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: Insufficient role. Required: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
          });
        }
      }

      next();
    } catch (err) {
      console.error('Token Error:', err.message); // Log error details
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
}

module.exports = authMiddleware;