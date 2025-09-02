const Item = require('../modal/item');
const Category = require('../modal/category');
const { uploadImageToS3, updateFromS3, deleteFromS3 } = require('../../utils/s3Utils');

// @desc    Create new item
// @route   POST /api/restaurant/items
// @access  Private (Restaurant)
const createItem = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] createItem called');
  console.log('📝 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('📁 [ITEM_CONTROLLER] Request files:', req.files);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const {
      name,
      description,
      category,
      itemCategory,
      price,
      availability,
      isDietMeal,
      calories
    } = req.body;

    console.log('🔍 [ITEM_CONTROLLER] Extracted data:', { 
      name, 
      description, 
      category, 
      itemCategory, 
      price, 
      availability, 
      isDietMeal, 
      calories 
    });

    // Handle uploaded image
    let imageUrl = null;
    if (req.files?.image && req.files.image[0]) {
      console.log('📸 [ITEM_CONTROLLER] Processing item image upload');
      try {
        imageUrl = await uploadImageToS3(req.files.image[0], 'restaurants/items');
        console.log('✅ [ITEM_CONTROLLER] Item image uploaded to S3:', imageUrl);
      } catch (uploadError) {
        console.error('❌ [ITEM_CONTROLLER] Image upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading item image'
        });
      }
    } else {
      console.log('ℹ️ [ITEM_CONTROLLER] No image provided for item');
    }

    // Validation
    if (!name || name.trim().length < 2) {
      console.log('❌ [ITEM_CONTROLLER] Name validation failed:', name);
      return res.status(400).json({
        success: false,
        message: 'Item name is required and must be at least 2 characters'
      });
    }

    if (!category) {
      console.log('❌ [ITEM_CONTROLLER] Category validation failed:', category);
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!price || price <= 0) {
      console.log('❌ [ITEM_CONTROLLER] Price validation failed:', price);
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Check if category exists and belongs to restaurant
    console.log('🔍 [ITEM_CONTROLLER] Checking if category exists:', category);
    const categoryExists = await Category.findOne({
      _id: category,
      restaurant: req.user.id,
      isActive: true
    });

    if (!categoryExists) {
      console.log('❌ [ITEM_CONTROLLER] Category not found or invalid:', category);
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }
    console.log('✅ [ITEM_CONTROLLER] Category validation passed:', categoryExists.name);

    console.log('✅ [ITEM_CONTROLLER] Creating new item...');
    
    // Create new item
    const item = new Item({
      name: name.trim(),
      description: description?.trim(),
      image: imageUrl,
      category,
      itemCategory: itemCategory || 'Veg', // Default to 'Veg' if not provided
      price: parseFloat(price),
      availability: availability || 'in-stock',
      isDietMeal: isDietMeal === 'true' || isDietMeal === true,
      calories: calories ? parseInt(calories) : null,
      restaurant: req.user.id
    });

    console.log('💾 [ITEM_CONTROLLER] Saving item to database...');
    await item.save();
    console.log('✅ [ITEM_CONTROLLER] Item saved successfully, ID:', item._id);

    // Update category item count
    console.log('🔄 [ITEM_CONTROLLER] Updating category item count...');
    await categoryExists.updateItemCount();
    console.log('✅ [ITEM_CONTROLLER] Category item count updated');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item.completeInfo
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Create Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
};

