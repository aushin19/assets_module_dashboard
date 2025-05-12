/**
 * Utility for validating asset data
 */

/**
 * Validates a single asset record
 * @param {Object} asset - The asset object to validate
 * @param {Set} seenAssetIds - Set of assetIds already seen in this file (for duplicate detection)
 * @returns {Object} - Object with isValid flag and array of error messages
 */
const validateAsset = (asset, seenAssetIds) => {
  const errors = [];
  
  // Check for required fields
  if (!asset.assetId) {
    errors.push('Missing required field: assetId');
  }
  
  if (!asset.name) {
    errors.push('Missing required field: name');
  }
  
  if (!asset.location) {
    errors.push('Missing required field: location');
  }
  
  // Check for duplicate assetId within the file
  if (asset.assetId && seenAssetIds.has(asset.assetId)) {
    errors.push(`Duplicate assetId within file: ${asset.assetId}`);
  } else if (asset.assetId) {
    // Add to seen set if not already there
    seenAssetIds.add(asset.assetId);
  }
  
  // Validate status if present
  if (asset.status && !['Active', 'Inactive', 'Disposed', 'In Repair'].includes(asset.status)) {
    errors.push(`Invalid status value: ${asset.status}. Must be one of: Active, Inactive, Disposed, In Repair`);
  }
  
  // Validate purchaseDate if present
  if (asset.purchaseDate) {
    const dateValue = new Date(asset.purchaseDate);
    if (isNaN(dateValue.getTime())) {
      errors.push(`Invalid date format for purchaseDate: ${asset.purchaseDate}`);
    } else {
      // Convert to proper Date object
      asset.purchaseDate = dateValue;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates an array of assets
 * @param {Array} assets - Array of asset objects to validate
 * @returns {Object} - Object with validData and invalidData arrays
 */
const validateAssets = (assets) => {
  if (!Array.isArray(assets)) {
    throw new Error('Assets must be an array');
  }
  
  const validData = [];
  const invalidData = [];
  const seenAssetIds = new Set();
  
  for (const asset of assets) {
    const { isValid, errors } = validateAsset(asset, seenAssetIds);
    
    if (isValid) {
      validData.push(asset);
    } else {
      invalidData.push({
        record: asset,
        errors
      });
    }
  }
  
  return {
    validData,
    invalidData
  };
};

module.exports = {
  validateAssets
}; 