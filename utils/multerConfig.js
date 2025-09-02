const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (to convert to base64)
const storage = multer.memoryStorage();

// Add logging to storage
const storageWithLogging = multer.memoryStorage({
  _handleFile: function (req, file, cb) {
    console.log('📁 MULTER STORAGE - Processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Call the original memory storage handler
    multer.memoryStorage()._handleFile(req, file, (err, info) => {
      if (err) {
        console.log('❌ MULTER STORAGE - Error processing file:', err.message);
        return cb(err);
      }
      console.log('✅ MULTER STORAGE - File processed successfully:', {
        fieldname: file.fieldname,
        bufferLength: info.buffer?.length
      });
      cb(null, info);
    });
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  console.log('🔍 MULTER FILE FILTER - Processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ MULTER FILE FILTER - File accepted:', file.fieldname);
    cb(null, true);
  } else {
    console.log('❌ MULTER FILE FILTER - File rejected (not an image):', file.fieldname);
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file at a time
  }
});

// Single file upload middleware
const uploadSingle = upload.single('image');

// Multiple files upload middleware (for documents)
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).array('images', 10);

// Multiple fields upload middleware (for registration steps)
const uploadFields = multer({
  storage: storageWithLogging,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).any(); // Temporarily use .any() to handle both files and text fields

// Driver-specific upload middleware
const uploadDriverFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'passbookImage', maxCount: 1 },
  { name: 'panCardImage', maxCount: 1 },
  { name: 'aadharFrontImage', maxCount: 1 },
  { name: 'aadharBackImage', maxCount: 1 },
  { name: 'dlFrontImage', maxCount: 1 },
  { name: 'dlBackImage', maxCount: 1 },
  { name: 'vehicleRegistrationImage', maxCount: 1 },
  { name: 'insuranceImage', maxCount: 1 },
  { name: 'fitnessCertificateImage', maxCount: 1 },
  { name: 'pollutionCertificateImage', maxCount: 1 }
]);

// Item and category upload middleware
const uploadItemFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).fields([
  { name: 'image', maxCount: 1 }
]);

// Offer upload middleware
const uploadOfferFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 1 // Only 1 file for offer image
  }
}).fields([
  { name: 'offerImage', maxCount: 1 }
]);

// Plan upload middleware
const uploadPlanFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).fields([
  { name: 'image', maxCount: 1 }
]);

// Restaurant documents upload middleware
const uploadRestaurantFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'messImages', maxCount: 5 },
  { name: 'qrCode', maxCount: 1 },
  { name: 'passbook', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 }
]);

// Convert buffer to base64
const bufferToBase64 = (buffer) => {
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
};

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  console.log('🚨 MULTER ERROR HANDLER - Error received:', err);
  console.log('🚨 MULTER ERROR HANDLER - Error type:', err.constructor.name);
  console.log('🚨 MULTER ERROR HANDLER - Error message:', err.message);
  
  if (err instanceof multer.MulterError) {
    console.log('🚨 MULTER ERROR HANDLER - Multer error code:', err.code);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadDriverFields,
  uploadItemFields,
  uploadOfferFields,
  uploadPlanFields,
  uploadRestaurantFields,
  bufferToBase64,
  handleMulterError
}; 