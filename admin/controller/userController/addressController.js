const User = require('../../../user/modal/user');

// @desc    Get all user addresses (Admin only)
// @route   GET /api/admin/users/addresses
// @access  Private (Admin)
const getAllAddresses = async (req, res) => {
  try {
    console.log('🏠 getAllAddresses - Request received:', { 
      query: req.query, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { city, state, pincode, page = 1, limit = 10, search } = req.query;
    console.log('🏠 getAllAddresses - Query parameters:', { city, state, pincode, page, limit, search });
    
    let query = {};
    
    // City filter
    if (city) {
      query.city = { $regex: city, $options: 'i' };
      console.log('🏠 getAllAddresses - Applied city filter:', city);
    }
    
    // State filter
    if (state) {
      query.state = { $regex: state, $options: 'i' };
      console.log('🏠 getAllAddresses - Applied state filter:', state);
    }
    
    // Pincode filter
    if (pincode) {
      query.pincode = pincode;
      console.log('🏠 getAllAddresses - Applied pincode filter:', pincode);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.phone': { $regex: search, $options: 'i' } }
      ];
      console.log('🏠 getAllAddresses - Applied search filter:', search);
    }

    console.log('🏠 getAllAddresses - Final query object:', JSON.stringify(query, null, 2));
    console.log('🏠 getAllAddresses - Pagination:', { page, limit, skip: (page - 1) * limit });

    // Get users with addresses that match the query
    console.log('🏠 getAllAddresses - Fetching users with addresses...');
    const users = await User.find({
      'addresses': { $exists: true, $ne: [] }
    }).select('firstName lastName phone profileImage addresses');
    
    console.log('🏠 getAllAddresses - Users found:', users.length);
    
    // Filter addresses based on query
    console.log('🏠 getAllAddresses - Filtering addresses...');
    let filteredAddresses = [];
    users.forEach(user => {
      user.addresses.forEach(address => {
        let matches = true;
        
        if (city && !address.city.toLowerCase().includes(city.toLowerCase())) matches = false;
        if (state && !address.state.toLowerCase().includes(state.toLowerCase())) matches = false;
        if (pincode && address.pincode !== pincode) matches = false;
        if (search) {
          const searchLower = search.toLowerCase();
          const addressText = `${address.fullAddress} ${address.city} ${address.state}`.toLowerCase();
          if (!addressText.includes(searchLower)) matches = false;
        }
        
        if (matches) {
          filteredAddresses.push({
            _id: address._id,
            user: {
              _id: user._id,
              name: user.fullName,
              phone: user.phone,
              profileImage: user.profileImage
            },
            ...address.toObject()
          });
        }
      });
    });
    
    console.log('🏠 getAllAddresses - Addresses filtered:', filteredAddresses.length);
    
    // Sort and paginate
    console.log('🏠 getAllAddresses - Sorting and paginating addresses...');
    filteredAddresses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = filteredAddresses.length;
    const startIndex = (page - 1) * limit;
    const addresses = filteredAddresses.slice(startIndex, startIndex + limit);

    const response = {
      success: true,
      count: addresses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: addresses
    };

    console.log('✅ getAllAddresses - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAllAddresses - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user addresses',
      error: error.message
    });
  }
};

// @desc    Get address by ID (Admin only)
// @route   GET /api/admin/users/addresses/:id
// @access  Private (Admin)
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🏠 getAddressById - Request received:', { 
      addressId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Find user with the specific address
    console.log('🏠 getAddressById - Finding user with address...');
    const user = await User.findOne({ 'addresses._id': id });
    
    if (!user) {
      console.log('❌ getAddressById - User with address not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    console.log('🏠 getAddressById - User found:', { userId: user._id, name: user.fullName });
    
    const address = user.addresses.id(id);
    if (!address) {
      console.log('❌ getAddressById - Address not found in user:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    console.log('✅ getAddressById - Address found successfully:', {
      addressId: address._id,
      city: address.city,
      state: address.state
    });
    
    // Format response
    const addressData = {
      _id: address._id,
      user: {
        _id: user._id,
        name: user.fullName,
        phone: user.phone,
        profileImage: user.profileImage
      },
      ...address.toObject()
    };

    res.status(200).json({
      success: true,
      data: addressData
    });

  } catch (error) {
    console.error('❌ getAddressById - Error occurred:', {
      addressId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user address',
      error: error.message
    });
  }
};

