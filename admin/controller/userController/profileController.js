const User = require('../../../user/modal/user');

// @desc    Get all user profiles (Admin only)
// @route   GET /api/admin/users/profiles
// @access  Private (Admin)
const getAllProfiles = async (req, res) => {
  try {
    console.log('👥 getAllProfiles - Request received:', { 
      query: req.query, 
      adminUser: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { status, verified, page = 1, limit = 10, search } = req.query;
    console.log('👥 getAllProfiles - Query parameters:', { status, verified, page, limit, search });
    
    let query = {};
    
    // Status filter
    if (status) {
      if (status === 'active') {
        query.isActive = true;
        query.isBlocked = false;
        console.log('👥 getAllProfiles - Applied active status filter');
      } else if (status === 'blocked') {
        query.isBlocked = true;
        console.log('👥 getAllProfiles - Applied blocked status filter');
      } else if (status === 'inactive') {
        query.isActive = false;
        console.log('👥 getAllProfiles - Applied inactive status filter');
      }
    }
    
    // Verification filter
    if (verified === 'true') {
      query.isVerified = true;
      console.log('👥 getAllProfiles - Applied verified filter: true');
    } else if (verified === 'false') {
      query.isVerified = false;
      console.log('👥 getAllProfiles - Applied verified filter: false');
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'profile.email': { $regex: search, $options: 'i' } },
        { 'profile.city': { $regex: search, $options: 'i' } }
      ];
      console.log('👥 getAllProfiles - Applied search filter:', search);
    }

    console.log('👥 getAllProfiles - Final query object:', JSON.stringify(query, null, 2));
    console.log('👥 getAllProfiles - Pagination:', { page, limit, skip: (page - 1) * limit });

    console.log('🔍 getAllProfiles - Executing database query...');
    const users = await User.find(query)
      .select('-otp -otpExpiry -password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('✅ getAllProfiles - Database query completed. Found users count:', users.length);

    console.log('🔍 getAllProfiles - Getting total count...');
    const total = await User.countDocuments(query);
    console.log('📊 getAllProfiles - Total users count:', total);

    const response = {
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users.map(user => user.completeProfile)
    };

    console.log('✅ getAllProfiles - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAllProfiles - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user profiles',
      error: error.message
    });
  }
};

