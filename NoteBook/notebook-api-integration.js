/**
 * Integration between the notebook UI and the API service
 * This connects the UI interactions to the API functions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Store references to active trees in the document
    const activeTreeElements = new Map(); // Map of DOM elements to tree IDs
    
    // Initialize integration
    initializeAPIIntegration();
    
    /**
     * Initialize the integration between UI and API
     */
    function initializeAPIIntegration() {
        // Store a reference to the original generateTreeInline function
        window.originalGenerateTreeInline = window.generateTreeInline;
        
        // Override with our API version
        window.apiGenerateTreeInline = apiGenerateTreeInline;
        
        // Add PDF.js script if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            loadPdfJs();
        }
        
        // Add event listener for export buttons in the more options menu
        document.addEventListener('click', function(e) {
            // Handle export options
            if (e.target.classList.contains('export-json-btn')) {
                handleExportJSON(e.target.closest('.ai-window'));
            } else if (e.target.classList.contains('export-markdown-btn')) {
                handleExportMarkdown(e.target.closest('.ai-window'));
            } else if (e.target.classList.contains('export-svg-btn')) {
                handleExportSVG(e.target.closest('.ai-window'));
            }
        });
    }
    
    /**
     * Load PDF.js library for PDF processing
     */
    function loadPdfJs() {
        // Load PDF.js script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
        script.onload = function() {
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
            console.log('PDF.js loaded successfully');
        };
        script.onerror = function() {
            console.error('Failed to load PDF.js library');
        };
        document.head.appendChild(script);
    }
    
    /**
     * Generate tree with API integration
     * @param {HTMLElement} summaryWindow - The summary window element
     */
    async function apiGenerateTreeInline(summaryWindow) {
        // Check if files were uploaded
        if (window.uploadedFiles.length === 0) {
            alert('Please upload at least one file to analyze.');
            return;
        }
        
        // Get the selected model
        const modelOptions = summaryWindow.querySelectorAll('.model-option');
        let selectedModel = 'openai'; // Default
        
        modelOptions.forEach(option => {
            if (option.classList.contains('selected')) {
                selectedModel = option.getAttribute('data-model');
            }
        });
        
        // Get custom structure if defined
        const structureTextarea = summaryWindow.querySelector('#structure-textarea');
        const customStructure = structureTextarea ? structureTextarea.value.trim() : '';
        
        // Create a loading indicator
        const loadingIndicator = createLoadingIndicator();
        summaryWindow.querySelector('.window-top-area').appendChild(loadingIndicator);
        
        try {
            // Process documents using the API
            const result = await window.docAPI.processDocuments(
                window.uploadedFiles, 
                selectedModel, 
                customStructure,
                updateProgressIndicator.bind(null, loadingIndicator)
            );
            
            // Create a visualization container to replace the summary window
            const vizContainer = document.createElement('div');
            vizContainer.className = 'ai-window';
            vizContainer.dataset.treeId = result.treeId; // Store the tree ID
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            vizContainer.style.width = docBodyWidth + 'px';
            
            vizContainer.innerHTML = `
                <div class="ai-window-header">
                    <div class="window-drag-handle">
                        <span>Doc Summary Tree (${selectedModel === 'openai' ? 'OpenAI' : 'Gemini'})</span>
                    </div>
                    <div class="window-controls">
                        <button class="files-btn">Files</button>
                        <button class="more-options-btn">More</button>
                        <button class="fullscreen-btn">Full Screen</button>
                        <button class="close-btn">Close</button>
                    </div>
                </div>
                <div class="ai-window-body">
                    <div class="visualization-container">
                        <svg width="100%" height="400" class="tree-svg"></svg>
                    </div>
                    <div class="more-options-panel" style="display: none;">
                        <button class="export-json-btn">Export as JSON</button>
                        <button class="export-markdown-btn">Export as Markdown</button>
                        <button class="export-svg-btn">Export as SVG</button>
                    </div>
                </div>
            `;
            
            // Replace the summary window with the visualization
            summaryWindow.parentNode.replaceChild(vizContainer, summaryWindow);
            
            // Store the active tree reference
            activeTreeElements.set(vizContainer, result.treeId);
            
            // Create D3 visualization
            window.notebookUI.createD3TreeInline(vizContainer.querySelector('svg'), result.treeData);
            
            // Add drag handle functionality
            const dragHandle = vizContainer.querySelector('.window-drag-handle');
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', function(e) {
                    window.notebookUI.handleDragStart(e, vizContainer);
                });
            }
            
            // Add event listeners
            vizContainer.querySelector('.close-btn').addEventListener('click', function() {
                // Remove from active trees map
                activeTreeElements.delete(vizContainer);
                vizContainer.remove();
            });
            
            vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
                window.notebookUI.toggleFullscreenInline(vizContainer, this);
            });
            
            vizContainer.querySelector('.files-btn').addEventListener('click', function() {
                showTreeFiles(result.treeId);
            });
            
            vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
                toggleMoreOptionsPanel(vizContainer);
            });
            
            // Export buttons
            vizContainer.querySelectorAll('.more-options-panel button').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.classList.contains('export-json-btn')) {
                        handleExportJSON(vizContainer);
                    } else if (this.classList.contains('export-markdown-btn')) {
                        handleExportMarkdown(vizContainer);
                    } else if (this.classList.contains('export-svg-btn')) {
                        handleExportSVG(vizContainer);
                    }
                });
            });
            
            // Enhanced node details
            setupEnhancedNodeDetails(vizContainer, result.treeId);
            
        } catch (error) {
            // Check for specific error types
            if (error.message.includes('PDF') || error.toString().includes('PDF')) {
                alert('Error processing PDF: ' + error.message + '\n\nMake sure the PDF is not password protected and is a valid document.');
            } else {
                alert('Error generating knowledge tree: ' + error.message);
            }
            
            console.error('Error generating knowledge tree:', error);
            
            // Remove loading indicator
            loadingIndicator.remove();
        }
    }
    
    /**
     * Setup enhanced node details
     * @param {HTMLElement} vizContainer - Visualization container
     * @param {String} treeId - Tree identifier
     */
    function setupEnhancedNodeDetails(vizContainer, treeId) {
        // Override the node click handler
        const svg = vizContainer.querySelector('svg');
        
        // Add a custom event listener for node clicks
        svg.addEventListener('click', function(event) {
            const nodeElement = event.target.closest('.node');
            if (!nodeElement) return;
            
            // Get the node data from D3
            const nodeData = d3.select(nodeElement).datum();
            
            // Show enhanced node details
            enhanceNodeDetailsDisplay(nodeData, event, treeId);
        });
    }
    
    /**
     * Show enhanced node details with file-specific content
     * @param {Object} node - D3 hierarchy node
     * @param {Event} event - Click event 
     * @param {String} treeId - Tree identifier
     */
    function enhanceNodeDetailsDisplay(node, event, treeId) {
        // First show the basic details
        window.notebookUI.showNodeDetails(node, event);
        
        // Then enhance with source content if available
        if (!treeId) return;
        
        const treeData = window.docAPI.getStoredTree(treeId);
        if (!treeData || !treeData.fileContents) return;
        
        // Get node lineage to find context
        const nodePath = getNodePath(node);
        
        // Look for matching content in file sections
        let matchingSection = null;
        let sectionFile = null;
        
        // Look for section match in file contents
        treeData.fileContents.files.forEach(file => {
            if (!file.sections) return;
            
            file.sections.forEach(section => {
                if (section.title === node.data.name) {
                    matchingSection = section;
                    sectionFile = file;
                }
            });
        });
        
        // If no direct match, try fuzzy matching with parent context
        if (!matchingSection && nodePath.length > 1) {
            const parentName = nodePath[nodePath.length - 2];
            
            treeData.fileContents.files.forEach(file => {
                if (!file.sections) return;
                
                file.sections.forEach(section => {
                    // Check if section title contains node name or vice versa
                    if ((section.title.includes(node.data.name) || node.data.name.includes(section.title)) && 
                        nodePath.some(name => section.content.includes(name))) {
                        matchingSection = section;
                        sectionFile = file;
                    }
                });
            });
        }
        
        // Update source panel if matching section found
        if (matchingSection) {
            const nodeSource = document.getElementById('node-source');
            nodeSource.innerHTML = `
                <h4>From ${sectionFile.name} ${matchingSection.page ? `(Page ${matchingSection.page})` : ''}</h4>
                <h5>${matchingSection.title}</h5>
                <div class="section-content">${formatContentForDisplay(matchingSection.content)}</div>
            `;
        } else {
            // Try to find any content that might be related to this node
            const nodeName = node.data.name.toLowerCase();
            const nodeDesc = (node.data.description || '').toLowerCase();
            
            let bestMatch = { file: null, content: null, score: 0 };
            
            // Look through all files for related content
            treeData.fileContents.files.forEach(file => {
                const fileText = file.text.toLowerCase();
                
                // Simple relevance score based on term frequency
                const nameCount = countOccurrences(fileText, nodeName);
                let descTerms = nodeDesc.split(/\s+/).filter(term => term.length > 3);
                let descCount = 0;
                
                descTerms.forEach(term => {
                    descCount += countOccurrences(fileText, term);
                });
                
                const score = nameCount * 2 + descCount;
                
                if (score > bestMatch.score) {
                    // Found better match, extract a relevant excerpt
                    const excerpt = extractRelevantExcerpt(file.text, nodeName, descTerms);
                    
                    if (excerpt) {
                        bestMatch = {
                            file: file,
                            content: excerpt,
                            score: score
                        };
                    }
                }
            });
            
            // Update source panel with best match if found
            if (bestMatch.score > 0) {
                const nodeSource = document.getElementById('node-source');
                nodeSource.innerHTML = `
                    <h4>Related content from ${bestMatch.file.name}</h4>
                    <div class="section-content">${formatContentForDisplay(bestMatch.content)}</div>
                    <p class="note">(This is the most relevant content found for this node)</p>
                `;
            }
        }
        
        // Update related concepts tab
        updateRelatedConcepts(node, treeData.fileContents);
    }
    
    /**
     * Count occurrences of a term in text
     * @param {String} text - Text to search in
     * @param {String} term - Term to search for
     * @returns {Number} - Number of occurrences
     */
    function countOccurrences(text, term) {
        let count = 0;
        let pos = text.indexOf(term);
        
        while (pos !== -1) {
            count++;
            pos = text.indexOf(term, pos + 1);
        }
        
        return count;
    }
    
    /**
     * Extract a relevant excerpt from text
     * @param {String} text - Full text
     * @param {String} mainTerm - Main term to find
     * @param {Array} secondaryTerms - Secondary terms
     * @returns {String} - Relevant excerpt
     */
    function extractRelevantExcerpt(text, mainTerm, secondaryTerms) {
        // Find position of main term
        const pos = text.toLowerCase().indexOf(mainTerm);
        if (pos === -1) {
            // If main term not found, try secondary terms
            for (const term of secondaryTerms) {
                const termPos = text.toLowerCase().indexOf(term);
                if (termPos !== -1) {
                    // Extract a window around this term
                    const start = Math.max(0, termPos - 100);
                    const end = Math.min(text.length, termPos + term.length + 200);
                    return text.substring(start, end) + '...';
                }
            }
            return null;
        }
        
        // Extract a window around the main term
        const start = Math.max(0, pos - 100);
        const end = Math.min(text.length, pos + mainTerm.length + 300);
        return text.substring(start, end) + '...';
    }
    
    /**
     * Get array of node names from root to current node
     * @param {Object} node - D3 hierarchy node
     * @returns {Array} - Array of node names
     */
    function getNodePath(node) {
        const path = [];
        let current = node;
        
        while (current) {
            path.unshift(current.data.name);
            current = current.parent;
        }
        
        return path;
    }
    
    /**
     * Format content for display with paragraph breaks
     * @param {String} content - Raw content text
     * @returns {String} - Formatted HTML
     */
    function formatContentForDisplay(content) {
        if (!content) return '';
        
        // Clean up content
        let cleanContent = content.replace(/\[Page Break\]/g, '<hr class="page-break">');
        
        // Convert newlines to paragraphs
        const paragraphs = cleanContent.split(/\n\n+/);
        
        return paragraphs
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('');
    }
    
    /**
     * Update related concepts tab with relevant terms
     * @param {Object} node - D3 hierarchy node
     * @param {Object} fileContents - Extracted file contents
     */
    function updateRelatedConcepts(node, fileContents) {
        const relatedConceptsList = document.getElementById('related-concepts');
        if (!relatedConceptsList) return;
        
        // Extract keywords from node and its description
        const nodeKeywords = extractKeywords(node.data.name + ' ' + (node.data.description || ''));
        
        // Find related sections
        const relatedSections = [];
        
        // Look for sibling nodes first
        if (node.parent && node.parent.children) {
            node.parent.children.forEach(sibling => {
                if (sibling !== node) {
                    relatedSections.push({
                        title: sibling.data.name,
                        relevance: 10, // High relevance for siblings
                        isSibling: true,
                        node: sibling
                    });
                }
            });
        }
        
        // Look for related content in document sections
        fileContents.files.forEach(file => {
            if (!file.sections) return;
            
            file.sections.forEach(section => {
                // Skip if this is the current section
                if (section.title === node.data.name) return;
                
                // Extract keywords from this section
                const sectionKeywords = extractKeywords(section.title + ' ' + section.content);
                
                // Calculate overlap
                let overlap = 0;
                nodeKeywords.forEach(word => {
                    if (sectionKeywords.has(word)) overlap++;
                });
                
                if (overlap > 0) {
                    relatedSections.push({
                        title: section.title,
                        file: file.name,
                        page: section.page,
                        relevance: overlap,
                        section: section
                    });
                }
            });
        });
        
        // Sort by relevance
        relatedSections.sort((a, b) => b.relevance - a.relevance);
        
        // Update the related concepts list
        relatedConceptsList.innerHTML = '';
        
        if (relatedSections.length === 0) {
            relatedConceptsList.innerHTML = '<li>No related concepts found</li>';
            return;
        }
        
        // Add top related sections (up to 5)
        relatedSections.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            
            if (item.isSibling) {
                li.innerHTML = `<a href="#" class="related-concept sibling-concept" 
                    data-node-id="${item.node.id || ''}">
                    ${item.title} <span class="relevance">(Related Topic)</span></a>`;
            } else {
                li.innerHTML = `<a href="#" class="related-concept" 
                    data-file="${item.file}" 
                    data-page="${item.page || ''}"
                    data-title="${item.title}">
                    ${item.title} <span class="relevance">(${item.file}${item.page ? `, Page ${item.page}` : ''})</span></a>`;
            }
            
            relatedConceptsList.appendChild(li);
        });
        
        // Add click handlers
        relatedConceptsList.querySelectorAll('.related-concept').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Handle sibling concept clicks
                if (this.classList.contains('sibling-concept')) {
                    const siblingNodeId = this.getAttribute('data-node-id');
                    
                    // Find the D3 nodes with the sibling id
                    const svg = document.querySelector('.tree-svg');
                    if (!svg) return;
                    
                    const allNodes = d3.select(svg).selectAll('.node');
                    allNodes.each(function(d) {
                        if (d.data.name === this.textContent.trim().split('(')[0].trim()) {
                            // Simulate a click on this node
                            d3.select(this).dispatch('click');
                        }
                    }.bind(this));
                    
                    return;
                }
                
                // Handle section concept clicks
                const title = this.getAttribute('data-title');
                const file = this.getAttribute('data-file');
                const page = this.getAttribute('data-page');
                
                // Find node with matching title if possible
                const svg = document.querySelector('.tree-svg');
                if (!svg) return;
                
                const allNodes = d3.select(svg).selectAll('.node');
                let found = false;
                
                // Try to find and highlight the matching node
                allNodes.each(function(d) {
                    if (d.data.name === title) {
                        // Simulate a click on this node
                        d3.select(this).dispatch('click');
                        found = true;
                    }
                });
                
                // If not found, display the content directly
                if (!found) {
                    // Get tree ID from the container
                    const treeId = document.querySelector('.ai-window').dataset.treeId;
                    if (!treeId) return;
                    
                    const treeData = window.docAPI.getStoredTree(treeId);
                    if (!treeData || !treeData.fileContents) return;
                    
                    // Find section with matching title
                    let matchingSection = null;
                    let sectionFile = null;
                    
                    treeData.fileContents.files.forEach(file => {
                        if (!file.sections) return;
                        
                        file.sections.forEach(section => {
                            if (section.title === title) {
                                matchingSection = section;
                                sectionFile = file;
                            }
                        });
                    });
                    
                    if (matchingSection) {
                        // Show in a modal or update the node details panel
                        const nodeSource = document.getElementById('node-source');
                        nodeSource.innerHTML = `
                            <h4>From ${sectionFile.name} ${matchingSection.page ? `(Page ${matchingSection.page})` : ''}</h4>
                            <h5>${matchingSection.title}</h5>
                            <div class="section-content">${formatContentForDisplay(matchingSection.content)}</div>
                        `;
                        
                        // Switch to source tab
                        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                        document.querySelector('.tab-btn[data-tab="source"]').classList.add('active');
                        document.getElementById('source-tab').classList.add('active');
                    }
                }
            });
        });
    }
    
    /**
     * Extract keywords from text
     * @param {String} text - Input text
     * @returns {Set} - Set of keywords
     */
    function extractKeywords(text) {
        if (!text) return new Set();
        
        // Remove punctuation and convert to lowercase
        const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
        
        // Split into words
        const words = cleanText.split(/\s+/);
        
        // Remove common stop words
        const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'is', 'are', 'was', 'were', 'of', 'from']);
        
        const keywords = new Set();
        
        words.forEach(word => {
            if (word.length > 3 && !stopWords.has(word)) {
                keywords.add(word);
            }
        });
        
        return keywords;
    }
    
    /**
     * Create a loading indicator with progress bar
     * @returns {HTMLElement} - Loading indicator element
     */
    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-status">Initializing...</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        `;
        
        return loadingDiv;
    }
    
    /**
     * Update progress indicator
     * @param {HTMLElement} indicator - Loading indicator element
     * @param {Object} progress - Progress information
     */
    function updateProgressIndicator(indicator, progress) {
        if (!indicator) return;
        
        const statusElement = indicator.querySelector('.loading-status');
        const progressBar = indicator.querySelector('.progress-bar');
        
        if (!statusElement || !progressBar) return;
        
        // Update progress bar width
        progressBar.style.width = `${progress.progress}%`;
        
        // Update status text
        let statusText = 'Processing...';
        
        switch (progress.status) {
            case 'extracting':
                statusText = progress.file 
                    ? `Extracting text from ${progress.file}...` 
                    : 'Extracting text from files...';
                break;
            case 'analyzing':
                statusText = `Analyzing with ${progress.model || 'AI'}...`;
                break;
            case 'processing':
                statusText = 'Processing document structure...';
                break;
            case 'finalizing':
                statusText = 'Finalizing knowledge tree...';
                break;
            case 'complete':
                statusText = 'Knowledge tree generation complete!';
                break;
            case 'error':
                statusText = `Error: ${progress.message}`;
                indicator.classList.add('error');
                break;
        }
        
        statusElement.textContent = statusText;
    }
    
    /**
     * Toggle more options panel
     * @param {HTMLElement} container - Tree container element
     */
    function toggleMoreOptionsPanel(container) {
        const optionsPanel = container.querySelector('.more-options-panel');
        if (optionsPanel) {
            optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    /**
     * Show files used for a tree
     * @param {String} treeId - Tree identifier
     */
    function showTreeFiles(treeId) {
        const treeData = window.docAPI.getStoredTree(treeId);
        
        if (treeData) {
            const filesList = treeData.files.join(', ');
            alert(`Files used: ${filesList}`);
        } else {
            alert('Tree data not found');
        }
    }
    
    /**
     * Handle exporting tree as JSON
     * @param {HTMLElement} container - Tree container element
     */
    function handleExportJSON(container) {
        if (!container) return;
        
        const treeId = container.dataset.treeId;
        
        if (!treeId) {
            // Fall back to using the in-memory tree data
            if (window.treeData) {
                window.notebookUI.exportAsJSON(window.treeData);
            } else {
                alert('No tree data available to export');
            }
            return;
        }
        
        const jsonData = window.docAPI.exportTreeAsJSON(treeId);
        
        if (jsonData) {
            // Create and trigger download
            window.notebookUI.downloadFile(jsonData, 'knowledge-tree.json', 'application/json');
        } else {
            alert('Failed to export tree as JSON');
        }
    }
    
    /**
     * Handle exporting tree as Markdown
     * @param {HTMLElement} container - Tree container element
     */
    function handleExportMarkdown(container) {
        if (!container) return;
        
        const treeId = container.dataset.treeId;
        
        if (!treeId) {
            // Fall back to using the in-memory tree data
            if (window.treeData) {
                window.notebookUI.exportAsMarkdown(window.treeData);
            } else {
                alert('No tree data available to export');
            }
            return;
        }
        
        const markdownData = window.docAPI.exportTreeAsMarkdown(treeId);
        
        if (markdownData) {
            // Create and trigger download
            window.notebookUI.downloadFile(markdownData, 'knowledge-tree.md', 'text/markdown');
        } else {
            alert('Failed to export tree as Markdown');
        }
    }
    
    /**
     * Handle exporting tree as SVG
     * @param {HTMLElement} container - Tree container element
     */
    function handleExportSVG(container) {
        if (!container) return;
        
        const svg = container.querySelector('svg');
        
        if (!svg) {
            alert('SVG element not found');
            return;
        }
        
        window.notebookUI.exportAsSVG(svg);
    }
    
    // Expose the API generate function for the UI to use
    window.apiGenerateTreeInline = apiGenerateTreeInline;
});