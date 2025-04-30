/**
 * Storage Module for WebNotebook
 * Handles local storage operations for saving and retrieving data
 */

(function() {
    // Create storage namespace
    window.storage = {};
    
    // Storage prefix to avoid name collisions
    const PREFIX = 'webNotebook_';
    
    /**
     * Set item in local storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON stringified if object)
     */
    window.storage.setItem = function(key, value) {
        try {
            const storageKey = PREFIX + key;
            const storageValue = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(storageKey, storageValue);
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    };
    
    /**
     * Get item from local storage
     * @param {string} key - Storage key
     * @returns {any} - Retrieved value (parsed from JSON if possible)
     */
    window.storage.getItem = function(key) {
        try {
            const storageKey = PREFIX + key;
            const value = localStorage.getItem(storageKey);
            
            if (value === null) {
                return null;
            }
            
            // Try to parse as JSON if possible
            try {
                return JSON.parse(value);
            } catch (e) {
                // If value starts with "object", it might be a corrupted JSON
                if (typeof value === 'string' && value.trim().startsWith('object')) {
                    console.warn('Corrupted JSON data found for key:', key);
                    return null;
                }
                // Not valid JSON, return as is
                return value;
            }
        } catch (error) {
            console.error('Error retrieving from local storage:', error);
            return null;
        }
    };
    
    /**
     * Remove item from local storage
     * @param {string} key - Storage key
     */
    window.storage.removeItem = function(key) {
        try {
            const storageKey = PREFIX + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Error removing from local storage:', error);
            return false;
        }
    };
    
    /**
     * Clear all application data from local storage
     */
    window.storage.clearAll = function() {
        try {
            // Only clear items with our prefix
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing local storage:', error);
            return false;
        }
    };
    
    /**
     * Get all application data from local storage
     * @returns {Object} - Object containing all stored data
     */
    window.storage.getAllData = function() {
        try {
            const data = {};
            
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(PREFIX)) {
                    const actualKey = key.substring(PREFIX.length);
                    data[actualKey] = window.storage.getItem(actualKey);
                }
            });
            
            return data;
        } catch (error) {
            console.error('Error getting all data from local storage:', error);
            return {};
        }
    };
    
    /**
     * Save document content to local storage
     * @param {string} title - Document title
     * @param {string} content - Document HTML content
     */
    window.storage.saveDocument = function(title, content) {
        const documentData = {
            title: title,
            content: content,
            lastModified: new Date().toISOString()
        };
        
        return window.storage.setItem('webNotebookDocument', documentData);
    };
    
    /**
     * Set up auto-save functionality
     */
    window.storage.setupAutoSave = function() {
        // Auto-save document every 30 seconds
        setInterval(() => {
            const title = document.getElementById('document-title').textContent;
            const content = document.getElementById('document-body').innerHTML;
            window.storage.saveDocument(title, content);
        }, 30000);
        
        // Also save when leaving the page
        window.addEventListener('beforeunload', function() {
            const title = document.getElementById('document-title').textContent;
            const content = document.getElementById('document-body').innerHTML;
            window.storage.saveDocument(title, content);
        });
    };
    
    /**
     * Save knowledge tree data
     * @param {string} id - Tree ID
     * @param {Object} treeData - Tree data object
     */
    window.storage.saveKnowledgeTree = function(id, treeData) {
        const trees = window.storage.getItem('knowledgeTrees') || {};
        trees[id] = {
            data: treeData,
            lastModified: new Date().toISOString()
        };
        
        return window.storage.setItem('knowledgeTrees', trees);
    };
    
    /**
     * Get saved knowledge tree
     * @param {string} id - Tree ID
     * @returns {Object|null} - Tree data or null if not found
     */
    window.storage.getKnowledgeTree = function(id) {
        const trees = window.storage.getItem('knowledgeTrees') || {};
        return trees[id] ? trees[id].data : null;
    };
    
    /**
     * Get all saved knowledge trees
     * @returns {Object} - Object with all saved trees
     */
    window.storage.getAllKnowledgeTrees = function() {
        return window.storage.getItem('knowledgeTrees') || {};
    };
    
    /**
     * Delete knowledge tree
     * @param {string} id - Tree ID
     */
    window.storage.deleteKnowledgeTree = function(id) {
        const trees = window.storage.getItem('knowledgeTrees') || {};
        if (trees[id]) {
            delete trees[id];
            return window.storage.setItem('knowledgeTrees', trees);
        }
        return true;
    };
    
    /**
     * Save clipboard history item
     * @param {string} text - Clipboard text
     * @param {string} processed - Processed text (if any)
     */
    window.storage.saveClipboardItem = function(text, processed = null) {
        const history = window.storage.getItem('clipboardHistory') || [];
        
        history.unshift({
            original: text,
            processed: processed,
            timestamp: new Date().toISOString()
        });
        
        // Limit history to 50 items
        if (history.length > 50) {
            history.pop();
        }
        
        return window.storage.setItem('clipboardHistory', history);
    };
    
    /**
     * Get clipboard history
     * @returns {Array} - Array of clipboard history items
     */
    window.storage.getClipboardHistory = function() {
        return window.storage.getItem('clipboardHistory') || [];
    };
    
    /**
     * Clear clipboard history
     */
    window.storage.clearClipboardHistory = function() {
        return window.storage.setItem('clipboardHistory', []);
    };
    
    /**
     * Save road map data
     * @param {Array} roadMapItems - Road map items array
     */
    window.storage.saveRoadMap = function(roadMapItems) {
        return window.storage.setItem('webNotebookRoadMap', roadMapItems);
    };
    
    /**
     * Get road map data
     * @returns {Array} - Road map items array
     */
    window.storage.getRoadMap = function() {
        return window.storage.getItem('webNotebookRoadMap') || [];
    };
    
    /**
     * Save study spaces to storage
     * @param {Object} spaces - Study spaces object
     */
    window.storage.setStudySpaces = function(spaces) {
        return window.storage.setItem('studySpaces', spaces);
    };
    
    /**
     * Get study spaces from storage
     * @returns {Object} - Study spaces object or empty object if none
     */
    window.storage.getStudySpaces = function() {
        return window.storage.getItem('studySpaces') || {};
    };
    
    /**
     * Delete study space from storage
     * @param {string} spaceId - Space ID to delete
     */
    window.storage.deleteStudySpace = function(spaceId) {
        const spaces = window.storage.getStudySpaces();
        if (spaces && spaces[spaceId]) {
            delete spaces[spaceId];
            return window.storage.setStudySpaces(spaces);
        }
        return true;
    };
    
    /**
     * Get knowledge item from storage
     * @param {string} spaceId - Space ID
     * @param {string} itemId - Item ID
     * @returns {Object|null} - Knowledge item or null if not found
     */
    window.storage.getKnowledgeItem = function(spaceId, itemId) {
        const spaces = window.storage.getStudySpaces();
        if (spaces && spaces[spaceId] && spaces[spaceId].items) {
            return spaces[spaceId].items.find(item => item.id === itemId) || null;
        }
        return null;
    };
    
    /**
     * Get all knowledge items from a space
     * @param {string} spaceId - Space ID
     * @returns {Array} - Array of knowledge items or empty array if none
     */
    window.storage.getKnowledgeItems = function(spaceId) {
        const spaces = window.storage.getStudySpaces();
        if (spaces && spaces[spaceId] && spaces[spaceId].items) {
            return spaces[spaceId].items;
        }
        return [];
    };
    
    /**
     * Save user preferences
     * @param {Object} preferences - User preferences object
     */
    window.storage.savePreferences = function(preferences) {
        return window.storage.setItem('userPreferences', preferences);
    };
    
    /**
     * Get user preferences
     * @returns {Object} - User preferences object
     */
    window.storage.getPreferences = function() {
        return window.storage.getItem('userPreferences') || {
            sidebarVisible: false,
            clipboardEnabled: false,
            theme: 'light'
        };
    };
    
    // Initialize auto-save on page load
    document.addEventListener('DOMContentLoaded', function() {
        window.storage.setupAutoSave();
    });
})();