/**
 * PDF Processor Module
 * Handles processing PDFs into knowledge trees
 */

(function() {
    // Create PDF processor namespace
    window.pdfProcessor = {};
    
    // Store processed document data
    const processedDocuments = new Map();
    
    /**
     * Handle file uploads
     * @param {Array} files - Array of files
     * @param {HTMLElement} windowElement - Window element
     */
    window.pdfProcessor.handleFiles = function(files, windowElement) {
        // Get uploaded files reference
        const uploadedFiles = window.webNotebook.app.uploadedFiles;
        
        for (let file of files) {
            // Check file type
            if (file.type === 'application/pdf' || 
                file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'text/plain' ||
                file.type === 'text/markdown') {
                
                // Check if file already exists in the array
                const fileExists = uploadedFiles.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (!fileExists) {
                    // Add to uploaded files array
                    uploadedFiles.push(file);
                    
                    // Display in UI
                    displayUploadedFile(file, windowElement);
                }
            } else {
                window.knowledgeApi.showStatusMessage('Please upload PDF, Word, or text documents only.', true, windowElement);
            }
        }
        
        // Update files list in manage files dropdown
        updateFilesDropdown(windowElement);
        
        // Enable generate button if files were uploaded
        if (uploadedFiles.length > 0) {
            const generateBtn = windowElement.querySelector('#generate-tree-btn');
            if (generateBtn) {
                generateBtn.classList.remove('disabled');
            }
        }
    };
    
    /**
     * Display uploaded file in the list
     * @param {File} file - Uploaded file
     * @param {HTMLElement} windowElement - Window element
     */
    function displayUploadedFile(file, windowElement) {
        const filesList = windowElement.querySelector('#uploaded-files-list');
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Create file type icon
        let fileTypeIcon = '';
        if (file.type === 'application/pdf') {
            fileTypeIcon = '<span class="file-type-icon pdf-icon"></span>';
        } else if (file.type.includes('word')) {
            fileTypeIcon = '<span class="file-type-icon docx-icon"></span>';
        } else {
            fileTypeIcon = '<span class="file-type-icon txt-icon"></span>';
        }
        
        fileItem.innerHTML = `
            ${fileTypeIcon}
            <span class="file-name">${file.name}</span>
            <span class="remove-file" data-file="${file.name}">&times;</span>
        `;
        
        // Remove file functionality
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            const fileName = this.getAttribute('data-file');
            removeFile(fileName, windowElement);
            fileItem.remove();
        });
        
        filesList.appendChild(fileItem);
    }
    
    /**
     * Remove file from uploaded files
     * @param {string} fileName - File name to remove
     * @param {HTMLElement} windowElement - Window element
     */
    function removeFile(fileName, windowElement) {
        const uploadedFiles = window.webNotebook.app.uploadedFiles;
        window.webNotebook.app.uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
        
        // Update files dropdown
        updateFilesDropdown(windowElement);
        
        // Disable generate button if no files left
        if (window.webNotebook.app.uploadedFiles.length === 0) {
            const generateBtn = windowElement.querySelector('#generate-tree-btn');
            if (generateBtn) {
                generateBtn.classList.add('disabled');
            }
        }
    }
    
    /**
     * Update files in the manage files dropdown
     * @param {HTMLElement} windowElement - Window element
     */
    function updateFilesDropdown(windowElement) {
        const filesList = windowElement.querySelector('.files-dropdown .files-list');
        const uploadedFiles = window.webNotebook.app.uploadedFiles;
        
        if (!filesList) return;
        
        if (uploadedFiles.length === 0) {
            filesList.textContent = 'No files uploaded';
            return;
        }
        
        filesList.innerHTML = '';
        uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'dropdown-file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <span class="remove-dropdown-file" data-file="${file.name}">&times;</span>
            `;
            
            // Remove file functionality
            fileItem.querySelector('.remove-dropdown-file').addEventListener('click', function(e) {
                e.stopPropagation();
                const fileName = this.getAttribute('data-file');
                removeFile(fileName, windowElement);
                
                // Also remove from the main display
                const fileItemInList = windowElement.querySelector(`.remove-file[data-file="${fileName}"]`)?.closest('.file-item');
                if (fileItemInList) {
                    fileItemInList.remove();
                }
                
                fileItem.remove();
            });
            
            filesList.appendChild(fileItem);
        });
    }
    
    /**
     * Generate knowledge tree from PDF files
     * @param {HTMLElement} windowElement - Window element
     */
    window.pdfProcessor.generateKnowledgeTree = async function(windowElement) {
        const uploadedFiles = window.webNotebook.app.uploadedFiles;
        
        if (uploadedFiles.length === 0) {
            window.knowledgeApi.showStatusMessage("Please upload at least one file first", true, windowElement);
            return;
        }
        
        // Get the selected model
        const model = window.webNotebook.app.selectedModel;
        
        // Show loading indicator
        const loadingIndicator = window.utils.createLoadingIndicator();
        windowElement.querySelector('.window-top-area').appendChild(loadingIndicator);
        
        // Get structure if defined
        const structureTextarea = windowElement.querySelector('#structure-textarea');
        const customStructure = structureTextarea ? structureTextarea.value.trim() : '';
        
        try {
            window.utils.updateProgressIndicator(loadingIndicator, {
                status: "Processing documents...",
                progress: 10
            });
            
            // Process the documents
            const result = await processDocuments(
                uploadedFiles, 
                model, 
                customStructure,
                (progress) => {
                    window.utils.updateProgressIndicator(loadingIndicator, progress);
                }
            );
            
            // Create a visualization container to replace the PDF window
            createTreeVisualizationWindow(windowElement, result.treeData, result.treeId, model);
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                status: "Knowledge tree generated successfully!",
                progress: 100
            });
            
            // Hide loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 1000);
        } catch (error) {
            console.error("Error generating knowledge tree:", error);
            window.utils.updateProgressIndicator(loadingIndicator, {
                status: `Error: ${error.message}`,
                progress: 0, 
                error: true
            });
            
            // Hide loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 5000);
        }
    };
    
    /**
     * Process documents to generate a tree structure
     * @param {Array} files - Array of files
     * @param {string} model - AI model to use
     * @param {string} customStructure - Optional custom structure
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Object>} - Processing result
     */
    async function processDocuments(files, model, customStructure, progressCallback) {
        if (!files || files.length === 0) {
            throw new Error("No files provided for processing");
        }
        
        // Generate unique ID for this tree
        const treeId = window.utils.generateUniqueId();
        
        // Create result object
        const result = {
            treeId: treeId,
            files: files.map(f => f.name),
            treeData: null,
            extractedContent: { 
                files: [],
                combinedText: ''
            }
        };
        
        try {
            // Update progress
            if (progressCallback) {
                progressCallback({ 
                    status: 'Extracting text from files...', 
                    progress: 10 
                });
            }
            
            // Extract text and structure from all files
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Update progress
                if (progressCallback) {
                    progressCallback({ 
                        status: `Extracting text from ${file.name} (${i+1}/${files.length})...`, 
                        progress: 10 + (i / files.length) * 40
                    });
                }
                
                // Extract text based on file type
                let fileContent;
                
                if (file.type === 'application/pdf') {
                    fileContent = await window.pdfParser.extractTextFromPDF(file, (pdfProgress) => {
                        // Map PDF extraction progress to overall progress
                        if (progressCallback) {
                            const mappedProgress = 10 + (i / files.length) * 40 + (pdfProgress.progress / 100) * (40 / files.length);
                            progressCallback({
                                status: pdfProgress.status,
                                progress: mappedProgress
                            });
                        }
                    });
                } else if (file.type === 'application/msword' || 
                          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    fileContent = await window.pdfParser.extractTextFromWord(file, (wordProgress) => {
                        // Map Word extraction progress to overall progress
                        if (progressCallback) {
                            const mappedProgress = 10 + (i / files.length) * 40 + (wordProgress.progress / 100) * (40 / files.length);
                            progressCallback({
                                status: wordProgress.status,
                                progress: mappedProgress
                            });
                        }
                    });
                } else {
                    const text = await window.pdfParser.readFileAsText(file);
                    fileContent = {
                        text: text,
                        sections: [{ 
                            title: file.name, 
                            content: text,
                            page: null
                        }],
                        metadata: { type: 'text' },
                        numPages: 1
                    };
                }
                
                // Add to extracted content
                result.extractedContent.files.push({
                    name: file.name,
                    text: fileContent.text,
                    sections: fileContent.sections,
                    metadata: fileContent.metadata || {},
                    numPages: fileContent.numPages || 1
                });
                
                // Add to combined text
                result.extractedContent.combinedText += fileContent.text + "\n\n";
            }
            
            // Update progress
            if (progressCallback) {
                progressCallback({ 
                    status: 'Identifying key concepts...', 
                    progress: 50 
                });
            }
            
            // Extract key concepts from the combined text
            const keyConcepts = window.pdfParser.extractKeyConceptsFromText(result.extractedContent.combinedText);
            
            // Create notes from sections and concepts
            const notes = [];
            
            // Add key section titles and content snippets
            result.extractedContent.files.forEach(file => {
                if (file.sections && file.sections.length > 0) {
                    // Add file name
                    notes.push(`Document: ${file.name}`);
                    
                    // Add important sections (first 50 chars of content)
                    file.sections.forEach(section => {
                        notes.push(`Section: ${section.title}`);
                        
                        // Add first sentence of each section
                        const firstSentence = section.content.split(/[.!?]/).find(s => s.trim().length > 0);
                        if (firstSentence && firstSentence.length > 5) {
                            notes.push(firstSentence.trim() + '.');
                        }
                    });
                }
            });
            
            // Add key concepts
            keyConcepts.forEach(concept => {
                notes.push(`Key term: ${concept.term} - ${concept.context}`);
            });
            
            // Update progress
            if (progressCallback) {
                progressCallback({ 
                    status: `Generating knowledge tree with ${model}...`, 
                    progress: 70 
                });
            }
            
            // Generate tree with API
            const apiResult = await window.knowledgeApi.processNotes(notes, customStructure, model);
            
            // Extract JSON from the response
            let treeData;
            try {
                // Try to find JSON in the response
                const jsonMatch = apiResult.match(/```json\n([\s\S]*?)\n```/) || apiResult.match(/```([\s\S]*?)```/) || apiResult.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    treeData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } else {
                    throw new Error("Could not extract JSON from response");
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                console.log("Raw response:", apiResult);
                throw new Error("Failed to parse knowledge tree structure. Please try again.");
            }
            
            // Store the tree data
            result.treeData = treeData;
            
            // Store the result for later retrieval
            processedDocuments.set(treeId, result);
            
            // Update progress
            if (progressCallback) {
                progressCallback({ 
                    status: 'Knowledge tree generation complete!', 
                    progress: 100 
                });
            }
            
            return result;
            
        } catch (error) {
            // Update progress with error
            if (progressCallback) {
                progressCallback({ 
                    status: `Error: ${error.message}`, 
                    progress: 0,
                    error: true
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Create tree visualization window
     * @param {HTMLElement} originalWindow - Original window element
     * @param {Object} treeData - Tree data
     * @param {string} treeId - Tree ID
     * @param {string} model - AI model used
     */
    function createTreeVisualizationWindow(originalWindow, treeData, treeId, model) {
        // Create a visualization container to replace the original window
        const vizContainer = document.createElement('div');
        vizContainer.className = 'ai-window';
        vizContainer.dataset.treeId = treeId;
        
        // Make sure width matches the document body
        const docBodyWidth = document.querySelector('.body-area').offsetWidth;
        vizContainer.style.width = docBodyWidth + 'px';
        
        vizContainer.innerHTML = `
            <div class="ai-window-header">
                <div class="window-drag-handle">
                    <span>PDF Knowledge Tree (${model === 'gpt-4o' ? 'OpenAI' : 'Gemini'})</span>
                </div>
                <div class="window-controls">
                    <button class="files-btn">Files</button>
                    <button class="more-options-btn">Export</button>
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
                <div class="knowledge-details" style="display: none;"></div>
            </div>
        `;
        
        // Replace the original window with the visualization
        originalWindow.parentNode.replaceChild(vizContainer, originalWindow);
        
        // Create D3 visualization
        window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
        
        // Add drag handle functionality
        const dragHandle = vizContainer.querySelector('.window-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function(e) {
                window.webNotebook.handleDragStart(e, vizContainer);
            });
        }
        
        // Add event listeners
        vizContainer.querySelector('.close-btn').addEventListener('click', function() {
            vizContainer.remove();
        });
        
        vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
            window.utils.toggleFullscreen(vizContainer, this);
            
            // Re-create visualization with new dimensions
            window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
        });
        
        vizContainer.querySelector('.files-btn').addEventListener('click', function() {
            showTreeFiles(treeId);
        });
        
        vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
            window.webNotebook.toggleMoreOptionsPanel(vizContainer);
        });
        
        // Setup export buttons
        setupExportButtons(vizContainer, treeId);
    }
    
    /**
     * Show files used for a tree
     * @param {string} treeId - Tree identifier
     */
    function showTreeFiles(treeId) {
        const treeData = processedDocuments.get(treeId);
        
        if (treeData) {
            // Create modal for file list
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Files Used in Knowledge Tree</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="files-list"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add files to list
            const filesList = modal.querySelector('.files-list');
            if (treeData.files.length === 0) {
                filesList.innerHTML = '<p>No files available</p>';
            } else {
                const fileItems = document.createElement('ul');
                fileItems.style.listStyle = 'none';
                fileItems.style.padding = '0';
                
                treeData.files.forEach(fileName => {
                    const fileItem = document.createElement('li');
                    fileItem.style.padding = '8px';
                    fileItem.style.borderBottom = '1px solid #eee';
                    fileItem.textContent = fileName;
                    fileItems.appendChild(fileItem);
                });
                
                filesList.appendChild(fileItems);
            }
            
            // Add close button functionality
            modal.querySelector('.modal-close-btn').addEventListener('click', function() {
                modal.remove();
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Add styles for modal if not already in document
            if (!document.getElementById('modal-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-styles';
                style.textContent = `
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    .modal-content {
                        background-color: white;
                        border-radius: 5px;
                        width: 80%;
                        max-width: 600px;
                        max-height: 80vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        border-bottom: 1px solid #ddd;
                    }
                    .modal-close-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                    }
                    .modal-body {
                        padding: 15px;
                        overflow-y: auto;
                        flex: 1;
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            window.knowledgeApi.showStatusMessage("Tree data not found", true);
        }
    }
    
    /**
     * Setup export buttons
     * @param {HTMLElement} container - Container element
     * @param {string} treeId - Tree ID
     */
    function setupExportButtons(container, treeId) {
        // Export as JSON
        container.querySelector('.export-json-btn').addEventListener('click', function() {
            const treeData = processedDocuments.get(treeId);
            
            if (treeData && treeData.treeData) {
                const jsonString = JSON.stringify(treeData.treeData, null, 2);
                window.utils.downloadFile(jsonString, 'knowledge-tree.json', 'application/json');
            } else {
                window.knowledgeApi.showStatusMessage("Failed to export tree as JSON", true);
            }
        });
        
        // Export as Markdown
        container.querySelector('.export-markdown-btn').addEventListener('click', function() {
            const treeData = processedDocuments.get(treeId);
            
            if (treeData && treeData.treeData) {
                const markdown = convertTreeToMarkdown(treeData.treeData);
                window.utils.downloadFile(markdown, 'knowledge-tree.md', 'text/markdown');
            } else {
                window.knowledgeApi.showStatusMessage("Failed to export tree as Markdown", true);
            }
        });
        
        // Export as SVG
        container.querySelector('.export-svg-btn').addEventListener('click', function() {
            const svg = container.querySelector('svg');
            const svgData = window.treeVisualizer.exportSvg(svg);
            window.utils.downloadFile(svgData, 'knowledge-tree.svg', 'image/svg+xml');
        });
    }
    
    /**
     * Convert tree to Markdown
     * @param {Object} treeData - Tree data
     * @returns {string} - Markdown representation
     */
    function convertTreeToMarkdown(treeData) {
        let markdown = `# ${treeData.title}\n\n`;
        markdown += `${treeData.summary}\n\n`;
        
        // Recursively add child nodes
        function addChildToMarkdown(node, level) {
            let result = '';
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    // Add heading with appropriate level
                    result += `\n${'#'.repeat(level + 2)} ${child.title}\n\n`;
                    
                    // Add summary and content
                    result += `${child.summary}\n\n`;
                    if (child.content) {
                        result += `${child.content}\n\n`;
                    }
                    
                    // Add children recursively
                    result += addChildToMarkdown(child, level + 1);
                });
            }
            return result;
        }
        
        markdown += addChildToMarkdown(treeData, 0);
        
        return markdown;
    }
    
    /**
     * Get stored tree
     * @param {string} treeId - Tree ID
     * @returns {Object|null} - Tree data or null if not found
     */
    window.pdfProcessor.getStoredTree = function(treeId) {
        return processedDocuments.get(treeId);
    };
    
    /**
     * Export tree as JSON
     * @param {string} treeId - Tree ID
     * @returns {string|null} - JSON string or null if tree not found
     */
    window.pdfProcessor.exportTreeAsJSON = function(treeId) {
        const treeData = processedDocuments.get(treeId);
        return treeData ? JSON.stringify(treeData.treeData, null, 2) : null;
    };
    
    /**
     * Export tree as Markdown
     * @param {string} treeId - Tree ID
     * @returns {string|null} - Markdown string or null if tree not found
     */
    window.pdfProcessor.exportTreeAsMarkdown = function(treeId) {
        const treeData = processedDocuments.get(treeId);
        return treeData ? convertTreeToMarkdown(treeData.treeData) : null;
    };
})();


