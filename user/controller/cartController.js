const Cart = require('../modal/cart');
const Restaurant = require('../../restaurant/modal/restaurant');

// Get user's active cart for a specific restaurant
const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantId } = req.params;

    console.log('🛒 [CART_CONTROLLER] getUserCart called');
    console.log('🔍 [CART_CONTROLLER] User ID:', userId);
    console.log('🔍 [CART_CONTROLLER] Restaurant ID:', restaurantId);

    // Validate restaurantId
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    // Find active cart for user and restaurant
    const cart = await Cart.findActiveCart(userId, restaurantId).populate('restaurantId', 'businessName city state');

    if (!cart) {
      console.log('ℹ️ [CART_CONTROLLER] No active cart found for user and restaurant');
      return res.status(200).json({
        success: true,
        message: 'No cart found',
        data: {
          id: null,
          items: [],
          subtotal: 0,
          total: 0,
          itemCount: 0,
          restaurant: {
            id: restaurantId,
            name: 'Unknown',
            city: 'Unknown',
            state: 'Unknown'
          }
        }
      });
    }

    console.log('✅ [CART_CONTROLLER] Active cart found:', cart._id);
    console.log('✅ [CART_CONTROLLER] Cart retrieved successfully:', {
      cartId: cart._id,
      itemCount: cart.itemCount,
      total: cart.total
    });

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
        itemCount: cart.itemCount,
        restaurant: {
          id: cart.restaurantId._id,
          name: cart.restaurantId.businessName,
          city: cart.restaurantId.city,
          state: cart.restaurantId.state
        }
      }
    });
  } catch (error) {
    console.error('❌ [CART_CONTROLLER] getUserCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart',
      error: error.message
    });
  }
};

