const User = require('../../../user/modal/user');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 getAllUsers - Request received:', { 
      query: req.query, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { status, verified, city, state, page = 1, limit = 10 } = req.query;
    console.log('🔍 getAllUsers - Query parameters:', { status, verified, city, state, page, limit });
    
    let query = {};
    
    // Status filter
    if (status === 'active') {
      query.isActive = true;
      query.isBlocked = false;
      console.log('🔍 getAllUsers - Applied active status filter');
    } else if (status === 'blocked') {
      query.isBlocked = true;
      console.log('🔍 getAllUsers - Applied blocked status filter');
    } else if (status === 'inactive') {
      query.isActive = false;
      console.log('🔍 getAllUsers - Applied inactive status filter');
    }
    
    // Verification filter
    if (verified === 'true') {
      query.isVerified = true;
      console.log('🔍 getAllUsers - Applied verified filter: true');
    } else if (verified === 'false') {
      query.isVerified = false;
      console.log('🔍 getAllUsers - Applied verified filter: false');
    }
    
    // City filter
    if (city && city.trim()) {
      query.city = { $regex: city.trim(), $options: 'i' };
      console.log('🔍 getAllUsers - Applied city filter:', city.trim());
    }
    
    // State filter
    if (state && state.trim()) {
      query.state = { $regex: state.trim(), $options: 'i' };
      console.log('🔍 getAllUsers - Applied state filter:', state.trim());
    }

    console.log('🔍 getAllUsers - Final query object:', JSON.stringify(query, null, 2));
    console.log('🔍 getAllUsers - Pagination:', { page, limit, skip: (page - 1) * limit });

    console.log('🔍 getAllUsers - Executing database query...');
    const users = await User.find(query)
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🔍 getAllUsers - Database query completed. Found users count:', users.length);

    console.log('🔍 getAllUsers - Getting total count...');
    const total = await User.countDocuments(query);
    console.log('🔍 getAllUsers - Total users count:', total);

    const response = {
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users.map(user => user.completeProfile)
    };

    console.log('✅ getAllUsers - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAllUsers - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    console.log('🔍 getUserById - Request received:', { 
      params: req.params, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { id } = req.params;
    console.log('🔍 getUserById - Looking for user with ID:', id);

    console.log('🔍 getUserById - Executing database query...');
    const user = await User.findById(id).select('-otp -otpExpiry');
    
    if (!user) {
      console.log('❌ getUserById - User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ getUserById - User found:', {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone
    });

    const response = {
      success: true,
      data: user.completeProfile
    };

    console.log('✅ getUserById - Success response prepared');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getUserById - Error occurred:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Verify user (Admin only)
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin)
const verifyUser = async (req, res) => {
  try {
    console.log('✅ verifyUser - Request received:', { 
      params: req.params, 
      body: req.body,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('✅ verifyUser - Parameters:', { id, reason });
    
    if (!id) {
      console.log('❌ verifyUser - Missing user ID');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log('✅ verifyUser - Finding user in database...');
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ verifyUser - User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ verifyUser - User found:', {
      id: user._id,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      currentVerificationStatus: user.isVerified
    });
    
    if (user.isVerified) {
      console.log('✅ verifyUser - User already verified');
      return res.status(400).json({
        success: false,
        message: 'User is already verified'
      });
    }
    
    console.log('✅ verifyUser - Updating user verification status...');
    user.isVerified = true;
    user.verificationDate = new Date();
    user.verificationReason = reason || 'Admin verification';
    user.verifiedBy = req.user.id;
    
    await user.save();
    
    console.log('✅ verifyUser - User verification completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      data: {
        id: user._id,
        isVerified: user.isVerified,
        verificationDate: user.verificationDate,
        verificationReason: user.verificationReason
      }
    });
    
  } catch (error) {
    console.error('❌ verifyUser - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
};

// @desc    Block user (Admin only)
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
const blockUser = async (req, res) => {
  try {
    console.log('🚫 blockUser - Request received:', { 
      params: req.params, 
      body: req.body,
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('🚫 blockUser - Blocking user:', { userId: id, reason });

    if (!reason || reason.trim().length < 10) {
      console.log('❌ blockUser - Invalid reason provided:', { reason, length: reason?.trim().length });
      return res.status(400).json({
        success: false,
        message: 'Block reason must be at least 10 characters'
      });
    }

    console.log('🔍 blockUser - Looking for user with ID:', id);
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ blockUser - User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isBlocked) {
      console.log('❌ blockUser - User is already blocked:', { userId: id, currentStatus: user.isBlocked });
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    console.log('🚫 blockUser - User found, proceeding with blocking:', {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      currentStatus: user.isBlocked
    });

    user.isBlocked = true;
    user.blockedReason = reason.trim();
    
    console.log('💾 blockUser - Saving blocked user to database...');
    await user.save();
    console.log('✅ blockUser - User blocked successfully in database');

    const response = {
      success: true,
      message: 'User blocked successfully',
      data: user.completeProfile
    };

    console.log('✅ blockUser - Success response prepared:', {
      userId: user._id,
      blockedAt: new Date().toISOString(),
      reason: user.blockedReason
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ blockUser - Error occurred:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: error.message
    });
  }
};

// @desc    Unblock user (Admin only)
// @route   PUT /api/admin/users/:id/unblock
// @access  Private (Admin)
const unblockUser = async (req, res) => {
  try {
    console.log('🔓 unblockUser - Request received:', { 
      params: req.params, 
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { id } = req.params;
    console.log('🔓 unblockUser - Unblocking user with ID:', id);

    console.log('🔍 unblockUser - Looking for user with ID:', id);
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ unblockUser - User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isBlocked) {
      console.log('❌ unblockUser - User is not blocked:', { userId: id, currentStatus: user.isBlocked });
      return res.status(400).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    console.log('🔓 unblockUser - User found and is blocked, proceeding with unblocking:', {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      currentStatus: user.isBlocked,
      blockedReason: user.blockedReason
    });

    user.isBlocked = false;
    user.blockedReason = '';
    
    console.log('💾 unblockUser - Saving unblocked user to database...');
    await user.save();
    console.log('✅ unblockUser - User unblocked successfully in database');

    const response = {
      success: true,
      message: 'User unblocked successfully',
      data: user.completeProfile
    };

    console.log('✅ unblockUser - Success response prepared:', {
      userId: user._id,
      unblockedAt: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ unblockUser - Error occurred:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: error.message
    });
  }
};

// @desc    Toggle user status (Admin only)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    console.log('🔄 toggleUserStatus - Request received:', { 
      params: req.params, 
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { id } = req.params;
    console.log('🔄 toggleUserStatus - Toggling status for user with ID:', id);

    console.log('🔍 toggleUserStatus - Looking for user with ID:', id);
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ toggleUserStatus - User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🔄 toggleUserStatus - User found, current status:', {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      currentStatus: user.isActive,
      isBlocked: user.isBlocked
    });

    const previousStatus = user.isActive;
    user.isActive = !user.isActive;
    
    console.log('💾 toggleUserStatus - Saving user with new status:', {
      userId: user._id,
      previousStatus,
      newStatus: user.isActive
    });
    
    await user.save();
    console.log('✅ toggleUserStatus - User status updated successfully in database');

    const response = {
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user.completeProfile
    };

    console.log('✅ toggleUserStatus - Success response prepared:', {
      userId: user._id,
      statusChangedAt: new Date().toISOString(),
      newStatus: user.isActive
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ toggleUserStatus - Error occurred:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
};

// @desc    Get user statistics for dashboard
// @route   GET /api/admin/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    console.log('📊 getUserStats - Request received:', { 
      query: req.query, 
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('🔍 getUserStats - Starting database queries...');
    
    console.log('🔍 getUserStats - Getting total users count...');
    const totalUsers = await User.countDocuments();
    console.log('📊 getUserStats - Total users:', totalUsers);
    
    console.log('🔍 getUserStats - Getting active users count...');
    const activeUsers = await User.countDocuments({ isActive: true, isBlocked: false });
    console.log('📊 getUserStats - Active users:', activeUsers);
    
    console.log('🔍 getUserStats - Getting blocked users count...');
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    console.log('📊 getUserStats - Blocked users:', blockedUsers);
    
    console.log('🔍 getUserStats - Getting inactive users count...');
    const inactiveUsers = await User.countDocuments({ isActive: false });
    console.log('📊 getUserStats - Inactive users:', inactiveUsers);
    
    console.log('🔍 getUserStats - Getting new users today count...');
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    console.log('📊 getUserStats - New users today:', newUsersToday);
    
    console.log('🔍 getUserStats - Getting verified users count...');
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    console.log('📊 getUserStats - Verified users:', verifiedUsers);
    
    console.log('🔍 getUserStats - Getting unverified users count...');
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    console.log('📊 getUserStats - Unverified users:', unverifiedUsers);

    console.log('🔍 getUserStats - Getting monthly user registration trend...');
    // Monthly user registration trend
    const monthlyStats = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    console.log('📊 getUserStats - Monthly stats retrieved, months count:', monthlyStats.length);

    const statsData = {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      inactive: inactiveUsers,
      verified: verifiedUsers,
      unverified: unverifiedUsers,
      newToday: newUsersToday,
      monthlyTrend: monthlyStats
    };

    console.log('✅ getUserStats - All statistics collected:', {
      total: statsData.total,
      active: statsData.active,
      blocked: statsData.blocked,
      inactive: statsData.inactive,
      verified: statsData.verified,
      unverified: statsData.unverified,
      newToday: statsData.newToday,
      monthlyTrendCount: statsData.monthlyTrend.length
    });

    const response = {
      success: true,
      data: statsData
    };

    console.log('✅ getUserStats - Success response prepared');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getUserStats - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Search users (Admin only)
// @route   GET /api/admin/users/search
// @access  Private (Admin)
const searchUsers = async (req, res) => {
  try {
    console.log('🔍 searchUsers - Request received:', { 
      query: req.query, 
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { q, page = 1, limit = 10 } = req.query;
    console.log('🔍 searchUsers - Search parameters:', { query: q, page, limit });
    
    if (!q || q.trim().length < 2) {
      console.log('❌ searchUsers - Invalid search query:', { query: q, length: q?.trim().length });
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const query = {
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } }
      ]
    };

    console.log('🔍 searchUsers - Search query built:', JSON.stringify(query, null, 2));
    console.log('🔍 searchUsers - Pagination:', { page, limit, skip: (page - 1) * limit });

    console.log('🔍 searchUsers - Executing database search...');
    const users = await User.find(query)
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🔍 searchUsers - Search completed. Found users count:', users.length);

    console.log('🔍 searchUsers - Getting total count for pagination...');
    const total = await User.countDocuments(query);
    console.log('🔍 searchUsers - Total matching users:', total);

    const response = {
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users.map(user => user.completeProfile)
    };

    console.log('✅ searchUsers - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      searchQuery: q
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ searchUsers - Error occurred:', {
      message: error.message,
      stack: error.stack,
      searchQuery: req.query.q,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  verifyUser,
  blockUser,
  unblockUser,
  toggleUserStatus,
  getUserStats,
  searchUsers
};
