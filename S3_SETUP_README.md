# AWS S3 Integration Setup

This document explains how to set up and use AWS S3 integration in the maateBackend project.

## Prerequisites

1. AWS Account with S3 access
2. S3 bucket created
3. IAM user with S3 permissions

## Environment Variables

Add the following environment variables to your `.env` file:

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## Installation

Install the required dependencies:

```bash
npm install
```

## Usage

### Import the S3 utility

```javascript
const { 
  uploadImageToS3, 
  deleteFromS3, 
  updateFromS3, 
  uploadMultipleImagesToS3 
} = require('../utils/s3Utils');
```

### Upload a single image

```javascript
// In your controller
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = await uploadImageToS3(req.file, 'restaurants');
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Upload multiple images

```javascript
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const imageUrls = await uploadMultipleImagesToS3(req.files, 'menu-items');
    res.json({ success: true, imageUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Update an existing image

```javascript
const updateImage = async (req, res) => {
  try {
    const { existingImageUrl } = req.body;
    const newImage = req.file;
    
    if (!newImage) {
      return res.status(400).json({ error: 'No new file uploaded' });
    }
    
    const newImageUrl = await updateFromS3(existingImageUrl, newImage, 'restaurants');
    res.json({ success: true, imageUrl: newImageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Delete an image

```javascript
const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    await deleteFromS3(imageUrl);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Features

- **Automatic file size detection**: Files < 5MB use single-part upload, larger files use multipart upload
- **MIME type detection**: Automatically detects file content type
- **Folder organization**: Files are organized by folder name (e.g., 'restaurants', 'menu-items')
- **Unique naming**: Files are prefixed with timestamp to avoid conflicts
- **Error handling**: Comprehensive error handling with cleanup on failure
- **Batch operations**: Support for uploading multiple files simultaneously

## File Structure

```
maateBackend/
├── utils/
│   ├── s3Utils.js          # S3 utility functions
│   └── multerConfig.js     # File upload middleware
├── package.json
└── S3_SETUP_README.md      # This file
```

## Security Notes

1. Never commit your `.env` file to version control
2. Use IAM roles with minimal required permissions
3. Consider using AWS STS for temporary credentials in production
4. Enable S3 bucket versioning for data protection
5. Configure S3 bucket policies to restrict access

## Troubleshooting

### Common Issues

1. **Access Denied**: Check IAM permissions and bucket policies
2. **Region Mismatch**: Ensure AWS_REGION matches your bucket's region
3. **Invalid Credentials**: Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
4. **Bucket Not Found**: Confirm AWS_S3_BUCKET_NAME is correct

### Testing

Test your S3 integration with a simple endpoint:

```javascript
// Test endpoint
app.post('/test-s3', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = await uploadImageToS3(req.file, 'test');
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```