/**
 * Integration Code
 * Connects tree generation with node navigation
 */

// This code should be added to the end of pdf-processor.js, just before the closing })();

/**
 * Create tree visualization window with navigation
 * @param {HTMLElement} originalWindow - Original window element
 * @param {Object} treeData - Tree data
 * @param {string} treeId - Tree ID
 * @param {string} model - AI model used
 */
function createTreeVisualizationWindow(originalWindow, treeData, treeId, model) {
    // If the enhanced tree visualizer is available, use it
    if (window.enhancedTreeVisualizer && typeof window.enhancedTreeVisualizer.createTreeVisualizer === 'function') {
        // Create a visualization container to replace the original window
        const vizContainer = document.createElement('div');
        vizContainer.className = 'ai-window';
        vizContainer.dataset.treeId = treeId;
        
        // Make sure width matches the document body
        const docBodyWidth = document.querySelector('.body-area').offsetWidth;
        vizContainer.style.width = docBodyWidth + 'px';
        
        // Replace the original window with the visualization container
        originalWindow.parentNode.replaceChild(vizContainer, originalWindow);
        
        // Create tree visualizer in the container
        window.enhancedTreeVisualizer.createTreeVisualizer(vizContainer, treeData);
        
        // Initialize node navigator if available
        if (window.nodeNavigator && typeof window.nodeNavigator.initialize === 'function') {
            window.nodeNavigator.initialize(treeData);
        }
    } else {
        // Fall back to the original implementation
        fallbackCreateTreeVisualization(originalWindow, treeData, treeId, model);
    }
}

