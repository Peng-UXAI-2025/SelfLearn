/**
 * Storage Module
 * Handles storing and retrieving data using localStorage or IndexedDB
 */

// Add to WebNotebook namespace
WebNotebook.Utils = WebNotebook.Utils || {};
WebNotebook.Utils.Storage = (function() {
    // Constants
    const STORAGE_KEYS = {
        NODES: 'webnotebook_nodes',
        SETTINGS: 'webnotebook_settings',
        NODE_EXPANSION: 'webnotebook_node_expansion',
        VIEW_MODE: 'webnotebook_view_mode',
        COPILOT_HISTORY: 'webnotebook_copilot_history'
    };
    
    // Cache for node data to reduce localStorage reads
    let nodeDataCache = null;
    
    /**
     * Initialize the storage module
     */
    function initialize() {
        console.log('Storage module initialized');
        
        // Check if local storage is available
        if (!isLocalStorageAvailable()) {
            console.error('LocalStorage is not available!');
            alert('Your browser does not support local storage. Data saving will not work.');
        }
        
        // Load node data into cache
        loadNodesData();
    }
    
    /**
     * Check if localStorage is available
     * @returns {boolean} - True if localStorage is available
     */
    function isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Save node data to localStorage
     * @param {Object} data - Node data to save
     */
    function saveNodesData(data) {
        if (data) {
            nodeDataCache = data;
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodeDataCache || {}));
        } catch (e) {
            console.error('Error saving node data to localStorage:', e);
            alert('Failed to save your data. Your browser storage might be full.');
        }
    }
    
    /**
     * Load node data from localStorage
     * @returns {Object} - Node data
     */
    function loadNodesData() {
        if (nodeDataCache) return nodeDataCache;
        
        try {
            const data = localStorage.getItem(STORAGE_KEYS.NODES);
            nodeDataCache = data ? JSON.parse(data) : {};
            return nodeDataCache;
        } catch (e) {
            console.error('Error loading node data from localStorage:', e);
            nodeDataCache = {};
            return {};
        }
    }
    
    /**
     * Get a single node by ID
     * @param {string} nodeId - Node ID
     * @returns {Object|null} - Node data or null if not found
     */
    function getNodeById(nodeId) {
        const nodes = loadNodesData();
        return nodes[nodeId] || null;
    }
    
    /**
     * Save a single node
     * @param {string} nodeId - Node ID
     * @param {Object} nodeData - Node data
     */
    function saveNode(nodeId, nodeData) {
        const nodes = loadNodesData();
        nodes[nodeId] = nodeData;
        saveNodesData(nodes);
    }
    
    /**
     * Delete a node
     * @param {string} nodeId - Node ID
     */
    function deleteNode(nodeId) {
        const nodes = loadNodesData();
        if (nodes[nodeId]) {
            delete nodes[nodeId];
            saveNodesData(nodes);
        }
    }
    
    /**
     * Save application settings
     * @param {Object} settings - Application settings
     */
    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings to localStorage:', e);
        }
    }
    
    /**
     * Load application settings
     * @returns {Object} - Application settings
     */
    function loadSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading settings from localStorage:', e);
            return {};
        }
    }
    
    /**
     * Save node expansion state
     * @param {Object} expansionState - Map of node IDs to expansion state (true/false)
     */
    function saveNodeExpansionState(expansionState) {
        try {
            localStorage.setItem(STORAGE_KEYS.NODE_EXPANSION, JSON.stringify(expansionState));
        } catch (e) {
            console.error('Error saving node expansion state:', e);
        }
    }
    
    /**
     * Load node expansion state
     * @returns {Object} - Map of node IDs to expansion state
     */
    function loadNodeExpansionState() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.NODE_EXPANSION);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading node expansion state:', e);
            return {};
        }
    }
    
    /**
     * Save preferred view mode
     * @param {string} viewMode - 'tree' or 'icon'
     */
    function saveViewMode(viewMode) {
        try {
            localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
        } catch (e) {
            console.error('Error saving view mode:', e);
        }
    }
    
    /**
     * Load preferred view mode
     * @returns {string} - 'tree' or 'icon'
     */
    function loadViewMode() {
        try {
            return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'tree';
        } catch (e) {
            console.error('Error loading view mode:', e);
            return 'tree';
        }
    }
    
    /**
     * Save copilot history
     * @param {Array} history - Copilot history entries
     */
    function saveCopilotHistory(history) {
        try {
            // Only keep the most recent 100 items to prevent storage limits
            const historyToSave = history.slice(-100);
            localStorage.setItem(STORAGE_KEYS.COPILOT_HISTORY, JSON.stringify(historyToSave));
        } catch (e) {
            console.error('Error saving copilot history:', e);
        }
    }
    
    /**
     * Load copilot history
     * @returns {Array} - Copilot history entries
     */
    function loadCopilotHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.COPILOT_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading copilot history:', e);
            return [];
        }
    }
    
    /**
     * Export all data as JSON
     * @returns {string} - JSON string with all data
     */
    function exportAllData() {
        const exportData = {
            nodes: loadNodesData(),
            settings: loadSettings(),
            nodeExpansion: loadNodeExpansionState(),
            viewMode: loadViewMode(),
            copilotHistory: loadCopilotHistory(),
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string with data to import
     * @returns {boolean} - True if import was successful
     */
    function importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.nodes || typeof data.nodes !== 'object') {
                throw new Error('Invalid data format: missing nodes object');
            }
            
            // Import the data
            if (data.nodes) saveNodesData(data.nodes);
            if (data.settings) saveSettings(data.settings);
            if (data.nodeExpansion) saveNodeExpansionState(data.nodeExpansion);
            if (data.viewMode) saveViewMode(data.viewMode);
            if (data.copilotHistory) saveCopilotHistory(data.copilotHistory);
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
    
    /**
     * Clear all application data
     */
    function clearAllData() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            nodeDataCache = {};
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    }
    
    // Public API
    return {
        initialize,
        saveNodesData,
        loadNodesData,
        getNodeById,
        saveNode,
        deleteNode,
        saveSettings,
        loadSettings,
        saveNodeExpansionState,
        loadNodeExpansionState,
        saveViewMode,
        loadViewMode,
        saveCopilotHistory,
        loadCopilotHistory,
        exportAllData,
        importData,
        clearAllData
    };
})();