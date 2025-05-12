# Asset Upsert Application

A web application that allows users to upload JSON or CSV files containing asset details, validate the data, and perform upsert operations on a MongoDB database.

## Features

- Upload JSON or CSV files containing asset data
- Multi-step process: validation, review, confirmation
- Detailed validation feedback with error reporting
- MongoDB upsert operations (update existing assets or insert new ones)
- Real-time feedback on processing results
- Comprehensive error handling and validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Clone the repository or download the source code.

2. Navigate to the project directory:
   ```
   cd asset-upsert-app
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/asset_management
   NODE_ENV=development
   ```
   
   Note: Update the `MONGODB_URI` with your MongoDB connection string.

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

## User Workflow

1. **Upload & Validate**: Select a JSON or CSV file and click "Upload & Validate"
2. **Review Validation Results**: Review the validation summary and any invalid records
3. **Confirm Import**: If there are valid records, click "Confirm Import" to proceed
4. **View Import Results**: See the final results showing inserted and updated records

## File Format Requirements

### JSON Format

JSON files should contain an array of objects, where each object represents an asset and must include an `assetId` field:

```json
[
  {
    "assetId": "LAP001",
    "name": "Laptop A",
    "location": "Office 101",
    "status": "Active"
  },
  {
    "assetId": "MON005",
    "name": "Monitor B",
    "location": "WFH",
    "status": "In Repair"
  }
]
```

### CSV Format

CSV files should have a header row with an `assetId` column, and each subsequent row represents an asset:

```
assetId,name,location,status
LAP001,"Laptop A","Office 101",Active
MON005,"Monitor B","WFH","In Repair"
```

## Required Fields

The following fields are required for each asset:
- `assetId` (unique identifier)
- `name`
- `location`

## Status Values

The `status` field, if provided, must be one of:
- Active
- Inactive
- Disposed
- In Repair

## API Endpoints

- `POST /api/assets/upload-validate`: Validates the uploaded file and returns a validation report
- `POST /api/assets/confirm-import`: Performs the upsert operations for valid records

## Error Handling

The application handles various errors including:
- Invalid file types
- Malformed JSON or CSV
- Missing required fields
- Invalid field values
- Duplicate asset IDs within the file
- Database connection issues

## Security Considerations

- File size is limited to 10MB
- Only JSON and CSV file types are accepted
- Input validation is performed on both client and server sides
- Temporary data storage with automatic cleanup

## Sample Files for Testing

This repository includes several sample files you can use to test the asset import wizard:

### 1. sample-assets.csv

A clean CSV file with properly formatted data that should pass validation without errors:
- Contains 10 sample assets
- Includes all required fields (assetId, name, location)
- Contains optional fields (description, purchaseDate, status)
- Field names exactly match the database schema

**Usage:** Upload this file for a successful import demonstration.

### 2. sample-assets.json

A clean JSON file with properly formatted data that should pass validation:
- Contains 10 sample assets
- Includes all required fields (assetId, name, location)
- Contains optional fields (description, purchaseDate, status)
- Field names exactly match the database schema

**Usage:** Upload this file to test JSON import functionality.

### 3. sample-assets-with-errors.csv

A CSV file with intentional errors to demonstrate validation:
- Contains 8 sample assets with various issues
- Field names don't directly match the database schema (requires mapping)
- Missing required fields in some records
- Invalid date format in some records
- Invalid status values in some records

**Usage:** Upload this file to test the validation and error handling features.

## Field Mapping Guide

When importing `sample-assets-with-errors.csv`, use the following field mappings:

| Source Field (File) | Target Field (Database) |
|---------------------|-------------------------|
| id                  | assetId                 |
| asset_name          | name                    |
| notes               | description             |
| office_location     | location                |
| date_purchased      | purchaseDate            |
| condition           | status                  |

## Running the Application

1. Start the MongoDB server
2. Install dependencies: `npm install`
3. Start the application: `npm run dev`
4. Open your browser to: `http://localhost:3000`

## Import Process

1. **Upload File:** Select one of the sample files
2. **Map Fields:** Map source fields to database fields (already matched for clean files)
3. **Validate Data:** Review validation results
4. **Import Results:** View the import outcome

## Testing Validation Errors

To see how validation works:
1. Upload `sample-assets-with-errors.csv`
2. Map the fields as shown in the Field Mapping Guide above
3. Proceed to validation
4. You should see validation errors for:
   - Missing assetId (row 2)
   - Missing location (row 7)
   - Invalid date format (rows 3 and 8)
   - Invalid status values (rows 3-6) 