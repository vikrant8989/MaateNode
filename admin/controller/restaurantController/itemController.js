const Item = require('../../../restaurant/modal/item');
const Restaurant = require('../../../restaurant/modal/restaurant');
const Category = require('../../../restaurant/modal/category');

console.log('🚀 [ITEM_CONTROLLER] Item controller loaded successfully');

// @desc    Get all items (Admin only)
// @route   GET /api/admin/items
// @access  Private (Admin)
const getAllItems = async (req, res) => {
  console.log('🔍 [ITEM_CONTROLLER] getAllItems function called');
  console.log('🔍 [ITEM_CONTROLLER] Request params:', req.params);
  console.log('🔍 [ITEM_CONTROLLER] Request query:', req.query);
  console.log('🔍 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
  console.log('🔍 [ITEM_CONTROLLER] Request headers:', req.headers);
  
  try {
    console.log('🔍 [ITEM_CONTROLLER] getAllItems called with query:', req.query);
    console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
    
    const { restaurant, category, availability, isActive, page = 1, limit = 10 } = req.query;
    console.log('🔍 [ITEM_CONTROLLER] Extracted query parameters:', { restaurant, category, availability, isActive, page, limit });
    
    let query = {};
    console.log('🔍 [ITEM_CONTROLLER] Initial query object:', query);
    
    if (restaurant) {
      query.restaurant = restaurant;
      console.log('🔍 [ITEM_CONTROLLER] Added restaurant filter:', restaurant);
      console.log('🔍 [ITEM_CONTROLLER] Updated query object:', query);
    }
    if (category) {
      query.category = category;
      console.log('🔍 [ITEM_CONTROLLER] Added category filter:', category);
      console.log('🔍 [ITEM_CONTROLLER] Updated query object:', query);
    }
    if (availability) {
      query.availability = availability;
      console.log('🔍 [ITEM_CONTROLLER] Added availability filter:', availability);
      console.log('🔍 [ITEM_CONTROLLER] Updated query object:', query);
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      console.log('🔍 [ITEM_CONTROLLER] Added isActive filter:', query.isActive);
      console.log('🔍 [ITEM_CONTROLLER] Updated query object:', query);
    }
    
    console.log('🔍 [ITEM_CONTROLLER] Final query object:', query);
    console.log('🔍 [ITEM_CONTROLLER] Query JSON stringified:', JSON.stringify(query, null, 2));

    console.log('🔍 [ITEM_CONTROLLER] Executing database query...');
    console.log('🔍 [ITEM_CONTROLLER] Query details:', {
      query: query,
      populate: ['restaurant', 'category'],
      sort: { createdAt: -1 },
      limit: limit * 1,
      skip: (page - 1) * limit
    });
    
    const items = await Item.find(query)
      .populate('restaurant', 'businessName email phone city state')
      .populate('category', 'name description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🔍 [ITEM_CONTROLLER] Database query executed successfully');
    console.log('🔍 [ITEM_CONTROLLER] Raw items response:', items);
    console.log('🔍 [ITEM_CONTROLLER] Items count:', items.length);
    console.log('🔍 [ITEM_CONTROLLER] Sample item structure:', items[0] ? Object.keys(items[0]) : 'No items found');

    const total = await Item.countDocuments(query);
    console.log('🔍 [ITEM_CONTROLLER] Total count query executed');
    console.log('🔍 [ITEM_CONTROLLER] Total items in database:', total);
    console.log('🔍 [ITEM_CONTROLLER] Found items:', items.length, 'Total:', total);

    const responseData = {
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: items
    };
    
    console.log('🔍 [ITEM_CONTROLLER] Response data prepared:', responseData);
    console.log('🔍 [ITEM_CONTROLLER] Sending response...');

    res.status(200).json(responseData);
    
    console.log('✅ [ITEM_CONTROLLER] getAllItems completed successfully');

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get All Items Error:', error);
    console.error('❌ [ITEM_CONTROLLER] Error name:', error.name);
    console.error('❌ [ITEM_CONTROLLER] Error message:', error.message);
    console.error('❌ [ITEM_CONTROLLER] Error stack:', error.stack);
    console.error('❌ [ITEM_CONTROLLER] Error code:', error.code);
    console.error('❌ [ITEM_CONTROLLER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
    
    console.log('❌ [ITEM_CONTROLLER] Error response sent to client');
  }
};

// @desc    Get item by ID (Admin only)
// @route   GET /api/admin/items/:id
// @access  Private (Admin)
const getItemById = async (req, res) => {
  console.log('🔍 [ITEM_CONTROLLER] getItemById function called');
  console.log('🔍 [ITEM_CONTROLLER] Request params:', req.params);
  console.log('🔍 [ITEM_CONTROLLER] Request query:', req.query);
  console.log('🔍 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
  
  try {
    const { id } = req.params;
    console.log('🔍 [ITEM_CONTROLLER] Looking for item with ID:', id);
    console.log('🔍 [ITEM_CONTROLLER] ID type:', typeof id);
    console.log('🔍 [ITEM_CONTROLLER] ID length:', id ? id.length : 'N/A');

    console.log('🔍 [ITEM_CONTROLLER] Executing findById query...');
    console.log('🔍 [ITEM_CONTROLLER] Query details:', {
      id: id,
      populate: ['restaurant', 'category'],
      restaurantFields: 'businessName email phone address city state pinCode category specialization',
      categoryFields: 'name description image'
    });
    
    const item = await Item.findById(id)
      .populate('restaurant', 'businessName email phone address city state pinCode category specialization')
      .populate('category', 'name description image');
    
    console.log('🔍 [ITEM_CONTROLLER] Database query executed');
    console.log('🔍 [ITEM_CONTROLLER] Raw item response:', item);
    console.log('🔍 [ITEM_CONTROLLER] Item found:', !!item);
    
    if (item) {
      console.log('🔍 [ITEM_CONTROLLER] Item structure:', Object.keys(item));
      console.log('🔍 [ITEM_CONTROLLER] Item ID:', item._id);
      console.log('🔍 [ITEM_CONTROLLER] Item name:', item.name);
      console.log('🔍 [ITEM_CONTROLLER] Item restaurant:', item.restaurant);
      console.log('🔍 [ITEM_CONTROLLER] Item category:', item.category);
      console.log('🔍 [ITEM_CONTROLLER] Item isActive:', item.isActive);
      console.log('🔍 [ITEM_CONTROLLER] Item availability:', item.availability);
    }
    
    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const responseData = {
      success: true,
      data: item
    };
    
    console.log('🔍 [ITEM_CONTROLLER] Response data prepared:', responseData);
    console.log('🔍 [ITEM_CONTROLLER] Sending response...');

    res.status(200).json(responseData);
    
    console.log('✅ [ITEM_CONTROLLER] getItemById completed successfully');

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get Item Error:', error);
    console.error('❌ [ITEM_CONTROLLER] Error name:', error.name);
    console.error('❌ [ITEM_CONTROLLER] Error message:', error.message);
    console.error('❌ [ITEM_CONTROLLER] Error stack:', error.stack);
    console.error('❌ [ITEM_CONTROLLER] Error code:', error.code);
    console.error('❌ [ITEM_CONTROLLER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
    
    console.log('❌ [ITEM_CONTROLLER] Error response sent to client');
  }
};

// @desc    Toggle item status (Admin only)
// @route   PUT /api/admin/items/:id/toggle-status
// @access  Private (Admin)
const toggleItemStatus = async (req, res) => {
  console.log('🔍 [ITEM_CONTROLLER] toggleItemStatus function called');
  console.log('🔍 [ITEM_CONTROLLER] Request params:', req.params);
  console.log('🔍 [ITEM_CONTROLLER] Request query:', req.query);
  console.log('🔍 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
  
  try {
    const { id } = req.params;
    console.log('🔍 [ITEM_CONTROLLER] Toggling status for item with ID:', id);
    console.log('🔍 [ITEM_CONTROLLER] ID type:', typeof id);
    console.log('🔍 [ITEM_CONTROLLER] ID length:', id ? id.length : 'N/A');

    console.log('🔍 [ITEM_CONTROLLER] Finding item by ID...');
    const item = await Item.findById(id);
    
    console.log('🔍 [ITEM_CONTROLLER] Database query executed');
    console.log('🔍 [ITEM_CONTROLLER] Raw item response:', item);
    console.log('🔍 [ITEM_CONTROLLER] Item found:', !!item);
    
    if (item) {
      console.log('🔍 [ITEM_CONTROLLER] Item structure:', Object.keys(item));
      console.log('🔍 [ITEM_CONTROLLER] Item ID:', item._id);
      console.log('🔍 [ITEM_CONTROLLER] Item name:', item.name);
      console.log('🔍 [ITEM_CONTROLLER] Current isActive status:', item.isActive);
      console.log('🔍 [ITEM_CONTROLLER] Current availability:', item.availability);
    }
    
    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('🔍 [ITEM_CONTROLLER] Current isActive status:', item.isActive);
    const newStatus = !item.isActive;
    console.log('🔍 [ITEM_CONTROLLER] New isActive status will be:', newStatus);
    
    item.isActive = newStatus;
    console.log('🔍 [ITEM_CONTROLLER] Updated item.isActive to:', item.isActive);
    
    console.log('🔍 [ITEM_CONTROLLER] Saving item to database...');
    await item.save();
    console.log('🔍 [ITEM_CONTROLLER] Item saved successfully');
    
    console.log('🔍 [ITEM_CONTROLLER] Final item state:', {
      _id: item._id,
      name: item.name,
      isActive: item.isActive,
      availability: item.availability,
      updatedAt: item.updatedAt
    });

    const responseData = {
      success: true,
      message: `Item ${item.isActive ? 'activated' : 'deactivated'} successfully`,
      data: item
    };
    
    console.log('🔍 [ITEM_CONTROLLER] Response data prepared:', responseData);
    console.log('🔍 [ITEM_CONTROLLER] Sending response...');

    res.status(200).json(responseData);
    
    console.log('✅ [ITEM_CONTROLLER] toggleItemStatus completed successfully');

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Toggle Item Status Error:', error);
    console.error('❌ [ITEM_CONTROLLER] Error name:', error.name);
    console.error('❌ [ITEM_CONTROLLER] Error message:', error.message);
    console.error('❌ [ITEM_CONTROLLER] Error stack:', error.stack);
    console.error('❌ [ITEM_CONTROLLER] Error code:', error.code);
    console.error('❌ [ITEM_CONTROLLER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Error toggling item status',
      error: error.message
    });
    
    console.log('❌ [ITEM_CONTROLLER] Error response sent to client');
  }
};

// @desc    Update item availability (Admin only)
// @route   PUT /api/admin/items/:id/availability
// @access  Private (Admin)
const updateItemAvailability = async (req, res) => {
  console.log('🔍 [ITEM_CONTROLLER] updateItemAvailability function called');
  console.log('🔍 [ITEM_CONTROLLER] Request params:', req.params);
  console.log('🔍 [ITEM_CONTROLLER] Request query:', req.query);
  console.log('🔍 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
  
  try {
    const { id } = req.params;
    const { availability } = req.body;
    
    console.log('🔍 [ITEM_CONTROLLER] Updating availability for item with ID:', id);
    console.log('🔍 [ITEM_CONTROLLER] New availability requested:', availability);
    console.log('🔍 [ITEM_CONTROLLER] ID type:', typeof id);
    console.log('🔍 [ITEM_CONTROLLER] Availability type:', typeof availability);

    const validAvailabilities = ['in-stock', 'out-of-stock', 'limited'];
    console.log('🔍 [ITEM_CONTROLLER] Valid availabilities:', validAvailabilities);
    console.log('🔍 [ITEM_CONTROLLER] Requested availability is valid:', validAvailabilities.includes(availability));
    
    if (!validAvailabilities.includes(availability)) {
      console.log('❌ [ITEM_CONTROLLER] Invalid availability status:', availability);
      console.log('❌ [ITEM_CONTROLLER] Valid options are:', validAvailabilities);
      return res.status(400).json({
        success: false,
        message: 'Invalid availability status'
      });
    }

    console.log('🔍 [ITEM_CONTROLLER] Finding item by ID...');
    const item = await Item.findById(id);
    
    console.log('🔍 [ITEM_CONTROLLER] Database query executed');
    console.log('🔍 [ITEM_CONTROLLER] Raw item response:', item);
    console.log('🔍 [ITEM_CONTROLLER] Item found:', !!item);
    
    if (item) {
      console.log('🔍 [ITEM_CONTROLLER] Item structure:', Object.keys(item));
      console.log('🔍 [ITEM_CONTROLLER] Item ID:', item._id);
      console.log('🔍 [ITEM_CONTROLLER] Item name:', item.name);
      console.log('🔍 [ITEM_CONTROLLER] Current availability:', item.availability);
      console.log('🔍 [ITEM_CONTROLLER] Current isActive status:', item.isActive);
    }
    
    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('🔍 [ITEM_CONTROLLER] Current availability:', item.availability);
    console.log('🔍 [ITEM_CONTROLLER] New availability will be:', availability);
    
    item.availability = availability;
    console.log('🔍 [ITEM_CONTROLLER] Updated item.availability to:', item.availability);
    
    console.log('🔍 [ITEM_CONTROLLER] Saving item to database...');
    await item.save();
    console.log('🔍 [ITEM_CONTROLLER] Item saved successfully');
    
    console.log('🔍 [ITEM_CONTROLLER] Final item state:', {
      _id: item._id,
      name: item.name,
      availability: item.availability,
      isActive: item.isActive,
      updatedAt: item.updatedAt
    });

    const responseData = {
      success: true,
      message: `Item availability updated to ${availability}`,
      data: item
    };
    
    console.log('🔍 [ITEM_CONTROLLER] Response data prepared:', responseData);
    console.log('🔍 [ITEM_CONTROLLER] Sending response...');

    res.status(200).json(responseData);
    
    console.log('✅ [ITEM_CONTROLLER] updateItemAvailability completed successfully');

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Update Item Availability Error:', error);
    console.error('❌ [ITEM_CONTROLLER] Error name:', error.name);
    console.error('❌ [ITEM_CONTROLLER] Error message:', error.message);
    console.error('❌ [ITEM_CONTROLLER] Error stack:', error.stack);
    console.error('❌ [ITEM_CONTROLLER] Error code:', error.code);
    console.error('❌ [ITEM_CONTROLLER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Error updating item availability',
      error: error.message
    });
    
    console.log('❌ [ITEM_CONTROLLER] Error response sent to client');
  }
};

// @desc    Get item statistics for dashboard
// @route   GET /api/admin/item-stats
// @access  Private (Admin)
const getItemStats = async (req, res) => {
  console.log('🔍 [ITEM_CONTROLLER] getItemStats function called');
  console.log('🔍 [ITEM_CONTROLLER] Request params:', req.params);
  console.log('🔍 [ITEM_CONTROLLER] Request query:', req.query);
  console.log('🔍 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('🔍 [ITEM_CONTROLLER] User making request:', req.user?.id, req.user?.userType);
  
  try {
    console.log('🔍 [ITEM_CONTROLLER] Executing count queries...');
    
    const totalItems = await Item.countDocuments();
    console.log('🔍 [ITEM_CONTROLLER] Total items count:', totalItems);
    
    const activeItems = await Item.countDocuments({ isActive: true });
    console.log('🔍 [ITEM_CONTROLLER] Active items count:', activeItems);
    
    const inactiveItems = await Item.countDocuments({ isActive: false });
    console.log('🔍 [ITEM_CONTROLLER] Inactive items count:', inactiveItems);
    
    const inStockItems = await Item.countDocuments({ availability: 'in-stock' });
    console.log('🔍 [ITEM_CONTROLLER] In-stock items count:', inStockItems);
    
    const outOfStockItems = await Item.countDocuments({ availability: 'out-of-stock' });
    console.log('🔍 [ITEM_CONTROLLER] Out-of-stock items count:', outOfStockItems);
    
    const limitedItems = await Item.countDocuments({ availability: 'limited' });
    console.log('🔍 [ITEM_CONTROLLER] Limited items count:', limitedItems);
    
    const dietMeals = await Item.countDocuments({ isDietMeal: true });
    console.log('🔍 [ITEM_CONTROLLER] Diet meals count:', dietMeals);
    
    const regularMeals = await Item.countDocuments({ isDietMeal: false });
    console.log('🔍 [ITEM_CONTROLLER] Regular meals count:', regularMeals);

    console.log('🔍 [ITEM_CONTROLLER] Executing aggregation queries...');
    
    // Get items by restaurant
    console.log('🔍 [ITEM_CONTROLLER] Executing items by restaurant aggregation...');
    const itemsByRestaurant = await Item.aggregate([
      {
        $group: {
          _id: '$restaurant',
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
    console.log('🔍 [ITEM_CONTROLLER] Items by restaurant aggregation result:', itemsByRestaurant);

    // Get items by category
    console.log('🔍 [ITEM_CONTROLLER] Executing items by category aggregation...');
    const itemsByCategory = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
          count: 1
        }
      }
    ]);
    console.log('🔍 [ITEM_CONTROLLER] Items by category aggregation result:', itemsByCategory);

    const responseData = {
      success: true,
      data: {
        total: totalItems,
        active: activeItems,
        inactive: inactiveItems,
        availability: {
          inStock: inStockItems,
          outOfStock: outOfStockItems,
          limited: limitedItems
        },
        mealTypes: {
          dietMeals,
          regularMeals
        },
        itemsByRestaurant,
        itemsByCategory
      }
    };
    
    console.log('🔍 [ITEM_CONTROLLER] Response data prepared:', responseData);
    console.log('🔍 [ITEM_CONTROLLER] Sending response...');

    res.status(200).json(responseData);
    
    console.log('✅ [ITEM_CONTROLLER] getItemStats completed successfully');

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get Item Stats Error:', error);
    console.error('❌ [ITEM_CONTROLLER] Error name:', error.name);
    console.error('❌ [ITEM_CONTROLLER] Error message:', error.message);
    console.error('❌ [ITEM_CONTROLLER] Error stack:', error.stack);
    console.error('❌ [ITEM_CONTROLLER] Error code:', error.code);
    console.error('❌ [ITEM_CONTROLLER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching item statistics',
      error: error.message
    });
    
    console.log('❌ [ITEM_CONTROLLER] Error response sent to client');
  }
};

console.log('📤 [ITEM_CONTROLLER] Exporting controller functions...');

module.exports = {
  getAllItems,
  getItemById,
  toggleItemStatus,
  updateItemAvailability,
  getItemStats
};

console.log('✅ [ITEM_CONTROLLER] Item controller exported successfully');
