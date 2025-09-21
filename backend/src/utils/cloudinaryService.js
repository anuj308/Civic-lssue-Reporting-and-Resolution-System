const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('🌩️ Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'
});

/**
 * Upload a single image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadImage = async (base64Data, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'civic-issues',
      transformation: [
        { width: 1024, height: 1024, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    console.log('🌩️ Uploading image to Cloudinary...');
    console.log('🔍 Input data type:', typeof base64Data);
    console.log('🔍 Input data preview:', base64Data.substring(0, 100) + '...');
    
    // Handle different image data formats
    let uploadData = base64Data;
    
    if (base64Data.startsWith('data:')) {
      // Already a data URI
      uploadData = base64Data;
      console.log('📋 Format: Data URI detected');
    } else if (base64Data.startsWith('file://')) {
      // React Native file URI - need to read as base64
      uploadData = base64Data;
      console.log('📋 Format: File URI detected');
    } else if (base64Data.startsWith('content://')) {
      // Android content URI
      uploadData = base64Data;
      console.log('📋 Format: Content URI detected');
    } else if (base64Data.startsWith('/')) {
      // Absolute file path
      uploadData = base64Data;
      console.log('📋 Format: File path detected');
    } else {
      // Assume it's raw base64 data
      uploadData = `data:image/jpeg;base64,${base64Data}`;
      console.log('📋 Format: Raw base64 detected, adding data URI prefix');
    }

    const result = await cloudinary.uploader.upload(uploadData, defaultOptions);
    
    console.log('✅ Image uploaded successfully:', {
      public_id: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response
    });
    throw new Error(`Failed to upload image: ${error.message || error.toString() || 'Unknown error'}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} base64Array - Array of base64 encoded images
 * @param {Object} options - Upload options
 * @returns {Promise<Array<Object>>} - Array of Cloudinary upload results
 */
const uploadMultipleImages = async (base64Array, options = {}) => {
  try {
    console.log(`🌩️ Uploading ${base64Array.length} images to Cloudinary...`);
    
    const uploadPromises = base64Array.map((base64Data, index) => {
      const imageOptions = {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${index}` : undefined
      };
      return uploadImage(base64Data, imageOptions);
    });

    const results = await Promise.all(uploadPromises);
    console.log(`✅ All ${results.length} images uploaded successfully`);
    
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} - Deletion result
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    console.log(`🗑️ Deleting ${publicIds.length} images from Cloudinary...`);
    const result = await cloudinary.api.delete_resources(publicIds);
    console.log('✅ Images deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};

/**
 * Generate a transformation URL for an existing image
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
const getTransformedImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

/**
 * Extract public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
const extractPublicId = (url) => {
  try {
    // Extract public ID from Cloudinary URL
    const matches = url.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('❌ Error extracting public ID:', error);
    return null;
  }
};

/**
 * Process issue images and upload to Cloudinary
 * @param {Array<string>} images - Array of base64 image data
 * @param {string} issueId - Issue ID for folder organization
 * @returns {Promise<Array<Object>>} - Array of processed image objects
 */
const processIssueImages = async (images, issueId) => {
  try {
    if (!images || images.length === 0) {
      return [];
    }

    console.log(`🔄 Processing ${images.length} images for issue ${issueId}`);

    const options = {
      folder: `civic-issues/${issueId}`,
      public_id: `issue_${issueId}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    const uploadResults = await uploadMultipleImages(images, options);

    // Return structured image objects for database storage
    return uploadResults.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      uploadedAt: new Date(result.created_at),
      originalIndex: index
    }));
  } catch (error) {
    console.error('❌ Error processing issue images:', error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getTransformedImageUrl,
  extractPublicId,
  processIssueImages
};