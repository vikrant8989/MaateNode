const express = require('express');
const router = express.Router();
const Address = require('../../../user/modal/user');

const authMiddleware = require('../../../middlewres/auth');
const {
  getAllAddresses,
  getAddressById,
  updateAddress,
  verifyAddress,
  getAddressStats,
  getAddressesByUser,
  deleteAddress
} = require('../../controller/userController/addressController');

// @route   GET /api/admin/users/addresses
router.get('/', authMiddleware(['admin']), getAllAddresses);

// @route   GET /api/admin/users/addresses/stats
router.get('/stats', authMiddleware(['admin']), getAddressStats);

// @route   GET /api/admin/users/:userId/addresses
router.get('/user/:userId', authMiddleware(['admin']), getAddressesByUser);

// @route   GET /api/admin/users/:userId/addresses/:addressId - Get specific address for specific user
router.get('/user/:userId/:addressId', authMiddleware(['admin']), async (req, res) => {
  const { userId, addressId } = req.params;
  
  console.log('🔍 [ADDRESS_ROUTE] Request received for user ID:', userId, 'and address ID:', addressId);
  
  try {
    // Import the Address model
    const Address = require('../../../user/modal/address');
    
    console.log('🔍 [ADDRESS_ROUTE] Address model imported successfully');
    
    // Find the specific address for the specific user
    const address = await Address.findOne({ _id: addressId, user: userId });
    
    console.log('🔍 [ADDRESS_ROUTE] Address found:', address ? 'Yes' : 'No');
    
    if (!address) {
      console.log('🔍 [ADDRESS_ROUTE] Address not found for user:', userId, 'address:', addressId);
      return res.status(404).json({
        success: false,
        message: 'Address not found for this user'
      });
    }
    
    console.log('🔍 [ADDRESS_ROUTE] Address data:', {
      id: address._id,
      fullAddress: address.fullAddress,
      city: address.city,
      pincode: address.pincode,
      type: address.type,
      isDefault: address.isDefault,
      isActive: address.isActive
    });
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('❌ [ADDRESS_ROUTE] Error fetching user address:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user address',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:userId/addresses/stats
router.get('/:userId/stats', authMiddleware(['admin']), getAddressStats);

// @route   GET /api/admin/users/addresses/:id
router.get('/:id', authMiddleware(['admin']), getAddressById);

// @route   PUT /api/admin/users/addresses/:id/update
router.put('/:id/update', authMiddleware(['admin']), updateAddress);

// @route   PUT /api/admin/users/addresses/:id/verify
router.put('/:id/verify', authMiddleware(['admin']), verifyAddress);

// @route   DELETE /api/admin/users/addresses/:id
router.delete('/:id', authMiddleware(['admin']), deleteAddress);

module.exports = router;
