const Driver = require('../modal/driver');
const jwt = require('jsonwebtoken');
const { 
  uploadImageToS3, 
  deleteFromS3, 
  updateFromS3, 
  uploadMultipleImagesToS3 
} = require('../../utils/s3Utils');

// Helper function to parse DD/MM/YYYY date format
const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  // Handle DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
    const year = parseInt(parts[2], 10);
    
    // Validate date components
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 0 || month > 11) return null;
    if (year < 1900 || year > 2100) return null;
    
    const date = new Date(year, month, day);
    
    // Check if the date is valid (handles edge cases like 31/02/2024)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  }
  
  // Try parsing as ISO string or other formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

// Generate JWT Token
const generateToken = (driverId) => {
  console.log('🔑 Generating JWT token for driver ID:', driverId);
  const token = jwt.sign({ id: driverId }, process.env.JWT_SECRET || 'maate_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
  console.log('✅ JWT token generated successfully');
  return token;
};

// @desc    Send OTP to driver phone (auto-register if not exists)
// @route   POST /api/driver/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  console.log('📱 SEND OTP - Request received:', { body: req.body, headers: req.headers });
  
  try {
    const { phone } = req.body;
    console.log('📱 SEND OTP - Phone number received:', phone);

    // Validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('❌ SEND OTP - Validation failed:', { phone, length: phone?.length, isNumeric: /^\d+$/.test(phone) });
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }
    console.log('✅ SEND OTP - Phone validation passed');

    // Check if driver exists
    console.log('🔍 SEND OTP - Checking if driver exists with phone:', phone);
    let driver = await Driver.findOne({ phone });
    console.log('🔍 SEND OTP - Driver lookup result:', driver ? 'Found' : 'Not found');

    // If driver doesn't exist, create new driver
    if (!driver) {
      console.log('🆕 SEND OTP - Creating new driver for phone:', phone);
      driver = new Driver({
        phone,
        registrationStep: 1
      });
      await driver.save();
      console.log('✅ SEND OTP - New driver created with ID:', driver._id);
    } else {
      console.log('👤 SEND OTP - Existing driver found with ID:', driver._id);
    }

    // Generate new OTP
    console.log('🔐 SEND OTP - Generating new OTP for driver:', driver._id);
    await driver.generateOTP();
    console.log('✅ SEND OTP - OTP generated successfully');

    const responseData = {
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: driver.phone,
        isNewUser: !driver.isVerified,
        message: 'Use OTP: 123456 for testing'
      }
    };
    
    console.log('📤 SEND OTP - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 SEND OTP - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @desc    Verify OTP and login/register driver
// @route   POST /api/driver/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  console.log('🔐 VERIFY OTP - Request received:', { body: req.body, headers: req.headers });
  
  try {
    const { phone, otp } = req.body;
    console.log('🔐 VERIFY OTP - Phone and OTP received:', { phone, otp });

    // Validation
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      console.log('❌ VERIFY OTP - Phone validation failed:', { phone, length: phone?.length, isNumeric: /^\d+$/.test(phone) });
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      console.log('❌ VERIFY OTP - OTP validation failed:', { otp, length: otp?.length, isNumeric: /^\d+$/.test(otp) });
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }
    console.log('✅ VERIFY OTP - Validation passed');

    console.log('🔍 VERIFY OTP - Looking up driver with phone:', phone);
    const driver = await Driver.findOne({ phone });

    if (!driver) {
      console.log('❌ VERIFY OTP - Driver not found for phone:', phone);
      return res.status(404).json({
        success: false,
        message: 'Driver not found. Please send OTP first.'
      });
    }
    console.log('👤 VERIFY OTP - Driver found with ID:', driver._id);

    // Verify OTP
    console.log('🔐 VERIFY OTP - Verifying OTP for driver:', driver._id);
    const isOTPValid = driver.verifyOTP(otp);
    console.log('🔐 VERIFY OTP - OTP verification result:', isOTPValid);
    
    if (!isOTPValid) {
      console.log('❌ VERIFY OTP - Invalid or expired OTP');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update verification status
    console.log('✅ VERIFY OTP - Updating driver verification status');
    driver.isVerified = true;
    driver.lastActive = new Date();
    await driver.save();
    console.log('✅ VERIFY OTP - Driver verification status updated');

    // Generate JWT token
    console.log('🔑 VERIFY OTP - Generating JWT token for driver:', driver._id);
    const token = generateToken(driver._id);

    const responseData = {
      success: true,
      message: 'OTP verified successfully',
      data: {
        driver: {
          id: driver._id,
          phone: driver.phone,
          profileImage: driver.profileImage,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          dob: driver.dob,
          state: driver.state,
          city: driver.city,
          pincode: driver.pincode,
          address: driver.address,
          bankName: driver.bankName,
          accountNumber: driver.accountNumber,
          ifscCode: driver.ifscCode,
          branch: driver.branch,
          vehicleNumber: driver.vehicleNumber,
          isVerified: driver.isVerified,
          registrationStep: driver.registrationStep,
          isRegistrationComplete: driver.isRegistrationComplete,
          isApproved: driver.isApproved,
          isOnline: driver.isOnline,
          lastActive: driver.lastActive
        },
        token
      }
    };
    
    console.log('📤 VERIFY OTP - Sending response with driver data:', {
      driverId: driver._id,
      isVerified: driver.isVerified,
      registrationStep: driver.registrationStep,
      isRegistrationComplete: driver.isRegistrationComplete
    });
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 VERIFY OTP - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// @desc    Update registration step (Step 1: Personal Details)
// @route   PUT /api/driver/registration/personal
// @access  Private
const updatePersonalDetails = async (req, res) => {
  console.log('👤 UPDATE PERSONAL DETAILS - Request received:', { 
    body: req.body, 
    files: req.files, 
    filesKeys: req.files ? Object.keys(req.files) : 'No files',
    userId: req.user?.id,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });
  
  try {
    const {
      firstName,
      lastName,
      email,
      dob,
      state,
      city,
      pincode,
      address
    } = req.body;

    console.log('👤 UPDATE PERSONAL DETAILS - Extracted data:', {
      firstName, lastName, email, dob, state, city, pincode, address
    });

    console.log('🔍 UPDATE PERSONAL DETAILS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE PERSONAL DETAILS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE PERSONAL DETAILS - Driver found:', { id: driver._id, phone: driver.phone });

    // Handle uploaded profile image
    console.log('🔍 UPDATE PERSONAL DETAILS - Checking for profile image...');
    console.log('🔍 UPDATE PERSONAL DETAILS - req.files exists:', !!req.files);
    if (req.files) {
      console.log('🔍 UPDATE PERSONAL DETAILS - req.files type:', Array.isArray(req.files) ? 'Array' : 'Object');
      console.log('🔍 UPDATE PERSONAL DETAILS - req.files length:', req.files.length);
      
      // Find profile image in the files array
      const profileImageFile = req.files.find(file => file.fieldname === 'profileImage');
      if (profileImageFile) {
        console.log('🔍 UPDATE PERSONAL DETAILS - Found profile image file:', {
          fieldname: profileImageFile.fieldname,
          originalname: profileImageFile.originalname,
          mimetype: profileImageFile.mimetype,
          size: profileImageFile.size,
          bufferLength: profileImageFile.buffer?.length
        });
      } else {
        console.log('🔍 UPDATE PERSONAL DETAILS - No profile image file found');
        console.log('🔍 UPDATE PERSONAL DETAILS - Available fields:', req.files.map(f => f.fieldname));
      }
    }
    
    // Find profile image file in the array
    const profileImageFile = req.files && req.files.find(file => file.fieldname === 'profileImage');
    if (profileImageFile) {
      console.log('📸 UPDATE PERSONAL DETAILS - Processing profile image');
              console.log('📸 UPDATE PERSONAL DETAILS - File details:', {
          originalname: profileImageFile.originalname,
          mimetype: profileImageFile.mimetype,
          size: profileImageFile.size,
          bufferLength: profileImageFile.buffer?.length
        });
      
      try {
        // Check if S3 environment variables are set
        if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
          console.warn('⚠️ UPDATE PERSONAL DETAILS - S3 environment variables not configured, falling back to base64 storage');
          
          // Fallback to base64 storage
          const imageBuffer = profileImageFile.buffer;
          const mimeType = profileImageFile.mimetype;
          const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          
          driver.profileImage = base64Image;
          console.log('✅ UPDATE PERSONAL DETAILS - Profile image stored as base64 (fallback mode)');
          return; // Skip S3 upload
        }
        
        // Delete existing image from S3 if it exists
        if (driver.profileImage) {
          console.log('🗑️ UPDATE PERSONAL DETAILS - Deleting old profile image from S3:', driver.profileImage);
          try {
            await deleteFromS3(driver.profileImage);
            console.log('🗑️ UPDATE PERSONAL DETAILS - Old profile image deleted from S3');
          } catch (deleteError) {
            console.warn('⚠️ UPDATE PERSONAL DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
          }
        }
        
        // Upload new image to S3
        console.log('📤 UPDATE PERSONAL DETAILS - Starting S3 upload...');
        const imageUrl = await uploadImageToS3(profileImageFile, 'drivers/profile');
        console.log('📤 UPDATE PERSONAL DETAILS - Image URL:', imageUrl);
        driver.profileImage = imageUrl;
        console.log('✅ UPDATE PERSONAL DETAILS - Profile image uploaded to S3:', imageUrl);
      } catch (error) {
        console.error('❌ UPDATE PERSONAL DETAILS - Error uploading profile image to S3:', error);
        console.error('❌ UPDATE PERSONAL DETAILS - Error stack:', error.stack);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile image',
          error: error.message
        });
      }
    } else {
      console.log('ℹ️ UPDATE PERSONAL DETAILS - No profile image uploaded or files not found');
      console.log('ℹ️ UPDATE PERSONAL DETAILS - req.files:', req.files);
      if (req.files && req.files.length > 0) {
        console.log('ℹ️ UPDATE PERSONAL DETAILS - Available files:', req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));
      }
    }

    // Update personal details
    console.log('📝 UPDATE PERSONAL DETAILS - Updating driver fields');
    
    // Only update fields if they are provided (preserve existing values)
    if (firstName !== undefined) driver.firstName = firstName?.trim();
    if (lastName !== undefined) driver.lastName = lastName?.trim();
    if (email !== undefined) driver.email = email?.toLowerCase().trim();
    
    // Handle date of birth - only update if provided
    if (dob !== undefined) {
      if (dob) {
        const dobDate = new Date(dob);
        if (!isNaN(dobDate.getTime())) {
          driver.dob = dobDate;
          console.log('✅ UPDATE PERSONAL DETAILS - DOB set successfully:', dobDate);
        } else {
          console.log('⚠️ UPDATE PERSONAL DETAILS - Invalid DOB format:', dob);
          // Don't overwrite existing DOB if new one is invalid
          console.log('⚠️ UPDATE PERSONAL DETAILS - Keeping existing DOB:', driver.dob);
        }
      } else {
        // Only clear DOB if explicitly set to null/empty
        driver.dob = undefined;
        console.log('⚠️ UPDATE PERSONAL DETAILS - DOB cleared as requested');
      }
    } else {
      console.log('✅ UPDATE PERSONAL DETAILS - DOB not provided, keeping existing value:', driver.dob);
    }
    
    if (state !== undefined) driver.state = state?.trim();
    if (city !== undefined) driver.city = city?.trim();
    if (pincode !== undefined) driver.pincode = pincode?.trim();
    if (address !== undefined) driver.address = address?.trim();
    driver.registrationStep = 1;
    
    console.log('📝 UPDATE PERSONAL DETAILS - Updated fields:', {
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      dob: driver.dob,
      state: driver.state,
      city: driver.city,
      pincode: driver.pincode,
      address: driver.address,
      registrationStep: driver.registrationStep
    });

    // Check if all required personal details are provided
    const hasAllRequiredFields = !!(driver.firstName && driver.lastName && driver.email && driver.state && driver.city && driver.pincode && driver.address);
    console.log('🔍 UPDATE PERSONAL DETAILS - Checking required fields:', {
      hasFirstName: !!driver.firstName,
      hasLastName: !!driver.lastName,
      hasEmail: !!driver.email,
      hasDob: !!driver.dob,
      hasState: !!driver.state,
      hasCity: !!driver.city,
      hasPincode: !!driver.pincode,
      hasAddress: !!driver.address,
      hasAllRequiredFields
    });
    
    if (hasAllRequiredFields) {
      console.log('✅ UPDATE PERSONAL DETAILS - All required fields present, marking step 1 as completed');
      // Only mark step 1 as completed, keep registration incomplete
      driver.registrationStep = 1;
      driver.isRegistrationComplete = false;
      console.log('✅ UPDATE PERSONAL DETAILS - Step 1 marked as completed, registration still incomplete');
    } else {
      console.log('⚠️ UPDATE PERSONAL DETAILS - Missing required fields, step 1 incomplete');
      driver.registrationStep = 1;
      driver.isRegistrationComplete = false;
    }

    console.log('💾 UPDATE PERSONAL DETAILS - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE PERSONAL DETAILS - Driver saved successfully');

    // Log the driver object after save to verify dob field
    console.log('🔍 UPDATE PERSONAL DETAILS - Driver object after save:', {
      id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      dob: driver.dob,
      dobType: typeof driver.dob,
      state: driver.state,
      city: driver.city,
      pincode: driver.pincode,
      address: driver.address
    });

    const responseData = {
      success: true,
      message: 'Personal details updated successfully',
      data: {
        driver: {
          id: driver._id,
          phone: driver.phone,
          profileImage: driver.profileImage,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          dob: driver.dob,
          state: driver.state,
          city: driver.city,
          pincode: driver.pincode,
          address: driver.address,
          registrationStep: driver.registrationStep,
          isRegistrationComplete: driver.isRegistrationComplete
        }
      }
    };
    
    console.log('📤 UPDATE PERSONAL DETAILS - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE PERSONAL DETAILS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating personal details',
      error: error.message
    });
  }
};