// @desc    Update address (Admin only)
// @route   PUT /api/admin/users/addresses/:id/update
// @access  Private (Admin)
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, state, pincode, isDefault, isActive } = req.body;
    console.log('✏️ updateAddress - Request received:', { 
      addressId: id, 
      updates: { address, city, state, pincode, isDefault, isActive },
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Find user with the specific address
    console.log('✏️ updateAddress - Finding user with address...');
    const user = await User.findOne({ 'addresses._id': id });
    
    if (!user) {
      console.log('❌ updateAddress - User with address not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    console.log('✏️ updateAddress - User found:', { userId: user._id, name: user.fullName });
    
    const addressDoc = user.addresses.id(id);
    if (!addressDoc) {
      console.log('❌ updateAddress - Address not found in user:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    console.log('✏️ updateAddress - Applying updates...');
    // Update fields
    if (address !== undefined) {
      addressDoc.fullAddress = address;
      console.log('✏️ updateAddress - Updated address:', address);
    }
    if (city !== undefined) {
      addressDoc.city = city;
      console.log('✏️ updateAddress - Updated city:', city);
    }
    if (state !== undefined) {
      addressDoc.state = state;
      console.log('✏️ updateAddress - Updated state:', state);
    }
    if (pincode !== undefined) {
      addressDoc.pincode = pincode;
      console.log('✏️ updateAddress - Updated pincode:', pincode);
    }
    if (isDefault !== undefined) {
      addressDoc.isDefault = isDefault;
      console.log('✏️ updateAddress - Updated isDefault:', isDefault);
    }
    if (isActive !== undefined) {
      addressDoc.isActive = isActive;
      console.log('✏️ updateAddress - Updated isActive:', isActive);
    }

    // If setting as default, unset other addresses as default
    if (isDefault) {
      console.log('✏️ updateAddress - Setting as default, unsetting other addresses...');
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== id) {
          addr.isDefault = false;
        }
      });
    }

    console.log('✏️ updateAddress - Saving user...');
    await user.save();

    console.log('✅ updateAddress - Address updated successfully:', {
      addressId: addressDoc._id,
      city: addressDoc.city,
      state: addressDoc.state,
      isDefault: addressDoc.isDefault,
      isActive: addressDoc.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: addressDoc
    });

  } catch (error) {
    console.error('❌ updateAddress - Error occurred:', {
      addressId: req.params.id,
      updates: req.body,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
};

// @desc    Verify address (Admin only)
// @route   PUT /api/admin/users/addresses/:id/verify
// @access  Private (Admin)
const verifyAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    console.log('✅ verifyAddress - Request received:', { 
      addressId: id, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Find user with the specific address
    console.log('✅ verifyAddress - Finding user with address...');
    const user = await User.findOne({ 'addresses._id': id });
    
    if (!user) {
      console.log('❌ verifyAddress - User with address not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    console.log('✅ verifyAddress - User found:', { userId: user._id, name: user.fullName });
    
    const address = user.addresses.id(id);
    if (!address) {
      console.log('❌ verifyAddress - Address not found in user:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (address.isVerified) {
      console.log('❌ verifyAddress - Address already verified:', id);
      return res.status(400).json({
        success: false,
        message: 'Address is already verified'
      });
    }

    console.log('✅ verifyAddress - Verifying address...');
    address.isVerified = true;
    address.verifiedAt = new Date();

    console.log('✅ verifyAddress - Saving user...');
    await user.save();

    console.log('✅ verifyAddress - Address verified successfully:', {
      addressId: address._id,
      verifiedAt: address.verifiedAt
    });

    res.status(200).json({
      success: true,
      message: 'Address verified successfully',
      data: address
    });

  } catch (error) {
    console.error('❌ verifyAddress - Error occurred:', {
      addressId: req.params.id,
      adminNote: req.body.adminNote,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error verifying address',
      error: error.message
    });
  }
};

// @desc    Get address statistics (Admin only)
// @route   GET /api/admin/users/addresses/stats
// @access  Private (Admin)
const getAddressStats = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 getAddressStats - Request received:', { 
      user: req.user?.id,
      userId,
      timestamp: new Date().toISOString()
    });

    let query = {};
    if (userId) {
      query._id = userId;
      console.log('📊 getAddressStats - Filtering for specific user:', userId);
    }

    // Aggregate address statistics from users
    console.log('📊 getAddressStats - Getting basic address statistics...');
    const addressStats = await User.aggregate([
      { $match: query },
      { $unwind: '$addresses' },
      {
        $group: {
          _id: null,
          totalAddresses: { $sum: 1 },
          verifiedAddresses: { $sum: { $cond: ['$addresses.isVerified', 1, 0] } },
          unverifiedAddresses: { $sum: { $cond: ['$addresses.isVerified', 0, 1] } },
          activeAddresses: { $sum: { $cond: ['$addresses.isActive', 1, 0] } },
          defaultAddresses: { $sum: { $cond: ['$addresses.isDefault', 1, 0] } }
        }
      }
    ]);

    const stats = addressStats[0] || {
      totalAddresses: 0,
      verifiedAddresses: 0,
      unverifiedAddresses: 0,
      activeAddresses: 0,
      defaultAddresses: 0
    };

    console.log('📊 getAddressStats - Basic stats completed:', stats);

    // City distribution
    console.log('📊 getAddressStats - Getting city distribution...');
    const cityStats = await User.aggregate([
      { $match: query },
      { $unwind: '$addresses' },
      {
        $group: {
          _id: '$addresses.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    console.log('📊 getAddressStats - City distribution completed, count:', cityStats.length);

    // State distribution
    console.log('📊 getAddressStats - Getting state distribution...');
    const stateStats = await User.aggregate([
      { $match: query },
      { $unwind: '$addresses' },
      {
        $group: {
          _id: '$addresses.state',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log('📊 getAddressStats - State distribution completed, count:', stateStats.length);

    // Monthly address count
    console.log('📊 getAddressStats - Getting monthly stats...');
    const monthlyStats = await User.aggregate([
      { $match: query },
      { $unwind: '$addresses' },
      {
        $group: {
          _id: {
            year: { $year: '$addresses.createdAt' },
            month: { $month: '$addresses.createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    console.log('📊 getAddressStats - Monthly stats completed, count:', monthlyStats.length);

    const response = {
      success: true,
      data: {
        total: stats.totalAddresses,
        verified: stats.verifiedAddresses,
        unverified: stats.unverifiedAddresses,
        active: stats.activeAddresses,
        default: stats.defaultAddresses,
        cityDistribution: cityStats,
        stateDistribution: stateStats,
        monthlyTrend: monthlyStats
      }
    };

    console.log('✅ getAddressStats - Success response prepared:', {
      success: response.success,
      total: response.data.total,
      verified: response.data.verified,
      active: response.data.active,
      default: response.data.default
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAddressStats - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching address statistics',
      error: error.message
    });
  }
};

// @desc    Get addresses by user (Admin only)
// @route   GET /api/admin/users/:userId/addresses
// @access  Private (Admin)
const getAddressesByUser = async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      console.log('🏠 getAddressesByUser - Request received:', { 
        userId, 
        page, 
        limit, 
        user: req.user?.id,
        timestamp: new Date().toISOString()
      });
  
      // Check if user exists
      console.log('🏠 getAddressesByUser - Checking if user exists...');
      const user = await User.findById(userId).select('addresses');
      if (!user) {
        console.log('❌ getAddressesByUser - User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      console.log('🏠 getAddressesByUser - User found, addresses count:', user.addresses.length);
  
      // Sort addresses: default first, then by creation date (newest first)
      console.log('🏠 getAddressesByUser - Sorting addresses...');
      const sortedAddresses = user.addresses.sort((a, b) => {
        if (a.isDefault !== b.isDefault) return b.isDefault - a.isDefault;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  
      // Pagination
      console.log('🏠 getAddressesByUser - Applying pagination...');
      const startIndex = (page - 1) * limit;
      const paginatedAddresses = sortedAddresses.slice(startIndex, startIndex + Number(limit));
      const total = user.addresses.length;

      const response = {
        success: true,
        count: paginatedAddresses.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        data: paginatedAddresses
      };

      console.log('✅ getAddressesByUser - Success response prepared:', {
        success: response.success,
        count: response.count,
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage
      });
  
      return res.status(200).json(response);
  
    } catch (error) {
      console.error('❌ getAddressesByUser - Error occurred:', {
        userId: req.params.userId,
        page: req.query.page,
        limit: req.query.limit,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({
        success: false,
        message: 'Error fetching user addresses',
        error: error.message
      });
    }
  };
  

// @desc    Delete address (Admin only)
// @route   DELETE /api/admin/users/addresses/:id
// @access  Private (Admin)
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log('🗑️ deleteAddress - Request received:', { 
      addressId: id, 
      reason, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!reason || reason.trim().length < 10) {
      console.log('❌ deleteAddress - Invalid deletion reason:', reason);
      return res.status(400).json({
        success: false,
        message: 'Deletion reason must be at least 10 characters'
      });
    }

    // Find user with the specific address
    console.log('🗑️ deleteAddress - Finding user with address...');
    const user = await User.findOne({ 'addresses._id': id });
    
    if (!user) {
      console.log('❌ deleteAddress - User with address not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    console.log('🗑️ deleteAddress - User found:', { userId: user._id, name: user.fullName });
    
    const address = user.addresses.id(id);
    if (!address) {
      console.log('❌ deleteAddress - Address not found in user:', id);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    console.log('🗑️ deleteAddress - Address found, removing...');
    // Remove the address from the user's addresses array
    const previousCount = user.addresses.length;
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== id);
    
    console.log('🗑️ deleteAddress - Saving user...');
    await user.save();

    console.log('✅ deleteAddress - Address deleted successfully:', {
      addressId: id,
      previousCount,
      newCount: user.addresses.length
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('❌ deleteAddress - Error occurred:', {
      addressId: req.params.id,
      reason: req.body.reason,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: error.message
    });
  }
};

module.exports = {
  getAllAddresses,
  getAddressById,
  updateAddress,
  verifyAddress,
  getAddressStats,
  getAddressesByUser,
  deleteAddress
};
