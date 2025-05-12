document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const assetTableBody = document.getElementById('assetTableBody');
  const loadingRow = document.getElementById('loadingRow');
  const noAssetsRow = document.getElementById('noAssetsRow');
  const startRange = document.getElementById('startRange');
  const endRange = document.getElementById('endRange');
  const totalAssets = document.getElementById('totalAssets');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const refreshButton = document.getElementById('refreshButton');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const closeErrorButton = document.getElementById('closeErrorButton');
  
  // Pagination state
  let currentPage = 1;
  let pageSize = 10;
  let totalCount = 0;
  
  // Filter state
  let searchQuery = '';
  let statusValue = '';
  
  // Initial load
  loadAssets();
  
  // Event listeners
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadAssets();
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      loadAssets();
    }
  });
  
  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value;
    currentPage = 1; // Reset to first page when searching
    loadAssets();
  }, 500));
  
  statusFilter.addEventListener('change', () => {
    statusValue = statusFilter.value;
    currentPage = 1; // Reset to first page when filtering
    loadAssets();
  });
  
  refreshButton.addEventListener('click', () => {
    loadAssets();
  });
  
  closeErrorButton.addEventListener('click', () => {
    errorAlert.classList.add('hidden');
  });
  
  // Function to load assets from API
  async function loadAssets() {
    showLoading('Loading assets...');
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (statusValue) {
        params.append('status', statusValue);
      }
      
      // Fetch assets from API
      const response = await fetch(`/api/assets?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load assets');
      }
      
      // Update pagination info
      totalCount = data.totalCount || 0;
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(start + pageSize - 1, totalCount);
      
      if (startRange) startRange.textContent = totalCount > 0 ? start : 0;
      if (endRange) endRange.textContent = end;
      if (totalAssets) totalAssets.textContent = totalCount;
      
      // Update pagination buttons
      if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
      if (nextPageBtn) nextPageBtn.disabled = currentPage >= Math.ceil(totalCount / pageSize);
      
      // Render assets
      renderAssets(data.assets || []);
      
      hideLoading();
    } catch (error) {
      hideLoading();
      showError('Failed to load assets: ' + error.message);
      console.error('Error loading assets:', error);
    }
  }
  
  // Function to render assets in the table
  function renderAssets(assets) {
    // Clear existing rows except for loading and no assets rows
    const rows = assetTableBody.querySelectorAll('tr:not(#loadingRow):not(#noAssetsRow)');
    rows.forEach(row => row.remove());
    
    // Hide loading row
    if (loadingRow) loadingRow.classList.add('hidden');
    
    // Show no assets message if no assets
    if (noAssetsRow) {
      if (assets.length === 0) {
        noAssetsRow.classList.remove('hidden');
      } else {
        noAssetsRow.classList.add('hidden');
      }
    }
    
    // Add asset rows
    assets.forEach(asset => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      // Asset ID cell
      const idCell = document.createElement('td');
      idCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900';
      idCell.textContent = asset.assetId || '';
      row.appendChild(idCell);
      
      // Name cell
      const nameCell = document.createElement('td');
      nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      nameCell.textContent = asset.name || '';
      row.appendChild(nameCell);
      
      // Description cell
      const descCell = document.createElement('td');
      descCell.className = 'px-6 py-4 text-sm text-gray-500 max-w-xs truncate';
      descCell.textContent = asset.description || '';
      row.appendChild(descCell);
      
      // Location cell
      const locationCell = document.createElement('td');
      locationCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      locationCell.textContent = asset.location || '';
      row.appendChild(locationCell);
      
      // Purchase Date cell
      const dateCell = document.createElement('td');
      dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      dateCell.textContent = asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '';
      row.appendChild(dateCell);
      
      // Status cell
      const statusCell = document.createElement('td');
      statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      
      // Status badge
      const statusBadge = document.createElement('span');
      statusBadge.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
      
      // Set badge color based on status
      switch (asset.status) {
        case 'Active':
          statusBadge.classList.add('bg-green-100', 'text-green-800');
          break;
        case 'Inactive':
          statusBadge.classList.add('bg-gray-100', 'text-gray-800');
          break;
        case 'Disposed':
          statusBadge.classList.add('bg-red-100', 'text-red-800');
          break;
        case 'In Repair':
          statusBadge.classList.add('bg-yellow-100', 'text-yellow-800');
          break;
        default:
          statusBadge.classList.add('bg-blue-100', 'text-blue-800');
      }
      
      statusBadge.textContent = asset.status || 'Unknown';
      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);
      
      // Add row to table
      assetTableBody.appendChild(row);
    });
  }
  
  // Function to show loading overlay
  function showLoading(text) {
    if (loadingText) loadingText.textContent = text || 'Loading...';
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  }
  
  // Function to hide loading overlay
  function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }
  
  // Function to show error message
  function showError(message) {
    if (errorMessage) errorMessage.textContent = message;
    if (errorAlert) errorAlert.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      if (errorAlert) errorAlert.classList.add('hidden');
    }, 5000);
  }
  
  // Debounce function to limit how often a function is called
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}); 