// @desc    Update registration step (Step 2: Bank Details)
// @route   PUT /api/driver/registration/bank-details
// @access  Private
const updateBankDetails = async (req, res) => {
  console.log('🏦 UPDATE BANK DETAILS - Request received:', { body: req.body, files: req.files, userId: req.user?.id });
  
  try {
    const {
      bankName,
      accountNumber,
      ifscCode,
      branch
    } = req.body;

    console.log('🏦 UPDATE BANK DETAILS - Extracted data:', {
      bankName, accountNumber, ifscCode, branch
    });

    console.log('🔍 UPDATE BANK DETAILS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE BANK DETAILS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE BANK DETAILS - Driver found:', { id: driver._id, phone: driver.phone });

    // Handle uploaded images
    if (req.files) {
      console.log('📸 UPDATE BANK DETAILS - Processing uploaded files:', req.files.length);
      
      // Find passbook image
      const passbookFile = req.files.find(file => file.fieldname === 'passbookImage');
      if (passbookFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE BANK DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = passbookFile.buffer;
            const mimeType = passbookFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.passbookImage = base64Image;
            console.log('✅ UPDATE BANK DETAILS - Passbook image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.passbookImage) {
              try {
                await deleteFromS3(driver.passbookImage);
                console.log('🗑️ UPDATE BANK DETAILS - Old passbook image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE BANK DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(passbookFile, 'drivers/bank');
            driver.passbookImage = imageUrl;
            console.log('✅ UPDATE BANK DETAILS - Passbook image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE BANK DETAILS - Error uploading passbook image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading passbook image',
            error: error.message
          });
        }
      }
      
      // Find PAN card image
      const panCardFile = req.files.find(file => file.fieldname === 'panCardImage');
      if (panCardFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE BANK DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = panCardFile.buffer;
            const mimeType = panCardFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.panCardImage = base64Image;
            console.log('✅ UPDATE BANK DETAILS - PAN card image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.panCardImage) {
              try {
                await deleteFromS3(driver.panCardImage);
                console.log('🗑️ UPDATE BANK DETAILS - Old PAN card image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE BANK DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
          }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(panCardFile, 'drivers/bank');
            driver.panCardImage = imageUrl;
            console.log('✅ UPDATE BANK DETAILS - PAN card image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE BANK DETAILS - Error uploading PAN card image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading PAN card image',
            error: error.message
          });
        }
      }
    }

    // Update bank details
    console.log('📝 UPDATE BANK DETAILS - Updating bank fields');
    driver.bankName = bankName?.trim();
    driver.accountNumber = accountNumber?.trim();
    driver.ifscCode = ifscCode?.trim().toUpperCase();
    driver.branch = branch?.trim();
    driver.registrationStep = 2;

    console.log('📝 UPDATE BANK DETAILS - Updated fields:', {
      bankName: driver.bankName,
      accountNumber: driver.accountNumber,
      ifscCode: driver.ifscCode,
      branch: driver.branch,
      passbookImage: !!driver.passbookImage,
      panCardImage: !!driver.panCardImage,
      registrationStep: driver.registrationStep
    });

    console.log('💾 UPDATE BANK DETAILS - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE BANK DETAILS - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Bank details updated successfully',
      data: {
        driver: {
          id: driver._id,
          bankName: driver.bankName,
          accountNumber: driver.accountNumber,
          ifscCode: driver.ifscCode,
          branch: driver.branch,
          passbookImage: driver.passbookImage,
          panCardImage: driver.panCardImage,
          registrationStep: driver.registrationStep
        }
      }
    };
    
    console.log('📤 UPDATE BANK DETAILS - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE BANK DETAILS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bank details',
      error: error.message
    });
  }
};

