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
        // Override the original tree generation function with our API version
        window.generateTreeInline = apiGenerateTreeInline;
        
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
            // Process documents using the PDF processor module
            const result = await window.pdfProcessor.processDocuments(
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
            window.pdfProcessor.createD3TreeVisualization(vizContainer.querySelector('svg'), result.treeData);
            
            // Add drag handle functionality
            const dragHandle = vizContainer.querySelector('.window-drag-handle');
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', function(e) {
                    handleDragStart(e, vizContainer);
                });
            }
            
            // Add event listeners
            vizContainer.querySelector('.close-btn').addEventListener('click', function() {
                // Remove from active trees map
                activeTreeElements.delete(vizContainer);
                vizContainer.remove();
            });
            
            vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
                toggleFullscreenMode(vizContainer, this);
            });
            
            vizContainer.querySelector('.files-btn').addEventListener('click', function() {
                showTreeFiles(result.treeId);
            });
            
            vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
                toggleMoreOptionsPanel(vizContainer);
            });
            
            // Setup export buttons
            setupExportButtons(vizContainer);
            
            // Setup node details functionality
            setupNodeDetails(vizContainer, result.treeId);
            
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
     * Handle drag start for draggable windows
     * @param {Event} e - Mouse event
     * @param {HTMLElement} element - Element to drag
     */
    function handleDragStart(e, element) {
        // Only handle left mouse button
        if (e.button !== 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Let the script.js handle dragging
        if (window.notebookUI && window.notebookUI.handleDragStart) {
            window.notebookUI.handleDragStart(e, element);
        }
    }
    
    /**
     * Setup node details functionality
     * @param {HTMLElement} vizContainer - Visualization container
     * @param {String} treeId - Tree identifier
     */
    function setupNodeDetails(vizContainer, treeId) {
        // Get tree data for reference
        const treeData = window.pdfProcessor.getStoredTree(treeId);
        
        // Set up click handler on svg
        const svg = vizContainer.querySelector('svg');
        svg._treeId = treeId; // Store tree ID on the svg element
        
        // Ensure the node details panel close button works
        document.querySelector('.close-details-btn')?.addEventListener('click', function() {
            document.getElementById('node-details-panel').style.display = 'none';
            
            // Deselect any selected node
            d3.select(svg).selectAll(".node").classed("selected", false);
        });
    }
    
    /**
     * Toggle fullscreen mode
     * @param {HTMLElement} container - Container element
     * @param {HTMLElement} button - Button element
     */
    function toggleFullscreenMode(container, button) {
        const isAlreadyFullscreen = container.classList.contains('is-fullscreen');
        const treeId = container.dataset.treeId;
        const treeData = treeId ? window.pdfProcessor.getStoredTree(treeId)?.treeData : null;
        
        if (!isAlreadyFullscreen) {
            // Save the current position
            container.dataset.originalParent = container.parentNode.id || '';
            container.dataset.originalNextSibling = container.nextSibling ? container.nextSibling.id || '' : 'none';
            
            // Move to body and make fullscreen
            document.body.appendChild(container);
            container.classList.add('is-fullscreen');
            button.textContent = 'Exit Fullscreen';
            
            // Update the SVG height for better viewing
            const svg = container.querySelector('svg');
            svg.style.height = 'calc(100vh - 80px)';
            
            // Recreate the visualization with more space
            if (treeData) {
                window.pdfProcessor.createD3TreeVisualization(svg, treeData);
            }
        } else {
            // Remove fullscreen
            container.classList.remove('is-fullscreen');
            button.textContent = 'Full Screen';
            
            // Reset SVG height
            const svg = container.querySelector('svg');
            svg.style.height = '400px';
            
            // Return to original position if possible
            const docBody = document.getElementById('document-body');
            if (docBody) {
                docBody.appendChild(container);
            }
            
            // Recreate the visualization for normal size
            if (treeData) {
                window.pdfProcessor.createD3TreeVisualization(svg, treeData);
            }
        }
    }
    
    /**
     * Setup export buttons
     * @param {HTMLElement} container - Container element
     */
    function setupExportButtons(container) {
        container.querySelectorAll('.more-options-panel button').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('export-json-btn')) {
                    handleExportJSON(container);
                } else if (this.classList.contains('export-markdown-btn')) {
                    handleExportMarkdown(container);
                } else if (this.classList.contains('export-svg-btn')) {
                    handleExportSVG(container);
                }
            });
        });
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
        const treeData = window.pdfProcessor.getStoredTree(treeId);
        
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
            alert('No tree data available to export');
            return;
        }
        
        const jsonData = window.pdfProcessor.exportTreeAsJSON(treeId);
        
        if (jsonData) {
            // Create and trigger download
            downloadFile(jsonData, 'knowledge-tree.json', 'application/json');
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
            alert('No tree data available to export');
            return;
        }
        
        const markdownData = window.pdfProcessor.exportTreeAsMarkdown(treeId);
        
        if (markdownData) {
            // Create and trigger download
            downloadFile(markdownData, 'knowledge-tree.md', 'text/markdown');
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
        
        // Clone the SVG for export
        const clonedSvg = svg.cloneNode(true);
        
        // Add inline CSS to ensure styles are included
        const style = document.createElement('style');
        style.textContent = `
        .node circle {
            fill: #557ba1;
            stroke: #233749;
            stroke-width: 1.5px;
        }
        .node text {
            font: 12px sans-serif;
            fill: #333;
        }
        .node.selected circle {
            fill: #233749;
            r: 8;
        }
        .link {
            fill: none;
            stroke: #ccc;
            stroke-width: 1.5px;
        }
        `;
        clonedSvg.insertBefore(style, clonedSvg.firstChild);
        
        // Adjust viewBox to ensure all content is visible
        const bbox = svg.getBBox();
        clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`);
        
        // Export
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        downloadFile(svgData, 'knowledge-tree.svg', 'image/svg+xml');
    }
    
    /**
     * Download file
     * @param {String} content - File content
     * @param {String} fileName - File name
     * @param {String} contentType - Content type
     */
    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
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
            <div class="loading-status">Initializing document analysis...</div>
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
                statusText = 'Generating knowledge tree visualization...';
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
    
    // Expose public API
    window.docAPI = {
        processDocuments: window.pdfProcessor.processDocuments,
        getStoredTree: window.pdfProcessor.getStoredTree,
        exportTreeAsJSON: window.pdfProcessor.exportTreeAsJSON,
        exportTreeAsMarkdown: window.pdfProcessor.exportTreeAsMarkdown
    };
});