// @desc    Get user profile by ID (Admin only)
// @route   GET /api/admin/users/profiles/:id
// @access  Private (Admin)
const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 getProfileById - Request received:', { 
      userId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('👤 getProfileById - Executing database query...');
    const user = await User.findById(id)
      .select('-otp -otpExpiry -password');
    
    if (!user) {
      console.log('❌ getProfileById - User profile not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    console.log('✅ getProfileById - User profile found successfully:', {
      userId: user._id,
      name: user.name,
      email: user.profile?.email
    });

    res.status(200).json({
      success: true,
      data: user.completeProfile
    });

  } catch (error) {
    console.error('❌ getProfileById - Error occurred:', {
      userId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile (Admin only)
// @route   PUT /api/admin/users/profiles/:id/update
// @access  Private (Admin)
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profile, isActive, isBlocked, isVerified } = req.body;
    console.log('✏️ updateProfile - Request received:', { 
      userId: id, 
      updates: { name, profile, isActive, isBlocked, isVerified },
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('✏️ updateProfile - Finding user...');
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ updateProfile - User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✏️ updateProfile - User found, applying updates...');
    // Update basic fields
    if (name !== undefined) {
      user.name = name;
      console.log('✏️ updateProfile - Updated name:', name);
    }
    if (isActive !== undefined) {
      user.isActive = isActive;
      console.log('✏️ updateProfile - Updated isActive:', isActive);
    }
    if (isBlocked !== undefined) {
      user.isBlocked = isBlocked;
      console.log('✏️ updateProfile - Updated isBlocked:', isBlocked);
    }
    if (isVerified !== undefined) {
      user.isVerified = isVerified;
      console.log('✏️ updateProfile - Updated isVerified:', isVerified);
    }

    // Update profile fields
    if (profile) {
      if (profile.email !== undefined) {
        user.profile.email = profile.email;
        console.log('✏️ updateProfile - Updated email:', profile.email);
      }
      if (profile.address !== undefined) {
        user.profile.address = profile.address;
        console.log('✏️ updateProfile - Updated address:', profile.address);
      }
      if (profile.city !== undefined) {
        user.profile.city = profile.city;
        console.log('✏️ updateProfile - Updated city:', profile.city);
      }
      if (profile.state !== undefined) {
        user.profile.state = profile.state;
        console.log('✏️ updateProfile - Updated state:', profile.state);
      }
      if (profile.pincode !== undefined) {
        user.profile.pincode = profile.pincode;
        console.log('✏️ updateProfile - Updated pincode:', profile.pincode);
      }
      if (profile.bio !== undefined) {
        user.profile.bio = profile.bio;
        console.log('✏️ updateProfile - Updated bio:', profile.bio);
      }
    }

    user.profileUpdatedBy = req.user.id;
    user.profileUpdatedAt = new Date();
    console.log('✏️ updateProfile - Set metadata:', {
      updatedBy: user.profileUpdatedBy,
      updatedAt: user.profileUpdatedAt
    });

    console.log('✏️ updateProfile - Saving user...');
    await user.save();

    console.log('✅ updateProfile - User profile updated successfully:', {
      userId: user._id,
      name: user.name,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      isVerified: user.isVerified
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: user.completeProfile
    });

  } catch (error) {
    console.error('Update User Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// @desc    Verify user profile (Admin only)
// @route   PUT /api/admin/users/profiles/:id/verify
// @access  Private (Admin)
const verifyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    console.log('✅ verifyProfile - Request received:', { 
      userId: id, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('✅ verifyProfile - Finding user...');
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ verifyProfile - User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      console.log('❌ verifyProfile - User profile already verified:', id);
      return res.status(400).json({
        success: false,
        message: 'User profile is already verified'
      });
    }

    console.log('✅ verifyProfile - Updating verification status...');
    user.isVerified = true;
    user.verifiedBy = req.user.id;
    user.verifiedAt = new Date();
    user.adminNote = adminNote;

    console.log('✅ verifyProfile - Saving user...');
    await user.save();

    console.log('✅ verifyProfile - User profile verified successfully:', {
      userId: user._id,
      verifiedBy: user.verifiedBy,
      verifiedAt: user.verifiedAt
    });

    res.status(200).json({
      success: true,
      message: 'User profile verified successfully',
      data: user.completeProfile
    });

  } catch (error) {
    console.error('❌ verifyProfile - Error occurred:', {
      userId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error verifying user profile',
      error: error.message
    });
  }
};

// @desc    Get user verification documents (Admin only)
// @route   GET /api/admin/users/profiles/:id/documents
// @access  Private (Admin)
const getUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 getUserDocuments - Request received:', { 
      userId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📄 getUserDocuments - Finding user...');
    const user = await User.findById(id)
      .select('profile verificationDocuments');
    
    if (!user) {
      console.log('❌ getUserDocuments - User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const documentsCount = user.verificationDocuments?.length || 0;
    console.log('✅ getUserDocuments - User documents found:', {
      userId: user._id,
      documentsCount
    });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        profile: user.profile,
        verificationDocuments: user.verificationDocuments || []
      }
    });

  } catch (error) {
    console.error('❌ getUserDocuments - Error occurred:', {
      userId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user documents',
      error: error.message
    });
  }
};

// @desc    Approve user documents (Admin only)
// @route   PUT /api/admin/users/profiles/:id/documents/approve
// @access  Private (Admin)
const approveUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentIds, adminNote } = req.body;
    console.log('✅ approveUserDocuments - Request received:', { 
      userId: id, 
      documentIds, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      console.log('❌ approveUserDocuments - Invalid document IDs:', documentIds);
      return res.status(400).json({
        success: false,
        message: 'Document IDs are required'
      });
    }

    console.log('✅ approveUserDocuments - Finding user...');
    const user = await User.findById(id);
    
    if (!user) {
      console.log('❌ approveUserDocuments - User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ approveUserDocuments - Updating document status...');
    let approvedCount = 0;
    // Update document status
    if (user.verificationDocuments) {
      user.verificationDocuments.forEach(doc => {
        if (documentIds.includes(doc._id.toString())) {
          doc.status = 'approved';
          doc.approvedBy = req.user.id;
          doc.approvedAt = new Date();
          doc.adminNote = adminNote;
          approvedCount++;
        }
      });
    }

    user.documentsApprovedBy = req.user.id;
    user.documentsApprovedAt = new Date();

    console.log('✅ approveUserDocuments - Saving user...');
    await user.save();

    console.log('✅ approveUserDocuments - User documents approved successfully:', {
      userId: user._id,
      approvedCount,
      approvedBy: user.documentsApprovedBy,
      approvedAt: user.documentsApprovedAt
    });

    res.status(200).json({
      success: true,
      message: 'User documents approved successfully',
      data: user.verificationDocuments
    });

  } catch (error) {
    console.error('❌ approveUserDocuments - Error occurred:', {
      userId: req.params.id,
      documentIds: req.body.documentIds,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error approving user documents',
      error: error.message
    });
  }
};