// @desc    Update registration step (Step 3: Aadhar Verification)
// @route   PUT /api/driver/registration/aadhar
// @access  Private
const updateAadharDetails = async (req, res) => {
  console.log('🆔 UPDATE AADHAR DETAILS - Request received:', { 
    body: req.body, 
    bodyKeys: Object.keys(req.body),
    bodyValues: Object.values(req.body),
    files: req.files, 
    userId: req.user?.id,
    headers: req.headers['content-type']
  });
  
  try {
    const {
      aadharNumber,
      fullName,
      dateOfBirth,
      gender,
      address
    } = req.body;

    console.log('🆔 UPDATE AADHAR DETAILS - Extracted data:', {
      aadharNumber, fullName, dateOfBirth, gender, address
    });

    console.log('🔍 UPDATE AADHAR DETAILS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE AADHAR DETAILS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE AADHAR DETAILS - Driver found:', { id: driver._id, phone: driver.phone });

    // Update Aadhar text fields
    console.log('📝 UPDATE AADHAR DETAILS - Updating Aadhar text fields');
    if (aadharNumber !== undefined) driver.aadharNumber = aadharNumber?.trim();
    if (fullName !== undefined) driver.fullName = fullName?.trim();
    if (dateOfBirth !== undefined) driver.dateOfBirth = dateOfBirth?.trim();
    if (gender !== undefined) driver.gender = gender?.trim();
    if (address !== undefined) driver.address = address?.trim();

    console.log('📝 UPDATE AADHAR DETAILS - Updated text fields:', {
      aadharNumber: driver.aadharNumber,
      fullName: driver.fullName,
      dateOfBirth: driver.dateOfBirth,
      gender: driver.gender,
      address: driver.address
    });

    // Handle uploaded images
    if (req.files) {
      console.log('📸 UPDATE AADHAR DETAILS - Processing uploaded files:', req.files.length);
      
      // Find Aadhar front image
      const aadharFrontFile = req.files.find(file => file.fieldname === 'aadharFrontImage');
      if (aadharFrontFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE AADHAR DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = aadharFrontFile.buffer;
            const mimeType = aadharFrontFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.aadharFrontImage = base64Image;
            console.log('✅ UPDATE AADHAR DETAILS - Aadhar front image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.aadharFrontImage) {
              try {
                await deleteFromS3(driver.aadharFrontImage);
                console.log('🗑️ UPDATE AADHAR DETAILS - Old Aadhar front image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE AADHAR DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(aadharFrontFile, 'drivers/aadhar');
            driver.aadharFrontImage = imageUrl;
            console.log('✅ UPDATE AADHAR DETAILS - Aadhar front image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE AADHAR DETAILS - Error uploading Aadhar front image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading Aadhar front image',
            error: error.message
          });
        }
      }
      
      // Find Aadhar back image
      const aadharBackFile = req.files.find(file => file.fieldname === 'aadharBackImage');
      if (aadharBackFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE AADHAR DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = aadharBackFile.buffer;
            const mimeType = aadharBackFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.aadharBackImage = base64Image;
            console.log('✅ UPDATE AADHAR DETAILS - Aadhar back image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.aadharBackImage) {
              try {
                await deleteFromS3(driver.aadharBackImage);
                console.log('🗑️ UPDATE AADHAR DETAILS - Old Aadhar back image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE AADHAR DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(aadharBackFile, 'drivers/aadhar');
            driver.aadharBackImage = imageUrl;
            console.log('✅ UPDATE AADHAR DETAILS - Aadhar back image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE AADHAR DETAILS - Error uploading Aadhar back image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading Aadhar back image',
            error: error.message
          });
        }
      }
    }

    // Update registration step
    console.log('📝 UPDATE AADHAR DETAILS - Updating registration step to 3');
    driver.registrationStep = 3;

    console.log('💾 UPDATE AADHAR DETAILS - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE AADHAR DETAILS - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Aadhar details updated successfully',
      data: {
        driver: {
          id: driver._id,
          aadharNumber: driver.aadharNumber,
          fullName: driver.fullName,
          dateOfBirth: driver.dateOfBirth,
          gender: driver.gender,
          address: driver.address,
          aadharFrontImage: driver.aadharFrontImage,
          aadharBackImage: driver.aadharBackImage,
          registrationStep: driver.registrationStep
        }
      }
    };
    
    console.log('📤 UPDATE AADHAR DETAILS - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE AADHAR DETAILS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Aadhar details',
      error: error.message
    });
  }
};

// @desc    Update registration step (Step 4: Driving License)
// @route   PUT /api/driver/registration/driving-license
// @access  Private
const updateDrivingLicense = async (req, res) => {
  console.log('🚗 UPDATE DRIVING LICENSE - Request received:', { body: req.body, files: req.files, userId: req.user?.id });
  
  try {
    console.log('🔍 UPDATE DRIVING LICENSE - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE DRIVING LICENSE - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE DRIVING LICENSE - Driver found:', { id: driver._id, phone: driver.phone });

    // Extract driving license details from request body
    const { 
      dlNumber, 
      dlFullName, 
      dlDateOfIssue, 
      dlDateOfExpiry, 
      dlIssuingAuthority, 
      dlAddress 
    } = req.body;

    console.log('📝 UPDATE DRIVING LICENSE - Driving license details received:', {
      dlNumber,
      dlFullName,
      dlDateOfIssue,
      dlDateOfExpiry,
      dlIssuingAuthority,
      dlAddress
    });

    // Update driving license details
    if (dlNumber) driver.dlNumber = dlNumber.trim().toUpperCase();
    if (dlFullName) driver.dlFullName = dlFullName.trim();
    
    // Parse and validate dates
    if (dlDateOfIssue) {
      const parsedIssueDate = parseDate(dlDateOfIssue);
      if (parsedIssueDate) {
        driver.dlDateOfIssue = parsedIssueDate;
      } else {
        console.warn('⚠️ UPDATE DRIVING LICENSE - Invalid issue date format:', dlDateOfIssue);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for Date of Issue. Please use DD/MM/YYYY format.',
          error: 'Invalid date format'
        });
      }
    }
    
    if (dlDateOfExpiry) {
      const parsedExpiryDate = parseDate(dlDateOfExpiry);
      if (parsedExpiryDate) {
        driver.dlDateOfExpiry = parsedExpiryDate;
      } else {
        console.warn('⚠️ UPDATE DRIVING LICENSE - Invalid expiry date format:', dlDateOfExpiry);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for Date of Expiry. Please use DD/MM/YYYY format.',
          error: 'Invalid date format'
        });
      }
    }
    
    if (dlIssuingAuthority) driver.dlIssuingAuthority = dlIssuingAuthority.trim();
    if (dlAddress) driver.dlAddress = dlAddress.trim();

    // Handle uploaded images
    if (req.files) {
      console.log('📸 UPDATE DRIVING LICENSE - Processing uploaded files:', req.files.length);
      
      // Find DL front image
      const dlFrontFile = req.files.find(file => file.fieldname === 'dlFrontImage');
      if (dlFrontFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE DRIVING LICENSE - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = dlFrontFile.buffer;
            const mimeType = dlFrontFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.dlFrontImage = base64Image;
            console.log('✅ UPDATE DRIVING LICENSE - DL front image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.dlFrontImage) {
              try {
                await deleteFromS3(driver.dlFrontImage);
                console.log('🗑️ UPDATE DRIVING LICENSE - Old DL front image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE DRIVING LICENSE - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(dlFrontFile, 'drivers/license');
            driver.dlFrontImage = imageUrl;
            console.log('✅ UPDATE DRIVING LICENSE - DL front image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE DRIVING LICENSE - Error uploading DL front image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading DL front image',
            error: error.message
          });
        }
      }
      
      // Find DL back image
      const dlBackFile = req.files.find(file => file.fieldname === 'dlBackImage');
      if (dlBackFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE DRIVING LICENSE - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = dlBackFile.buffer;
            const mimeType = dlBackFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.dlBackImage = base64Image;
            console.log('✅ UPDATE DRIVING LICENSE - DL back image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.dlBackImage) {
              try {
                await deleteFromS3(driver.dlBackImage);
                console.log('🗑️ UPDATE DRIVING LICENSE - Old DL back image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE DRIVING LICENSE - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(dlBackFile, 'drivers/license');
            driver.dlBackImage = imageUrl;
            console.log('✅ UPDATE DRIVING LICENSE - DL back image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE DRIVING LICENSE - Error uploading DL back image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading DL back image',
            error: error.message
          });
        }
      }
    }

    // Update registration step
    console.log('📝 UPDATE DRIVING LICENSE - Updating registration step to 4');
    driver.registrationStep = 4;

    console.log('💾 UPDATE DRIVING LICENSE - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE DRIVING LICENSE - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Driving license details updated successfully',
      data: {
        driver: {
          id: driver._id,
          dlNumber: driver.dlNumber,
          dlFullName: driver.dlFullName,
          dlDateOfIssue: driver.dlDateOfIssue,
          dlDateOfExpiry: driver.dlDateOfExpiry,
          dlIssuingAuthority: driver.dlIssuingAuthority,
          dlAddress: driver.dlAddress,
          dlFrontImage: driver.dlFrontImage,
          dlBackImage: driver.dlBackImage,
          registrationStep: driver.registrationStep
        }
      }
    };
    
    console.log('📤 UPDATE DRIVING LICENSE - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE DRIVING LICENSE - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driving license details',
      error: error.message
    });
  }
};

