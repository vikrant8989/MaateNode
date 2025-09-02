const Category = require('../../../restaurant/modal/category');
const Restaurant = require('../../../restaurant/modal/restaurant');
const Item = require('../../../restaurant/modal/item');

// @desc    Get all categories (Admin only)
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getAllCategories = async (req, res) => {
  try {
    console.log('🔍 [CATEGORY] getAllCategories called with query:', req.query);
    console.log('🔍 [CATEGORY] User making request:', req.user?.id, req.user?.userType);
    
    const { restaurant, isActive, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (restaurant) {
      query.restaurant = restaurant;
      console.log('🔍 [CATEGORY] Filtering by restaurant:', restaurant);
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      console.log('🔍 [CATEGORY] Filtering by isActive:', query.isActive);
    }
    
    console.log('🔍 [CATEGORY] Final query:', query);

    console.log('🔍 [CATEGORY] Executing database query...');
    const categories = await Category.find(query)
      .populate('restaurant', 'businessName email phone city state')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);
    console.log('🔍 [CATEGORY] Found categories:', categories.length, 'Total:', total);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: categories
    });

  } catch (error) {
    console.error('❌ [CATEGORY] Get All Categories Error:', error);
    console.error('❌ [CATEGORY] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get category by ID (Admin only)
// @route   GET /api/admin/categories/:id
// @access  Private (Admin)
const getCategoryById = async (req, res) => {
  try {
    console.log('🔍 [CATEGORY] getCategoryById called with ID:', req.params.id);
    console.log('🔍 [CATEGORY] User making request:', req.user?.id, req.user?.userType);
    
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('restaurant', 'businessName email phone address city state pinCode category specialization');
    
    if (!category) {
      console.log('❌ [CATEGORY] Category not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    console.log('✅ [CATEGORY] Category found:', category._id, category.name);

    // Get items in this category
    console.log('🔍 [CATEGORY] Fetching items for category:', id);
    const items = await Item.find({ category: id, isActive: true })
      .select('name price availability rating totalRatings totalOrder')
      .sort({ totalOrder: -1 })
      .limit(10);
    
    console.log('✅ [CATEGORY] Found items:', items.length);

    const categoryData = {
      ...category.toObject(),
      items
    };

    res.status(200).json({
      success: true,
      data: categoryData
    });

  } catch (error) {
    console.error('❌ [CATEGORY] Get Category Error:', error);
    console.error('❌ [CATEGORY] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Toggle category status (Admin only)
// @route   PUT /api/admin/categories/:id/toggle-status
// @access  Private (Admin)
const toggleCategoryStatus = async (req, res) => {
  try {
    console.log('🔄 [CATEGORY] toggleCategoryStatus called with ID:', req.params.id);
    console.log('🔄 [CATEGORY] User making request:', req.user?.id, req.user?.userType);
    
    const { id } = req.params;

    const category = await Category.findById(id);
    
    if (!category) {
      console.log('❌ [CATEGORY] Category not found for toggle status, ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    console.log('✅ [CATEGORY] Category found for toggle, current status:', category.isActive);

    category.isActive = !category.isActive;
    console.log('🔄 [CATEGORY] Toggling status to:', category.isActive);
    await category.save();

    // Update item count
    console.log('🔄 [CATEGORY] Updating item count...');
    await category.updateItemCount();
    console.log('✅ [CATEGORY] Item count updated successfully');

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });

  } catch (error) {
    console.error('❌ [CATEGORY] Toggle Category Status Error:', error);
    console.error('❌ [CATEGORY] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error toggling category status',
      error: error.message
    });
  }
};

// @desc    Update category item count (Admin only)
// @route   PUT /api/admin/categories/:id/update-item-count
// @access  Private (Admin)
const updateCategoryItemCount = async (req, res) => {
  try {
    console.log('🔄 [CATEGORY] updateCategoryItemCount called with ID:', req.params.id);
    console.log('🔄 [CATEGORY] User making request:', req.user?.id, req.user?.userType);
    
    const { id } = req.params;

    const category = await Category.findById(id);
    
    if (!category) {
      console.log('❌ [CATEGORY] Category not found for item count update, ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    console.log('✅ [CATEGORY] Category found for item count update:', category._id, category.name);

    console.log('🔄 [CATEGORY] Updating item count...');
    await category.updateItemCount();
    console.log('✅ [CATEGORY] Item count updated successfully');

    res.status(200).json({
      success: true,
      message: 'Category item count updated successfully',
      data: category
    });

  } catch (error) {
    console.error('❌ [CATEGORY] Update Category Item Count Error:', error);
    console.error('❌ [CATEGORY] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating category item count',
      error: error.message
    });
  }
};

// @desc    Get category statistics for dashboard
// @route   GET /api/admin/category-stats
// @access  Private (Admin)
const getCategoryStats = async (req, res) => {
  try {
    console.log('📊 [CATEGORY] getCategoryStats called');
    console.log('📊 [CATEGORY] User making request:', req.user?.id, req.user?.userType);
    
    console.log('📊 [CATEGORY] Counting total categories...');
    const totalCategories = await Category.countDocuments();
    console.log('📊 [CATEGORY] Counting active categories...');
    const activeCategories = await Category.countDocuments({ isActive: true });
    console.log('📊 [CATEGORY] Counting inactive categories...');
    const inactiveCategories = await Category.countDocuments({ isActive: false });
    
    console.log('📊 [CATEGORY] Basic counts - Total:', totalCategories, 'Active:', activeCategories, 'Inactive:', inactiveCategories);

    // Get categories by restaurant
    console.log('📊 [CATEGORY] Aggregating categories by restaurant...');
    const categoriesByRestaurant = await Category.aggregate([
      {
        $group: {
          _id: '$restaurant',
          count: { $sum: 1 },
          totalItems: { $sum: '$itemCount' }
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
          count: 1,
          totalItems: 1
        }
      }
    ]);
    console.log('📊 [CATEGORY] Categories by restaurant aggregation complete, found:', categoriesByRestaurant.length);

    // Get top categories by item count
    console.log('📊 [CATEGORY] Fetching top categories by item count...');
    const topCategories = await Category.find({ isActive: true })
      .sort({ itemCount: -1 })
      .limit(10)
      .select('name itemCount restaurant')
      .populate('restaurant', 'businessName');
    console.log('📊 [CATEGORY] Top categories found:', topCategories.length);

    res.status(200).json({
      success: true,
      data: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
        categoriesByRestaurant,
        topCategories
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY] Get Category Stats Error:', error);
    console.error('❌ [CATEGORY] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  toggleCategoryStatus,
  updateCategoryItemCount,
  getCategoryStats
};
