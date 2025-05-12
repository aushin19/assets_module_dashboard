/**
 * Utility for temporary storage of validated asset data
 */
const { v4: uuidv4 } = require('uuid');

// In-memory storage for temporary data
const tempDataStore = new Map();

// Expiration time for temporary data (15 minutes in milliseconds)
const EXPIRATION_TIME = 15 * 60 * 1000;

/**
 * Store valid asset data with a unique ID
 * @param {Array} validData - Array of valid asset objects
 * @returns {String} - Unique ID for retrieving the data later
 */
const storeValidData = (validData) => {
  const requestId = uuidv4();
  
  // Store data with timestamp
  tempDataStore.set(requestId, {
    validData,
    timestamp: Date.now()
  });
  
  // Schedule cleanup after expiration time
  setTimeout(() => {
    tempDataStore.delete(requestId);
  }, EXPIRATION_TIME);
  
  return requestId;
};

/**
 * Retrieve valid asset data by ID
 * @param {String} requestId - Unique ID for the stored data
 * @returns {Array|null} - Array of valid asset objects or null if not found/expired
 */
const retrieveValidData = (requestId) => {
  // Check if data exists
  if (!tempDataStore.has(requestId)) {
    return null;
  }
  
  const { validData, timestamp } = tempDataStore.get(requestId);
  
  // Check if data has expired
  if (Date.now() - timestamp > EXPIRATION_TIME) {
    tempDataStore.delete(requestId);
    return null;
  }
  
  return validData;
};

/**
 * Delete stored data by ID
 * @param {String} requestId - Unique ID for the stored data
 */
const deleteStoredData = (requestId) => {
  tempDataStore.delete(requestId);
};

/**
 * Clean up expired data from storage
 * This can be called periodically if needed
 */
const cleanupExpiredData = () => {
  const now = Date.now();
  
  for (const [requestId, { timestamp }] of tempDataStore.entries()) {
    if (now - timestamp > EXPIRATION_TIME) {
      tempDataStore.delete(requestId);
    }
  }
};

module.exports = {
  storeValidData,
  retrieveValidData,
  deleteStoredData,
  cleanupExpiredData
}; 