const Restaurant = require('../modal/restaurant');
const jwt = require('jsonwebtoken');
const admin = require("../config/firebase"); // Firebase Admin SDK initialized here

const { uploadImageToS3, updateFromS3, uploadMultipleImagesToS3 } = require('../../utils/s3Utils');

// Generate JWT Token
const generateToken = (restaurantId) => {
  console.log('🔑 [JWT] Generating token for restaurant ID:', restaurantId);
  const token = jwt.sign({ id: restaurantId }, process.env.JWT_SECRET || 'maate_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
  console.log('🔑 [JWT] Token generated successfully');
  return token;
};

// @desc    Send OTP to restaurant phone
// @route   POST /api/restaurant/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    console.log('🔐 [SEND_OTP] Request received:', req.body);
    const { phone } = req.body;
    // Validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('❌ [SEND_OTP] Validation failed for phone:', phone);
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    console.log('✅ [SEND_OTP] Phone validation passed:', phone);

    // Check if restaurant exists
    let restaurant = await Restaurant.findOne({ phone });

    if (!restaurant) {
      console.log('🆕 [SEND_OTP] Restaurant not found, creating new one for phone:', phone);
      // Create new restaurant with basic info
      restaurant = new Restaurant({
        phone,
        firstName: 'Pending',
        lastName: 'Update',
        dateOfBirth: new Date('1990-01-01'), // Default date
        businessName: 'Pending Update',
        email: `${phone}@pending.com`, // Temporary email
        address: 'Pending Update',
        city: 'Pending Update',
        pinCode: '000000',
        state: 'Pending Update',
        category: 'Veg',
        isProfile: false, // Profile not completed
        isActive: true, // Allow access to profile update endpoints
        isVerified: true // Mark as verified since OTP was sent
      });
      
      await restaurant.save();
      console.log('✅ [SEND_OTP] New restaurant created with ID:', restaurant._id);
    } else {
      console.log('✅ [SEND_OTP] Existing restaurant found with ID:', restaurant._id);
      
      // Activate existing restaurant if it's not active
      if (!restaurant.isActive) {
        console.log('🔄 [SEND_OTP] Activating existing restaurant for profile setup');
        restaurant.isActive = true;
        restaurant.isVerified = true;
        await restaurant.save();
        console.log('✅ [SEND_OTP] Restaurant activated successfully');
      }
    }

    // Generate new OTP
    console.log('🔢 [SEND_OTP] Generating OTP for restaurant:', restaurant._id);
    await restaurant.generateOTP();

    console.log('✅ [SEND_OTP] OTP generated successfully for phone:', phone);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: restaurant.phone,
        message: 'Use OTP: 1234 for testing',
        isNewRestaurant: !restaurant.isProfile
      }
    });

  } catch (error) {
    console.error('❌ [SEND_OTP] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @desc    Verify OTP and login restaurant
// @route   POST /api/restaurant/verify-otp
// @access  Public
// const verifyOTP = async (req, res) => {
//   try {
//     console.log('🔍 [VERIFY_OTP] Request received:', req.body);
//     const { phone, otp } = req.body;

//     // Validation
//     if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
//       console.log('❌ [VERIFY_OTP] Phone validation failed:', phone);
//       return res.status(400).json({
//         success: false,
//         message: 'Phone number must be 10 digits'
//       });
//     }

//     if (!otp || otp.length !== 4 || !/^\d+$/.test(otp)) {
//       console.log('❌ [VERIFY_OTP] OTP validation failed:', otp);
//       return res.status(400).json({
//         success: false,
//         message: 'OTP must be 4 digits'
//       });
//     }

//     console.log('✅ [VERIFY_OTP] Validation passed - Phone:', phone, 'OTP:', otp);

//     const restaurant = await Restaurant.findOne({ phone });

//     if (!restaurant) {
//       console.log('❌ [VERIFY_OTP] Restaurant not found for phone:', phone);
//       return res.status(404).json({
//         success: false,
//         message: 'Restaurant not found'
//       });
//     }

//     console.log('✅ [VERIFY_OTP] Restaurant found with ID:', restaurant._id);

//     // Verify OTP
//     console.log('🔢 [VERIFY_OTP] Verifying OTP. Expected:', restaurant.otp, 'Received:', otp);
//     if (!restaurant.verifyOTP(otp)) {
//       console.log('❌ [VERIFY_OTP] OTP verification failed');
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired OTP'
//       });
//     }

//     console.log('✅ [VERIFY_OTP] OTP verified successfully');

//     // For new restaurants (not approved yet), allow login but mark as pending
//     if (!restaurant.isApproved) {
//       console.log('⚠️ [VERIFY_OTP] Restaurant not approved yet, allowing login for profile setup');
//       // Update verification status and last login
//       restaurant.isVerified = true;
//       await restaurant.updateLastLogin();

//       // Generate JWT token
//       const token = generateToken(restaurant._id);
//       console.log('🔑 [VERIFY_OTP] JWT token generated for unapproved restaurant:', restaurant._id);

//       return res.status(200).json({
//         success: true,
//         message: 'OTP verified successfully. Profile setup required.',
//         data: {
//           restaurant: restaurant.completeProfile,
//           token,
//           isProfile: restaurant.isProfile,
//           message: 'Please complete your profile setup. Your account is pending admin approval.'
//         }
//       });
//     }

//     // Check if restaurant is active
//     if (!restaurant.isActive) {
//       console.log('❌ [VERIFY_OTP] Restaurant is deactivated:', restaurant._id);
//       return res.status(403).json({
//         success: false,
//         message: 'Restaurant account is deactivated. Please contact admin.',
//         status: restaurant.status
//       });
//     }

//     console.log('✅ [VERIFY_OTP] Restaurant is approved and active');

//     // Update verification status and last login
//     restaurant.isVerified = true;
//     await restaurant.updateLastLogin();

//     // Generate JWT token
//     const token = generateToken(restaurant._id);
//     console.log('🔑 [VERIFY_OTP] JWT token generated for approved restaurant:', restaurant._id);

//     res.status(200).json({
//       success: true,
//       message: 'OTP verified successfully',
//       data: {
//         restaurant: restaurant.completeProfile,
//         token,
//         isProfile: restaurant.isProfile
//       }
//     });

//   } catch (error) {
//     console.error('❌ [VERIFY_OTP] Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error verifying OTP',
//       error: error.message
//     });
//   }
// };

// vikrant changes 
// @desc    Verify Firebase OTP and login restaurant
// @route   POST /api/restaurant/verify-otp
// @access  Public


const verifyOTP = async (req, res) => {
  try {
    console.log("🔍 [VERIFY_OTP] Request received:", req.body);
    const { phone, firebaseToken, firebaseUid } = req.body;

    // 🔹 Basic validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }
    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    // 🔹 Verify Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log("✅ [VERIFY_OTP] Firebase token verified:", decodedToken.uid);

      // Optional: Cross-check UID from frontend with decoded UID
      if (firebaseUid && firebaseUid !== decodedToken.uid) {
        console.warn(
          "⚠️ [VERIFY_OTP] UID mismatch! Frontend UID:",
          firebaseUid,
          "Decoded UID:",
          decodedToken.uid
        );
        return res.status(401).json({
          success: false,
          message: "Firebase UID mismatch",
        });
      }
    } catch (err) {
      console.error("❌ [VERIFY_OTP] Firebase token verification failed:", err);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Firebase token",
      });
    }

    // 🔹 Find Restaurant by phone
    const restaurant = await Restaurant.findOne({ phone });
    if (!restaurant) {
      console.log("❌ [VERIFY_OTP] Restaurant not found for phone:", phone);
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    console.log("✅ [VERIFY_OTP] Restaurant found with ID:", restaurant._id);

    // 🔹 Update verification status & last login
    restaurant.isVerified = true;
    await restaurant.updateLastLogin();

    // Handle unapproved restaurants
    if (!restaurant.isApproved) {
      const token = generateToken(restaurant._id);
      return res.status(200).json({
        success: true,
        message: "OTP verified. Profile setup required.",
        data: {
          restaurant: restaurant.completeProfile,
          token,
          isProfile: restaurant.isProfile,
          message:
            "Please complete your profile setup. Your account is pending admin approval.",
        },
      });
    }

    // Handle inactive restaurants
    if (!restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Restaurant account is deactivated. Please contact administrator.",
        status: restaurant.status,
      });
    }

    // 🔹 Approved & Active → Generate JWT
    const token = generateToken(restaurant._id);
    console.log("🔑 [VERIFY_OTP] JWT token generated for:", restaurant._id);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        restaurant: restaurant.completeProfile,
        token,
        isProfile: restaurant.isProfile,
      },
    });
  } catch (error) {
    console.error("❌ [VERIFY_OTP] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

// @desc    Register new restaurant
// @route   POST /api/restaurant/register
// @access  Public
const registerRestaurant = async (req, res) => {
  try {
    console.log('📝 [REGISTER] Request received:', req.body);
    const {
      phone,
      firstName,
      lastName,
      dateOfBirth,
      businessName,
      email,
      address,
      city,
      pinCode,
      state,
      category,
      specialization,
      bankName,
      bankBranch,
      accountNumber,
      accountHolder,
      ifscCode,
      customerId,
      bankPhoneNumber
    } = req.body;

    // Validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('❌ [REGISTER] Phone validation failed:', phone);
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
      console.log('❌ [REGISTER] First name validation failed:', firstName);
      return res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters'
      });
    }

    if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
      console.log('❌ [REGISTER] Last name validation failed:', lastName);
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters'
      });
    }

    if (!businessName || businessName.trim().length < 2 || businessName.trim().length > 100) {
      console.log('❌ [REGISTER] Business name validation failed:', businessName);
      return res.status(400).json({
        success: false,
        message: 'Business name must be between 2 and 100 characters'
      });
    }

    if (!['Veg', 'Non Veg', 'Mix'].includes(category)) {
      console.log('❌ [REGISTER] Category validation failed:', category);
      return res.status(400).json({
        success: false,
        message: 'Category must be Veg, Non Veg, or Mix'
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ [REGISTER] Email validation failed:', email);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

   
 

     
  
    console.log('✅ [REGISTER] All validations passed');

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingRestaurant) {
      console.log('❌ [REGISTER] Restaurant already exists with phone:', phone, 'or email:', email);
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this phone or email already exists'
      });
    }

    console.log('✅ [REGISTER] No existing restaurant found, creating new one');

    // Create new restaurant
    const restaurant = new Restaurant({
      phone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      businessName: businessName.trim(),
      category,
      email: email.toLowerCase().trim(),
      address: address.trim(),
      city: city.trim(),
      pinCode,
      state: state.trim(),
      specialization: specialization?.trim() || '',
      bankName: bankName?.trim(),
      bankBranch: bankBranch?.trim(),
      accountNumber: accountNumber?.trim(),
      accountHolder: accountHolder?.trim(),
      ifscCode: ifscCode?.trim(),
      customerId: customerId?.trim(),
      bankPhoneNumber: bankPhoneNumber?.trim()
    });

    await restaurant.save();
    console.log('✅ [REGISTER] Restaurant created successfully with ID:', restaurant._id);

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully. Pending admin approval.',
      data: {
        restaurant: restaurant.completeProfile,
        message: 'Your registration is pending approval. You will be notified once approved.'
      }
    });

  } catch (error) {
    console.error('❌ [REGISTER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering restaurant',
      error: error.message
    });
  }
};

