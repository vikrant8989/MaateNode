const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const mime = require("mime-types");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload function
const uploadImageToS3 = async (file, folderName) => {
  console.log("Starting uploadImageToS3", { fileName: file?.originalname, folderName, fileSize: file?.buffer?.length });
  
  if (!file || !file.buffer || !file.originalname) {
    console.error("Invalid file upload", { file });
    throw new Error("Invalid file upload");
  }

  const fileName = `${folderName}/${Date.now()}_${file.originalname}`;
  const fileSize = file.buffer.length;
  const contentType = file.mimetype || mime.lookup(file.originalname) || "application/octet-stream";
  console.log("File details", { fileName, fileSize, contentType });

  // Single-part upload for files < 5MB
  if (fileSize < 5 * 1024 * 1024) {
    try {
      console.log("Initiating single-part upload", { fileName });
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: contentType,
      });
      await s3.send(uploadCommand);
      const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      console.log("Single-part upload successful", { url });
      return url;
    } catch (err) {
      console.error("Single-part upload failed", { error: err.message });
      throw new Error("Single-part upload failed.");
    }
  }

  // Multipart upload for files >= 5MB
  console.log("Initiating multipart upload", { fileName, fileSize });
  const createUpload = new CreateMultipartUploadCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });

  const uploadResponse = await s3.send(createUpload);
  const uploadId = uploadResponse.UploadId;
  console.log("Multipart upload created", { uploadId });

  try {
    const partSize = 5 * 1024 * 1024;
    const totalParts = Math.ceil(fileSize / partSize);
    console.log("Preparing parts", { totalParts, partSize });
    const uploadPromises = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, fileSize);
      console.log("Processing part", { partNumber, start, end });

      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: file.buffer.slice(start, end),
      });

      uploadPromises.push(
        s3.send(uploadPartCommand).then((partUploadResponse) => {
          console.log("Part uploaded", { partNumber, ETag: partUploadResponse.ETag });
          return {
            ETag: partUploadResponse.ETag,
            PartNumber: partNumber,
          };
        })
      );
    }

    const uploadedParts = await Promise.all(uploadPromises);
    console.log("All parts uploaded", { uploadedParts });

    const completeUpload = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: { Parts: uploadedParts },
    });

    await s3.send(completeUpload);
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log("Multipart upload completed", { url });
    return url;
  } catch (error) {
    console.error("Multipart upload error", { error: error.message });
    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
      })
    );
    console.log("Multipart upload aborted", { fileName, uploadId });
    throw new Error("Multipart upload failed.");
  }
};

const deleteFromS3 = async (fileUrl) => {
  console.log("Starting deleteFromS3", { fileUrl });
  try {
    const urlParts = new URL(fileUrl);
    const key = urlParts.pathname.substring(1); // Removes leading "/"
    console.log("Extracted key", { key });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    await s3.send(deleteCommand);
    console.log("File deleted from S3", { fileUrl });
  } catch (error) {
    console.error("Error deleting file from S3", { error: error.message });
    throw new Error("S3 delete failed");
  }
};

const updateFromS3 = async (existingImageUrl, file, folderName) => {
  console.log("Starting updateFromS3", { existingImageUrl, fileName: file?.originalname, folderName });
  try {
    if (existingImageUrl) {
      console.log("Deleting existing image", { existingImageUrl });
      await deleteFromS3(existingImageUrl);
    }

    if (!file || !file.buffer || !file.originalname) {
      console.error("Invalid file input for update", { file });
      throw new Error("Invalid file input for update.");
    }

    const newUrl = await uploadImageToS3(file, folderName);
    console.log("Image updated", { newUrl });
    return newUrl;
  } catch (error) {
    console.error("Error updating image on S3", { error: error.message });
    throw new Error("Failed to update image on S3.");
  }
};

const uploadMultipleImagesToS3 = async (files = [], folderName) => {
  console.log("Starting uploadMultipleImagesToS3", { fileCount: files.length, folderName });
  if (!Array.isArray(files) || files.length === 0) {
    console.error("No files provided for upload", { files });
    throw new Error("No files provided for upload.");
  }

  try {
    const uploadPromises = files.map((file, index) => {
      console.log("Queuing upload for file", { index, fileName: file.originalname });
      return uploadImageToS3(file, folderName);
    });
    const imageUrls = await Promise.all(uploadPromises);
    console.log("All images uploaded", { imageUrls });
    return imageUrls;
  } catch (error) {
    console.error("Error uploading multiple images to S3", { error: error.message });
    throw new Error("One or more image uploads failed.");
  }
};

module.exports = { 
  uploadImageToS3, 
  deleteFromS3, 
  updateFromS3, 
  uploadMultipleImagesToS3 
};