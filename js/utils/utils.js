/**
 * Utils Module
 * Contains utility functions and namespaces used throughout the application
 */

// Create the Utils namespace if it doesn't exist
WebNotebook.Utils = WebNotebook.Utils || {};

// Storage namespace is directly imported in the existing modules
WebNotebook.Utils.Storage = WebNotebook.Utils.Storage || {};

// Initialize WebNotebook namespace if it doesn't exist
WebNotebook.KnowledgeTree = WebNotebook.KnowledgeTree || {};

/**
 * Initialize the Knowledge Tree
 */
WebNotebook.KnowledgeTree.initialize = function() {
    console.log('Knowledge Tree module initialized');
    
    // Initialize sub-modules
    WebNotebook.KnowledgeTree.NodeTypes.loadCustomNodeTypes();
    WebNotebook.KnowledgeTree.TreeEditor.initialize();
    WebNotebook.KnowledgeTree.Visualizer.initialize();
    WebNotebook.KnowledgeTree.ExportManager.initialize();
    WebNotebook.KnowledgeTree.AIOrganizer.initialize();
};

/**
 * Generate a unique ID
 * @returns {string} A unique identifier
 */
WebNotebook.Utils.generateUniqueId = function() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Format a date as a readable string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
WebNotebook.Utils.formatDate = function(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
WebNotebook.Utils.sanitizeHtml = function(html) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
};

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} Debounced function
 */
WebNotebook.Utils.debounce = function(func, wait) {
    let timeout;
    
    return function() {
        const context = this;
        const args = arguments;
        
        clearTimeout(timeout);
        
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
};

/**
 * Convert HTML to plain text
 * @param {string} html - HTML string to convert
 * @returns {string} Plain text
 */
WebNotebook.Utils.htmlToText = function(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Create a deep copy of an object
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy of the object
 */
WebNotebook.Utils.deepCopy = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if a string contains another string, case insensitive
 * @param {string} str - String to search in
 * @param {string} searchStr - String to search for
 * @returns {boolean} True if string contains the search string
 */
WebNotebook.Utils.containsIgnoreCase = function(str, searchStr) {
    return str.toLowerCase().includes(searchStr.toLowerCase());
};

/**
 * Create a slugified version of a string (for IDs, URLs, etc.)
 * @param {string} str - String to slugify
 * @returns {string} Slugified string
 */
WebNotebook.Utils.slugify = function(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Parse and extract metadata from document content
 * @param {string} content - Document content
 * @returns {Object} Extracted metadata
 */
WebNotebook.Utils.extractMetadata = function(content) {
    const metadata = {};
    
    // Look for metadata in HTML comments <!-- key: value -->
    const metadataRegex = /<!--\s*(\w+):\s*(.+?)\s*-->/g;
    let match;
    
    while ((match = metadataRegex.exec(content)) !== null) {
        metadata[match[1]] = match[2];
    }
    
    return metadata;
};

/**
 * Event emitter for custom application events
 */
WebNotebook.Utils.EventEmitter = {
    events: {},
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on: function(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off: function(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    },
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit: function(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                callback(data);
            });
        }
    }
};