/**
 * Fallback implementation of tree visualization
 * Used when the enhanced components aren't available
 */
function fallbackCreateTreeVisualization(originalWindow, treeData, treeId, model) {
    // Create a visualization container to replace the original window
    const vizContainer = document.createElement('div');
    vizContainer.className = 'ai-window';
    vizContainer.dataset.treeId = treeId;
    
    // Make sure width matches the document body
    const docBodyWidth = document.querySelector('.body-area').offsetWidth;
    vizContainer.style.width = docBodyWidth + 'px';
    
    vizContainer.innerHTML = `
        <div class="ai-window-header">
            <div class="window-drag-handle">
                <span>PDF Knowledge Tree (${model === 'gpt-4o' ? 'OpenAI' : 'Gemini'})</span>
            </div>
            <div class="window-controls">
                <button class="files-btn">Files</button>
                <button class="more-options-btn">Export</button>
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
            <div class="knowledge-details" style="display: none;"></div>
        </div>
    `;
    
    // Replace the original window with the visualization
    originalWindow.parentNode.replaceChild(vizContainer, originalWindow);
    
    // Create D3 visualization
    window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
    
    // Add drag handle functionality
    const dragHandle = vizContainer.querySelector('.window-drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', function(e) {
            window.webNotebook.handleDragStart(e, vizContainer);
        });
    }
    
    // Add event listeners
    vizContainer.querySelector('.close-btn').addEventListener('click', function() {
        vizContainer.remove();
    });
    
    vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
        window.utils.toggleFullscreen(vizContainer, this);
        
        // Re-create visualization with new dimensions
        window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
    });
    
    vizContainer.querySelector('.files-btn').addEventListener('click', function() {
        showTreeFiles(treeId);
    });
    
    vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
        window.webNotebook.toggleMoreOptionsPanel(vizContainer);
    });
    
    // Setup export buttons
    setupExportButtons(vizContainer, treeId);
}