// @desc    Update registration step (Step 5: Vehicle Details)
// @route   PUT /api/driver/registration/vehicle
// @access  Private
const updateVehicleDetails = async (req, res) => {
  console.log('🚙 UPDATE VEHICLE DETAILS - Request received:', { body: req.body, files: req.files, userId: req.user?.id });
  
  try {
    const { 
      vehicleNumber, 
      vehicleOwnerName, 
      vehicleType, 
      vehicleRegistrationDate 
    } = req.body;
    
    console.log('🚙 UPDATE VEHICLE DETAILS - Vehicle details received:', {
      vehicleNumber,
      vehicleOwnerName,
      vehicleType,
      vehicleRegistrationDate
    });

    console.log('🔍 UPDATE VEHICLE DETAILS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE VEHICLE DETAILS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE VEHICLE DETAILS - Driver found:', { id: driver._id, phone: driver.phone });

    // Handle uploaded vehicle documents
    if (req.files) {
      console.log('📸 UPDATE VEHICLE DETAILS - Processing uploaded files:', req.files.length);
      
      // Find RC front image
      const rcFrontFile = req.files.find(file => file.fieldname === 'rcFrontImage');
      if (rcFrontFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE VEHICLE DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = rcFrontFile.buffer;
            const mimeType = rcFrontFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.rcFrontImage = base64Image;
            console.log('✅ UPDATE VEHICLE DETAILS - RC front image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.rcFrontImage) {
              try {
                await deleteFromS3(driver.rcFrontImage);
                console.log('🗑️ UPDATE VEHICLE DETAILS - Old RC front image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE VEHICLE DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(rcFrontFile, 'drivers/vehicle');
            driver.rcFrontImage = imageUrl;
            console.log('✅ UPDATE VEHICLE DETAILS - RC front image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE VEHICLE DETAILS - Error uploading RC front image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading RC front image',
            error: error.message
          });
        }
      }
      
      // Find RC back image
      const rcBackFile = req.files.find(file => file.fieldname === 'rcBackImage');
      if (rcBackFile) {
        try {
          // Check if S3 environment variables are set
          if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
            console.warn('⚠️ UPDATE VEHICLE DETAILS - S3 environment variables not configured, falling back to base64 storage');
            
            // Fallback to base64 storage
            const imageBuffer = rcBackFile.buffer;
            const mimeType = rcBackFile.mimetype;
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            
            driver.rcBackImage = base64Image;
            console.log('✅ UPDATE VEHICLE DETAILS - RC back image stored as base64 (fallback mode)');
          } else {
            // Delete existing image from S3 if it exists
            if (driver.rcBackImage) {
              try {
                await deleteFromS3(driver.rcBackImage);
                console.log('🗑️ UPDATE VEHICLE DETAILS - Old RC back image deleted from S3');
              } catch (deleteError) {
                console.warn('⚠️ UPDATE VEHICLE DETAILS - Could not delete old image, continuing with upload:', deleteError.message);
              }
            }
            
            // Upload new image to S3
            const imageUrl = await uploadImageToS3(rcBackFile, 'drivers/vehicle');
            driver.rcBackImage = imageUrl;
            console.log('✅ UPDATE VEHICLE DETAILS - RC back image uploaded to S3:', imageUrl);
          }
        } catch (error) {
          console.error('❌ UPDATE VEHICLE DETAILS - Error uploading RC back image:', error);
          return res.status(500).json({
            success: false,
            message: 'Error uploading RC back image',
            error: error.message
          });
          }
        }
      }

    // Update vehicle details
    console.log('📝 UPDATE VEHICLE DETAILS - Updating vehicle details and registration step');
    
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber.trim().toUpperCase();
    if (vehicleOwnerName) driver.vehicleOwnerName = vehicleOwnerName.trim();
    if (vehicleType) driver.vehicleType = vehicleType.trim();
    
    // Parse and validate registration date
    if (vehicleRegistrationDate) {
      const parsedRegDate = parseDate(vehicleRegistrationDate);
      if (parsedRegDate) {
        driver.vehicleRegistrationDate = parsedRegDate;
      } else {
        console.warn('⚠️ UPDATE VEHICLE DETAILS - Invalid registration date format:', vehicleRegistrationDate);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for Registration Date. Please use DD/MM/YYYY format.',
          error: 'Invalid date format'
        });
      }
    }
    
    driver.registrationStep = 5;

    console.log('📝 UPDATE VEHICLE DETAILS - Updated fields:', {
      vehicleNumber: driver.vehicleNumber,
      registrationStep: driver.registrationStep
    });

    console.log('💾 UPDATE VEHICLE DETAILS - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE VEHICLE DETAILS - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Vehicle details updated successfully',
      data: {
        driver: {
          id: driver._id,
          vehicleNumber: driver.vehicleNumber,
          vehicleOwnerName: driver.vehicleOwnerName,
          vehicleType: driver.vehicleType,
          vehicleRegistrationDate: driver.vehicleRegistrationDate,
          rcFrontImage: driver.rcFrontImage,
          rcBackImage: driver.rcBackImage,
          registrationStep: driver.registrationStep
        }
      }
    };
    
    console.log('📤 UPDATE VEHICLE DETAILS - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE VEHICLE DETAILS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle details',
      error: error.message
    });
  }
};