// @desc    Get profile statistics (Admin only)
// @route   GET /api/admin/users/profiles/stats
// @access  Private (Admin)
const getProfileStats = async (req, res) => {
  try {
    console.log('📊 getProfileStats - Request received:', { 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📊 getProfileStats - Getting basic counts...');
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const activeUsers = await User.countDocuments({ isActive: true, isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    console.log('📊 getProfileStats - Basic counts completed:', {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: unverifiedUsers,
      active: activeUsers,
      blocked: blockedUsers
    });

    // Profile completion stats
    console.log('📊 getProfileStats - Getting profile completion stats...');
    const profileCompletionStats = await User.aggregate([
      {
        $project: {
          hasEmail: { $cond: [{ $ne: ['$profile.email', null] }, 1, 0] },
          hasAddress: { $cond: [{ $ne: ['$profile.address', null] }, 1, 0] },
          hasCity: { $cond: [{ $ne: ['$profile.city', null] }, 1, 0] },
          hasState: { $cond: [{ $ne: ['$profile.state', null] }, 1, 0] },
          hasPincode: { $cond: [{ $ne: ['$profile.pincode', null] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withEmail: { $sum: '$hasEmail' },
          withAddress: { $sum: '$hasAddress' },
          withCity: { $sum: '$hasCity' },
          withState: { $sum: '$hasState' },
          withPincode: { $sum: '$hasPincode' }
        }
      }
    ]);
    console.log('📊 getProfileStats - Profile completion stats completed:', profileCompletionStats[0] || {});

    // Monthly user registration
    console.log('📊 getProfileStats - Getting monthly stats...');
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
    console.log('📊 getProfileStats - Monthly stats completed:', monthlyStats);

    const response = {
      success: true,
      data: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        active: activeUsers,
        blocked: blockedUsers,
        profileCompletion: profileCompletionStats[0] || {},
        monthlyTrend: monthlyStats
      }
    };

    console.log('✅ getProfileStats - Success response prepared:', {
      success: response.success,
      total: response.data.total,
      verified: response.data.verified,
      active: response.data.active,
      blocked: response.data.blocked
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getProfileStats - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching profile statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllProfiles,
  getProfileById,
  updateProfile,
  verifyProfile,
  getUserDocuments,
  approveUserDocuments,
  getProfileStats
};
