# Driver S3 Integration Guide

This document explains how AWS S3 integration has been implemented in the driver module of the maateBackend project.

## Overview

The driver module now uses AWS S3 for all image storage instead of storing base64 encoded images in the database. This provides:
- Better performance (no large base64 strings in database)
- Scalability (images stored in cloud)
- Cost efficiency (pay only for storage used)
- Better security (controlled access to images)

## What Changed

### 1. Database Schema
- All image fields now store S3 URLs instead of base64 data
- Image fields remain the same type (String) but now contain URLs
- Comments added to clarify that fields store S3 URLs

### 2. Image Upload Process
- Images are uploaded to S3 with organized folder structure
- Old images are automatically deleted from S3 when replaced
- Error handling for S3 operations
- Automatic cleanup on driver deactivation

### 3. New Endpoints
- `DELETE /api/driver/images/:imageType` - Delete specific image types
- `POST /api/driver/test-s3` - Test S3 upload functionality

## Folder Structure in S3

```
drivers/
├── profile/           # Profile images
├── bank/             # Bank documents (passbook, PAN)
├── aadhar/           # Aadhar card images
├── license/          # Driving license images
├── vehicle/          # Vehicle documents
└── test/             # Test uploads
```

## Image Types and Fields

| Image Type | Field Name | S3 Path | Description |
|------------|------------|---------|-------------|
| profile | profileImage | `drivers/profile/` | Driver profile picture |
| passbook | passbookImage | `drivers/bank/` | Bank passbook image |
| pan | panCardImage | `drivers/bank/` | PAN card image |
| aadhar-front | aadharFrontImage | `drivers/aadhar/` | Aadhar front side |
| aadhar-back | aadharBackImage | `drivers/aadhar/` | Aadhar back side |
| dl-front | dlFrontImage | `drivers/license/` | Driving license front |
| dl-back | dlBackImage | `drivers/license/` | Driving license back |
| vehicle-registration | vehicleRegistrationImage | `drivers/vehicle/` | Vehicle registration |
| insurance | insuranceImage | `drivers/vehicle/` | Insurance document |
| fitness | fitnessCertificateImage | `drivers/vehicle/` | Fitness certificate |
| pollution | pollutionCertificateImage | `drivers/vehicle/` | Pollution certificate |

## API Endpoints

### Update Profile with Image
```http
PUT /api/driver/profile
Content-Type: multipart/form-data

profileImage: [file]
firstName: "John"
lastName: "Doe"
```

### Update Bank Details with Images
```http
PUT /api/driver/registration/bank-details
Content-Type: multipart/form-data

passbookImage: [file]
panCardImage: [file]
bankName: "HDFC Bank"
accountNumber: "1234567890"
ifscCode: "HDFC0001234"
branch: "Main Branch"
```

### Delete Specific Image
```http
DELETE /api/driver/images/profile
Authorization: Bearer <token>
```

### Test S3 Upload
```http
POST /api/driver/test-s3
Content-Type: multipart/form-data
Authorization: Bearer <token>

profileImage: [file]
passbookImage: [file]
```

## Error Handling

### S3 Upload Errors
- Invalid file format
- File size too large
- S3 connection issues
- Insufficient permissions

### Automatic Cleanup
- Old images are deleted when replaced
- Failed uploads don't affect existing images
- Cleanup continues even if some operations fail

## Security Features

1. **Authentication Required**: All image operations require valid JWT token
2. **User Isolation**: Drivers can only access/modify their own images
3. **File Validation**: Multer middleware validates file types and sizes
4. **S3 Permissions**: IAM roles with minimal required permissions

## Environment Variables Required

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## Testing

### 1. Test S3 Connection
Use the test endpoint to verify S3 connectivity:
```bash
curl -X POST http://localhost:3000/api/driver/test-s3 \
  -H "Authorization: Bearer <your-token>" \
  -F "profileImage=@test-image.jpg"
```

### 2. Test Image Upload
Upload images through the registration endpoints:
```bash
curl -X PUT http://localhost:3000/api/driver/registration/personal \
  -H "Authorization: Bearer <your-token>" \
  -F "profileImage=@profile.jpg" \
  -F "firstName=John" \
  -F "lastName=Doe"
```

### 3. Test Image Deletion
Delete specific image types:
```bash
curl -X DELETE http://localhost:3000/api/driver/images/profile \
  -H "Authorization: Bearer <your-token>"
```

## Migration from Base64

If you have existing drivers with base64 images:

1. **Export existing data**: Backup current driver documents
2. **Upload to S3**: Use the update endpoints to re-upload images
3. **Verify URLs**: Check that S3 URLs are properly stored
4. **Clean database**: Remove old base64 data

## Monitoring and Logging

### Console Logs
- All S3 operations are logged with emojis for easy identification
- Success/failure status for each operation
- File details (size, type, name) logged

### Error Tracking
- S3 errors are captured and returned to client
- Database errors are logged separately
- Network timeouts and connection issues tracked

## Performance Considerations

1. **File Size Limits**: Large files use multipart upload
2. **Concurrent Uploads**: Multiple images can be uploaded simultaneously
3. **CDN Integration**: S3 URLs can be served through CloudFront
4. **Caching**: Browser caching for frequently accessed images

## Troubleshooting

### Common Issues

1. **Access Denied**
   - Check IAM permissions
   - Verify bucket policies
   - Confirm region settings

2. **Upload Failures**
   - Check file size limits
   - Verify file format
   - Check network connectivity

3. **Image Not Found**
   - Verify S3 URL format
   - Check if image was deleted
   - Confirm bucket name

### Debug Steps

1. Check console logs for detailed error messages
2. Verify environment variables are set correctly
3. Test S3 connectivity with test endpoint
4. Check AWS CloudTrail for API call logs

## Future Enhancements

1. **Image Compression**: Automatic image optimization
2. **Thumbnail Generation**: Create smaller versions for lists
3. **Image Validation**: Check image dimensions and quality
4. **Batch Operations**: Upload multiple images in single request
5. **Versioning**: Keep image history for audit purposes

## Support

For issues with S3 integration:
1. Check the logs for detailed error messages
2. Verify AWS credentials and permissions
3. Test with the provided test endpoints
4. Review the S3_SETUP_README.md for general S3 setup
