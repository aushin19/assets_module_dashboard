document.addEventListener('DOMContentLoaded', () => {
  // Step elements
  const uploadStep = document.getElementById('uploadStep');
  const mapFieldsStep = document.getElementById('mapFieldsStep');
  const validationStep = document.getElementById('validationStep');
  const importResultsStep = document.getElementById('importResultsStep');
  
  // Stepper elements
  const stepCircles = {
    1: document.getElementById('step-circle-1'),
    2: document.getElementById('step-circle-2'),
    3: document.getElementById('step-circle-3'),
    4: document.getElementById('step-circle-4')
  };
  
  const stepTexts = {
    1: document.getElementById('step-text-1'),
    2: document.getElementById('step-text-2'),
    3: document.getElementById('step-text-3'),
    4: document.getElementById('step-text-4')
  };
  
  const stepperLines = {
    '1-2': document.getElementById('line-1-2'),
    '2-3': document.getElementById('line-2-3'),
    '3-4': document.getElementById('line-3-4')
  };
  
  // Form elements
  const fileInput = document.getElementById('fileInput');
  const dropArea = document.getElementById('dropArea');
  const browseButton = document.getElementById('browseButton');
  const nextButton = document.getElementById('nextButton');
  const backButton = document.getElementById('backButton');
  
  // File info elements
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const removeFile = document.getElementById('removeFile');
  
  // Map Fields elements
  const mappingContainer = document.getElementById('mappingContainer');
  const backToUploadButton = document.getElementById('backToUploadButton');
  const proceedToValidateButton = document.getElementById('proceedToValidateButton');
  
  // Validation results elements
  const totalCount = document.getElementById('totalCount');
  const validCount = document.getElementById('validCount');
  const invalidCount = document.getElementById('invalidCount');
  const invalidRecordsSection = document.getElementById('invalidRecordsSection');
  const invalidRecordsTable = document.getElementById('invalidRecordsTable');
  const backToMapButton = document.getElementById('backToMapButton');
  const confirmImportButton = document.getElementById('confirmImportButton');
  
  // Import results elements
  const importSuccessMessage = document.getElementById('importSuccessMessage');
  const insertedCount = document.getElementById('insertedCount');
  const updatedCount = document.getElementById('updatedCount');
  const failedCount = document.getElementById('failedCount');
  const databaseErrorsSection = document.getElementById('databaseErrorsSection');
  const databaseErrorsTable = document.getElementById('databaseErrorsTable');
  const startOverButton = document.getElementById('startOverButton');
  
  // Loading and error elements
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const closeErrorButton = document.getElementById('closeErrorButton');
  
  // Store data for steps
  let currentRequestId = null;
  let selectedFile = null;
  let fileHeaders = [];
  let fieldMappings = {};
  
  // Current step tracker
  let currentStep = 1;
  
  // --- FIELD MAPPING LOGIC ---
  // Asset schema fields (could be fetched from backend in future)
  const assetSchemaFields = [
    { name: 'assetId', label: 'Asset ID', type: 'String', required: true },
    { name: 'name', label: 'Name', type: 'String', required: true },
    { name: 'description', label: 'Description', type: 'String', required: false },
    { name: 'location', label: 'Location', type: 'String', required: true },
    { name: 'purchaseDate', label: 'Purchase Date', type: 'Date', required: false },
    { name: 'status', label: 'Status', type: 'String', required: false }
  ];
  
  // Mapping state
  let mappingRows = [];
  
  // DOM elements for mapping
  const mappingTableBody = document.getElementById('mappingTableBody');
  const newSourceField = document.getElementById('newSourceField');
  const newTargetField = document.getElementById('newTargetField');
  const newDataType = document.getElementById('newDataType');
  const newRequired = document.getElementById('newRequired');
  const addMappingButton = document.getElementById('addMappingButton');
  const updateExistingSelect = document.getElementById('updateExisting');
  const skipErrorsSelect = document.getElementById('skipErrors');
  
  // File Input Handling
  browseButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener('change', handleFileSelection);
  
  // Handle drag and drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropArea.classList.add('border-blue-500');
  }
  
  function unhighlight() {
    dropArea.classList.remove('border-blue-500');
  }
  
  dropArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelection();
    }
  }
  
  function handleFileSelection() {
    const file = fileInput.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // Check file type
      if (!['json', 'csv', 'xlsx', 'xls'].includes(fileExtension)) {
        fileInput.value = '';
        showError('Invalid file type. Please select a supported file type (JSON, CSV, Excel).');
        return;
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        fileInput.value = '';
        showError('File is too large. Maximum size is 10MB.');
        return;
      }
      
      // Store the selected file
      selectedFile = file;
      
      // Show file info
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
      fileInfo.classList.remove('hidden');
      
      // Enable next button
      nextButton.disabled = false;
    }
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
  
  // Remove selected file
  removeFile.addEventListener('click', () => {
    fileInput.value = '';
    selectedFile = null;
    fileInfo.classList.add('hidden');
    nextButton.disabled = true;
  });
  
  // Handle step navigation
  nextButton.addEventListener('click', () => {
    if (currentStep === 1 && selectedFile) {
      // Upload and process file for field mapping
      uploadFileForMapping();
    }
  });
  
  backButton.addEventListener('click', () => {
    // This button is disabled in step 1, so no action needed
  });
  
  backToUploadButton.addEventListener('click', () => {
    showStep(1);
  });
  
  proceedToValidateButton.addEventListener('click', () => {
    // Validate the file with mappings
    validateFileWithMappings();
  });
  
  backToMapButton.addEventListener('click', () => {
    showStep(2);
  });
  
  confirmImportButton.addEventListener('click', async () => {
    if (!currentRequestId) {
      showError('No valid data to import. Please upload a file first.');
      return;
    }
    
    // Show loading overlay
    showLoading('Importing assets...');
    
    try {
      // Send request to confirm import
      const response = await fetch('/api/assets/confirm-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: currentRequestId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to import assets');
      }
      
      // Show import results
      showStep(4);
      showImportResults(result);
      
      // Hide loading overlay
      hideLoading();
    } catch (error) {
      // Hide loading overlay
      hideLoading();
      
      // Show error message
      showError('Import failed: ' + error.message);
    }
  });
  
  // Start new import button
  const startNewImportButton = document.getElementById('startNewImportButton');
  if (startNewImportButton) {
    startNewImportButton.addEventListener('click', () => {
      // Reset form and data
      resetWizard();
      showStep(1);
    });
  }
  
  // View assets button
  const viewAssetsButton = document.getElementById('viewAssetsButton');
  if (viewAssetsButton) {
    viewAssetsButton.addEventListener('click', () => {
      // Navigate to the assets page
      window.location.href = '/assets.html';
    });
  }
  
  closeErrorButton.addEventListener('click', () => {
    errorAlert.classList.add('hidden');
  });
  
  // Function to upload and process file for field mapping
  async function uploadFileForMapping() {
    if (!selectedFile) {
      showError('Please select a file to upload.');
      return;
    }
    
    // Show loading overlay
    showLoading('Processing file...');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('assetFile', selectedFile);
      
      // Extract headers from the selected file
      let headers = [];
      
      if (selectedFile.name.toLowerCase().endsWith('.json')) {
        // For JSON, parse the first object to get keys
        try {
          const text = await selectedFile.text();
          const data = JSON.parse(text);
          
          if (Array.isArray(data) && data.length > 0) {
            headers = Object.keys(data[0]);
            console.log('Extracted JSON headers:', headers);
          } else {
            throw new Error('Invalid JSON format. Expected an array of objects.');
          }
        } catch (error) {
          throw new Error(`Error parsing JSON file: ${error.message}`);
        }
      } else if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        // For CSV, parse the first line to get headers
        try {
          const text = await selectedFile.text();
          const lines = text.split('\n');
          
          if (lines.length > 0) {
            // Handle both comma and semicolon delimiters
            const firstLine = lines[0].trim();
            const delimiter = firstLine.includes(',') ? ',' : (firstLine.includes(';') ? ';' : ',');
            
            headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
            console.log('Extracted CSV headers:', headers);
          } else {
            throw new Error('Invalid CSV format. File appears to be empty.');
          }
        } catch (error) {
          throw new Error(`Error parsing CSV file: ${error.message}`);
        }
      } else {
        // For Excel files or other formats, we'd need a proper parser
        // For this demo, we'll use placeholder headers or show an error
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }
      
      // Validate that we have headers
      if (!headers || headers.length === 0) {
        throw new Error('Could not extract headers from the file. Please check the file format.');
      }
      
      // Store headers
      fileHeaders = headers;
      
      // Hide loading overlay
      hideLoading();
      
      // Show field mapping UI
      showFieldMappingUI();
      
      // Proceed to next step
      showStep(2);
      
    } catch (error) {
      // Hide loading overlay
      hideLoading();
      
      // Show error message
      showError('Failed to process file: ' + error.message);
      console.error('File processing error:', error);
    }
  }
  
  // Function to show field mapping UI
  function showFieldMappingUI() {
    // Clear previous mapping UI
    if (mappingContainer) {
      mappingContainer.innerHTML = '';
      
      // Create mapping UI for each database field
      const databaseFields = [
        { name: 'assetId', label: 'Asset ID', required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', required: false },
        { name: 'location', label: 'Location', required: true },
        { name: 'purchaseDate', label: 'Purchase Date', required: false },
        { name: 'status', label: 'Status', required: false }
      ];
      
      databaseFields.forEach(field => {
        const mappingRow = document.createElement('div');
        mappingRow.className = 'mb-4';
        
        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700 mb-1';
        label.textContent = `${field.label}${field.required ? ' *' : ''}`;
        
        const select = document.createElement('select');
        select.name = `mapping_${field.name}`;
        select.id = `mapping_${field.name}`;
        select.className = 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select field --';
        select.appendChild(emptyOption);
        
        // Add options for each file header
        fileHeaders.forEach(header => {
          const option = document.createElement('option');
          option.value = header;
          option.textContent = header;
          select.appendChild(option);
        });
        
        // Set default mapping if available
        if (fieldMappings[field.name]) {
          select.value = fieldMappings[field.name];
        }
        
        // Update mapping when selection changes
        select.addEventListener('change', (e) => {
          fieldMappings[field.name] = e.target.value;
        });
        
        mappingRow.appendChild(label);
        mappingRow.appendChild(select);
        mappingContainer.appendChild(mappingRow);
      });
    }
    
    // Create mappingRows for the table view
    mappingRows = [];
    
    // First, try to auto-map based on exact or similar field names
    fileHeaders.forEach(header => {
      // Try exact match first (case-insensitive)
      const exactMatch = assetSchemaFields.find(f => 
        f.name.toLowerCase() === header.toLowerCase() || 
        f.label.toLowerCase() === header.toLowerCase()
      );
      
      // Try partial match if no exact match
      const partialMatch = !exactMatch && assetSchemaFields.find(f => 
        header.toLowerCase().includes(f.name.toLowerCase()) || 
        f.name.toLowerCase().includes(header.toLowerCase()) ||
        header.toLowerCase().includes(f.label.toLowerCase()) || 
        f.label.toLowerCase().includes(header.toLowerCase())
      );
      
      // Add to mapping rows
      mappingRows.push({ 
        source: header, 
        target: exactMatch ? exactMatch.name : (partialMatch ? partialMatch.name : '')
      });
    });
    
    // Special case handling for common field name variations
    if (!mappingRows.some(row => row.target === 'assetId')) {
      // Look for common asset ID field names
      const assetIdField = fileHeaders.find(h => 
        ['id', 'asset_id', 'assetid', 'asset-id', 'asset_number', 'assetnumber'].includes(h.toLowerCase())
      );
      if (assetIdField) {
        const existingMapping = mappingRows.find(row => row.source === assetIdField);
        if (existingMapping) {
          existingMapping.target = 'assetId';
        }
      }
    }
    
    // Make sure mappingTableBody exists before using it
    if (mappingTableBody) {
      renderMappingTable();
    }
    
    // Populate Add Mapping target field dropdown
    if (newTargetField) populateTargetFieldDropdown(newTargetField, '');
    if (newDataType) newDataType.innerHTML = '<option value="String">String</option>';
    if (newRequired) newRequired.innerHTML = '<option value="no">No</option>';
    
    // Log the current mappings for debugging
    console.log('Current mappings:', mappingRows);
  }
  
  // Populate target field dropdowns
  function populateTargetFieldDropdown(select, selectedValue) {
    select.innerHTML = '<option value="">-- Do Not Import --</option>';
    assetSchemaFields.forEach(field => {
      const option = document.createElement('option');
      option.value = field.name;
      option.textContent = field.label;
      if (selectedValue && selectedValue === field.name) option.selected = true;
      select.appendChild(option);
    });
  }
  
  // Update Data Type and Required for Add Mapping section
  if (newTargetField) {
    newTargetField.addEventListener('change', () => {
      const field = assetSchemaFields.find(f => f.name === newTargetField.value);
      if (newDataType) {
        newDataType.innerHTML = '';
        newDataType.appendChild(new Option(field ? field.type : 'String', field ? field.type : 'String'));
      }
      if (newRequired) {
        newRequired.innerHTML = '';
        newRequired.appendChild(new Option(field && field.required ? 'Yes' : 'No', field && field.required ? 'yes' : 'no'));
      }
    });
  }
  
  // Add mapping row
  addMappingButton.addEventListener('click', (e) => {
    e.preventDefault();
    const source = newSourceField.value.trim();
    const target = newTargetField.value;
    if (!source || !target) {
      showError('Please provide both Source Field and Target Field.');
      return;
    }
    if (mappingRows.some(row => row.source === source)) {
      showError('A mapping for this source field already exists.');
      return;
    }
    mappingRows.push({ source, target });
    renderMappingTable();
    newSourceField.value = '';
    newTargetField.value = '';
    if (newDataType) newDataType.innerHTML = '<option value="String">String</option>';
    if (newRequired) newRequired.innerHTML = '<option value="no">No</option>';
  });
  
  // Render mapping table
  function renderMappingTable() {
    if (!mappingTableBody) return; // Exit if mappingTableBody doesn't exist
    
    mappingTableBody.innerHTML = '';
    mappingRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      // Source Field
      const tdSource = document.createElement('td');
      tdSource.className = 'px-6 py-2';
      tdSource.textContent = row.source;
      tr.appendChild(tdSource);
      // Target Field (dropdown)
      const tdTarget = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'border border-gray-300 rounded-md py-1 px-2';
      populateTargetFieldDropdown(select, row.target);
      select.value = row.target;
      select.addEventListener('change', (e) => {
        row.target = e.target.value;
        renderMappingTable();
      });
      tdTarget.appendChild(select);
      tr.appendChild(tdTarget);
      // Data Type
      const tdType = document.createElement('td');
      const field = assetSchemaFields.find(f => f.name === row.target);
      tdType.className = 'px-6 py-2';
      tdType.textContent = field ? field.type : '';
      tr.appendChild(tdType);
      // Required
      const tdReq = document.createElement('td');
      tdReq.className = 'px-6 py-2';
      tdReq.textContent = field && field.required ? 'Yes' : 'No';
      tr.appendChild(tdReq);
      // Actions
      const tdActions = document.createElement('td');
      tdActions.className = 'px-6 py-2 flex gap-2';
      // Edit (not needed, dropdown is editable)
      // Delete
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      delBtn.title = 'Delete mapping';
      delBtn.onclick = () => {
        mappingRows.splice(idx, 1);
        renderMappingTable();
      };
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);
      mappingTableBody.appendChild(tr);
    });
  }
  
  // Function to validate file with mappings
  async function validateFileWithMappings() {
    // Validate required fields are mapped
    const requiredFields = assetSchemaFields.filter(f => f.required).map(f => f.name);
    const mappedTargets = mappingRows.map(row => row.target);
    const missing = requiredFields.filter(f => !mappedTargets.includes(f));
    if (missing.length > 0) {
      showError('Please map all required fields: ' + missing.join(', '));
      return;
    }
    
    // Collect import options
    const importOptions = {
      updateExisting: updateExistingSelect.value,
      errorHandling: skipErrorsSelect.value
    };
    
    // Prepare mappings for backend - ensure we only include valid mappings
    const fieldMappings = mappingRows
      .filter(row => row.source && row.target) // Only include mappings with both source and target
      .map(row => ({ 
        source: row.source, 
        target: row.target 
      }));
    
    // Verify that all required fields are mapped
    const mappedFields = fieldMappings.map(m => m.target);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    
    if (missingRequired.length > 0) {
      showError('Required fields are not mapped: ' + missingRequired.join(', '));
      return;
    }
    
    // Show loading overlay
    showLoading('Validating data...');
    
    try {
      const formData = new FormData();
      formData.append('assetFile', selectedFile);
      formData.append('mappings', JSON.stringify(fieldMappings));
      formData.append('importOptions', JSON.stringify(importOptions));
      
      const response = await fetch('/api/assets/upload-validate', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      // Hide loading overlay
      hideLoading();
      
      if (response.ok) {
        showValidationResults(result);
        showStep(3);
      } else {
        showError(result.error || result.message || 'An unknown error occurred during validation.');
      }
    } catch (error) {
      hideLoading();
      showError('Failed to validate file. Please try again.');
      console.error('Validation error:', error);
    }
  }
  
  // Function to show validation results
  const showValidationResults = (result) => {
    // Store the request ID for later use
    currentRequestId = result.requestId;
    
    // Get validation elements
    const validationStatusSuccess = document.getElementById('validationStatusSuccess');
    const validationStatusError = document.getElementById('validationStatusError');
    const validationErrorMessage = document.getElementById('validationErrorMessage');
    const allValidSummary = document.getElementById('allValidSummary');
    const errorSummary = document.getElementById('errorSummary');
    const totalRecordsCount = document.getElementById('totalRecordsCount');
    const validRecordsCount = document.getElementById('validRecordsCount');
    const invalidRecordsCount = document.getElementById('invalidRecordsCount');
    const errorDetailsTable = document.getElementById('errorDetailsTable');
    const importInstructions = document.getElementById('importInstructions');
    
    // Update counts
    const totalCount = result.counts.total;
    const validCount = result.counts.valid;
    const invalidCount = result.counts.invalid;
    
    if (totalRecordsCount) totalRecordsCount.textContent = totalCount;
    if (validRecordsCount) validRecordsCount.textContent = validCount;
    if (invalidRecordsCount) invalidRecordsCount.textContent = invalidCount;
    
    // Determine if we have validation errors
    const hasErrors = invalidCount > 0;
    
    // Show appropriate status message
    if (validationStatusSuccess) validationStatusSuccess.classList.toggle('hidden', hasErrors);
    if (validationStatusError) validationStatusError.classList.toggle('hidden', !hasErrors);
    
    // Show appropriate summary section
    if (allValidSummary) allValidSummary.classList.toggle('hidden', hasErrors);
    if (errorSummary) errorSummary.classList.toggle('hidden', !hasErrors);
    
    // Update error message based on skipErrors setting (from step 2)
    if (hasErrors && validationErrorMessage) {
      const skipErrors = skipErrorsSelect && skipErrorsSelect.value === 'continue_on_error';
      if (skipErrors) {
        validationErrorMessage.textContent = `Some records have validation errors. Please review the details below. Only valid records will be imported if you choose to proceed.`;
      } else {
        validationErrorMessage.textContent = `Please go back and correct your file or field mappings. The import cannot proceed with these errors.`;
      }
    }
    
    // Update import instructions
    if (importInstructions) {
      if (hasErrors) {
        const skipErrors = skipErrorsSelect && skipErrorsSelect.value === 'continue_on_error';
        if (skipErrors) {
          importInstructions.textContent = `Review the errors above. Only the ${validCount} valid records will be imported. Click 'Import Valid Data' to proceed.`;
          if (confirmImportButton) confirmImportButton.textContent = 'IMPORT VALID DATA';
        } else {
          importInstructions.textContent = `Please go back and correct your file or field mappings. The import cannot proceed with these errors.`;
          if (confirmImportButton) confirmImportButton.textContent = 'IMPORT';
        }
      } else {
        importInstructions.textContent = `Click 'Import' to proceed with importing the data into the database.`;
        if (confirmImportButton) confirmImportButton.textContent = 'IMPORT';
      }
    }
    
    // Clear previous error details
    if (errorDetailsTable) errorDetailsTable.innerHTML = '';
    
    // Show error details if any
    if (hasErrors && errorDetailsTable && result.invalidRecords) {
      result.invalidRecords.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Row number cell
        const rowCell = document.createElement('td');
        rowCell.className = 'px-4 py-2 text-sm text-gray-500';
        rowCell.textContent = index + 1; // Assuming 1-based row numbering
        row.appendChild(rowCell);
        
        // Asset ID cell
        const idCell = document.createElement('td');
        idCell.className = 'px-4 py-2 text-sm';
        idCell.textContent = item.record.assetId || 'N/A';
        row.appendChild(idCell);
        
        // For each error, create a row with field and error message
        if (item.errors && item.errors.length) {
          // Get the first error for the main row
          const firstError = item.errors[0];
          
          // Source field cell (assuming the error format includes field information)
          const fieldCell = document.createElement('td');
          fieldCell.className = 'px-4 py-2 text-sm';
          // Extract field name from error message if possible
          const fieldMatch = firstError.match(/field: (\w+)/i);
          fieldCell.textContent = fieldMatch ? fieldMatch[1] : 'Multiple fields';
          row.appendChild(fieldCell);
          
          // Error message cell
          const errorCell = document.createElement('td');
          errorCell.className = 'px-4 py-2 text-sm text-red-600';
          errorCell.textContent = firstError;
          row.appendChild(errorCell);
          
          errorDetailsTable.appendChild(row);
          
          // If there are multiple errors for this record, add additional rows
          if (item.errors.length > 1) {
            for (let i = 1; i < item.errors.length; i++) {
              const additionalRow = document.createElement('tr');
              additionalRow.className = 'bg-gray-50';
              
              // Empty row number cell
              const emptyRowCell = document.createElement('td');
              emptyRowCell.className = 'px-4 py-2 text-sm text-gray-500';
              additionalRow.appendChild(emptyRowCell);
              
              // Empty asset ID cell
              const emptyIdCell = document.createElement('td');
              emptyIdCell.className = 'px-4 py-2 text-sm';
              additionalRow.appendChild(emptyIdCell);
              
              // Source field cell
              const additionalFieldCell = document.createElement('td');
              additionalFieldCell.className = 'px-4 py-2 text-sm';
              const additionalFieldMatch = item.errors[i].match(/field: (\w+)/i);
              additionalFieldCell.textContent = additionalFieldMatch ? additionalFieldMatch[1] : '';
              additionalRow.appendChild(additionalFieldCell);
              
              // Error message cell
              const additionalErrorCell = document.createElement('td');
              additionalErrorCell.className = 'px-4 py-2 text-sm text-red-600';
              additionalErrorCell.textContent = item.errors[i];
              additionalRow.appendChild(additionalErrorCell);
              
              errorDetailsTable.appendChild(additionalRow);
            }
          }
        }
      });
    }
    
    // Enable/disable confirm button based on valid records and skipErrors setting
    if (confirmImportButton) {
      const skipErrors = skipErrorsSelect && skipErrorsSelect.value === 'continue_on_error';
      confirmImportButton.disabled = !result.requestId || 
                                    (validCount === 0) || 
                                    (hasErrors && !skipErrors);
    }
  };
  
  // Function to show import results
  const showImportResults = (result) => {
    // Get elements
    const importSuccessAlert = document.getElementById('importSuccessAlert');
    const importErrorAlert = document.getElementById('importErrorAlert');
    const importSuccessMessage = document.getElementById('importSuccessMessage');
    const importErrorMessage = document.getElementById('importErrorMessage');
    const totalRecordsImport = document.getElementById('totalRecordsImport');
    const createdRecords = document.getElementById('createdRecords');
    const updatedRecords = document.getElementById('updatedRecords');
    const failedRecords = document.getElementById('failedRecords');
    const errorDetailsSection = document.getElementById('errorDetailsSection');
    const errorDetailsTableImport = document.getElementById('errorDetailsTableImport');
    
    // Calculate totals
    const inserted = result.results.inserted || 0;
    const updated = result.results.updated || 0;
    const failed = result.results.dbFailures || 0;
    const total = inserted + updated + failed;
    const successRate = total > 0 ? ((inserted + updated) / total * 100).toFixed(1) : '0.0';
    
    // Update summary cards
    if (totalRecordsImport) totalRecordsImport.textContent = total;
    if (createdRecords) createdRecords.textContent = inserted;
    if (updatedRecords) updatedRecords.textContent = updated;
    if (failedRecords) failedRecords.textContent = failed;
    
    // Determine if we have errors
    const hasErrors = failed > 0;
    
    // Show appropriate status message
    if (importSuccessAlert) importSuccessAlert.classList.toggle('hidden', hasErrors);
    if (importErrorAlert) importErrorAlert.classList.toggle('hidden', !hasErrors);
    
    // Update status messages
    if (importSuccessMessage) {
      importSuccessMessage.textContent = `Successfully imported ${inserted + updated} out of ${total} records (${successRate}% success rate).`;
    }
    
    if (importErrorMessage) {
      importErrorMessage.textContent = `Imported ${inserted + updated} out of ${total} records (${successRate}% success rate).`;
    }
    
    // Show error details if any
    if (errorDetailsSection) {
      errorDetailsSection.classList.toggle('hidden', !hasErrors);
    }
    
    // Clear previous error details
    if (errorDetailsTableImport) {
      errorDetailsTableImport.innerHTML = '';
      
      // Add each error to the table
      if (hasErrors && result.databaseErrors && result.databaseErrors.length > 0) {
        result.databaseErrors.forEach((item, index) => {
          const row = document.createElement('tr');
          
          // Row number cell
          const rowCell = document.createElement('td');
          rowCell.className = 'px-4 py-3 text-sm text-gray-500';
          rowCell.textContent = index + 1;
          row.appendChild(rowCell);
          
          // Field cell
          const fieldCell = document.createElement('td');
          fieldCell.className = 'px-4 py-3 text-sm';
          fieldCell.textContent = item.field || 'N/A';
          row.appendChild(fieldCell);
          
          // Value cell
          const valueCell = document.createElement('td');
          valueCell.className = 'px-4 py-3 text-sm';
          valueCell.textContent = item.assetId || 'Row ' + (index + 1);
          row.appendChild(valueCell);
          
          // Error message cell
          const errorCell = document.createElement('td');
          errorCell.className = 'px-4 py-3 text-sm text-red-600';
          errorCell.textContent = item.error || 'Unknown error';
          row.appendChild(errorCell);
          
          errorDetailsTableImport.appendChild(row);
        });
      }
    }
  };
  
  // Function to show a specific step
  function showStep(step) {
    currentStep = step;
    
    // Hide all steps
    uploadStep.classList.add('hidden');
    mapFieldsStep.classList.add('hidden');
    validationStep.classList.add('hidden');
    importResultsStep.classList.add('hidden');
    
    // Show the current step
    switch (step) {
      case 1:
        uploadStep.classList.remove('hidden');
        break;
      case 2:
        mapFieldsStep.classList.remove('hidden');
        break;
      case 3:
        validationStep.classList.remove('hidden');
        break;
      case 4:
        importResultsStep.classList.remove('hidden');
        break;
    }
    
    // Update stepper UI
    updateStepperUI(step);
  }
  
  // Function to update the stepper UI
  function updateStepperUI(currentStep) {
    // Reset all steps
    for (let i = 1; i <= 4; i++) {
      // Reset step circles
      stepCircles[i].classList.remove('step-circle-active', 'step-circle-completed');
      stepCircles[i].classList.add('step-circle');
      
      // Reset step text
      stepTexts[i].classList.remove('text-blue-600');
      stepTexts[i].classList.add('text-gray-500');
    }
    
    // Reset all lines
    stepperLines['1-2'].classList.remove('stepper-line-active');
    stepperLines['2-3'].classList.remove('stepper-line-active');
    stepperLines['3-4'].classList.remove('stepper-line-active');
    
    // Set active and completed steps
    for (let i = 1; i <= 4; i++) {
      if (i < currentStep) {
        // Completed steps
        stepCircles[i].classList.remove('step-circle');
        stepCircles[i].classList.add('step-circle-completed');
        stepTexts[i].classList.remove('text-gray-500');
        stepTexts[i].classList.add('text-blue-600');
      } else if (i === currentStep) {
        // Current step
        stepCircles[i].classList.remove('step-circle');
        stepCircles[i].classList.add('step-circle-active');
        stepTexts[i].classList.remove('text-gray-500');
        stepTexts[i].classList.add('text-blue-600');
      }
      
      // Active lines (between completed steps and current step)
      if (i < currentStep) {
        const lineKey = `${i}-${i+1}`;
        if (stepperLines[lineKey]) {
          stepperLines[lineKey].classList.add('stepper-line-active');
        }
      }
    }
  }
  
  // Function to reset the wizard
  function resetWizard() {
    // Reset file input
    fileInput.value = '';
    selectedFile = null;
    fileInfo.classList.add('hidden');
    
    // Reset buttons
    nextButton.disabled = true;
    confirmImportButton.disabled = true;
    
    // Reset data
    currentRequestId = null;
    fileHeaders = [];
    fieldMappings = {};
    mappingRows = [];
    
    // Clear mapping container
    if (mappingContainer) mappingContainer.innerHTML = '';
    if (mappingTableBody) mappingTableBody.innerHTML = '';
    
    // Reset validation UI
    const validationStatusSuccess = document.getElementById('validationStatusSuccess');
    const validationStatusError = document.getElementById('validationStatusError');
    const allValidSummary = document.getElementById('allValidSummary');
    const errorSummary = document.getElementById('errorSummary');
    
    if (validationStatusSuccess) validationStatusSuccess.classList.remove('hidden');
    if (validationStatusError) validationStatusError.classList.add('hidden');
    if (allValidSummary) allValidSummary.classList.remove('hidden');
    if (errorSummary) errorSummary.classList.add('hidden');
    
    // Reset import results UI
    const importSuccessAlert = document.getElementById('importSuccessAlert');
    const importErrorAlert = document.getElementById('importErrorAlert');
    const totalRecordsImport = document.getElementById('totalRecordsImport');
    const createdRecords = document.getElementById('createdRecords');
    const updatedRecords = document.getElementById('updatedRecords');
    const failedRecords = document.getElementById('failedRecords');
    const errorDetailsSection = document.getElementById('errorDetailsSection');
    const errorDetailsTableImport = document.getElementById('errorDetailsTableImport');
    
    if (importSuccessAlert) importSuccessAlert.classList.add('hidden');
    if (importErrorAlert) importErrorAlert.classList.add('hidden');
    if (totalRecordsImport) totalRecordsImport.textContent = '0';
    if (createdRecords) createdRecords.textContent = '0';
    if (updatedRecords) updatedRecords.textContent = '0';
    if (failedRecords) failedRecords.textContent = '0';
    if (errorDetailsSection) errorDetailsSection.classList.add('hidden');
    if (errorDetailsTableImport) errorDetailsTableImport.innerHTML = '';
  }
  
  // Function to show loading overlay
  const showLoading = (text) => {
    loadingText.textContent = text || 'Processing...';
    loadingOverlay.classList.remove('hidden');
  };
  
  // Function to hide loading overlay
  const hideLoading = () => {
    loadingOverlay.classList.add('hidden');
  };
  
  // Function to show error message
  const showError = (message) => {
    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      errorAlert.classList.add('hidden');
    }, 5000);
  };
}); 