// @desc    Create or update restaurant profile (comprehensive API)
// @route   POST /api/restaurant/profile
// @access  Private
const createOrUpdateProfile = async (req, res) => {
  try {
    console.log('📝 [UPDATE_PROFILE] Request received from user:', req.user.id);
    console.log('📝 [UPDATE_PROFILE] Request body:', req.body);
    console.log('📝 [UPDATE_PROFILE] Files:', req.files);
    
    // Log individual fields for debugging
    console.log('🔍 [UPDATE_PROFILE] Extracted fields:', {
      phone: req.body.phone,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      businessName: req.body.businessName,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      pinCode: req.body.pinCode,
      state: req.body.state,
      category: req.body.category,
      specialization: req.body.specialization,
      bankName: req.body.bankName,
      bankBranch: req.body.bankBranch,
      accountNumber: req.body.accountNumber,
      accountHolder: req.body.accountHolder,
      ifscCode: req.body.ifscCode,
      customerId: req.body.customerId,
      bankPhoneNumber: req.body.bankPhoneNumber
    });
    
    const {
      phone,
      firstName,
      lastName,
      dateOfBirth,
      businessName,
      email,
      address,
      city,
      pinCode,
      state,
      category,
      specialization,
      bankName,
      bankBranch,
      accountNumber,
      accountHolder,
      ifscCode,
      customerId,
      bankPhoneNumber
    } = req.body;

    // Check if restaurant exists
    let restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [UPDATE_PROFILE] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [UPDATE_PROFILE] Restaurant found:', restaurant._id);

    // Validation for required fields
    if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
      console.log('❌ [UPDATE_PROFILE] First name validation failed:', firstName);
      return res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters'
      });
    }

    if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
      console.log('❌ [UPDATE_PROFILE] Last name validation failed:', lastName);
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters'
      });
    }

    if (!businessName || businessName.trim().length < 2 || businessName.trim().length > 100) {
      console.log('❌ [UPDATE_PROFILE] Business name validation failed:', businessName);
      return res.status(400).json({
        success: false,
        message: 'Business name must be between 2 and 100 characters'
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ [UPDATE_PROFILE] Email validation failed:', email);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }
 

    

    

    console.log('✅ [UPDATE_PROFILE] All validations passed');

    // Update profile fields
    restaurant.firstName = firstName.trim();
    restaurant.lastName = lastName.trim();
    restaurant.businessName = businessName.trim();
    restaurant.email = email.toLowerCase().trim();
    restaurant.address = address.trim();
    restaurant.city = city.trim();
    restaurant.pinCode = pinCode;
    restaurant.state = state.trim();
    restaurant.category = category;
    restaurant.specialization = specialization?.trim() || '';

    // Update bank details
    if (bankName !== undefined) restaurant.bankName = bankName?.trim();
    if (bankBranch !== undefined) restaurant.bankBranch = bankBranch?.trim();
    if (accountNumber !== undefined) restaurant.accountNumber = accountNumber?.trim();
    if (accountHolder !== undefined) restaurant.accountHolder = accountHolder?.trim();
    if (ifscCode !== undefined) restaurant.ifscCode = ifscCode?.trim();
    if (customerId !== undefined) restaurant.customerId = customerId?.trim();
    if (bankPhoneNumber !== undefined) restaurant.bankPhoneNumber = bankPhoneNumber?.trim();

    // Handle date of birth
    if (dateOfBirth) {
      restaurant.dateOfBirth = new Date(dateOfBirth);
    }

    console.log('✅ [UPDATE_PROFILE] Profile fields updated');
    console.log('💾 [UPDATE_PROFILE] Updated restaurant data:', {
      firstName: restaurant.firstName,
      lastName: restaurant.lastName,
      businessName: restaurant.businessName,
      email: restaurant.email,
      address: restaurant.address,
      city: restaurant.city,
      pinCode: restaurant.pinCode,
      state: restaurant.state,
      category: restaurant.category,
      specialization: restaurant.specialization,
      bankName: restaurant.bankName,
      bankBranch: restaurant.bankBranch,
      accountNumber: restaurant.accountNumber,
      accountHolder: restaurant.accountHolder,
      ifscCode: restaurant.ifscCode,
      customerId: restaurant.customerId,
      bankPhoneNumber: restaurant.bankPhoneNumber,
      dateOfBirth: restaurant.dateOfBirth
    });

    // Handle file uploads
    if (req.files) {
      console.log('📁 [UPDATE_PROFILE] Processing file uploads...');
      
      // Profile image
      if (req.files.profileImage && req.files.profileImage[0]) {
        try {
          console.log('🖼️ [UPDATE_PROFILE] Processing profile image...');
          if (restaurant.profileImage) {
            // Update existing image
            restaurant.profileImage = await updateFromS3(restaurant.profileImage, req.files.profileImage[0], 'restaurants');
            console.log('✅ [UPDATE_PROFILE] Profile image updated');
          } else {
            // Upload new image
            restaurant.profileImage = await uploadImageToS3(req.files.profileImage[0], 'restaurants');
            console.log('✅ [UPDATE_PROFILE] Profile image uploaded');
          }
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] Profile image upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading profile image'
          });
        }
      }

      // QR Code
      if (req.files.qrCode && req.files.qrCode[0]) {
        try {
          console.log('📱 [UPDATE_PROFILE] Processing QR code...');
          if (restaurant.qrCode) {
            // Update existing QR code
            restaurant.qrCode = await updateFromS3(restaurant.qrCode, req.files.qrCode[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] QR code updated');
          } else {
            // Upload new QR code
            restaurant.qrCode = await uploadImageToS3(req.files.qrCode[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] QR code uploaded');
          }
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] QR code upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading QR code'
          });
        }
      }

      // Mess images
      if (req.files.messImages && req.files.messImages.length > 0) {
        try {
          console.log('🖼️ [UPDATE_PROFILE] Processing mess images...');
          const newMessImages = await uploadMultipleImagesToS3(req.files.messImages, 'restaurants/mess');
          restaurant.messImages = [...(restaurant.messImages || []), ...newMessImages];
          console.log('✅ [UPDATE_PROFILE] Mess images uploaded:', newMessImages.length);
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] Mess images upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading mess images'
          });
        }
      }

      // Passbook
      if (req.files.passbook && req.files.passbook[0]) {
        try {
          console.log('📄 [UPDATE_PROFILE] Processing passbook...');
          if (restaurant.passbook) {
            restaurant.passbook = await updateFromS3(restaurant.passbook, req.files.passbook[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] Passbook updated');
          } else {
            restaurant.passbook = await uploadImageToS3(req.files.passbook[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] Passbook uploaded');
          }
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] Passbook upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading passbook'
          });
        }
      }

      // Aadhar card
      if (req.files.aadharCard && req.files.aadharCard[0]) {
        try {
          console.log('🆔 [UPDATE_PROFILE] Processing aadhar card...');
          if (restaurant.aadharCard) {
            restaurant.aadharCard = await updateFromS3(restaurant.aadharCard, req.files.aadharCard[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] Aadhar card updated');
          } else {
            restaurant.aadharCard = await uploadImageToS3(req.files.aadharCard[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] Aadhar card uploaded');
          }
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] Aadhar card upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading aadhar card'
          });
        }
      }

      // PAN card
      if (req.files.panCard && req.files.panCard[0]) {
        try {
          console.log('🆔 [UPDATE_PROFILE] Processing PAN card...');
          if (restaurant.panCard) {
            restaurant.panCard = await updateFromS3(restaurant.panCard, req.files.panCard[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] PAN card updated');
          } else {
            restaurant.panCard = await uploadImageToS3(req.files.panCard[0], 'restaurants/documents');
            console.log('✅ [UPDATE_PROFILE] PAN card uploaded');
          }
        } catch (error) {
          console.error('❌ [UPDATE_PROFILE] PAN card upload error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error uploading PAN card'
          });
        }
      }
    }

    await restaurant.save();
    console.log('✅ [UPDATE_PROFILE] Restaurant saved to database');

    // Set isProfile to true after successful profile update
    restaurant.isProfile = true;
    await restaurant.save();
    console.log('✅ [UPDATE_PROFILE] isProfile set to true');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('❌ [UPDATE_PROFILE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get restaurant profile
// @route   GET /api/restaurant/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('👤 [GET_PROFILE] Request received from user:', req.user.id);
    
    const restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [GET_PROFILE] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [GET_PROFILE] Profile retrieved successfully for restaurant:', restaurant._id);

    res.status(200).json({
      success: true,
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('❌ [GET_PROFILE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Get restaurant dashboard
// @route   GET /api/restaurant/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    console.log('📊 [DASHBOARD] Request received from user:', req.user.id);
    
    const restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [DASHBOARD] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [DASHBOARD] Restaurant found:', restaurant._id);

    // Dashboard data (placeholder for now)
    const dashboardData = {
      restaurantInfo: {
        name: `${restaurant.firstName} ${restaurant.lastName}`,
        businessName: restaurant.businessName,
        status: restaurant.status,
        isActive: restaurant.isActive,
        isApproved: restaurant.isApproved
      },
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageRating: 0
      },
      recentActivity: []
    };

    console.log('✅ [DASHBOARD] Dashboard data prepared successfully');

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

// @desc    Remove mess image
// @route   DELETE /api/restaurant/mess-image/:imageUrl
// @access  Private
const removeMessImage = async (req, res) => {
  try {
    console.log('🗑️ [REMOVE_MESS_IMAGE] Request received from user:', req.user.id);
    console.log('🗑️ [REMOVE_MESS_IMAGE] Image URL to remove:', req.params.imageUrl);
    
    const { imageUrl } = req.params;
    const restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [REMOVE_MESS_IMAGE] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [REMOVE_MESS_IMAGE] Restaurant found:', restaurant._id);
    console.log('🗑️ [REMOVE_MESS_IMAGE] Current mess images:', restaurant.messImages);

    // Remove the image from messImages array
    restaurant.messImages = restaurant.messImages.filter(img => img !== imageUrl);
    await restaurant.save();

    console.log('✅ [REMOVE_MESS_IMAGE] Mess image removed successfully');
    console.log('🗑️ [REMOVE_MESS_IMAGE] Updated mess images:', restaurant.messImages);

    res.status(200).json({
      success: true,
      message: 'Mess image removed successfully',
      data: {
        messImages: restaurant.messImages
      }
    });

  } catch (error) {
    console.error('❌ [REMOVE_MESS_IMAGE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing mess image',
      error: error.message
    });
  }
};

// @desc    Clear all mess images
// @route   DELETE /api/restaurant/mess-images
// @access  Private
const clearMessImages = async (req, res) => {
  try {
    console.log('🗑️ [CLEAR_MESS_IMAGES] Request received from user:', req.user.id);
    
    const restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [CLEAR_MESS_IMAGES] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [CLEAR_MESS_IMAGES] Restaurant found:', restaurant._id);
    console.log('🗑️ [CLEAR_MESS_IMAGES] Current mess images count:', restaurant.messImages?.length || 0);

    // Clear all mess images
    restaurant.messImages = [];
    await restaurant.save();

    console.log('✅ [CLEAR_MESS_IMAGES] All mess images cleared successfully');

    res.status(200).json({
      success: true,
      message: 'All mess images cleared successfully',
      data: {
        messImages: restaurant.messImages
      }
    });

  } catch (error) {
    console.error('❌ [CLEAR_MESS_IMAGES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing mess images',
      error: error.message
    });
  }
};

// @desc    Logout restaurant
// @route   POST /api/restaurant/logout
// @access  Private
const logout = async (req, res) => {
  try {
    console.log('🚪 [LOGOUT] Request received from user:', req.user.id);
    console.log('✅ [LOGOUT] Restaurant logged out successfully');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ [LOGOUT] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// @desc    Toggle restaurant online/offline status
// @route   POST /api/restaurant/toggle-online
// @access  Private
const toggleOnlineStatus = async (req, res) => {
  try {
    console.log('🔄 [TOGGLE_ONLINE] Request received from user:', req.user.id);
    
    const restaurant = await Restaurant.findById(req.user.id);
    
    if (!restaurant) {
      console.log('❌ [TOGGLE_ONLINE] Restaurant not found for user ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ [TOGGLE_ONLINE] Restaurant found:', restaurant._id);
    console.log('🔄 [TOGGLE_ONLINE] Current online status:', restaurant.isOnline);

    // Toggle online status
    await restaurant.toggleOnlineStatus();
    
    console.log('✅ [TOGGLE_ONLINE] Online status toggled to:', restaurant.isOnline);

    res.status(200).json({
      success: true,
      message: `Restaurant is now ${restaurant.isOnline ? 'online' : 'offline'}`,
      data: {
        isOnline: restaurant.isOnline,
        message: restaurant.isOnline 
          ? 'Your restaurant is now online and visible to customers' 
          : 'Your restaurant is now offline and not visible to customers'
      }
    });

  } catch (error) {
    console.error('❌ [TOGGLE_ONLINE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling online status',
      error: error.message
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  registerRestaurant,
  createOrUpdateProfile,
  getProfile,
  getDashboard,
  removeMessImage,
  clearMessImages,
  logout,
  toggleOnlineStatus
}; 