// @desc    Get all items for restaurant
// @route   GET /api/restaurant/items
// @access  Private (Restaurant)
const getAllItems = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] getAllItems called');
  console.log('🔍 [ITEM_CONTROLLER] Query params:', req.query);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const {
      category,
      itemCategory,
      availability,
      isDietMeal,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 [ITEM_CONTROLLER] Applied filters:', { 
      category, 
      itemCategory, 
      availability, 
      isDietMeal, 
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    });

    let query = { restaurant: req.user.id };

    // Apply filters
    if (category) query.category = category;
    if (itemCategory) query.itemCategory = itemCategory;
    if (availability) query.availability = availability;
    if (isDietMeal !== undefined) query.isDietMeal = isDietMeal === 'true';

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 [ITEM_CONTROLLER] Search query applied:', search);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    console.log('📊 [ITEM_CONTROLLER] Sort options:', sortOptions);

    console.log('🔍 [ITEM_CONTROLLER] Final query:', query);
    const items = await Item.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);
    console.log('✅ [ITEM_CONTROLLER] Items fetched successfully:', { count: items.length, total });

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: items.map(item => ({
        ...item.completeInfo,
        availabilityStatus: item.availabilityStatus
      }))
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get All Items Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// @desc    Get all items by restaurant ID (Public access for users)
// @route   GET /api/restaurant/items/restaurant/:restaurantId
// @access  Public
const getAllItemsByRestaurantId = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] getAllItemsByRestaurantId called');
  console.log('🔍 [ITEM_CONTROLLER] Restaurant ID:', req.params.restaurantId);
  console.log('🔍 [ITEM_CONTROLLER] Query params:', req.query);
  
  try {
    const { restaurantId } = req.params;
    const {
      category,
      itemCategory,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    console.log('🔍 [ITEM_CONTROLLER] Applied filters:', { 
      restaurantId,
      category, 
      itemCategory, 
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    });

    let query = { 
      restaurant: restaurantId,
      isActive: true,
      availability: 'in-stock' // Only show available items
    };

    // Apply filters
    if (category) query.category = category;
    if (itemCategory) query.itemCategory = itemCategory;

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 [ITEM_CONTROLLER] Search query applied:', search);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    console.log('📊 [ITEM_CONTROLLER] Sort options:', sortOptions);

    console.log('🔍 [ITEM_CONTROLLER] Final query:', query);
    const items = await Item.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);
    console.log('✅ [ITEM_CONTROLLER] Items fetched successfully:', { count: items.length, total });

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: items.map(item => ({
        ...item.completeInfo,
        availabilityStatus: item.availabilityStatus
      }))
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get All Items By Restaurant ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant items',
      error: error.message
    });
  }
};

// @desc    Get item by ID
// @route   GET /api/restaurant/items/:id
// @access  Private (Restaurant)
const getItemById = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] getItemById called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 [ITEM_CONTROLLER] Finding item with ID:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    }).populate('category', 'name');

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found successfully:', item.name);

    res.status(200).json({
      success: true,
      data: {
        ...item.completeInfo,
        availabilityStatus: item.availabilityStatus
      }
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// @desc    Update item
// @route   PUT /api/restaurant/items/:id
// @access  Private (Restaurant)
const updateItem = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] updateItem called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('📝 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('📁 [ITEM_CONTROLLER] Request files:', req.files);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      itemCategory,
      price,
      availability,
      isDietMeal,
      calories
    } = req.body;

    console.log('🔍 [ITEM_CONTROLLER] Extracted update data:', { 
      name, 
      description, 
      category, 
      itemCategory, 
      price, 
      availability, 
      isDietMeal, 
      calories 
    });

    console.log('🔍 [ITEM_CONTROLLER] Finding item to update:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found for update:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found for update:', item.name);

    // Handle uploaded image
    if (req.files?.image) {
      console.log('📸 [ITEM_CONTROLLER] Processing image update');
      try {
        if (item.image) {
          console.log('🗑️ [ITEM_CONTROLLER] Deleting old image from S3');
          await deleteFromS3(item.image);
        }
        
        console.log('📤 [ITEM_CONTROLLER] Uploading new image to S3');
        const newImageUrl = await uploadImageToS3(req.files.image[0], 'restaurants/items');
        item.image = newImageUrl;
        console.log('✅ [ITEM_CONTROLLER] New image uploaded:', newImageUrl);
      } catch (imageError) {
        console.error('❌ [ITEM_CONTROLLER] Image update failed:', imageError);
        return res.status(400).json({
          success: false,
          message: 'Error updating item image'
        });
      }
    }

    // Update fields
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        console.log('❌ [ITEM_CONTROLLER] Name validation failed:', name);
        return res.status(400).json({
          success: false,
          message: 'Item name must be at least 2 characters'
        });
      }
      item.name = name.trim();
      console.log('✅ [ITEM_CONTROLLER] Name updated:', item.name);
    }

    if (description !== undefined) {
      item.description = description?.trim();
      console.log('✅ [ITEM_CONTROLLER] Description updated:', item.description);
    }

    if (category !== undefined) {
      console.log('🔍 [ITEM_CONTROLLER] Validating new category:', category);
      const categoryExists = await Category.findOne({
        _id: category,
        restaurant: req.user.id,
        isActive: true
      });

      if (!categoryExists) {
        console.log('❌ [ITEM_CONTROLLER] Invalid category selected:', category);
        return res.status(400).json({
          success: false,
          message: 'Invalid category selected'
        });
      }
      item.category = category;
      console.log('✅ [ITEM_CONTROLLER] Category updated:', category);
    }

    if (itemCategory !== undefined) {
      item.itemCategory = itemCategory;
      console.log('✅ [ITEM_CONTROLLER] Item category updated:', item.itemCategory);
    }

    if (price !== undefined) {
      if (!price || price <= 0) {
        console.log('❌ [ITEM_CONTROLLER] Price validation failed:', price);
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }
      item.price = parseFloat(price);
      console.log('✅ [ITEM_CONTROLLER] Price updated:', item.price);
    }

    if (availability !== undefined) {
      item.availability = availability;
      console.log('✅ [ITEM_CONTROLLER] Availability updated:', item.availability);
    }

    if (isDietMeal !== undefined) {
      item.isDietMeal = isDietMeal === 'true' || isDietMeal === true;
      console.log('✅ [ITEM_CONTROLLER] Diet meal updated:', item.isDietMeal);
    }

    if (calories !== undefined) {
      item.calories = calories ? parseInt(calories) : null;
      console.log('✅ [ITEM_CONTROLLER] Calories updated:', item.calories);
    }

    console.log('💾 [ITEM_CONTROLLER] Saving updated item...');
    await item.save();
    console.log('✅ [ITEM_CONTROLLER] Item updated successfully');

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: {
        ...item.completeInfo,
        availabilityStatus: item.availabilityStatus
      }
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Update Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error.message
    });
  }
};

