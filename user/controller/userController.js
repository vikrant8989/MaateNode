const User = require('../modal/user');
const jwt = require('jsonwebtoken');
const { uploadImageToS3, deleteFromS3 } = require('../../utils/s3Utils');

// Generate JWT Token
const generateToken = (userId) => {
  console.log('🔑 Generating JWT token for user ID:', userId);
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'maate_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @desc    Single API for login/signup with OTP
// @route   POST /api/user/auth
// @access  Public
const authUser = async (req, res) => {
  try {
    console.log('🚀 Auth request received:', { body: req.body });
    const { phone, otp } = req.body;

    // Validation - only phone number is required initially
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('❌ Invalid phone number:', phone);
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phone });
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      // New user registration - create with minimal data
      console.log('📝 Creating new user with phone:', phone);
      
      // Create new user with just phone number
      user = new User({
        phone,
        otp: '123456', // Hardcoded OTP
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        isVerified: false, // User needs to complete profile
        isActive: true
      });

      await user.save();
      console.log('✅ New user created:', user._id);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('🚫 User is blocked:', user.phone);
      return res.status(403).json({
        success: false,
        message: 'Account is blocked',
        reason: user.blockedReason
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('🚫 User account is deactivated:', user.phone);
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // If OTP is provided, verify it
    if (otp) {
      console.log('🔍 Verifying OTP for user:', user.phone);
      
      if (!user.verifyOTP(otp)) {
        console.log('❌ OTP verification failed for user:', user.phone);
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // OTP verified successfully
      console.log('✅ OTP verified successfully for user:', user.phone);
      user.isVerified = true;
      await user.updateLastLogin();

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.completeProfile,
          token,
          isNewUser: !user.firstName || !user.lastName, // Check if profile is complete
          needsProfileCompletion: !user.isProfile // Use isProfile field from model
        }
      });
    } else {
      // No OTP provided, send OTP
      console.log('📱 Sending OTP to user:', user.phone);
      await user.generateOTP();

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone: user.phone,
          message: 'Use OTP: 123456 for testing',
          isNewUser: !user.firstName || !user.lastName,
          needsProfileCompletion: !user.isProfile // Use isProfile field from model
        }
      });
    }

  } catch (error) {
    console.error('❌ Auth Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during authentication',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('👤 Getting profile for user ID:', req.user.id);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile retrieved successfully for user:', user.phone);
    res.status(200).json({
      success: true,
      data: user.completeProfile
    });

  } catch (error) {
    console.error('❌ Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    console.log('✏️ Updating profile for user ID:', req.user.id, 'Data:', req.body);
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      address,
      city,
      state,
      pincode,
      gender
    } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validation and updates
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
        console.log('❌ Invalid first name:', firstName);
        return res.status(400).json({
          success: false,
          message: 'First name must be between 2 and 50 characters'
        });
      }
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
        console.log('❌ Invalid last name:', lastName);
        return res.status(400).json({
          success: false,
          message: 'Last name must be between 2 and 50 characters'
        });
      }
      user.lastName = lastName.trim();
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = new Date(dateOfBirth);
    }

    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log('❌ Invalid email format:', email);
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email'
        });
      }
      user.email = email?.toLowerCase().trim();
    }

    if (address !== undefined) {
      if (address && address.trim().length > 500) {
        console.log('❌ Address too long:', address.length);
        return res.status(400).json({
          success: false,
          message: 'Address cannot exceed 500 characters'
        });
      }
      user.address = address?.trim();
    }

    if (city !== undefined) {
      user.city = city?.trim();
    }

    if (state !== undefined) {
      user.state = state?.trim();
    }

    if (pincode !== undefined) {
      if (pincode && (pincode.length !== 6 || !/^\d+$/.test(pincode))) {
        console.log('❌ Invalid pincode:', pincode);
        return res.status(400).json({
          success: false,
          message: 'Pincode must be 6 digits'
        });
      }
      user.pincode = pincode;
    }

    if (gender !== undefined) {
      if (gender && !['male', 'female', 'other'].includes(gender)) {
        console.log('❌ Invalid gender:', gender);
        return res.status(400).json({
          success: false,
          message: 'Gender must be male, female, or other'
        });
      }
      user.gender = gender;
    }

    // Check if profile is now complete (has firstName and lastName)
    if (user.firstName && user.lastName && !user.isProfile) {
      console.log('✅ Profile is now complete, marking isProfile as true');
      user.isProfile = true;
    }

    await user.save();
    console.log('✅ Profile updated successfully for user:', user.phone);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.completeProfile
    });

  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Upload user profile image
