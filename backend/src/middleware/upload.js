const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for processing

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Middleware for handling multiple files with different field names
const uploadIssueFiles = upload.fields([
  { name: 'media[images]', maxCount: 5 },
  { name: 'media[videos]', maxCount: 3 },
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]);

// Custom middleware to process FormData and populate req.body correctly
const processFormData = (req, res, next) => {
  // Only process if there are files (indicating multipart/form-data)
  if (req.files || req.is('multipart/form-data')) {
    console.log('🔍 Processing FormData...');
    console.log('📋 Raw body fields:', Object.keys(req.body));
    
    // Create a new body object with processed data
    const processedBody = { ...req.body };
    
    // Process nested location fields
    if (req.body['location[address]']) {
      if (!processedBody.location) processedBody.location = {};
      processedBody.location.address = req.body['location[address]'];
    }
    
    if (req.body['location[city]']) {
      if (!processedBody.location) processedBody.location = {};
      processedBody.location.city = req.body['location[city]'];
    }
    
    if (req.body['location[state]']) {
      if (!processedBody.location) processedBody.location = {};
      processedBody.location.state = req.body['location[state]'];
    }
    
    if (req.body['location[pincode]']) {
      if (!processedBody.location) processedBody.location = {};
      processedBody.location.pincode = req.body['location[pincode]'];
    }
    
    if (req.body['location[landmark]']) {
      if (!processedBody.location) processedBody.location = {};
      processedBody.location.landmark = req.body['location[landmark]'];
    }
    
    // Process coordinates
    if (req.body['location[coordinates][latitude]'] || req.body['location[coordinates][longitude]']) {
      if (!processedBody.location) processedBody.location = {};
      if (!processedBody.location.coordinates) processedBody.location.coordinates = {};
      
      if (req.body['location[coordinates][latitude]']) {
        processedBody.location.coordinates.latitude = parseFloat(req.body['location[coordinates][latitude]']);
      }
      
      if (req.body['location[coordinates][longitude]']) {
        processedBody.location.coordinates.longitude = parseFloat(req.body['location[coordinates][longitude]']);
      }
    }
    
    // Replace req.body with processed version
    req.body = processedBody;
    
    console.log('✅ Processed FormData body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.',
        error: { code: 'FILE_TOO_LARGE' }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.',
        error: { code: 'TOO_MANY_FILES' }
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
        error: { code: 'UNEXPECTED_FILE' }
      });
    }
  }
  
  if (error.message === 'Only image and video files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only images and videos are allowed.',
      error: { code: 'INVALID_FILE_TYPE' }
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadIssueFiles,
  processFormData,
  handleUploadError
};