// @desc    Complete registration (Step 7: Final)
// @route   PUT /api/driver/registration/complete
// @access  Private
const completeRegistration = async (req, res) => {
  console.log('✅ COMPLETE REGISTRATION - Request received:', { body: req.body, userId: req.user?.id });
  
  try {
    console.log('🔍 COMPLETE REGISTRATION - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ COMPLETE REGISTRATION - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 COMPLETE REGISTRATION - Driver found:', { id: driver._id, phone: driver.phone });

    // Complete registration
    console.log('📝 COMPLETE REGISTRATION - Completing registration process');
    driver.registrationStep = 7;
    driver.isRegistrationComplete = true;
    
    console.log('📝 COMPLETE REGISTRATION - Updated fields:', {
      registrationStep: driver.registrationStep,
      isRegistrationComplete: driver.isRegistrationComplete
    });

    console.log('💾 COMPLETE REGISTRATION - Saving driver to database');
    await driver.save();
    console.log('✅ COMPLETE REGISTRATION - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Registration completed successfully.',
      data: {
        driver: {
          id: driver._id,
          registrationStep: driver.registrationStep,
          isRegistrationComplete: driver.isRegistrationComplete
        }
      }
    };
    
    console.log('📤 COMPLETE REGISTRATION - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 COMPLETE REGISTRATION - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing registration',
      error: error.message
    });
  }
};