// @route   POST /api/user/upload-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    console.log('🖼️ Uploading profile image for user ID:', req.user.id);
    
    if (!req.file) {
      console.log('❌ No image file provided');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image from S3 if it exists
    if (user.profileImage && user.profileImage.startsWith('http')) {
      try {
        console.log('🗑️ Deleting old profile image from S3:', user.profileImage);
        await deleteFromS3(user.profileImage);
        console.log('✅ Old profile image deleted from S3');
      } catch (deleteError) {
        console.log('⚠️ Warning: Could not delete old profile image from S3:', deleteError.message);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to S3
    console.log('📤 Uploading new profile image to S3');
    const s3ImageUrl = await uploadImageToS3(req.file, 'user-profiles');
    
    // Update user profile with S3 URL
    user.profileImage = s3ImageUrl;
    await user.save();

    console.log('✅ Profile image uploaded successfully to S3 for user:', user.phone);
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('❌ Upload Profile Image Error:', error);
    
    // Handle S3-specific errors
    if (error.message.includes('S3') || error.message.includes('upload')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image. Please try again.',
        error: 'Image upload service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading profile image',
      error: error.message
    });
  }
};

// @desc    Delete user profile image
// @route   DELETE /api/user/profile-image
// @access  Private
const deleteProfileImage = async (req, res) => {
  try {
    console.log('🗑️ Deleting profile image for user ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profileImage) {
      console.log('ℹ️ No profile image to delete for user:', user.phone);
      return res.status(200).json({
        success: true,
        message: 'No profile image to delete'
      });
    }

    // Delete image from S3 if it's an S3 URL
    if (user.profileImage.startsWith('http')) {
      try {
        console.log('🗑️ Deleting profile image from S3:', user.profileImage);
        await deleteFromS3(user.profileImage);
        console.log('✅ Profile image deleted from S3');
      } catch (deleteError) {
        console.log('⚠️ Warning: Could not delete profile image from S3:', deleteError.message);
        // Continue with local deletion even if S3 deletion fails
      }
    }

    // Remove profile image reference from user
    user.profileImage = undefined;
    await user.save();

    console.log('✅ Profile image deleted successfully for user:', user.phone);
    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete Profile Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile image',
      error: error.message
    });
  }
};

