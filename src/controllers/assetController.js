const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Asset = require('../models/Asset');
const { validateAssets } = require('../utils/validator');
const { storeValidData, retrieveValidData, deleteStoredData } = require('../utils/tempStorage');

// Helper function to process JSON file
const processJsonFile = async (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const assets = JSON.parse(fileContent);
    
    if (!Array.isArray(assets)) {
      throw new Error('JSON file must contain an array of asset objects');
    }
    
    return assets;
  } catch (error) {
    throw new Error(`Error parsing JSON file: ${error.message}`);
  }
};

// Helper function to process CSV file
const processCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const assets = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        assets.push(data);
      })
      .on('end', () => {
        resolve(assets);
      })
      .on('error', (error) => {
        reject(new Error(`Error parsing CSV file: ${error.message}`));
      });
  });
};

// Helper function to get headers from JSON file
const getHeadersFromJsonFile = async (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON file must contain an array with at least one object');
    }
    
    // Extract keys from the first object
    return Object.keys(data[0]);
  } catch (error) {
    throw new Error(`Error extracting headers from JSON file: ${error.message}`);
  }
};

// Helper function to get headers from CSV file
const getHeadersFromCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    let headers = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({ 
        skipLines: 0,
        headers: false 
      }))
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', () => {
        // We only need the headers, so end the stream after the first data row
        fs.createReadStream(filePath).destroy();
      })
      .on('end', () => {
        resolve(headers);
      })
      .on('error', (error) => {
        reject(new Error(`Error extracting headers from CSV file: ${error.message}`));
      });
  });
};

// Helper function to apply field mappings
const applyFieldMappings = (assets, mappings) => {
  if (!mappings || mappings.length === 0) {
    return assets;
  }
  
  // Convert mappings array to a mapping object
  const mappingObj = {};
  mappings.forEach(mapping => {
    if (mapping.source && mapping.target) {
      mappingObj[mapping.target] = mapping.source;
    }
  });
  
  return assets.map(asset => {
    const mappedAsset = {};
    
    // Use each mapping to create a new object with keys mapped to DB fields
    Object.entries(mappingObj).forEach(([dbField, fileField]) => {
      if (fileField && asset[fileField] !== undefined) {
        mappedAsset[dbField] = asset[fileField];
      }
    });
    
    return mappedAsset;
  });
};

// Helper function to validate asset data
const validateAssetData = (assets) => {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error('Invalid asset data: Expected non-empty array of assets');
  }
  
  // Check if each asset has an assetId
  const invalidAssets = assets.filter(asset => !asset.assetId);
  if (invalidAssets.length > 0) {
    throw new Error(`${invalidAssets.length} assets are missing the required 'assetId' field`);
  }
  
  return assets;
};

// Controller method to extract headers from uploaded file
exports.extractHeaders = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let headers = [];
    
    // Process file based on extension to extract headers
    if (fileExtension === '.json') {
      headers = await getHeadersFromJsonFile(filePath);
    } else if (fileExtension === '.csv') {
      headers = await getHeadersFromCsvFile(filePath);
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      // For Excel files, we'd use a library like ExcelJS or xlsx
      // For this example, we'll return a placeholder message
      return res.status(501).json({ 
        message: 'Excel file parsing not fully implemented. Please use JSON or CSV files.' 
      });
    } else {
      // Remove the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Unsupported file type. Please upload a JSON, CSV, or Excel file' 
      });
    }
    
    // Remove the uploaded file after processing
    fs.unlinkSync(filePath);
    
    // Return the headers
    return res.status(200).json({
      message: 'Headers extracted successfully',
      headers
    });
    
  } catch (error) {
    // If the file exists, remove it on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ 
      message: 'Failed to extract headers', 
      error: error.message 
    });
  }
};

// Controller method to handle file upload and validation
exports.uploadValidate = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let assets;
    
    // Process file based on extension
    if (fileExtension === '.json') {
      assets = await processJsonFile(filePath);
    } else if (fileExtension === '.csv') {
      assets = await processCsvFile(filePath);
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      // For Excel files, we'd use a library like ExcelJS or xlsx
      // For this example, we'll return a placeholder message
      fs.unlinkSync(filePath);
      return res.status(501).json({ 
        message: 'Excel file parsing not fully implemented. Please use JSON or CSV files.' 
      });
    } else {
      // Remove the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Unsupported file type. Please upload a JSON, CSV, or Excel file' 
      });
    }
    
    // Check for field mappings in the request body
    let mappings = [];
    if (req.body.mappings) {
      try {
        mappings = JSON.parse(req.body.mappings);
      } catch (error) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: 'Invalid mappings format. Mappings should be a valid JSON array of objects with source and target properties.'
        });
      }
    }
    
    // Apply field mappings if provided
    if (mappings.length > 0) {
      assets = applyFieldMappings(assets, mappings);
    }
    
    // Validate the asset data
    const { validData, invalidData } = validateAssets(assets);
    
    // Remove the uploaded file after processing
    fs.unlinkSync(filePath);
    
    // Store valid data and get request ID if there's any valid data
    let requestId = null;
    if (validData.length > 0) {
      requestId = storeValidData(validData);
    }
    
    // Return validation results
    return res.status(200).json({
      message: 'Validation complete',
      requestId,
      counts: {
        total: assets.length,
        valid: validData.length,
        invalid: invalidData.length
      },
      invalidRecords: invalidData
    });
    
  } catch (error) {
    // If the file exists, remove it on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ 
      message: 'Failed to process file', 
      error: error.message 
    });
  }
};

// Controller method to handle import confirmation
exports.confirmImport = async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ 
        message: 'Missing requestId parameter' 
      });
    }
    
    // Retrieve valid data from temporary storage
    const validData = retrieveValidData(requestId);
    
    if (!validData) {
      return res.status(404).json({ 
        message: 'No valid data found for the provided requestId. It may have expired or been already processed.' 
      });
    }
    
    // Track results
    let insertedCount = 0;
    let updatedCount = 0;
    const databaseErrors = [];
    
    // Process each asset with upsert
    for (const asset of validData) {
      try {
        // Perform the upsert operation
        const result = await Asset.findOneAndUpdate(
          { assetId: asset.assetId },
          { $set: asset },
          { 
            upsert: true, 
            new: true, 
            runValidators: true,
            rawResult: true 
          }
        );
        
        // Check if document was created or updated
        if (result.lastErrorObject.updatedExisting) {
          updatedCount++;
        } else {
          insertedCount++;
        }
      } catch (error) {
        databaseErrors.push({
          assetId: asset.assetId,
          error: error.message
        });
      }
    }
    
    // Clean up temporary data
    deleteStoredData(requestId);
    
    // Return success response with counts
    return res.status(200).json({
      message: 'Import process finished',
      results: {
        inserted: insertedCount,
        updated: updatedCount,
        dbFailures: databaseErrors.length
      },
      databaseErrors: databaseErrors.length > 0 ? databaseErrors : []
    });
    
  } catch (error) {
    return res.status(500).json({ 
      message: 'Failed to process import', 
      error: error.message 
    });
  }
};

// Controller method to get assets with pagination, search, and filtering
exports.getAssets = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Build query
    const query = {};
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { assetId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const assets = await Asset.find(query)
      .sort({ assetId: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await Asset.countDocuments(query);
    
    // Return response
    return res.status(200).json({
      message: 'Assets retrieved successfully',
      assets,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
    
  } catch (error) {
    return res.status(500).json({ 
      message: 'Failed to retrieve assets', 
      error: error.message 
    });
  }
}; 