// @desc    Get registration progress
// @route   GET /api/driver/registration/progress
// @access  Private
const getRegistrationProgress = async (req, res) => {
  console.log('📊 GET REGISTRATION PROGRESS - Request received:', { userId: req.user?.id });
  
  try {
    console.log('🔍 GET REGISTRATION PROGRESS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ GET REGISTRATION PROGRESS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 GET REGISTRATION PROGRESS - Driver found:', { 
      id: driver._id, 
      phone: driver.phone,
      registrationStep: driver.registrationStep,
      isRegistrationComplete: driver.isRegistrationComplete
    });

    const responseData = {
      success: true,
      data: {
        driver: {
          id: driver._id,
          phone: driver.phone,
          profileImage: driver.profileImage,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          dob: driver.dob,
          state: driver.state,
          city: driver.city,
          pincode: driver.pincode,
          address: driver.address,
          bankName: driver.bankName,
          accountNumber: driver.accountNumber,
          ifscCode: driver.ifscCode,
          branch: driver.branch,
          aadharNumber: driver.aadharNumber,
          fullName: driver.fullName,
          dateOfBirth: driver.dateOfBirth,
          gender: driver.gender,
          vehicleNumber: driver.vehicleNumber,
          registrationStep: driver.registrationStep,
          isRegistrationComplete: driver.isRegistrationComplete,
          isApproved: driver.isApproved,
          isOnline: driver.isOnline,
          lastActive: driver.lastActive
        }
      }
    };
    
    console.log('📤 GET REGISTRATION PROGRESS - Sending response with driver data');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 GET REGISTRATION PROGRESS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration progress',
      error: error.message
    });
  }
};

