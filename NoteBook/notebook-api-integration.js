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
        // Override the original generateTreeInline function to use API
        window.originalGenerateTreeInline = window.generateTreeInline;
        window.generateTreeInline = apiGenerateTreeInline;
        
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
            
        } catch (error) {
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Show error message
            alert('Error generating knowledge tree: ' + error.message);
            console.error('Error generating knowledge tree:', error);
        }
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
        const statusElement = indicator.querySelector('.loading-status');
        const progressBar = indicator.querySelector('.progress-bar');
        
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
                statusText = `Analyzing with ${progress.model}...`;
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
        optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
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
        const treeId = container.dataset.treeId;
        
        if (!treeId) {
            alert('Tree ID not found');
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
        const treeId = container.dataset.treeId;
        
        if (!treeId) {
            alert('Tree ID not found');
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
        const svg = container.querySelector('svg');
        
        if (!svg) {
            alert('SVG element not found');
            return;
        }
        
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svg.cloneNode(true);
        
        // Add inline CSS
        const style = document.createElement('style');
        style.textContent = `
            .node circle {
                fill: #557ba1;
                stroke: #233749;
                stroke-width: 1.5px;
            }
            .node text {
                font: 12px sans-serif;
            }
            .link {
                fill: none;
                stroke: #ccc;
                stroke-width: 1.5px;
            }
        `;
        
        clonedSvg.insertBefore(style, clonedSvg.firstChild);
        
        // Serialize to SVG string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        // Download
        window.notebookUI.downloadFile(svgString, 'knowledge-tree.svg', 'image/svg+xml');
    }
});