// Load the required scripts
function loadNavigationComponents() {
    return new Promise((resolve, reject) => {
        // Check if components are already loaded
        if (window.nodeNavigator && window.enhancedTreeVisualizer) {
            resolve();
            return;
        }
        
        // Create script elements
        const nodeNavigatorScript = document.createElement('script');
        nodeNavigatorScript.src = 'js/navigation/knowledge-node-navigator.js';
        
        const enhancedVisualizerScript = document.createElement('script');
        enhancedVisualizerScript.src = 'js/navigation/enhanced-tree-visualizer.js';
        
        // Add load handlers
        let loadedCount = 0;
        const onScriptLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
                resolve();
            }
        };
        
        nodeNavigatorScript.onload = onScriptLoad;
        enhancedVisualizerScript.onload = onScriptLoad;
        
        nodeNavigatorScript.onerror = reject;
        enhancedVisualizerScript.onerror = reject;
        
        // Add to document
        document.head.appendChild(nodeNavigatorScript);
        document.head.appendChild(enhancedVisualizerScript);
        
        // Set timeout in case scripts fail to load
        setTimeout(() => {
            // If not resolved yet, resolve anyway with what we have
            resolve();
        }, 2000);
    });
}

// Override the generateKnowledgeTree function to load components first
const originalGenerateKnowledgeTree = window.pdfProcessor.generateKnowledgeTree;
window.pdfProcessor.generateKnowledgeTree = async function(windowElement) {
    try {
        // Try to load navigation components 
        await loadNavigationComponents();
    } catch (e) {
        console.warn("Could not load navigation components:", e);
    }
    
    // Call the original function
    return originalGenerateKnowledgeTree(windowElement);
};