// @desc    Delete item
// @route   DELETE /api/restaurant/items/:id
// @access  Private (Restaurant)
const deleteItem = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] deleteItem called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 [ITEM_CONTROLLER] Finding item to delete:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found for deletion:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found for deletion:', item.name);

    // Delete image from S3 if exists
    if (item.image) {
      console.log('🗑️ [ITEM_CONTROLLER] Deleting image from S3:', item.image);
      try {
        await deleteFromS3(item.image);
        console.log('✅ [ITEM_CONTROLLER] Image deleted from S3');
      } catch (deleteError) {
        console.error('⚠️ [ITEM_CONTROLLER] Failed to delete image from S3:', deleteError);
        // Continue with item deletion even if image deletion fails
      }
    }

    console.log('🗑️ [ITEM_CONTROLLER] Deleting item from database...');
    await item.deleteOne();
    console.log('✅ [ITEM_CONTROLLER] Item deleted from database');

    // Update category item count
    console.log('🔄 [ITEM_CONTROLLER] Updating category item count...');
    const category = await Category.findById(item.category);
    if (category) {
      await category.updateItemCount();
      console.log('✅ [ITEM_CONTROLLER] Category item count updated');
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Delete Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
};

// @desc    Toggle item availability
// @route   PUT /api/restaurant/items/:id/toggle-availability
// @access  Private (Restaurant)
const toggleAvailability = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] toggleAvailability called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 [ITEM_CONTROLLER] Finding item to toggle availability:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found for availability toggle:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found for availability toggle:', item.name);
    console.log('🔄 [ITEM_CONTROLLER] Current availability:', item.availability);

    await item.toggleAvailability();
    console.log('✅ [ITEM_CONTROLLER] Availability toggled to:', item.availability);

    res.status(200).json({
      success: true,
      message: `Item availability updated to ${item.availability}`,
      data: {
        availability: item.availability,
        availabilityStatus: item.availabilityStatus
      }
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Toggle Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling availability',
      error: error.message
    });
  }
};