// Add item to cart
const addItemToCart = async (req, res) => {
  console.log('🛒 [CART_CONTROLLER] addItemToCart called');
  console.log('🔍 [CART_CONTROLLER] Request body:', req.body);

  try {
    const { restaurantId, itemData } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!restaurantId || !itemData) {
      console.log('❌ [CART_CONTROLLER] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and item data are required'
      });
    }

    if (!itemData.itemId || !itemData.name || !itemData.price || !itemData.quantity) {
      console.log('❌ [CART_CONTROLLER] Invalid item data');
      return res.status(400).json({
        success: false,
        message: 'Invalid item data. Required: itemId, name, price, quantity'
      });
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.log('❌ [CART_CONTROLLER] Restaurant not found:', restaurantId);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Find or create active cart
    let cart = await Cart.findActiveCart(userId, restaurantId);
    
    if (!cart) {
      console.log('🛒 [CART_CONTROLLER] Creating new cart for user');
      cart = new Cart({
        userId,
        restaurantId,
        items: [],
        subtotal: 0,
        total: 0
      });
    }

    // Add item to cart
    await cart.addItem(itemData);
    
    console.log('✅ [CART_CONTROLLER] Item added to cart successfully:', {
      cartId: cart._id,
      itemName: itemData.name,
      quantity: itemData.quantity
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cartId: cart._id,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total
      }
    });

  } catch (error) {
    console.error('❌ [CART_CONTROLLER] addItemToCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

// Update item quantity in cart
const updateItemQuantity = async (req, res) => {
  console.log('🛒 [CART_CONTROLLER] updateItemQuantity called');
  console.log('🔍 [CART_CONTROLLER] Request body:', req.body);

  try {
    const { restaurantId, itemId, quantity } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!restaurantId || !itemId || quantity === undefined) {
      console.log('❌ [CART_CONTROLLER] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID, item ID, and quantity are required'
      });
    }

    // Find active cart
    const cart = await Cart.findActiveCart(userId, restaurantId);
    if (!cart) {
      console.log('❌ [CART_CONTROLLER] No active cart found');
      return res.status(404).json({
        success: false,
        message: 'No active cart found'
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(itemId, quantity);
    
    console.log('✅ [CART_CONTROLLER] Item quantity updated successfully:', {
      cartId: cart._id,
      itemId,
      newQuantity: quantity
    });

    res.status(200).json({
      success: true,
      message: 'Item quantity updated successfully',
      data: {
        cartId: cart._id,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total
      }
    });

  } catch (error) {
    console.error('❌ [CART_CONTROLLER] updateItemQuantity error:', error);
    
    if (error.message === 'Item not found in cart') {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating item quantity',
      error: error.message
    });
  }
};

// Remove item from cart
const removeItemFromCart = async (req, res) => {
  console.log('🛒 [CART_CONTROLLER] removeItemFromCart called');
  console.log('🔍 [CART_CONTROLLER] Request body:', req.body);

  try {
    const { restaurantId, itemId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!restaurantId || !itemId) {
      console.log('❌ [CART_CONTROLLER] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and item ID are required'
      });
    }

    // Find active cart
    const cart = await Cart.findActiveCart(userId, restaurantId);
    if (!cart) {
      console.log('❌ [CART_CONTROLLER] No active cart found');
      return res.status(404).json({
        success: false,
        message: 'No active cart found'
      });
    }

    // Remove item (set quantity to 0)
    await cart.updateItemQuantity(itemId, 0);
    
    console.log('✅ [CART_CONTROLLER] Item removed from cart successfully:', {
      cartId: cart._id,
      itemId
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cartId: cart._id,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total
      }
    });

  } catch (error) {
    console.error('❌ [CART_CONTROLLER] removeItemFromCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  console.log('🛒 [CART_CONTROLLER] clearCart called');
  console.log('🔍 [CART_CONTROLLER] Restaurant ID:', req.params.restaurantId);

  try {
    const { restaurantId } = req.params;
    const userId = req.user.id;

    // Find active cart
    const cart = await Cart.findActiveCart(userId, restaurantId);
    if (!cart) {
      console.log('❌ [CART_CONTROLLER] No active cart found');
      return res.status(404).json({
        success: false,
        message: 'No active cart found'
      });
    }

    // Clear cart
    await cart.clearCart();
    
    console.log('✅ [CART_CONTROLLER] Cart cleared successfully:', cart._id);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cartId: cart._id,
        itemCount: 0,
        subtotal: 0,
        total: 0
      }
    });

  } catch (error) {
    console.error('❌ [CART_CONTROLLER] clearCart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

// Get cart summary
const getCartSummary = async (req, res) => {
  console.log('🛒 [CART_CONTROLLER] getCartSummary called');
  console.log('🔍 [CART_CONTROLLER] Restaurant ID:', req.params.restaurantId);

  try {
    const { restaurantId } = req.params;
    const userId = req.user.id;

    // Find active cart
    const cart = await Cart.findActiveCart(userId, restaurantId);
    if (!cart) {
      console.log('❌ [CART_CONTROLLER] No active cart found');
      return res.status(404).json({
        success: false,
        message: 'No active cart found'
      });
    }

    console.log('✅ [CART_CONTROLLER] Cart summary retrieved successfully:', {
      cartId: cart._id,
      itemCount: cart.itemCount,
      total: cart.total
    });

    res.status(200).json({
      success: true,
      message: 'Cart summary retrieved successfully',
      data: {
        cartId: cart._id,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total
      }
    });

  } catch (error) {
    console.error('❌ [CART_CONTROLLER] getCartSummary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart summary',
      error: error.message
    });
  }
};

// Get all user carts from all restaurants
const getAllUserCarts = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🛒 [CART_CONTROLLER] getAllUserCarts called');
    console.log('🔍 [CART_CONTROLLER] User ID:', userId);

    // Find all active carts for user
    const carts = await Cart.find({ userId }).populate('restaurantId', 'businessName city state');

    console.log('✅ [CART_CONTROLLER] All user carts retrieved successfully:', {
      totalCarts: carts.length
    });

    // Transform cart data for response
    const transformedCarts = carts.map(cart => ({
      id: cart._id,
      restaurantId: cart.restaurantId._id,
      restaurantName: cart.restaurantId.businessName,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.total,
      createdAt: cart.createdAt
    }));

    res.status(200).json({
      success: true,
      message: 'All user carts retrieved successfully',
      data: {
        carts: transformedCarts,
        totalCarts: carts.length
      }
    });
  } catch (error) {
    console.error('❌ [CART_CONTROLLER] getAllUserCarts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all user carts',
      error: error.message
    });
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  getCartSummary,
  getAllUserCarts
};