// @desc    Get driver profile
// @route   GET /api/driver/profile
// @access  Private
const getProfile = async (req, res) => {
  console.log('👤 GET PROFILE - Request received:', { userId: req.user?.id });
  
  try {
    console.log('🔍 GET PROFILE - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ GET PROFILE - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 GET PROFILE - Driver found:', { 
      id: driver._id, 
      phone: driver.phone,
      name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
    });

    const responseData = {
      success: true,
      data: {
        id: driver._id,
        phone: driver.phone,
        profileImage: driver.profileImage,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        dob: driver.dob,
        state: driver.state,
        city: driver.city,
        pincode: driver.pincode,
        address: driver.address,
        bankName: driver.bankName,
        accountNumber: driver.accountNumber,
        ifscCode: driver.ifscCode,
        branch: driver.branch,
        aadharNumber: driver.aadharNumber,
        fullName: driver.fullName,
        dateOfBirth: driver.dateOfBirth,
        gender: driver.gender,
        vehicleNumber: driver.vehicleNumber,
        registrationStep: driver.registrationStep,
        isRegistrationComplete: driver.isRegistrationComplete,
        isApproved: driver.isApproved,
        isOnline: driver.isOnline,
        lastActive: driver.lastActive
      }
    };
    
    console.log('📤 GET PROFILE - Sending response with profile data');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 GET PROFILE - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update driver profile
// @route   PUT /api/driver/profile
// @access  Private
const updateProfile = async (req, res) => {
  console.log('📝 UPDATE PROFILE - Request received:', { body: req.body, files: req.files, userId: req.user?.id });
  
  try {
    const {
      firstName,
      lastName,
      email,
      dob,
      address,
      city,
      state,
      pincode,
      aadharNumber,
      fullName,
      dateOfBirth,
      gender
    } = req.body;

    console.log('📝 UPDATE PROFILE - Extracted data:', {
      firstName, lastName, email, dob, address, city, state, pincode
    });

    console.log('🔍 UPDATE PROFILE - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE PROFILE - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE PROFILE - Driver found:', { id: driver._id, phone: driver.phone });

    // Handle uploaded profile image
    const profileImageFile = req.files && req.files.find(file => file.fieldname === 'profileImage');
    if (profileImageFile) {
      console.log('📸 UPDATE PROFILE - Processing profile image');
      try {
        // Check if S3 environment variables are set
        if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
          console.warn('⚠️ UPDATE PROFILE - S3 environment variables not configured, falling back to base64 storage');
          
          // Fallback to base64 storage
          const imageBuffer = profileImageFile.buffer;
          const mimeType = profileImageFile.mimetype;
          const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          
          driver.profileImage = base64Image;
          console.log('✅ UPDATE PROFILE - Profile image stored as base64 (fallback mode)');
        } else {
          // Delete existing image from S3 if it exists
          if (driver.profileImage) {
            try {
              await deleteFromS3(driver.profileImage);
              console.log('🗑️ UPDATE PROFILE - Old profile image deleted from S3');
            } catch (deleteError) {
              console.warn('⚠️ UPDATE PROFILE - Could not delete old image, continuing with upload:', deleteError.message);
            }
          }
          
          // Upload new image to S3
          console.log('📤 UPDATE PROFILE - Starting S3 upload...');
          const imageUrl = await uploadImageToS3(profileImageFile, 'drivers/profile');
          driver.profileImage = imageUrl;
          console.log('✅ UPDATE PROFILE - Profile image uploaded to S3:', imageUrl);
        }
      } catch (error) {
        console.error('❌ UPDATE PROFILE - Error uploading profile image:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile image',
          error: error.message
        });
      }
    }

    // Update fields if provided
    console.log('📝 UPDATE PROFILE - Updating provided fields');
    if (firstName !== undefined) driver.firstName = firstName.trim();
    if (lastName !== undefined) driver.lastName = lastName.trim();
    if (email !== undefined) driver.email = email?.toLowerCase().trim();
    if (dob !== undefined) driver.dob = dob;
    if (address !== undefined) driver.address = address?.trim();
    if (city !== undefined) driver.city = city?.trim();
    if (state !== undefined) driver.state = state?.trim();
    if (pincode !== undefined) driver.pincode = pincode?.trim();
    
    // Update Aadhar fields if provided
    if (aadharNumber !== undefined) driver.aadharNumber = aadharNumber?.trim();
    if (fullName !== undefined) driver.fullName = fullName?.trim();
    if (dateOfBirth !== undefined) driver.dateOfBirth = dateOfBirth?.trim();
    if (gender !== undefined) driver.gender = gender?.trim();
    
    console.log('📝 UPDATE PROFILE - Updated fields:', {
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      dob: driver.dob,
      address: driver.address,
      city: driver.city,
      state: driver.state,
      pincode: driver.pincode,
      aadharNumber: driver.aadharNumber,
      fullName: driver.fullName,
      dateOfBirth: driver.dateOfBirth,
      gender: driver.gender,
      profileImage: !!driver.profileImage
    });

    console.log('💾 UPDATE PROFILE - Saving driver to database');
    await driver.save();
    console.log('✅ UPDATE PROFILE - Driver saved successfully');

    const responseData = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: driver._id,
        phone: driver.phone,
        profileImage: driver.profileImage,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        dob: driver.dob,
        state: driver.state,
        city: driver.city,
        pincode: driver.pincode,
        address: driver.address,
        aadharNumber: driver.aadharNumber,
        fullName: driver.fullName,
        dateOfBirth: driver.dateOfBirth,
        gender: driver.gender,
        registrationStep: driver.registrationStep,
        isRegistrationComplete: driver.isRegistrationComplete,
        isOnline: driver.isOnline,
        lastActive: driver.lastActive
      }
    };
    
    console.log('📤 UPDATE PROFILE - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE PROFILE - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get driver dashboard
// @route   GET /api/driver/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  console.log('📊 GET DASHBOARD - Request received:', { userId: req.user?.id });
  
  try {
    console.log('🔍 GET DASHBOARD - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ GET DASHBOARD - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 GET DASHBOARD - Driver found:', { 
      id: driver._id, 
      phone: driver.phone,
      name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
      registrationStep: driver.registrationStep,
      isRegistrationComplete: driver.isRegistrationComplete,
      isApproved: driver.isApproved
    });

    // Check if driver is approved
    if (!driver.isApproved) {
      console.log('❌ GET DASHBOARD - Driver not approved:', { driverId: driver._id, isApproved: driver.isApproved });
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Dashboard data
    const dashboardData = {
      driverInfo: {
        name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
        phone: driver.phone,
        registrationStep: driver.registrationStep,
        isRegistrationComplete: driver.isRegistrationComplete,
        isApproved: driver.isApproved,
        isOnline: driver.isOnline,
        lastActive: driver.lastActive
      },
      registration: {
        currentStep: driver.registrationStep,
        isComplete: driver.isRegistrationComplete,
        progress: Math.round((driver.registrationStep / 7) * 100)
      }
    };
    
    console.log('📊 GET DASHBOARD - Dashboard data prepared:', dashboardData);

    const responseData = {
      success: true,
      data: dashboardData
    };
    
    console.log('📤 GET DASHBOARD - Sending response with dashboard data');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 GET DASHBOARD - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

// @desc    Update online status
// @route   PUT /api/driver/online-status
// @access  Private
const updateOnlineStatus = async (req, res) => {
  console.log('🌐 UPDATE ONLINE STATUS - Request received:', { body: req.body, userId: req.user?.id });
  
  try {
    const { isOnline } = req.body;
    console.log('🌐 UPDATE ONLINE STATUS - Online status received:', isOnline);

    console.log('🔍 UPDATE ONLINE STATUS - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ UPDATE ONLINE STATUS - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 UPDATE ONLINE STATUS - Driver found:', { id: driver._id, phone: driver.phone });

    console.log('🌐 UPDATE ONLINE STATUS - Updating online status to:', isOnline);
    await driver.updateOnlineStatus(isOnline);
    console.log('✅ UPDATE ONLINE STATUS - Online status updated successfully');

    const responseData = {
      success: true,
      message: 'Online status updated successfully',
      data: {
        isOnline: driver.isOnline,
        lastActive: driver.lastActive
      }
    };
    
    console.log('📤 UPDATE ONLINE STATUS - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 UPDATE ONLINE STATUS - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating online status',
      error: error.message
    });
  }
};

// @desc    Logout driver
// @route   POST /api/driver/logout
// @access  Private
const logout = async (req, res) => {
  console.log('🚪 LOGOUT - Request received:', { userId: req.user?.id });
  
  try {
    console.log('🔍 LOGOUT - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (driver) {
      console.log('👤 LOGOUT - Driver found, updating online status to false');
      await driver.updateOnlineStatus(false);
      console.log('✅ LOGOUT - Online status updated to offline');
    } else {
      console.log('⚠️ LOGOUT - Driver not found, but proceeding with logout');
    }

    const responseData = {
      success: true,
      message: 'Logged out successfully'
    };

    console.log('📤 LOGOUT - Sending logout response');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('💥 LOGOUT - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// @desc    Approve driver (Admin function)
// @route   PUT /api/driver/approve
// @access  Private (Admin)
const approveDriver = async (req, res) => {
  console.log('✅ APPROVE DRIVER - Request received:', { userId: req.user?.id, driverId: req.params?.driverId });
  
  try {
    const driverId = req.params.driverId || req.user.id;
    console.log('🔍 APPROVE DRIVER - Looking up driver with ID:', driverId);
    
    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      console.log('❌ APPROVE DRIVER - Driver not found for ID:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    console.log('👤 APPROVE DRIVER - Driver found:', { 
      id: driver._id, 
      phone: driver.phone,
      currentApprovalStatus: driver.isApproved
    });

    await driver.approveDriver();
    
    console.log('✅ APPROVE DRIVER - Driver approved successfully');

    const responseData = {
      success: true,
      message: 'Driver approved successfully',
      data: {
        driver: {
          id: driver._id,
          phone: driver.phone,
          isApproved: driver.isApproved
        }
      }
    };
    
    console.log('📤 APPROVE DRIVER - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 APPROVE DRIVER - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving driver',
      error: error.message
    });
  }
};

// @desc    Delete driver image
// @route   DELETE /api/driver/images/:imageType
// @access  Private
const deleteImage = async (req, res) => {
  console.log('🗑️ DELETE IMAGE - Request received:', { userId: req.user?.id, imageType: req.params?.imageType });
  
  try {
    const { imageType } = req.params;
    console.log('🗑️ DELETE IMAGE - Image type to delete:', imageType);

    console.log('🔍 DELETE IMAGE - Looking up driver with ID:', req.user.id);
    const driver = await Driver.findById(req.user.id);
    
    if (!driver) {
      console.log('❌ DELETE IMAGE - Driver not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    console.log('👤 DELETE IMAGE - Driver found:', { id: driver._id, phone: driver.phone });

    let imageUrl = null;
    let imageField = null;

    // Map image type to field name
    switch (imageType) {
      case 'profile':
        imageUrl = driver.profileImage;
        imageField = 'profileImage';
        break;
      case 'passbook':
        imageUrl = driver.passbookImage;
        imageField = 'passbookImage';
        break;
      case 'pan':
        imageUrl = driver.panCardImage;
        imageField = 'panCardImage';
        break;
      case 'aadhar-front':
        imageUrl = driver.aadharFrontImage;
        imageField = 'aadharFrontImage';
        break;
      case 'aadhar-back':
        imageUrl = driver.aadharBackImage;
        imageField = 'aadharBackImage';
        break;
      case 'dl-front':
        imageUrl = driver.dlFrontImage;
        imageField = 'dlFrontImage';
        break;
      case 'dl-back':
        imageUrl = driver.dlBackImage;
        imageField = 'dlBackImage';
        break;
      case 'vehicle-registration':
        imageUrl = driver.vehicleRegistrationImage;
        imageField = 'vehicleRegistrationImage';
        break;
      case 'insurance':
        imageUrl = driver.insuranceImage;
        imageField = 'insuranceImage';
        break;
      case 'fitness':
        imageUrl = driver.fitnessCertificateImage;
        imageField = 'fitnessCertificateImage';
        break;
      case 'pollution':
        imageUrl = driver.pollutionCertificateImage;
        imageField = 'pollutionCertificateImage';
        break;
      default:
        console.log('❌ DELETE IMAGE - Invalid image type:', imageType);
        return res.status(400).json({
          success: false,
          message: 'Invalid image type'
        });
    }

    if (!imageUrl) {
      console.log('⚠️ DELETE IMAGE - No image found for type:', imageType);
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    try {
      // Delete from S3
      await deleteFromS3(imageUrl);
      console.log('🗑️ DELETE IMAGE - Image deleted from S3:', imageUrl);
      
      // Clear the field in database
      driver[imageField] = undefined;
      await driver.save();
      console.log('✅ DELETE IMAGE - Image field cleared in database');
      
      const responseData = {
        success: true,
        message: 'Image deleted successfully',
        data: {
          imageType,
          imageField
        }
      };
      
      console.log('📤 DELETE IMAGE - Sending response:', responseData);
      res.status(200).json(responseData);
      
    } catch (error) {
      console.error('❌ DELETE IMAGE - Error deleting image from S3:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting image from S3',
        error: error.message
      });
    }

  } catch (error) {
    console.error('💥 DELETE IMAGE - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// @desc    Deactivate driver (Admin function)
// @route   PUT /api/driver/deactivate
// @access  Private (Admin)
const deactivateDriver = async (req, res) => {
  console.log('❌ DEACTIVATE DRIVER - Request received:', { userId: req.user?.id, driverId: req.params?.driverId });
  
  try {
    const driverId = req.params.driverId || req.user.id;
    console.log('🔍 DEACTIVATE DRIVER - Looking up driver with ID:', driverId);
    
    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      console.log('❌ DEACTIVATE DRIVER - Driver not found for ID:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    console.log('👤 DEACTIVATE DRIVER - Driver found:', { 
      id: driver._id, 
      phone: driver.phone,
      currentApprovalStatus: driver.isApproved
    });

    // Clean up S3 images before deactivating
    try {
      console.log('🗑️ DEACTIVATE DRIVER - Cleaning up S3 images');
      const imagesToDelete = [
        driver.profileImage,
        driver.passbookImage,
        driver.panCardImage,
        driver.aadharFrontImage,
        driver.aadharBackImage,
        driver.dlFrontImage,
        driver.dlBackImage,
        driver.vehicleRegistrationImage,
        driver.insuranceImage,
        driver.fitnessCertificateImage,
        driver.pollutionCertificateImage
      ].filter(Boolean); // Remove undefined/null values

      if (imagesToDelete.length > 0) {
        console.log('🗑️ DEACTIVATE DRIVER - Found images to delete:', imagesToDelete.length);
        await Promise.allSettled(imagesToDelete.map(imageUrl => deleteFromS3(imageUrl)));
        console.log('✅ DEACTIVATE DRIVER - S3 cleanup completed');
      } else {
        console.log('ℹ️ DEACTIVATE DRIVER - No images to clean up');
      }
    } catch (cleanupError) {
      console.error('⚠️ DEACTIVATE DRIVER - Error during S3 cleanup:', cleanupError);
      // Continue with deactivation even if cleanup fails
    }

    await driver.deactivateDriver();
    
    console.log('❌ DEACTIVATE DRIVER - Driver deactivated successfully');

    const responseData = {
      success: true,
      message: 'Driver deactivated successfully',
      data: {
        driver: {
          id: driver._id,
          phone: driver.phone,
          isApproved: driver.isApproved
        }
      }
    };
    
    console.log('📤 DEACTIVATE DRIVER - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 DEACTIVATE DRIVER - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating driver',
      error: error.message
    });
  }
};

// @desc    Test S3 upload functionality
// @route   POST /api/driver/test-s3
// @access  Private (for testing)
const testS3Upload = async (req, res) => {
  console.log('🧪 TEST S3 UPLOAD - Request received:', { files: req.files, userId: req.user?.id });
  
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded for testing'
      });
    }

    const results = {};
    const errors = [];

    // Test single file uploads
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (files && files.length > 0) {
        try {
          console.log(`🧪 TEST S3 UPLOAD - Testing upload for field: ${fieldName}`);
          const imageUrl = await uploadImageToS3(files[0], `drivers/test/${fieldName}`);
          results[fieldName] = {
            success: true,
            imageUrl,
            originalName: files[0].originalname,
            size: files[0].size,
            mimetype: files[0].mimetype
          };
          console.log(`✅ TEST S3 UPLOAD - Success for ${fieldName}:`, imageUrl);
        } catch (error) {
          console.error(`❌ TEST S3 UPLOAD - Error for ${fieldName}:`, error);
          errors.push({
            field: fieldName,
            error: error.message
          });
          results[fieldName] = {
            success: false,
            error: error.message
          };
        }
      }
    }

    const responseData = {
      success: true,
      message: 'S3 upload test completed',
      data: {
        results,
        summary: {
          totalFields: Object.keys(req.files).length,
          successfulUploads: Object.values(results).filter(r => r.success).length,
          failedUploads: errors.length
        }
      }
    };

    if (errors.length > 0) {
      responseData.data.errors = errors;
    }

    console.log('📤 TEST S3 UPLOAD - Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 TEST S3 UPLOAD - Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error during S3 upload test',
      error: error.message
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  updatePersonalDetails,
  updateBankDetails,
  updateAadharDetails,
  updateDrivingLicense,
  updateVehicleDetails,
  completeRegistration,
  getRegistrationProgress,
  getProfile,
  updateProfile,
  getDashboard,
  updateOnlineStatus,
  logout,
  approveDriver,
  deactivateDriver,
  deleteImage,
  testS3Upload
}; 