// @desc    Upload item image
// @route   POST /api/restaurant/items/:id/upload-image
// @access  Private (Restaurant)
const uploadItemImage = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] uploadItemImage called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('📁 [ITEM_CONTROLLER] Request file:', req.file);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    if (!req.file) {
      console.log('❌ [ITEM_CONTROLLER] No image file provided');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('🔍 [ITEM_CONTROLLER] Finding item for image upload:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found for image upload:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found for image upload:', item.name);

    // Delete old image from S3 if exists
    if (item.image) {
      console.log('🗑️ [ITEM_CONTROLLER] Deleting old image from S3:', item.image);
      try {
        await deleteFromS3(item.image);
        console.log('✅ [ITEM_CONTROLLER] Old image deleted from S3');
      } catch (deleteError) {
        console.error('⚠️ [ITEM_CONTROLLER] Failed to delete old image from S3:', deleteError);
      }
    }

    // Upload new image to S3
    console.log('📤 [ITEM_CONTROLLER] Uploading new image to S3');
    try {
      const newImageUrl = await uploadImageToS3(req.file, 'restaurants/items');
      item.image = newImageUrl;
      await item.save();
      console.log('✅ [ITEM_CONTROLLER] New image uploaded successfully:', newImageUrl);

      res.status(200).json({
        success: true,
        message: 'Item image uploaded successfully',
        data: {
          image: item.image
        }
      });
    } catch (uploadError) {
      console.error('❌ [ITEM_CONTROLLER] Image upload failed:', uploadError);
      res.status(400).json({
        success: false,
        message: 'Error uploading item image'
      });
    }

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Upload Item Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading item image',
      error: error.message
    });
  }
};

// @desc    Get item statistics
// @route   GET /api/restaurant/items/stats
// @access  Private (Restaurant)
const getItemStats = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] getItemStats called');
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    console.log('📊 [ITEM_CONTROLLER] Calculating item statistics...');
    
    const totalItems = await Item.countDocuments({ restaurant: req.user.id });
    const activeItems = await Item.countDocuments({ restaurant: req.user.id, isActive: true });
    const inStockItems = await Item.countDocuments({ restaurant: req.user.id, availability: 'in-stock' });
    const outOfStockItems = await Item.countDocuments({ restaurant: req.user.id, availability: 'out-of-stock' });
    const limitedItems = await Item.countDocuments({ restaurant: req.user.id, availability: 'limited' });
    const dietItems = await Item.countDocuments({ restaurant: req.user.id, isDietMeal: true });

    console.log('📊 [ITEM_CONTROLLER] Basic stats calculated:', {
      total: totalItems,
      active: activeItems,
      inStock: inStockItems,
      outOfStock: outOfStockItems,
      limited: limitedItems,
      diet: dietItems
    });

    // Category-wise statistics
    console.log('📊 [ITEM_CONTROLLER] Calculating category-wise statistics...');
    const categoryStats = await Item.aggregate([
      { $match: { restaurant: req.user.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $project: { categoryName: '$categoryInfo.name', count: 1 } }
    ]);

    console.log('✅ [ITEM_CONTROLLER] Category stats calculated:', categoryStats);

    res.status(200).json({
      success: true,
      data: {
        total: totalItems,
        active: activeItems,
        inStock: inStockItems,
        outOfStock: outOfStockItems,
        limited: limitedItems,
        diet: dietItems,
        categoryStats
      }
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get Item Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item statistics',
      error: error.message
    });
  }
};

