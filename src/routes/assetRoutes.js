const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const assetController = require('../controllers/assetController');
const { ApiError } = require('../utils/errorHandler');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.json', '.csv', '.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JSON, CSV, and Excel files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

// Middleware to handle multer errors
const handleMulterError = (req, res, next) => {
  upload.single('assetFile')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer error (file size, etc.)
        return res.status(400).json({ 
          message: err.code === 'LIMIT_FILE_SIZE' 
            ? 'File size too large. Maximum size is 10MB.' 
            : 'Error uploading file.' 
        });
      } else {
        // Custom error from fileFilter or other error
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    }
    next();
  });
};

// Route for extracting headers from uploaded file for mapping
router.post('/extract-headers', handleMulterError, assetController.extractHeaders);

// Route for validating uploaded assets with mappings
router.post('/upload-validate', handleMulterError, assetController.uploadValidate);

// Route for confirming import of validated assets
router.post('/confirm-import', express.json(), assetController.confirmImport);

// Route for fetching assets with pagination, search, and filtering
router.get('/', assetController.getAssets);

module.exports = router; 