const Offer = require('../modal/offer');
const Restaurant = require('../modal/restaurant');
const { uploadImageToS3, deleteFromS3, updateFromS3 } = require('../../utils/s3Utils');

// Create a new offer
const createOffer = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] createOffer called');
    console.log('📝 [OFFER_CONTROLLER] Request body:', req.body);
    console.log('📁 [OFFER_CONTROLLER] Request files:', req.files);
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const {
            offerTitle,
            discountAmount,
            startDate,
            endDate
        } = req.body;

        const restaurantId = req.user.id;

        console.log('🔍 [OFFER_CONTROLLER] Extracted data:', {
            offerTitle,
            discountAmount,
            startDate,
            endDate,
            restaurantId
        });

        // Validate restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            console.log('❌ [OFFER_CONTROLLER] Restaurant not found:', restaurantId);
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        console.log('✅ [OFFER_CONTROLLER] Restaurant validation passed:', restaurant.name);

        // Handle uploaded image
        let offerImageUrl = null;
        if (req.files?.offerImage && req.files.offerImage[0]) {
            console.log('📸 [OFFER_CONTROLLER] Processing offer image upload');
            try {
                offerImageUrl = await uploadImageToS3(req.files.offerImage[0], 'restaurants/offers');
                console.log('✅ [OFFER_CONTROLLER] Offer image uploaded to S3:', offerImageUrl);
            } catch (uploadError) {
                console.error('❌ [OFFER_CONTROLLER] Image upload failed:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading offer image'
                });
            }
        } else {
            console.log('❌ [OFFER_CONTROLLER] No offer image provided');
            return res.status(400).json({
                success: false,
                message: 'Offer image is required'
            });
        }

        console.log('✅ [OFFER_CONTROLLER] Creating new offer...');
        
        const offer = new Offer({
            offerImage: offerImageUrl,
            offerTitle,
            discountAmount,
            startDate,
            endDate,
            restaurantId
        });

        await offer.save();
        console.log('✅ [OFFER_CONTROLLER] Offer saved successfully, ID:', offer._id);

        res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            data: offer
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Create Offer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating offer',
            error: error.message
        });
    }
};

// Get all offers for a restaurant
const getAllOffers = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] getAllOffers called');
    console.log('🔍 [OFFER_CONTROLLER] Query params:', req.query);
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const restaurantId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        console.log('🔍 [OFFER_CONTROLLER] Applied filters:', { page, limit });

        const query = { restaurantId };
        console.log('🔍 [OFFER_CONTROLLER] Final query:', query);

        const offers = await Offer.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Offer.countDocuments(query);
        console.log('✅ [OFFER_CONTROLLER] Offers fetched successfully:', { count: offers.length, total });

        res.status(200).json({
            success: true,
            data: offers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Get All Offers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching offers',
            error: error.message
        });
    }
};

// Get active offers for a restaurant
const getActiveOffers = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] getActiveOffers called');
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const restaurantId = req.user.id;
        console.log('🔍 [OFFER_CONTROLLER] Finding active offers for restaurant:', restaurantId);

        const offers = await Offer.findActiveOffers(restaurantId)
            .sort({ createdAt: -1 });

        console.log('✅ [OFFER_CONTROLLER] Active offers fetched successfully:', { count: offers.length });

        res.status(200).json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Get Active Offers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active offers',
            error: error.message
        });
    }
};

// Get offer by ID
const getOfferById = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] getOfferById called');
    console.log('🔍 [OFFER_CONTROLLER] Offer ID:', req.params.offerId);
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const { offerId } = req.params;
        const restaurantId = req.user.id;

        console.log('🔍 [OFFER_CONTROLLER] Finding offer:', { offerId, restaurantId });

        const offer = await Offer.findOne({ _id: offerId, restaurantId });

        if (!offer) {
            console.log('❌ [OFFER_CONTROLLER] Offer not found:', offerId);
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        console.log('✅ [OFFER_CONTROLLER] Offer found successfully:', offer.offerTitle);

        res.status(200).json({
            success: true,
            data: offer
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Get Offer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching offer',
            error: error.message
        });
    }
};

// Update offer
const updateOffer = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] updateOffer called');
    console.log('🔍 [OFFER_CONTROLLER] Offer ID:', req.params.offerId);
    console.log('📝 [OFFER_CONTROLLER] Request body:', req.body);
    console.log('📁 [OFFER_CONTROLLER] Request files:', req.files);
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const { offerId } = req.params;
        const restaurantId = req.user.id;
        const updateData = req.body;

        console.log('🔍 [OFFER_CONTROLLER] Update data:', updateData);

        // Remove fields that shouldn't be updated
        delete updateData.restaurantId;

        console.log('🔍 [OFFER_CONTROLLER] Finding offer to update:', offerId);
        const offer = await Offer.findOne({ _id: offerId, restaurantId });

        if (!offer) {
            console.log('❌ [OFFER_CONTROLLER] Offer not found for update:', offerId);
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        console.log('✅ [OFFER_CONTROLLER] Offer found for update:', offer.offerTitle);

        // Handle image update if provided
        if (req.files?.offerImage) {
            console.log('📸 [OFFER_CONTROLLER] Processing image update');
            try {
                if (offer.offerImage) {
                    console.log('🗑️ [OFFER_CONTROLLER] Deleting old image from S3');
                    await deleteFromS3(offer.offerImage);
                }
                
                console.log('📤 [OFFER_CONTROLLER] Uploading new image to S3');
                const newImageUrl = await uploadImageToS3(req.files.offerImage[0], 'restaurants/offers');
                updateData.offerImage = newImageUrl;
                console.log('✅ [OFFER_CONTROLLER] New image uploaded:', newImageUrl);
            } catch (imageError) {
                console.error('❌ [OFFER_CONTROLLER] Image update failed:', imageError);
                return res.status(400).json({
                    success: false,
                    message: 'Error updating offer image'
                });
            }
        }

        console.log('💾 [OFFER_CONTROLLER] Saving updated offer...');
        
        // Update the offer
        Object.assign(offer, updateData);
        await offer.save();
        
        console.log('✅ [OFFER_CONTROLLER] Offer updated successfully');

        res.status(200).json({
            success: true,
            message: 'Offer updated successfully',
            data: offer
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Update Offer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating offer',
            error: error.message
        });
    }
};

