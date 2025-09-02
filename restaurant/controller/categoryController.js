const Category = require('../modal/category');
const { uploadImageToS3, updateFromS3, deleteFromS3 } = require('../../utils/s3Utils');

// @desc    Create new category
// @route   POST /api/restaurant/categories
// @access  Private (Restaurant)
const createCategory = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] createCategory called');
  console.log('📝 [CATEGORY_CONTROLLER] Request body:', req.body);
  console.log('📁 [CATEGORY_CONTROLLER] Request files:', req.files);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const {
      name,
      description
    } = req.body;

    console.log('🔍 [CATEGORY_CONTROLLER] Extracted data:', { name, description });

    // Handle uploaded image
    let imageUrl = null;
    if (req.files?.image && req.files.image[0]) {
      console.log('📸 [CATEGORY_CONTROLLER] Processing category image upload');
      try {
        imageUrl = await uploadImageToS3(req.files.image[0], 'restaurants/categories');
        console.log('✅ [CATEGORY_CONTROLLER] Category image uploaded to S3:', imageUrl);
      } catch (uploadError) {
        console.error('❌ [CATEGORY_CONTROLLER] Image upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading category image'
        });
      }
    } else {
      console.log('ℹ️ [CATEGORY_CONTROLLER] No image provided for category');
    }

    // Validation
    if (!name || name.trim().length < 2) {
      console.log('❌ [CATEGORY_CONTROLLER] Name validation failed:', name);
      return res.status(400).json({
        success: false,
        message: 'Category name is required and must be at least 2 characters'
      });
    }

    // Check if category with same name already exists
    console.log('🔍 [CATEGORY_CONTROLLER] Checking for existing category with name:', name.trim());
    const existingCategory = await Category.findOne({
      name: name.trim(),
      restaurant: req.user.id
    });

    if (existingCategory) {
      console.log('❌ [CATEGORY_CONTROLLER] Category with same name already exists');
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Creating new category...');
    
    // Create new category
    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      image: imageUrl,
      restaurant: req.user.id
    });

    console.log('💾 [CATEGORY_CONTROLLER] Saving category to database...');
    await category.save();
    console.log('✅ [CATEGORY_CONTROLLER] Category saved successfully, ID:', category._id);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        _id: category._id.toString(), // Convert ObjectId to string
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        itemCount: category.itemCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Create Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Get all categories for restaurant
// @route   GET /api/restaurant/categories
// @access  Private (Restaurant)
const getAllCategories = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] getAllCategories called');
  console.log('🔍 [CATEGORY_CONTROLLER] Query params:', req.query);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { isActive, page = 1, limit = 50 } = req.query;

    let query = { restaurant: req.user.id };
    console.log('🔍 [CATEGORY_CONTROLLER] Base query:', query);

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      console.log('🔍 [CATEGORY_CONTROLLER] Added isActive filter:', query.isActive);
    }

    console.log('🔍 [CATEGORY_CONTROLLER] Final query:', query);
    console.log('📄 [CATEGORY_CONTROLLER] Pagination:', { page, limit });

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('✅ [CATEGORY_CONTROLLER] Found categories:', categories);

    const total = await Category.countDocuments(query);
    console.log('📊 [CATEGORY_CONTROLLER] Total categories count:', total);

    // Prepare response data
    const responseData = categories.map(category => ({
      _id: category._id.toString(), // Convert ObjectId to string
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      itemCount: category.itemCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    console.log('📤 [CATEGORY_CONTROLLER] Sending response data:', responseData);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: responseData
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Get All Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get category by ID
// @route   GET /api/restaurant/categories/:id
// @access  Private (Restaurant)
const getCategoryById = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] getCategoryById called');
  console.log('🔍 [CATEGORY_CONTROLLER] Category ID:', req.params.id);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 [CATEGORY_CONTROLLER] Searching for category...');
    const category = await Category.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!category) {
      console.log('❌ [CATEGORY_CONTROLLER] Category not found');
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Category found:', category.name);

    res.status(200).json({
      success: true,
      data: {
        _id: category._id.toString(), // Convert ObjectId to string
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        itemCount: category.itemCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Get Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/restaurant/categories/:id
// @access  Private (Restaurant)
const updateCategory = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] updateCategory called');
  console.log('🔍 [CATEGORY_CONTROLLER] Category ID:', req.params.id);
  console.log('📝 [CATEGORY_CONTROLLER] Request body:', req.body);
  console.log('📁 [CATEGORY_CONTROLLER] Request files:', req.files);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isActive
    } = req.body;

    console.log('🔍 [CATEGORY_CONTROLLER] Extracted update data:', { name, description, isActive });

    console.log('🔍 [CATEGORY_CONTROLLER] Finding category to update...');
    const category = await Category.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!category) {
      console.log('❌ [CATEGORY_CONTROLLER] Category not found for update');
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Category found for update:', category.name);

    // Handle uploaded image
    if (req.files?.image && req.files.image[0]) {
      console.log('📸 [CATEGORY_CONTROLLER] Processing category image update');
      try {
        if (category.image) {
          console.log('🔄 [CATEGORY_CONTROLLER] Updating existing image');
          category.image = await updateFromS3(category.image, req.files.image[0], 'restaurants/categories');
        } else {
          console.log('🆕 [CATEGORY_CONTROLLER] Uploading new image');
          category.image = await uploadImageToS3(req.files.image[0], 'restaurants/categories');
        }
        console.log('✅ [CATEGORY_CONTROLLER] Category image updated successfully');
      } catch (uploadError) {
        console.error('❌ [CATEGORY_CONTROLLER] Image update failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error updating category image'
        });
      }
    } else {
      console.log('ℹ️ [CATEGORY_CONTROLLER] No new image provided for update');
    }

    // Update fields
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        console.log('❌ [CATEGORY_CONTROLLER] Name validation failed:', name);
        return res.status(400).json({
          success: false,
          message: 'Category name must be at least 2 characters'
        });
      }

      // Check if name already exists (excluding current category)
      console.log('🔍 [CATEGORY_CONTROLLER] Checking for name conflict...');
      const existingCategory = await Category.findOne({
        name: name.trim(),
        restaurant: req.user.id,
        _id: { $ne: id }
      });

      if (existingCategory) {
        console.log('❌ [CATEGORY_CONTROLLER] Category with this name already exists');
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      console.log('✏️ [CATEGORY_CONTROLLER] Updating category name from:', category.name, 'to:', name.trim());
      category.name = name.trim();
    }

    if (description !== undefined) {
      console.log('✏️ [CATEGORY_CONTROLLER] Updating description');
      category.description = description?.trim();
    }

    if (isActive !== undefined) {
      console.log('✏️ [CATEGORY_CONTROLLER] Updating isActive from:', category.isActive, 'to:', isActive);
      category.isActive = isActive === 'true' || isActive === true;
    }

    console.log('💾 [CATEGORY_CONTROLLER] Saving updated category...');
    await category.save();
    console.log('✅ [CATEGORY_CONTROLLER] Category updated successfully');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        _id: category._id.toString(), // Convert ObjectId to string
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        itemCount: category.itemCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Update Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/restaurant/categories/:id
// @access  Private (Restaurant)
const deleteCategory = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] deleteCategory called');
  console.log('🔍 [CATEGORY_CONTROLLER] Category ID:', req.params.id);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 [CATEGORY_CONTROLLER] Finding category to delete...');
    const category = await Category.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!category) {
      console.log('❌ [CATEGORY_CONTROLLER] Category not found for deletion');
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Category found for deletion:', category.name);

    // Check if category has items
    console.log('🔍 [CATEGORY_CONTROLLER] Checking if category has items...');
    const Item = require('../modal/item');
    const itemCount = await Item.countDocuments({ category: id });

    if (itemCount > 0) {
      console.log('❌ [CATEGORY_CONTROLLER] Cannot delete category with items:', itemCount);
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${itemCount} items. Please move or delete the items first.`
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Category has no items, proceeding with deletion');

    // Delete image from S3 if exists
    if (category.image) {
      console.log('🗑️ [CATEGORY_CONTROLLER] Deleting category image from S3...');
      try {
        await deleteFromS3(category.image);
        console.log('✅ [CATEGORY_CONTROLLER] Category image deleted from S3');
      } catch (deleteError) {
        console.error('⚠️ [CATEGORY_CONTROLLER] Failed to delete image from S3:', deleteError);
        // Continue with category deletion even if image deletion fails
      }
    }

    console.log('🗑️ [CATEGORY_CONTROLLER] Deleting category from database...');
    await category.deleteOne();
    console.log('✅ [CATEGORY_CONTROLLER] Category deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Delete Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// @desc    Upload category image
// @route   POST /api/restaurant/categories/:id/upload-image
// @access  Private (Restaurant)
const uploadCategoryImage = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] uploadCategoryImage called');
  console.log('🔍 [CATEGORY_CONTROLLER] Category ID:', req.params.id);
  console.log('📁 [CATEGORY_CONTROLLER] Request file:', req.file);
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    const { id } = req.params;

    if (!req.file) {
      console.log('❌ [CATEGORY_CONTROLLER] No image file provided');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('🔍 [CATEGORY_CONTROLLER] Finding category for image upload...');
    const category = await Category.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!category) {
      console.log('❌ [CATEGORY_CONTROLLER] Category not found for image upload');
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ [CATEGORY_CONTROLLER] Category found for image upload:', category.name);

    // Upload image to S3
    console.log('📸 [CATEGORY_CONTROLLER] Uploading category image to S3...');
    let imageUrl;
    try {
      if (category.image) {
        console.log('🔄 [CATEGORY_CONTROLLER] Updating existing category image');
        imageUrl = await updateFromS3(category.image, req.file, 'restaurants/categories');
      } else {
        console.log('🆕 [CATEGORY_CONTROLLER] Uploading new category image');
        imageUrl = await uploadImageToS3(req.file, 'restaurants/categories');
      }
      console.log('✅ [CATEGORY_CONTROLLER] Category image uploaded successfully to S3');
    } catch (uploadError) {
      console.error('❌ [CATEGORY_CONTROLLER] Image upload to S3 failed:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Error uploading category image'
      });
    }

    // Update category with new image URL
    category.image = imageUrl;
    console.log('💾 [CATEGORY_CONTROLLER] Saving category with new image...');
    await category.save();
    console.log('✅ [CATEGORY_CONTROLLER] Category updated with new image');

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully',
      data: {
        image: category.image
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Upload Category Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading category image',
      error: error.message
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/restaurant/categories/stats
// @access  Private (Restaurant)
const getCategoryStats = async (req, res) => {
  console.log('🚀 [CATEGORY_CONTROLLER] getCategoryStats called');
  console.log('👤 [CATEGORY_CONTROLLER] User ID:', req.user.id);
  
  try {
    console.log('📊 [CATEGORY_CONTROLLER] Calculating category statistics...');
    
    const totalCategories = await Category.countDocuments({ restaurant: req.user.id });
    const activeCategories = await Category.countDocuments({ restaurant: req.user.id, isActive: true });
    const inactiveCategories = await Category.countDocuments({ restaurant: req.user.id, isActive: false });

    console.log('📊 [CATEGORY_CONTROLLER] Basic counts:', { totalCategories, activeCategories, inactiveCategories });

    // Categories with items count
    console.log('🔍 [CATEGORY_CONTROLLER] Calculating categories with items...');
    const Item = require('../modal/item');
    const categoriesWithItems = await Category.aggregate([
      { $match: { restaurant: req.user.id } },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $project: {
          name: 1,
          itemCount: { $size: '$items' }
        }
      },
      { $sort: { itemCount: -1 } }
    ]);

    console.log('✅ [CATEGORY_CONTROLLER] Categories with items calculated:', categoriesWithItems.length);

    res.status(200).json({
      success: true,
      data: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
        categoriesWithItems
      }
    });

  } catch (error) {
    console.error('❌ [CATEGORY_CONTROLLER] Get Category Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getCategoryStats
}; 