// @desc    Upload multiple images for user
// @route   POST /api/user/upload-images
// @access  Private
const uploadMultipleImages = async (req, res) => {
  try {
    console.log('🖼️ Uploading multiple images for user ID:', req.user.id);
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No image files provided');
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`📤 Uploading ${req.files.length} images to S3`);
    
    // Upload all images to S3
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        const s3ImageUrl = await uploadImageToS3(file, `user-images/${user._id}`);
        console.log(`✅ Image ${index + 1} uploaded to S3:`, s3ImageUrl);
        return {
          originalName: file.originalname,
          url: s3ImageUrl,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (uploadError) {
        console.log(`❌ Failed to upload image ${index + 1}:`, uploadError.message);
        throw uploadError;
      }
    });

    const uploadedImages = await Promise.all(uploadPromises);

    console.log('✅ All images uploaded successfully for user:', user.phone);
    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages,
        totalCount: uploadedImages.length
      }
    });

  } catch (error) {
    console.error('❌ Upload Multiple Images Error:', error);
    
    // Handle S3-specific errors
    if (error.message.includes('S3') || error.message.includes('upload')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload one or more images. Please try again.',
        error: 'Image upload service error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// @desc    Update complete user profile (data + image) in single request
// @route   PUT /api/user/profile-complete
// @access  Private
const updateCompleteProfile = async (req, res) => {
  try {
    console.log('🔄 Updating complete profile for user ID:', req.user.id);
    console.log('📝 Profile data:', req.body);
    console.log('🖼️ Image file:', req.file ? 'Present' : 'Not provided');
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract profile data from request body
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      address,
      city,
      state,
      pincode,
      gender
    } = req.body;

    // Validate profile data
    const validationErrors = [];

    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
        validationErrors.push('First name must be between 2 and 50 characters');
      }
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
        validationErrors.push('Last name must be between 2 and 50 characters');
      }
    }

    if (email !== undefined && email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        validationErrors.push('Please provide a valid email');
      }
    }

    if (address !== undefined && address) {
      if (address.trim().length > 500) {
        validationErrors.push('Address cannot exceed 500 characters');
      }
    }

    if (pincode !== undefined && pincode) {
      if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
        validationErrors.push('Pincode must be 6 digits');
      }
    }

    if (gender !== undefined && gender) {
      if (!['male', 'female', 'other'].includes(gender)) {
        validationErrors.push('Gender must be male, female, or other');
      }
    }

    // Validate date of birth if provided
    if (dateOfBirth !== undefined && dateOfBirth) {
      try {
        const parsedDate = new Date(dateOfBirth);
        
        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
          validationErrors.push('Invalid date of birth format');
        } else {
          // Check if date is reasonable (not too far in past/future)
          const currentYear = new Date().getFullYear();
          const birthYear = parsedDate.getFullYear();
          
          if (birthYear < 1900 || birthYear > currentYear) {
            validationErrors.push('Date of birth must be between 1900 and current year');
          }
          
          // Check if date is not in the future
          if (parsedDate > new Date()) {
            validationErrors.push('Date of birth cannot be in the future');
          }
        }
      } catch (dateError) {
        console.log('❌ Date parsing error:', dateError);
        validationErrors.push('Invalid date of birth');
      }
    }

    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    let newProfileImage = null;

    // Handle profile image upload if provided
    if (req.file) {
      try {
        console.log('📤 Processing profile image upload');
        
        // Delete old profile image from S3 if it exists
        if (user.profileImage && user.profileImage.startsWith('http')) {
          try {
            console.log('🗑️ Deleting old profile image from S3:', user.profileImage);
            await deleteFromS3(user.profileImage);
            console.log('✅ Old profile image deleted from S3');
          } catch (deleteError) {
            console.log('⚠️ Warning: Could not delete old profile image from S3:', deleteError.message);
            // Continue with upload even if deletion fails
          }
        }

        // Upload new image to S3
        console.log('📤 Uploading new profile image to S3');
        const s3ImageUrl = await uploadImageToS3(req.file, 'user-profiles');
        newProfileImage = s3ImageUrl;
        console.log('✅ New profile image uploaded to S3:', s3ImageUrl);
        
      } catch (imageError) {
        console.error('❌ Profile image upload error:', imageError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload profile image. Please try again.',
          error: 'Image upload service error'
        });
      }
    }

    // Prepare profile data for update
    const profileData = {};
    
    if (firstName !== undefined) profileData.firstName = firstName;
    if (lastName !== undefined) profileData.lastName = lastName;
    if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth;
    if (email !== undefined) profileData.email = email;
    if (address !== undefined) profileData.address = address;
    if (city !== undefined) profileData.city = city;
    if (state !== undefined) profileData.state = state;
    if (pincode !== undefined) profileData.pincode = pincode;
    if (gender !== undefined) profileData.gender = gender;

    // Update the complete profile
    await user.updateCompleteProfile(profileData, newProfileImage);

    // Get updated profile summary
    const profileSummary = user.getProfileUpdateSummary();

    console.log('✅ Complete profile updated successfully for user:', user.phone);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileSummary
    });

  } catch (error) {
    console.error('❌ Update Complete Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get user dashboard
// @route   GET /api/user/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Getting dashboard for user ID:', req.user.id);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Dashboard data (placeholder for now)
    const dashboardData = {
      userInfo: {
        name: user.fullName,
        phone: user.phone,
        lastActive: user.lastActive
      },
      stats: {
        totalAddresses: user.addresses.length,
        activeAddresses: user.activeAddresses.length
      },
      preferences: {
        gender: user.gender,
        email: user.email
      }
    };

    console.log('✅ Dashboard data retrieved successfully for user:', user.phone);
    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/user/logout
// @access  Private
const logout = async (req, res) => {
  try {
    console.log('🚪 Logout request for user ID:', req.user.id);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// ==================== ADDRESS CRUD OPERATIONS ====================

// @desc    Get all addresses for a user
// @route   GET /api/user/addresses
// @access  Private
const getAddresses = async (req, res) => {
  try {
    console.log('📍 Getting addresses for user ID:', req.user.id);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get only active addresses
    const activeAddresses = user.addresses.filter(addr => addr.isActive);
    
    console.log('✅ Addresses retrieved successfully for user:', user.phone, 'Count:', activeAddresses.length);
    res.status(200).json({
      success: true,
      data: activeAddresses
    });

  } catch (error) {
    console.error('❌ Get Addresses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses',
      error: error.message
    });
  }
};

// @desc    Add new address for a user
// @route   POST /api/user/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    console.log('📍 Adding new address for user ID:', req.user.id, 'Data:', req.body);
    const { type, fullAddress, city, pincode, isDefault } = req.body;

    // Validation
    if (!fullAddress || !city || !pincode) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Full address, city, and pincode are required'
      });
    }

    if (type && !['home', 'work', 'other'].includes(type)) {
      console.log('❌ Invalid address type:', type);
      return res.status(400).json({
        success: false,
        message: 'Address type must be home, work, or other'
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      console.log('❌ Invalid pincode:', pincode);
      return res.status(400).json({
        success: false,
        message: 'Pincode must be 6 digits'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add the new address
    await user.addAddress({
      type: type || 'home',
      fullAddress,
      city,
      pincode,
      isDefault: isDefault || false
    });

    // Get updated user with new address
    const updatedUser = await User.findById(req.user.id);
    const newAddress = updatedUser.addresses[updatedUser.addresses.length - 1];

    console.log('✅ Address added successfully for user:', user.phone, 'Address ID:', newAddress._id);
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });

  } catch (error) {
    console.error('❌ Add Address Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
};

// @desc    Get specific address by ID
// @route   GET /api/user/addresses/:addressId
// @access  Private
const getAddressById = async (req, res) => {
  try {
    console.log('📍 Getting address by ID:', req.params.addressId, 'for user ID:', req.user.id);
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    
    if (!address || !address.isActive) {
      console.log('❌ Address not found or inactive for ID:', addressId);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    console.log('✅ Address retrieved successfully for user:', user.phone, 'Address ID:', addressId);
    res.status(200).json({
      success: true,
      data: address
    });

  } catch (error) {
    console.error('❌ Get Address By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching address',
      error: error.message
    });
  }
};

// @desc    Update specific address
// @route   PUT /api/user/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
  try {
    console.log('✏️ Updating address:', req.params.addressId, 'for user ID:', req.user.id, 'Data:', req.body);
    const { addressId } = req.params;
    const { type, fullAddress, city, pincode, isDefault } = req.body;

    // Validation
    if (type && !['home', 'work', 'other'].includes(type)) {
      console.log('❌ Invalid address type:', type);
      return res.status(400).json({
        success: false,
        message: 'Address type must be home, work, or other'
      });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      console.log('❌ Invalid pincode:', pincode);
      return res.status(400).json({
        success: false,
        message: 'Pincode must be 6 digits'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    
    if (!address || !address.isActive) {
      console.log('❌ Address not found or inactive for ID:', addressId);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (fullAddress !== undefined) updateData.fullAddress = fullAddress;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // Update the address
    await user.updateAddress(addressId, updateData);

    // Get updated address
    const updatedUser = await User.findById(req.user.id);
    const updatedAddress = updatedUser.addresses.id(addressId);

    console.log('✅ Address updated successfully for user:', user.phone, 'Address ID:', addressId);
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });

  } catch (error) {
    console.error('❌ Update Address Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
};

// @desc    Delete specific address
// @route   DELETE /api/user/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    console.log('🗑️ Deleting address:', req.params.addressId, 'for user ID:', req.user.id);
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    
    if (!address || !address.isActive) {
      console.log('❌ Address not found or inactive for ID:', addressId);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Delete the address (soft delete)
    await user.deleteAddress(addressId);

    console.log('✅ Address deleted successfully for user:', user.phone, 'Address ID:', addressId);
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete Address Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: error.message
    });
  }
};

// @desc    Set address as default
// @route   PUT /api/user/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    console.log('⭐ Setting default address:', req.params.addressId, 'for user ID:', req.user.id);
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    
    if (!address || !address.isActive) {
      console.log('❌ Address not found or inactive for ID:', addressId);
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Set as default
    await user.setDefaultAddress(addressId);

    // Get updated address
    const updatedUser = await User.findById(req.user.id);
    const updatedAddress = updatedUser.addresses.id(addressId);

    console.log('✅ Default address set successfully for user:', user.phone, 'Address ID:', addressId);
    res.status(200).json({
      success: true,
      message: 'Default address set successfully',
      data: updatedAddress
    });

  } catch (error) {
    console.error('❌ Set Default Address Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default address',
      error: error.message
    });
  }
};

module.exports = {
  authUser,
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  uploadMultipleImages,
  updateCompleteProfile,
  getDashboard,
  logout,
  getAddresses,
  addAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress
}; 