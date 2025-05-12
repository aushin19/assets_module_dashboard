# Asset Upsert Application

A web application for bulk importing and upserting asset data from CSV/JSON files to MongoDB with a multi-step wizard interface.

## Features

- **Multi-step Wizard Interface**:
  - Step 1: Upload File (CSV/JSON)
  - Step 2: Map Fields (match file columns to database fields)
  - Step 3: Validate Data (review validation results)
  - Step 4: Import Results (view import outcome)

- **File Import**:
  - Support for CSV and JSON file formats
  - Drag-and-drop file upload
  - Auto-detection of field mappings
  - Validation before import

- **Data Management**:
  - MongoDB upsert operations (create new or update existing assets)
  - Configurable error handling (skip errors or stop on first error)
  - Detailed validation feedback

- **Asset Viewing**:
  - View all assets in a paginated table
  - Search functionality
  - Filter by status
  - Sortable columns

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/asset-upsert-app.git
   cd asset-upsert-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/asset_management
   NODE_ENV=development
   ```

## Running the Application

1. Start the application:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## User Guide

### Importing Assets

1. **Step 1: Upload File**
   - Click "Browse" or drag and drop a CSV/JSON file
   - File size limit: 10MB
   - Supported formats: CSV, JSON

2. **Step 2: Map Fields**
   - Match columns from your file to database fields
   - Required fields: assetId, name, location
   - The system will attempt to auto-map fields with similar names
   - Add custom mappings if needed

3. **Step 3: Validate Data**
   - Review validation results
   - See counts of valid and invalid records
   - View detailed error messages for invalid records
   - Configure import options:
     - Update Existing: Yes/No
     - Skip Errors: Yes/No

4. **Step 4: Import Results**
   - View summary of import operation
   - See counts of created, updated, and failed records
   - View detailed error messages for failed imports
   - Options:
     - View Assets: Navigate to the asset listing page
     - Start New Import: Begin a new import process

### Viewing Assets

1. Navigate to the Assets page by:
   - Clicking "VIEW ASSETS" after an import
   - Going to `/assets.html` directly

2. Asset Listing Features:
   - Paginated table of all assets
   - Search by asset ID, name, description, or location
   - Filter by status (Active, Inactive, In Repair, Disposed)
   - Click column headers to sort
   - Click "Refresh" to update the list

## API Endpoints

### Asset Import

- `POST /api/assets/extract-headers`: Extract headers from uploaded file
- `POST /api/assets/upload-validate`: Validate uploaded file with mappings
- `POST /api/assets/confirm-import`: Perform import operation

### Asset Management

- `GET /api/assets`: Get assets with pagination, search, and filtering
  - Query parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `search`: Search term for asset ID, name, description, or location
    - `status`: Filter by status

## Asset Schema

```javascript
{
  assetId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true },
  purchaseDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Disposed', 'In Repair']
  }
}
```

## Sample Files for Testing

The repository includes sample files for testing:

### 1. sample-assets.csv
Clean CSV file with all required fields that passes validation.

### 2. sample-assets.json
Clean JSON file with all required fields that passes validation.

### 3. sample-assets-with-errors.csv
CSV file with intentional errors to demonstrate validation.

## Field Mapping Guide

When importing files with non-standard field names, map as follows:

| Common Source Fields | Target Database Fields |
|---------------------|------------------------|
| id, asset_id, asset-id | assetId             |
| name, asset_name, title | name               |
| desc, description, notes | description       |
| loc, location, place | location              |
| date, purchase_date, purchased | purchaseDate |
| state, status, condition | status            |

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **File Processing**: csv-parser for CSV, native JSON parsing

## Development

### Project Structure

```
asset-upsert-app/
├── public/                 # Static frontend files
│   ├── index.html          # Main import wizard page
│   ├── assets.html         # Asset listing page
│   ├── script.js           # Import wizard logic
│   └── assets.js           # Asset listing logic
├── src/
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Helper utilities
│   └── server.js           # Express server setup
├── uploads/                # Temporary file storage (gitignored)
└── .env                    # Environment variables (gitignored)
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 