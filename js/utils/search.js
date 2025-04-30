/**
 * Search Module
 * Provides search functionality across notes and content
 */

WebNotebook.Utils = WebNotebook.Utils || {};
WebNotebook.Utils.Search = (function() {
    // Private variables
    let searchTimeout = null;
    let lastSearchQuery = '';
    let searchResults = [];
    
    /**
     * Initialize the search module
     */
    function initialize() {
        console.log('Search module initialized');
        
        // Set up search UI elements
        setupSearchUI();
    }
    
    /**
     * Set up search UI and event listeners
     */
    function setupSearchUI() {
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const closeSearchBtn = document.getElementById('close-search-btn');
        
        if (!searchContainer || !searchInput || !searchBtn || !closeSearchBtn) {
            console.error('Search UI elements not found');
            return;
        }
        
        // Toggle search container visibility
        searchBtn.addEventListener('click', function() {
            const isHidden = searchContainer.style.display === 'none';
            
            if (isHidden) {
                showSearchUI();
            } else {
                hideSearchUI();
            }
        });
        
        // Close button
        closeSearchBtn.addEventListener('click', hideSearchUI);
        
        // Search input
        searchInput.addEventListener('input', function() {
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            const query = this.value.trim();
            
            // Set a small delay to avoid searching on every keystroke
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
        
        // Handle Enter key to select first result
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && searchResults.length > 0) {
                selectSearchResult(searchResults[0]);
            } else if (e.key === 'Escape') {
                hideSearchUI();
            }
        });
        
        // Add shortcut key (Ctrl+F or Cmd+F)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                showSearchUI();
            }
        });
    }
    
    /**
     * Show the search UI and focus the input
     */
    function showSearchUI() {
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('search-input');
        
        searchContainer.style.display = 'flex';
        searchInput.focus();
        
        // Clear any existing results and highlights
        clearSearch();
    }
    
    /**
     * Hide the search UI and clear results
     */
    function hideSearchUI() {
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('search-input');
        
        searchContainer.style.display = 'none';
        searchInput.value = '';
        
        // Clear search results
        clearSearch();
    }
    
    /**
     * Perform search across nodes and content
     * @param {string} query - Search query
     */
    function performSearch(query) {
        // If query is empty, clear results
        if (!query) {
            clearSearch();
            return;
        }
        
        // If same as last query, don't search again
        if (query === lastSearchQuery) {
            return;
        }
        
        // Store current query
        lastSearchQuery = query;
        
        // Clear previous results
        clearSearch();
        
        // Convert query to lowercase for case-insensitive search
        const lowerQuery = query.toLowerCase();
        
        // Get all node data
        const nodesData = WebNotebook.Utils.Storage.loadNodesData();
        
        // Search in nodes
        searchResults = [];
        
        // Get all nodes in both views
        const allTreeNodes = document.querySelectorAll('.node-content');
        const allIconNodes = document.querySelectorAll('.grid-item');
        
        // Search in tree view
        allTreeNodes.forEach(node => {
            const nodeId = node.dataset.id;
            if (!nodeId) return;
            
            const nodeName = node.querySelector('.node-name').textContent.toLowerCase();
            const nodeData = nodesData[nodeId];
            
            let matches = [];
            
            // Check node name
            if (nodeName.includes(lowerQuery)) {
                matches.push({ type: 'title', text: nodeName });
                node.classList.add('search-match');
                
                // If in tree view, expand parent nodes
                expandParents(node);
                
                // Add to results
                searchResults.push({
                    nodeId,
                    node,
                    matches,
                    score: 10, // Higher score for title matches
                    type: node.getAttribute('data-type')
                });
            }
            // Check node content
            else if (nodeData && nodeData.content) {
                // Create a temporary div to strip HTML tags
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = nodeData.content;
                const contentText = tempDiv.textContent.toLowerCase();
                
                if (contentText.includes(lowerQuery)) {
                    // Find context for the match
                    const matchIndex = contentText.indexOf(lowerQuery);
                    const startIndex = Math.max(0, matchIndex - 30);
                    const endIndex = Math.min(contentText.length, matchIndex + lowerQuery.length + 30);
                    let context = contentText.substring(startIndex, endIndex);
                    
                    // Add ellipsis if necessary
                    if (startIndex > 0) context = '...' + context;
                    if (endIndex < contentText.length) context += '...';
                    
                    matches.push({ type: 'content', text: context });
                    node.classList.add('search-match');
                    
                    // If in tree view, expand parent nodes
                    expandParents(node);
                    
                    // Add to results
                    searchResults.push({
                        nodeId,
                        node,
                        matches,
                        score: 5, // Lower score for content matches
                        type: node.getAttribute('data-type')
                    });
                }
            }
        });
        
        // Also search and highlight in icon view
        allIconNodes.forEach(node => {
            const nodeId = node.dataset.id;
            
            // If this node is already in search results, highlight it
            const resultFound = searchResults.find(result => result.nodeId === nodeId);
            
            if (resultFound) {
                node.classList.add('search-match');
            }
        });
        
        // Sort results by score (higher first)
        searchResults.sort((a, b) => b.score - a.score);
        
        // Display number of results found
        updateSearchResultsCount(searchResults.length);
        
        return searchResults.length > 0;
    }
    
    /**
     * Clear search results and remove highlights
     */
    function clearSearch() {
        // Clear search results list
        searchResults = [];
        
        // Remove highlight from all nodes
        document.querySelectorAll('.search-match').forEach(node => {
            node.classList.remove('search-match');
        });
        
        // Clear results count
        updateSearchResultsCount(0);
        
        // Clear last query
        lastSearchQuery = '';
    }
    
    /**
     * Update the displayed search results count
     * @param {number} count - Number of results found
     */
    function updateSearchResultsCount(count) {
        // This could update a UI element showing how many results were found
        console.log(`Search found ${count} results`);
        
        // If there was a search-results-count element, we would update it here
    }
    
    /**
     * Expand parent nodes to reveal a search result
     * @param {Element} node - The node to reveal
     */
    function expandParents(node) {
        const treeNode = node.closest('.tree-node');
        if (!treeNode) return;
        
        const parentUl = treeNode.parentElement;
        if (!parentUl || !parentUl.classList.contains('node-children')) return;
        
        // Make parent ul visible
        parentUl.style.display = 'block';
        
        // Update expand/collapse toggle in parent node
        const parentNode = parentUl.previousElementSibling;
        if (parentNode && parentNode.classList.contains('node-content')) {
            const toggle = parentNode.querySelector('.expand-collapse');
            if (toggle) {
                toggle.classList.add('expanded');
                toggle.textContent = '▼';
            }
            
            // Recursively expand parents
            expandParents(parentNode);
        }
    }
    
    /**
     * Select a search result and navigate to it
     * @param {Object} result - Search result object
     */
    function selectSearchResult(result) {
        if (!result || !result.node) return;
        
        // Select the node in the file manager
        WebNotebook.Interface.FileManager.selectNode(result.node);
        
        // If the search result has content matches, highlight them in the document
        if (result.matches.some(m => m.type === 'content')) {
            highlightContentMatches(lastSearchQuery);
        }
        
        // Hide search UI
        hideSearchUI();
    }
    
    /**
     * Highlight matches in the document content
     * @param {string} query - The search query
     */
    function highlightContentMatches(query) {
        if (!query) return;
        
        const documentBody = document.getElementById('document-body');
        if (!documentBody) return;
        
        // We'll need to implement a proper highlighting function that preserves HTML structure
        // For now, this is a simplified approach that works on text nodes
        
        // Create a regular expression for the query (case insensitive)
        const regex = new RegExp(query, 'gi');
        
        // Function to process text nodes
        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (regex.test(text)) {
                    // Create a span with highlighted text
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(regex, match => `<mark class="search-highlight">${match}</mark>`);
                    
                    // Replace the text node with the span
                    node.parentNode.replaceChild(span, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('search-highlight')) {
                // Process child nodes
                Array.from(node.childNodes).forEach(processNode);
            }
        }
        
        // Process the document body
        Array.from(documentBody.childNodes).forEach(processNode);
        
        // Scroll to the first highlight
        const firstHighlight = documentBody.querySelector('.search-highlight');
        if (firstHighlight) {
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Perform a search and return the results
     * @param {string} query - Search query
     * @returns {Array} - Array of search result objects
     */
    function search(query) {
        performSearch(query);
        return searchResults;
    }
    
    // Public API
    return {
        initialize,
        search,
        showSearchUI,
        hideSearchUI,
        clearSearch
    };
})();