// Delete offer
const deleteOffer = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] deleteOffer called');
    console.log('🔍 [OFFER_CONTROLLER] Offer ID:', req.params.offerId);
    console.log('👤 [OFFER_CONTROLLER] Restaurant ID:', req.user?.id);
    
    try {
        const { offerId } = req.params;
        const restaurantId = req.user.id;

        console.log('🔍 [OFFER_CONTROLLER] Finding offer to delete:', offerId);
        const offer = await Offer.findOne({ _id: offerId, restaurantId });

        if (!offer) {
            console.log('❌ [OFFER_CONTROLLER] Offer not found for deletion:', offerId);
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        console.log('✅ [OFFER_CONTROLLER] Offer found for deletion:', offer.offerTitle);

        // Delete image from S3 if exists
        if (offer.offerImage) {
            console.log('🗑️ [OFFER_CONTROLLER] Deleting image from S3:', offer.offerImage);
            try {
                await deleteFromS3(offer.offerImage);
                console.log('✅ [OFFER_CONTROLLER] Image deleted from S3');
            } catch (deleteError) {
                console.error('⚠️ [OFFER_CONTROLLER] Failed to delete image from S3:', deleteError);
                // Continue with offer deletion even if image deletion fails
            }
        }

        console.log('🗑️ [OFFER_CONTROLLER] Deleting offer from database...');
        await offer.deleteOne();
        console.log('✅ [OFFER_CONTROLLER] Offer deleted from database');

        res.status(200).json({
            success: true,
            message: 'Offer deleted successfully'
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Delete Offer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting offer',
            error: error.message
        });
    }
};

// Toggle offer active status
const toggleOfferStatus = async (req, res) => {
    try {
        const { offerId } = req.params;
        const restaurantId = req.user.id;

        const offer = await Offer.findOne({ _id: offerId, restaurantId });

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        res.status(200).json({
            success: true,
            message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
            data: offer
        });
    } catch (error) {
        console.error('Error toggling offer status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling offer status',
            error: error.message
        });
    }
};

// Get offer usage statistics
const getOfferUsageStats = async (req, res) => {
    try {
        const { offerId } = req.params;
        const restaurantId = req.user.id;

        const offer = await Offer.findOne({ _id: offerId, restaurantId })
            .populate('userUsage.userId', 'name email');

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        const totalUsage = offer.userUsage.reduce((sum, usage) => sum + usage.usageCount, 0);
        const uniqueUsers = offer.userUsage.length;

        const stats = {
            offerId: offer._id,
            offerTitle: offer.offerTitle,
            totalUsage,
            uniqueUsers,
            maxUsagePerUser: offer.maxUsagePerUser,
            userUsage: offer.userUsage,
            isActive: offer.isActive,
            isValid: offer.isValid
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching offer usage stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching offer usage stats',
            error: error.message
        });
    }
};

// Record offer usage (for when a user uses an offer)
const recordOfferUsage = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { userId } = req.body;

        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        if (!offer.canUserUseOffer(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User cannot use this offer'
            });
        }

        await offer.recordUsage(userId);

        res.status(200).json({
            success: true,
            message: 'Offer usage recorded successfully'
        });
    } catch (error) {
        console.error('Error recording offer usage:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording offer usage',
            error: error.message
        });
    }
};

// Get offers for public API (for customers)
const getPublicOffers = async (req, res) => {
    console.log('🚀 [OFFER_CONTROLLER] getPublicOffers called');
    console.log('🔍 [OFFER_CONTROLLER] Restaurant ID:', req.params.restaurantId);
    
    try {
        const { restaurantId } = req.params;
        console.log('🔍 [OFFER_CONTROLLER] Finding public offers for restaurant:', restaurantId);

        const offers = await Offer.findActiveOffers(restaurantId)
            .sort({ createdAt: -1 });

        console.log('✅ [OFFER_CONTROLLER] Public offers fetched successfully:', { count: offers.length });

        res.status(200).json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('❌ [OFFER_CONTROLLER] Get Public Offers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching offers',
            error: error.message
        });
    }
};

module.exports = {
    createOffer,
    getAllOffers,
    getActiveOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    getOfferUsageStats,
    recordOfferUsage,
    getPublicOffers
}; 