// Add CSS styles for knowledge node navigation
function addNavigationStyles() {
    const style = document.createElement('style');
    style.id = 'knowledge-navigation-styles';
    style.textContent = `
        /* Node navigation styles */
        .node {
            cursor: pointer;
        }
        
        .node circle {
            fill: #557ba1;
            stroke: #233749;
            stroke-width: 1.5px;
        }
        
        .node.root-node circle {
            fill: #233749;
        }
        
        .node.leaf-node circle {
            fill: #7ba1c7;
        }
        
        .node text {
            font: 12px sans-serif;
        }
        
        .node.selected circle {
            fill: #233749;
            stroke-width: 2px;
        }
        
        .node-details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .node-details-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .view-node-btn {
            padding: 5px 10px;
            background-color: #233749;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .node-summary {
            margin-bottom: 15px;
            font-style: italic;
            color: #666;
        }
        
        .knowledge-content-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .breadcrumb-nav {
            margin-bottom: 20px;
            font-size: 14px;
            color: #777;
        }
        
        .breadcrumb-nav a {
            color: #233749;
            text-decoration: none;
        }
        
        .breadcrumb-nav a:hover {
            text-decoration: underline;
        }
        
        .breadcrumb-separator {
            margin: 0 5px;
            color: #ccc;
        }
        
        .child-knowledge-item {
            display: flex;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
            border-left: 3px solid #233749;
            margin-bottom: 10px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .child-knowledge-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
        
        .children-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .children-title {
            font-size: 24px;
            margin-bottom: 20px;
        }
        
        .children-counter {
            display: inline-block;
            background-color: #eef2f7;
            color: #233749;
            font-size: 14px;
            padding: 2px 8px;
            border-radius: 12px;
            margin-left: 8px;
        }
        
        .add-child-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            border: 1px dashed #ccc;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
            color: #666;
            transition: all 0.2s;
        }
        
        .add-child-button:hover {
            border-color: #233749;
            color: #233749;
        }
    `;
    
    document.head.appendChild(style);
}

// Add the styles when the document is ready
document.addEventListener('DOMContentLoaded', addNavigationStyles);

// Initialize node navigator functions if not already loaded
if (!window.nodeNavigator) {
    window.nodeNavigator = {
        initialize: function(treeData) {
            console.warn("Node navigator not fully loaded. Basic functionality will be available.");
        },
        handleNodeClick: function(nodeData) {
            console.warn("Node navigation not available. Implement with enhanced tree visualizer.");
            // Show basic node information
            alert(`Node: ${nodeData.title}\n\n${nodeData.summary || ''}`);
        }
    };
}