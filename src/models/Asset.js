const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String,
    required: true
  },
  description: { 
    type: String 
  },
  location: { 
    type: String,
    required: true
  },
  purchaseDate: { 
    type: Date 
  },
  status: { 
    type: String,
    enum: ['Active', 'Inactive', 'Disposed', 'In Repair']
  }
}, { 
  timestamps: true,
  // Allow fields not specified in the schema
  strict: true
});

module.exports = mongoose.model('Asset', assetSchema); 