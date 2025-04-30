/**
 * History Tracker Module
 * Manages the history of captured and processed content for the Copilot
 */

WebNotebook.Copilot = WebNotebook.Copilot || {};
WebNotebook.Copilot.HistoryTracker = (function() {
    // Private variables
    let historyItems = [];
    const MAX_HISTORY_ITEMS = 100; // Maximum number of history items to keep
    
    /**
     * Initialize the history tracker
     */
    function initialize() {
        console.log('History Tracker initialized');
        
        // Load history from storage
        loadHistory();
        
        // Display history items if UI element exists
        displayHistory();
    }
    
    /**
     * Add an item to the history
     * @param {Object} item - The history item to add
     * @param {string} item.type - Type of history item ('capture', 'process')
     * @param {string} item.content - The content
     * @param {string} item.timestamp - Timestamp in ISO format
     * @param {string} [item.action] - Action for 'process' type items
     * @param {Object} [item.result] - Result for 'process' type items
     */
    function addHistoryItem(item) {
        if (!item || !item.type || !item.content || !item.timestamp) {
            console.error('Invalid history item', item);
            return;
        }
        
        // Add unique ID
        item.id = 'history_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        // Add to history
        historyItems.unshift(item);
        
        // Trim history if needed
        if (historyItems.length > MAX_HISTORY_ITEMS) {
            historyItems = historyItems.slice(0, MAX_HISTORY_ITEMS);
        }
        
        // Save to storage
        saveHistory();
        
        // Update display
        displayHistory();
    }
    
    /**
     * Remove an item from history
     * @param {string} itemId - ID of the item to remove
     * @returns {boolean} - True if successfully removed
     */
    function removeHistoryItem(itemId) {
        const itemIndex = historyItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return false;
        
        // Remove from history
        historyItems.splice(itemIndex, 1);
        
        // Save to storage
        saveHistory();
        
        // Update display
        displayHistory();
        
        return true;
    }
    
    /**
     * Clear all history
     */
    function clearHistory() {
        historyItems = [];
        
        // Save to storage
        saveHistory();
        
        // Update display
        displayHistory();
    }
    
    /**
     * Load history from storage
     */
    function loadHistory() {
        const loadedHistory = WebNotebook.Utils.Storage.loadCopilotHistory();
        if (loadedHistory && Array.isArray(loadedHistory)) {
            historyItems = loadedHistory;
        }
    }
    
    /**
     * Save history to storage
     */
    function saveHistory() {
        WebNotebook.Utils.Storage.saveCopilotHistory(historyItems);
    }
    
    /**
     * Display history items in the UI
     */
    function displayHistory() {
        const historyContainer = document.querySelector('.copilot-history');
        if (!historyContainer) return;
        
        // Clear existing content
        historyContainer.innerHTML = `
            <h4>Recent Activity</h4>
            <div class="history-items"></div>
        `;
        
        const historyItemsContainer = historyContainer.querySelector('.history-items');
        
        // Add history items
        if (historyItems.length === 0) {
            historyItemsContainer.innerHTML = '<p class="empty-history">No activity yet. Copy text or use the AI Copilot to get started.</p>';
            return;
        }
        
        // Add the most recent items (up to 5)
        const recentItems = historyItems.slice(0, 5);
        
        recentItems.forEach(item => {
            // Create history item element
            const historyItemElement = document.createElement('div');
            historyItemElement.className = 'history-item';
            historyItemElement.dataset.id = item.id;
            
            // Format timestamp
            const timestamp = new Date(item.timestamp).toLocaleString();
            
            // Create preview of content
            const contentPreview = item.content.length > 60 ? 
                item.content.substring(0, 60) + '...' : 
                item.content;
            
            // Set content based on item type
            historyItemElement.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-type">${getItemTypeLabel(item)}</span>
                    <span class="history-item-time">${timestamp}</span>
                </div>
                <div class="history-item-content">${contentPreview}</div>
                <div class="history-item-actions">
                    <button class="reuse-item-btn">Reuse</button>
                    <button class="delete-item-btn">Delete</button>
                </div>
            `;
            
            // Add to container
            historyItemsContainer.appendChild(historyItemElement);
            
            // Set up event listeners
            setupHistoryItemEvents(historyItemElement, item);
        });
        
        // Add a 'View All' button if there are more items
        if (historyItems.length > 5) {
            const viewAllButton = document.createElement('button');
            viewAllButton.className = 'view-all-history-btn';
            viewAllButton.textContent = 'View All History';
            viewAllButton.addEventListener('click', showFullHistoryView);
            
            historyItemsContainer.appendChild(viewAllButton);
        }
    }
    
    /**
     * Get a descriptive label for a history item type
     * @param {Object} item - The history item
     * @returns {string} - A descriptive label
     */
    function getItemTypeLabel(item) {
        if (item.type === 'capture') {
            return 'Captured Text';
        } else if (item.type === 'process') {
            switch (item.action) {
                case 'summarize':
                    return 'Summary';
                case 'qa':
                    return 'Q&A Format';
                case 'insert':
                    return 'Knowledge Node';
                case 'custom':
                    return 'Custom Processing';
                default:
                    return 'Processed Content';
            }
        }
        return 'History Item';
    }
    
    /**
     * Set up event listeners for a history item
     * @param {Element} itemElement - The history item element
     * @param {Object} item - The history item data
     */
    function setupHistoryItemEvents(itemElement, item) {
        // Reuse button
        const reuseBtn = itemElement.querySelector('.reuse-item-btn');
        if (reuseBtn) {
            reuseBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                reuseHistoryItem(item);
            });
        }
        
        // Delete button
        const deleteBtn = itemElement.querySelector('.delete-item-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeHistoryItem(item.id);
            });
        }
        
        // Click on item to show details
        itemElement.addEventListener('click', function() {
            showHistoryItemDetails(item);
        });
    }
    
    /**
     * Reuse a history item
     * @param {Object} item - The history item to reuse
     */
    function reuseHistoryItem(item) {
        if (item.type === 'capture') {
            // Put the captured content back into the captured text display
            const capturedTextElement = document.getElementById('captured-text');
            if (capturedTextElement) {
                capturedTextElement.textContent = item.content;
            }
        } else if (item.type === 'process' && item.result) {
            // Display the processing result again
            WebNotebook.Copilot.AIProcessor.displayProcessingResult(item.result, item);
        }
    }
    
    /**
     * Show details for a history item
     * @param {Object} item - The history item to show details for
     */
    function showHistoryItemDetails(item) {
        // This would show a detailed view of the history item
        // For now, we'll just reuse the item
        reuseHistoryItem(item);
    }
    
    /**
     * Show the full history view
     */
    function showFullHistoryView() {
        // This would show a modal or panel with all history items
        // For now, we'll just log to console
        console.log('Showing full history view', historyItems);
        
        // You could create a modal here with pagination for all history items
        alert('Full history view not implemented yet. Check the console for all history items.');
    }
    
    /**
     * Export history as JSON
     * @returns {string} - JSON string of history data
     */
    function exportHistory() {
        return JSON.stringify(historyItems, null, 2);
    }
    
    /**
     * Import history from JSON
     * @param {string} jsonData - JSON string of history data
     * @returns {boolean} - True if import was successful
     */
    function importHistory(jsonData) {
        try {
            const parsedData = JSON.parse(jsonData);
            
            if (!Array.isArray(parsedData)) {
                throw new Error('Invalid history data format');
            }
            
            // Replace current history
            historyItems = parsedData;
            
            // Save to storage
            saveHistory();
            
            // Update display
            displayHistory();
            
            return true;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }
    
    /**
     * Get all history items
     * @returns {Array} - Copy of the history items array
     */
    function getAllHistoryItems() {
        return [...historyItems];
    }
    
    /**
     * Search history items
     * @param {string} query - Search query
     * @returns {Array} - Matching history items
     */
    function searchHistory(query) {
        if (!query) return [];
        
        const lowerQuery = query.toLowerCase();
        
        return historyItems.filter(item => 
            item.content.toLowerCase().includes(lowerQuery) ||
            (item.result && item.result.processedContent.toLowerCase().includes(lowerQuery))
        );
    }
    
    // Public API
    return {
        initialize,
        addHistoryItem,
        removeHistoryItem,
        clearHistory,
        getAllHistoryItems,
        searchHistory,
        exportHistory,
        importHistory
    };
})();