// @desc    Update item order count (for testing/admin purposes)
// @route   PUT /api/restaurant/items/:id/update-order-count
// @access  Private (Restaurant)
const updateItemOrderCount = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] updateItemOrderCount called');
  console.log('🔍 [ITEM_CONTROLLER] Item ID:', req.params.id);
  console.log('📝 [ITEM_CONTROLLER] Request body:', req.body);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;
    const { totalOrder, action = 'set' } = req.body; // action: 'set', 'increment', 'decrement'

    console.log('🔍 [ITEM_CONTROLLER] Order count update data:', { totalOrder, action });

    if (totalOrder === undefined && action !== 'increment' && action !== 'decrement') {
      console.log('❌ [ITEM_CONTROLLER] Invalid request data');
      return res.status(400).json({
        success: false,
        message: 'totalOrder is required for set action, or specify increment/decrement action'
      });
    }

    console.log('🔍 [ITEM_CONTROLLER] Finding item to update order count:', id);
    const item = await Item.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!item) {
      console.log('❌ [ITEM_CONTROLLER] Item not found for order count update:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('✅ [ITEM_CONTROLLER] Item found for order count update:', item.name);
    console.log('🔄 [ITEM_CONTROLLER] Current totalOrder:', item.totalOrder);

    // Update order count based on action
    switch (action) {
      case 'set':
        if (totalOrder < 0) {
          console.log('❌ [ITEM_CONTROLLER] Invalid totalOrder value:', totalOrder);
          return res.status(400).json({
            success: false,
            message: 'Total order count cannot be negative'
          });
        }
        item.totalOrder = totalOrder;
        console.log('✅ [ITEM_CONTROLLER] Order count set to:', item.totalOrder);
        break;
      
      case 'increment':
        item.totalOrder += (totalOrder || 1);
        console.log('✅ [ITEM_CONTROLLER] Order count incremented to:', item.totalOrder);
        break;
      
      case 'decrement':
        item.totalOrder = Math.max(0, item.totalOrder - (totalOrder || 1));
        console.log('✅ [ITEM_CONTROLLER] Order count decremented to:', item.totalOrder);
        break;
      
      default:
        console.log('❌ [ITEM_CONTROLLER] Invalid action:', action);
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: set, increment, or decrement'
        });
    }

    console.log('💾 [ITEM_CONTROLLER] Saving updated item...');
    await item.save();
    console.log('✅ [ITEM_CONTROLLER] Item order count updated successfully');

    res.status(200).json({
      success: true,
      message: 'Item order count updated successfully',
      data: {
        id: item._id.toString(),
        name: item.name,
        totalOrder: item.totalOrder
      }
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Update Item Order Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item order count',
      error: error.message
    });
  }
};

// @desc    Get best seller items
// @route   GET /api/restaurant/items/best-sellers
// @access  Private (Restaurant)
const getBestSellers = async (req, res) => {
  console.log('🚀 [ITEM_CONTROLLER] getBestSellers called');
  console.log('🔍 [ITEM_CONTROLLER] Query params:', req.query);
  console.log('👤 [ITEM_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { limit = 10 } = req.query;

    console.log('🔍 [ITEM_CONTROLLER] Best seller limit:', limit);

    // Simple query: just get all active items for the restaurant
    const query = { 
      restaurant: req.user.id,
      isActive: true
    };

    console.log('🔍 [ITEM_CONTROLLER] Best seller query:', query);

    // Get best sellers ordered by totalOrder (descending) - highest orders first
    const bestSellers = await Item.find(query)
      .populate('category', 'name')
      .sort({ totalOrder: -1 }) // Sort by totalOrder descending (highest first)
      .limit(parseInt(limit))
      .select('name image price totalOrder rating totalRatings category itemCategory');

    console.log('✅ [ITEM_CONTROLLER] Best sellers fetched successfully:', { 
      count: bestSellers.length, 
      limit: parseInt(limit) 
    });

    // Transform data for frontend
    const transformedBestSellers = bestSellers.map(item => ({
      id: item._id.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      totalOrder: item.totalOrder,
      rating: item.rating,
      totalRatings: item.totalRatings,
      category: item.category,
      itemCategory: item.itemCategory,
      soldCount: item.totalOrder // For frontend compatibility
    }));

    console.log('📤 [ITEM_CONTROLLER] Sending best sellers data:', transformedBestSellers);

    res.status(200).json({
      success: true,
      count: bestSellers.length,
      data: transformedBestSellers
    });

  } catch (error) {
    console.error('❌ [ITEM_CONTROLLER] Get Best Sellers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: error.message
    });
  }
};

module.exports = {
  createItem,
  getAllItems,
  getAllItemsByRestaurantId,
  getItemById,
  updateItem,
  deleteItem,
  toggleAvailability,
  uploadItemImage,
  getItemStats,
  updateItemOrderCount,
  getBestSellers
}; 