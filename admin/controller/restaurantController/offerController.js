const Offer = require('../../../restaurant/modal/offer');
const Restaurant = require('../../../restaurant/modal/restaurant');

// @desc    Get all offers (Admin only)
// @route   GET /api/admin/offers
// @access  Private (Admin)
const getAllOffers = async (req, res) => {
  try {
    console.log('🔍 [OFFER] getAllOffers called with query:', req.query);
    console.log('🔍 [OFFER] User making request:', req.user?.id, req.user?.userType);
    
    const { restaurantId, isValid, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (restaurantId) {
      query.restaurantId = restaurantId;
      console.log('🔍 [OFFER] Filtering by restaurantId:', restaurantId);
    }
    if (isValid !== undefined) {
      const now = new Date();
      console.log('🔍 [OFFER] Current time for validity check:', now);
      if (isValid === 'true') {
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
        console.log('🔍 [OFFER] Filtering for valid offers (currently active)');
      } else {
        query.$or = [
          { startDate: { $gt: now } },
          { endDate: { $lt: now } }
        ];
        console.log('🔍 [OFFER] Filtering for invalid offers (upcoming or expired)');
      }
    }
    
    console.log('🔍 [OFFER] Final query:', query);

    console.log('🔍 [OFFER] Executing database query...');
    const offers = await Offer.find(query)
      .populate('restaurantId', 'businessName email phone city state')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Offer.countDocuments(query);
    console.log('🔍 [OFFER] Found offers:', offers.length, 'Total:', total);

    res.status(200).json({
      success: true,
      count: offers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: offers
    });

  } catch (error) {
    console.error('❌ [OFFER] Get All Offers Error:', error);
    console.error('❌ [OFFER] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// @desc    Get offer by ID (Admin only)
// @route   GET /api/admin/offers/:id
// @access  Private (Admin)
const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id)
      .populate('restaurantId', 'businessName email phone address city state pinCode category specialization');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: offer
    });

  } catch (error) {
    console.error('Get Offer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// @desc    Toggle offer status (Admin only)
// @route   PUT /api/admin/offers/:id/toggle-status
// @access  Private (Admin)
const toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const offer = await Offer.findById(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // For offers, we can't directly toggle isActive since it's based on dates
    // Instead, we can extend or shorten the validity period
    if (isActive) {
      // Extend offer validity by 30 days if it's expired
      const now = new Date();
      if (offer.endDate < now) {
        offer.endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      }
    } else {
      // Expire the offer immediately
      offer.endDate = new Date();
    }

    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: offer
    });

  } catch (error) {
    console.error('Toggle Offer Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling offer status',
      error: error.message
    });
  }
};

// @desc    Get offer statistics for dashboard
// @route   GET /api/admin/offer-stats
// @access  Private (Admin)
const getOfferStats = async (req, res) => {
  try {
    const totalOffers = await Offer.countDocuments();
    const now = new Date();
    
    const activeOffers = await Offer.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    const expiredOffers = await Offer.countDocuments({
      endDate: { $lt: now }
    });
    
    const upcomingOffers = await Offer.countDocuments({
      startDate: { $gt: now }
    });

    // Get offers by restaurant
    const offersByRestaurant = await Offer.aggregate([
      {
        $group: {
          _id: '$restaurantId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $project: {
          restaurantName: { $arrayElemAt: ['$restaurantInfo.businessName', 0] },
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalOffers,
        active: activeOffers,
        expired: expiredOffers,
        upcoming: upcomingOffers,
        offersByRestaurant
      }
    });

  } catch (error) {
    console.error('Get Offer Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  toggleOfferStatus,
  getOfferStats
};
