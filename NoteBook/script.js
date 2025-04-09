document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    window.uploadedFiles = []; // Expose for API integration
    let selectedModel = 'openai';
    let isDragging = false;
    let startY, currentDragTarget;
    let dragPlaceholder = null;
    let dropTarget = null;
    let isFullscreen = false;
    let treeData = null;
    let selectedNode = null; // Currently selected node
    
    // Formatting tool states
    let formattingState = {
        bold: false,
        italic: false,
        underline: false,
        heading: null
    };

    // Initialize the document
    initializeDocument();

    // Initialize event listeners
    initializeEventListeners();

    // Function to initialize the document
    function initializeDocument() {
        // Update breadcrumb with title
        updateBreadcrumb();
        
        // Add event listener for document title changes
        document.getElementById('document-title').addEventListener('input', updateBreadcrumb);
        
        // Set up document-level drag events
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }

    // Function to update the breadcrumb with current document title
    function updateBreadcrumb() {
        const title = document.getElementById('document-title').textContent;
        document.querySelector('.file-title').textContent = title || 'Untitled Document';
    }

    // Initialize event listeners
    function initializeEventListeners() {
        // AI Tools dropdown
        document.getElementById('ai-tools-btn').addEventListener('click', toggleAIDropdown);
        
        // Doc Summary button
        document.getElementById('doc-summary-btn').addEventListener('click', showDocSummaryWindow);
        
        // AI Assistant and Summarize buttons
        if (document.getElementById('ai-assistant-btn')) {
            document.getElementById('ai-assistant-btn').addEventListener('click', function() {
                alert('AI Assistant feature would be implemented here');
                document.getElementById('ai-dropdown').style.display = 'none';
            });
        }
        
        if (document.getElementById('summarize-btn')) {
            document.getElementById('summarize-btn').addEventListener('click', function() {
                alert('Text summarization feature would be implemented here');
                document.getElementById('ai-dropdown').style.display = 'none';
            });
        }
        
        // Formatting tools
        initializeFormattingTools();
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.matches('#ai-tools-btn') && !event.target.closest('#ai-dropdown')) {
                document.getElementById('ai-dropdown').style.display = 'none';
            }
            
            // Close any dropdown panels when clicking outside
            if (!event.target.matches('.control-item button') && !event.target.closest('.dropdown-panel')) {
                document.querySelectorAll('.dropdown-panel').forEach(panel => {
                    panel.style.display = 'none';
                });
            }
        });
        
        // Make document body editable
        document.getElementById('document-body').addEventListener('focus', function() {
            this.classList.add('editing');
        });
        
        document.getElementById('document-body').addEventListener('blur', function() {
            this.classList.remove('editing');
        });
        
        // Node details panel tab functionality
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab panels
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                // Show selected tab panel
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Close node details panel
        document.querySelector('.close-details-btn').addEventListener('click', function() {
            document.getElementById('node-details-panel').style.display = 'none';
            // Deselect node in visualization if it exists
            if (selectedNode) {
                d3.select(selectedNode).classed('selected', false);
                selectedNode = null;
            }
        });
    }
    
    // Initialize formatting tools
    function initializeFormattingTools() {
        const formatButtons = document.querySelectorAll('.tool-button');
        
        formatButtons.forEach(button => {
            button.addEventListener('click', function() {
                const title = this.getAttribute('title');
                
                // Apply formatting based on button clicked
                if (title === 'Bold') {
                    document.execCommand('bold', false, null);
                    formattingState.bold = !formattingState.bold;
                    this.classList.toggle('active');
                } else if (title === 'Italic') {
                    document.execCommand('italic', false, null);
                    formattingState.italic = !formattingState.italic;
                    this.classList.toggle('active');
                } else if (title === 'Underline') {
                    document.execCommand('underline', false, null);
                    formattingState.underline = !formattingState.underline;
                    this.classList.toggle('active');
                } else if (title === 'Heading 1') {
                    applyHeadingFormat('h1');
                } else if (title === 'Heading 2') {
                    applyHeadingFormat('h2');
                } else if (title === 'Heading 3') {
                    applyHeadingFormat('h3');
                } else if (title === 'Bullet List') {
                    document.execCommand('insertUnorderedList', false, null);
                } else if (title === 'Numbered List') {
                    document.execCommand('insertOrderedList', false, null);
                } else if (title === 'To-do List') {
                    // Custom to-do list implementation would go here
                    alert('To-do list feature would be implemented here');
                } else if (title === 'Add Link') {
                    const url = prompt('Enter the URL:');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                } else if (title === 'Add Image') {
                    const imageUrl = prompt('Enter the image URL:');
                    if (imageUrl) {
                        document.execCommand('insertImage', false, imageUrl);
                    }
                }
                
                // Return focus to the editor
                document.getElementById('document-body').focus();
            });
        });
    }
    
    // Apply heading format
    function applyHeadingFormat(headingType) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
                // Create new heading element
                const heading = document.createElement(headingType);
                heading.textContent = selectedText;
                
                // Replace selected text with heading
                range.deleteContents();
                range.insertNode(heading);
                
                // Move cursor to end of heading
                const newRange = document.createRange();
                newRange.setStartAfter(heading);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    }

    // Toggle AI Tools dropdown
    function toggleAIDropdown() {
        const dropdown = document.getElementById('ai-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }

    // Show Doc Summary Window
    function showDocSummaryWindow() {
        // Hide dropdown
        document.getElementById('ai-dropdown').style.display = 'none';
        
        // Get the current selection or cursor position
        const selection = window.getSelection();
        let insertPoint;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Create a new range at the selection
            insertPoint = range.startContainer;
            
            // If the selection is in the document body, use that point
            // Otherwise, append to the end of the document body
            if (!document.getElementById('document-body').contains(insertPoint)) {
                insertPoint = document.getElementById('document-body');
                insertPoint.appendChild(document.createElement('div')); // Add placeholder
                insertPoint = insertPoint.lastChild;
            }
            
            // Insert the window at the cursor position
            const docSummary = document.getElementById('ai-doc-summary');
            
            // Clone the window to avoid moving the original template
            const summaryWindow = docSummary.cloneNode(true);
            summaryWindow.id = 'active-doc-summary';
            summaryWindow.style.display = 'block';
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            summaryWindow.style.width = docBodyWidth + 'px';
            
            // Insert it inline at the cursor position
            if (insertPoint.nodeType === 3) { // Text node
                const parentNode = insertPoint.parentNode;
                const textContent = insertPoint.textContent;
                const offset = range.startOffset;
                
                // Split the text node if needed
                if (offset > 0 && offset < textContent.length) {
                    const afterText = textContent.substring(offset);
                    insertPoint.textContent = textContent.substring(0, offset);
                    
                    const afterNode = document.createTextNode(afterText);
                    parentNode.insertBefore(summaryWindow, insertPoint.nextSibling);
                    parentNode.insertBefore(afterNode, summaryWindow.nextSibling);
                } else if (offset === 0) {
                    parentNode.insertBefore(summaryWindow, insertPoint);
                } else {
                    parentNode.insertBefore(summaryWindow, insertPoint.nextSibling);
                }
            } else { // Element node
                insertPoint.appendChild(summaryWindow);
            }
            
            // Initialize event handlers for the cloned window
            initializeClonedWindowHandlers(summaryWindow);
            
        } else {
            // If no selection, append to the end of the document body
            const docBody = document.getElementById('document-body');
            const docSummary = document.getElementById('ai-doc-summary');
            
            // Clone the window
            const summaryWindow = docSummary.cloneNode(true);
            summaryWindow.id = 'active-doc-summary';
            summaryWindow.style.display = 'block';
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            summaryWindow.style.width = docBodyWidth + 'px';
            
            // Append to the document body
            docBody.appendChild(summaryWindow);
            
            // Initialize event handlers for the cloned window
            initializeClonedWindowHandlers(summaryWindow);
        }
    }
    
    // Initialize event handlers for cloned windows
    function initializeClonedWindowHandlers(windowElement) {
        // Drag handle
        const dragHandle = windowElement.querySelector('.window-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function(e) {
                handleDragStart(e, windowElement);
            });
        }
        
        // File upload
        const fileUpload = windowElement.querySelector('input[type="file"]');
        const dropZone = windowElement.querySelector('#drop-zone');
        
        if (fileUpload) {
            fileUpload.addEventListener('change', function(e) {
                handleFiles(this.files);
            });
        }
        
        if (dropZone) {
            // Drag and drop events
            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.backgroundColor = '#f0f0f0';
            });
            
            dropZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.backgroundColor = '';
            });
            
            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.backgroundColor = '';
                handleFiles(e.dataTransfer.files);
            });
        }
        
        // Close button
        const closeBtn = windowElement.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                windowElement.remove();
            });
        }
        
        // Generate button
        const generateBtn = windowElement.querySelector('#generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', function() {
                generateTreeInline(windowElement);
            });
        }
        
        // Model selection
        const modelSelectBtn = windowElement.querySelector('#model-select-btn');
        if (modelSelectBtn) {
            modelSelectBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleDropdownPanelInline(windowElement, '.model-dropdown');
            });
        }
        
        // Model options
        const modelOptions = windowElement.querySelectorAll('.model-option');
        modelOptions.forEach(option => {
            option.addEventListener('click', function() {
                selectedModel = this.getAttribute('data-model');
                
                // Update UI
                windowElement.querySelectorAll('.model-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // Update button text
                windowElement.querySelector('#model-select-btn').textContent = 
                    this.textContent + ' ▼';
                
                // Hide dropdown
                windowElement.querySelector('.model-dropdown').style.display = 'none';
            });
        });
        
        // Other buttons
        const manageFilesBtn = windowElement.querySelector('#manage-files-btn');
        if (manageFilesBtn) {
            manageFilesBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleDropdownPanelInline(windowElement, '.files-dropdown');
            });
        }
        
        const customizeStructureBtn = windowElement.querySelector('#customize-structure-btn');
        if (customizeStructureBtn) {
            customizeStructureBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleDropdownPanelInline(windowElement, '.structure-dropdown');
            });
        }
    }
    
    // Handle drag start for draggable windows
    function handleDragStart(e, element) {
        // Only handle left mouse button
        if (e.button !== 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Get starting position
        startY = e.clientY;
        
        // Set dragging state
        isDragging = true;
        currentDragTarget = element;
        element.classList.add('dragging');
        
        // Create a placeholder for drop targets
        createDragPlaceholder(element);
        
        // Calculate possible drop locations
        updateDropTargets(e.clientY);
    }
    
    // Create drag placeholder
    function createDragPlaceholder(element) {
        // Remove existing placeholder if any
        if (dragPlaceholder) {
            dragPlaceholder.remove();
        }
        
        // Clone element dimensions but make it a placeholder
        dragPlaceholder = document.createElement('div');
        dragPlaceholder.className = 'drag-placeholder';
        dragPlaceholder.style.height = element.offsetHeight + 'px';
        dragPlaceholder.style.opacity = '0.2';
        
        // Insert after the element
        if (element.nextSibling) {
            element.parentNode.insertBefore(dragPlaceholder, element.nextSibling);
        } else {
            element.parentNode.appendChild(dragPlaceholder);
        }
        
        // Hide it initially
        dragPlaceholder.style.display = 'none';
    }
    
    // Update drop targets based on cursor position
    function updateDropTargets(clientY) {
        const docBody = document.getElementById('document-body');
        const bodyRect = docBody.getBoundingClientRect();
        
        // Convert client coordinates to document body coordinates
        const relativeY = clientY - bodyRect.top;
        
        // Get all direct children of the document body
        const children = Array.from(docBody.children);
        
        // Skip the current drag target in our calculations
        const filteredChildren = children.filter(child => child !== currentDragTarget && child !== dragPlaceholder);
        
        // No children or only the current drag target
        if (filteredChildren.length === 0) {
            // Just place at the beginning or end
            if (relativeY < bodyRect.height / 2) {
                dropTarget = { element: null, position: 'start' };
            } else {
                dropTarget = { element: null, position: 'end' };
            }
            return;
        }
        
        // Find the closest element to the cursor
        for (let i = 0; i < filteredChildren.length; i++) {
            const child = filteredChildren[i];
            const childRect = child.getBoundingClientRect();
            const childMiddle = childRect.top + childRect.height / 2 - bodyRect.top;
            
            if (relativeY < childMiddle) {
                // Place before this child
                dropTarget = { element: child, position: 'before' };
                return;
            }
        }
        
        // If we get here, place after the last child
        dropTarget = { element: filteredChildren[filteredChildren.length - 1], position: 'after' };
    }
    
    // Handle drag move
    function handleDragMove(e) {
        if (!isDragging || !currentDragTarget) return;
        
        const deltaY = e.clientY - startY;
        
        // If dragging, update drop targets
        updateDropTargets(e.clientY);
        
        // Update drag placeholder position
        updateDragPlaceholder();
    }
    
    // Update drag placeholder position
    function updateDragPlaceholder() {
        if (!dragPlaceholder || !dropTarget) return;
        
        // Show the placeholder
        dragPlaceholder.style.display = 'block';
        
        const docBody = document.getElementById('document-body');
        
        // Position the placeholder based on drop target
        if (dropTarget.position === 'start') {
            // At the start of document
            docBody.insertBefore(dragPlaceholder, docBody.firstChild);
        } else if (dropTarget.position === 'end') {
            // At the end of document
            docBody.appendChild(dragPlaceholder);
        } else if (dropTarget.position === 'before') {
            // Before the target element
            docBody.insertBefore(dragPlaceholder, dropTarget.element);
        } else if (dropTarget.position === 'after') {
            // After the target element
            if (dropTarget.element.nextSibling) {
                docBody.insertBefore(dragPlaceholder, dropTarget.element.nextSibling);
            } else {
                docBody.appendChild(dragPlaceholder);
            }
        }
    }
    
    // Handle drag end
    function handleDragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        
        if (currentDragTarget) {
            currentDragTarget.classList.remove('dragging');
            
            // Move the element to the drop location
            moveElementToDropLocation();
            
            // Reset
            currentDragTarget = null;
        }
        
        // Remove placeholder
        if (dragPlaceholder) {
            dragPlaceholder.remove();
            dragPlaceholder = null;
        }
        
        dropTarget = null;
    }
    
    // Move element to drop location
    function moveElementToDropLocation() {
        if (!currentDragTarget || !dropTarget) return;
        
        const docBody = document.getElementById('document-body');
        
        // Temporarily remove the element
        currentDragTarget.remove();
        
        // Place it in the new location
        if (dropTarget.position === 'start') {
            docBody.insertBefore(currentDragTarget, docBody.firstChild);
        } else if (dropTarget.position === 'end') {
            docBody.appendChild(currentDragTarget);
        } else if (dropTarget.position === 'before') {
            docBody.insertBefore(currentDragTarget, dropTarget.element);
        } else if (dropTarget.position === 'after') {
            if (dropTarget.element.nextSibling) {
                docBody.insertBefore(currentDragTarget, dropTarget.element.nextSibling);
            } else {
                docBody.appendChild(currentDragTarget);
            }
        }
    }
    
    // Toggle dropdown panel in inline window
    function toggleDropdownPanelInline(windowElement, selector) {
        const panel = windowElement.querySelector(selector);
        
        // Close all other dropdowns in this window
        windowElement.querySelectorAll('.dropdown-panel').forEach(p => {
            if (p !== panel) p.style.display = 'none';
        });
        
        // Toggle this dropdown
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    }
    
    // Handle uploaded files
    function handleFiles(files) {
        for (let file of files) {
            // Check file type
            if (file.type === 'application/pdf' || 
                file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                
                // Add to uploaded files array
                uploadedFiles.push(file);
                
                // Display in UI
                displayUploadedFile(file);
            } else {
                alert('Please upload PDF or Word documents only.');
            }
        }
        
        // Update files list in manage files dropdown
        updateFilesDropdown();
    }

    // Display uploaded file in the list
    function displayUploadedFile(file) {
        const filesList = document.getElementById('uploaded-files-list');
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="remove-file" data-file="${file.name}">&times;</span>
        `;
        
        // Remove file functionality
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            const fileName = this.getAttribute('data-file');
            removeFile(fileName);
            fileItem.remove();
        });
        
        filesList.appendChild(fileItem);
    }

    // Remove file from uploaded files
    function removeFile(fileName) {
        uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
        
        // Update files dropdown
        updateFilesDropdown();
    }

    // Update files in the manage files dropdown
    function updateFilesDropdown() {
        const filesList = document.querySelector('.files-dropdown .files-list');
        
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
                removeFile(fileName);
                
                // Also remove from the main display
                document.querySelector(`.remove-file[data-file="${fileName}"]`)?.closest('.file-item').remove();
                
                fileItem.remove();
            });
            
            filesList.appendChild(fileItem);
        });
    }
    
    // Generate tree visualization inline
    function generateTreeInline(summaryWindow) {
        if (uploadedFiles.length === 0) {
            alert('Please upload at least one file to analyze.');
            return;
        }
        
        // Show loading state
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-status">Processing documents...</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: 30%"></div>
            </div>
        `;
        summaryWindow.querySelector('.window-top-area').appendChild(loadingIndicator);
        
        // Simulate API call delay
        setTimeout(() => {
            // Mock tree data
            treeData = getMockTreeData();
            
            // Create a visualization container to replace the summary window
            const vizContainer = document.createElement('div');
            vizContainer.className = 'ai-window';
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            vizContainer.style.width = docBodyWidth + 'px';
            
            vizContainer.innerHTML = `
                <div class="ai-window-header">
                    <div class="window-drag-handle">
                        <span>Doc Summary Tree</span>
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
            
            // Create D3 visualization
            createD3TreeInline(vizContainer.querySelector('svg'), treeData);
            
            // Add drag handle functionality
            const dragHandle = vizContainer.querySelector('.window-drag-handle');
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', function(e) {
                    handleDragStart(e, vizContainer);
                });
            }
            
            // Add event listeners
            vizContainer.querySelector('.close-btn').addEventListener('click', function() {
                vizContainer.remove();
            });
            
            vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
                toggleFullscreenInline(vizContainer, this);
            });
            
            vizContainer.querySelector('.files-btn').addEventListener('click', function() {
                showTreeFiles(uploadedFiles);
            });
            
            vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
                toggleMoreOptionsPanel(vizContainer);
            });
            
            // Export buttons
            const exportButtons = vizContainer.querySelectorAll('.more-options-panel button');
            exportButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.classList.contains('export-json-btn')) {
                        exportAsJSON(treeData);
                    } else if (this.classList.contains('export-markdown-btn')) {
                        exportAsMarkdown(treeData);
                    } else if (this.classList.contains('export-svg-btn')) {
                        exportAsSVG(vizContainer.querySelector('svg'));
                    }
                });
            });
            
        }, 1500);
    }
    
    // Create D3 tree visualization inline with enhanced interactivity
    function createD3TreeInline(svgElement, data) {
        // Use D3 to select the SVG element
        const svg = d3.select(svgElement);
        
        // Clear any existing content
        svg.selectAll("*").remove();
        
        // Set up dimensions
        const width = svg.node().getBoundingClientRect().width;
        const height = svg.node().getBoundingClientRect().height;
        
        // Create a tree layout
        const treeLayout = d3.tree().size([height - 50, width - 100]);
        
        // Create hierarchy from data
        const root = d3.hierarchy(data);
        
        // Calculate position of each node
        treeLayout(root);
        
        // Add container g element
        const g = svg.append("g")
            .attr("transform", `translate(50, 25)`);
        
        // Create links
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)   // Swap x and y for horizontal layout
                .y(d => d.x));
        
        // Create nodes
        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", function(event, d) {
                // Handle node click - show details
                showNodeDetails(d, event);
                
                // Update selected state
                if (selectedNode) {
                    d3.select(selectedNode).classed('selected', false);
                }
                selectedNode = this;
                d3.select(this).classed('selected', true);
            });
        
        // Add circles to nodes
        node.append("circle")
            .attr("r", 5);
        
        // Add text labels
        node.append("text")
            .attr("dy", ".35em")
            .attr("x", d => d.children ? -10 : 10)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name);
        
        // Enable zoom and pan
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        
        svg.call(zoom);
    }
    
    // Show node details when clicked
    function showNodeDetails(node, event) {
        const detailsPanel = document.getElementById('node-details-panel');
        
        // Update panel content
        document.getElementById('node-title').textContent = node.data.name;
        
        // Create mock data for each tab based on the node data
        // In a real implementation, this would come from the API
        
        // Summary tab
        const summary = node.data.description || `This is a summary of the ${node.data.name} concept. It would include key information extracted from the document.`;
        document.getElementById('node-summary').textContent = summary;
        
        // Source tab - show the source text from the document
        const sourceContent = `Original text from document relating to "${node.data.name}":
        
This section would contain the actual extracted text from the document that this node is based on. In a real implementation, this would include the specific paragraphs or sections that were used to generate this node in the knowledge tree.`;
        document.getElementById('node-source').innerHTML = sourceContent;
        
        // Explore tab - show related concepts
        const relatedConcepts = document.getElementById('related-concepts');
        relatedConcepts.innerHTML = '';
        
        // Generate 3-5 related concepts based on siblings and children
        const siblings = node.parent ? node.parent.children : [];
        const relatedNodes = [...siblings, ...(node.children || [])].filter(n => n !== node).slice(0, 4);
        
        relatedNodes.forEach(relatedNode => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="related-concept" data-node-id="${relatedNode.data.id || Math.random().toString(36).substring(2, 10)}">${relatedNode.data.name}</a>`;
            relatedConcepts.appendChild(li);
        });
        
        // Add "Further Reading" suggestions
        document.getElementById('further-reading').innerHTML = `
            <p>To learn more about ${node.data.name}, consider:</p>
            <ul>
                <li>Exploring related sections in the document</li>
                <li>Reviewing ${siblings.length > 0 ? siblings[0].data.name : 'parent concepts'}</li>
                <li>Examining ${node.children && node.children.length > 0 ? 'subconcepts' : 'related examples'}</li>
            </ul>
        `;
        
        // Show the first tab by default
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.querySelector('.tab-btn[data-tab="summary"]').classList.add('active');
        document.getElementById('summary-tab').classList.add('active');
        
        // Position the panel beside the visualization
        const rect = event.target.getBoundingClientRect();
        const panelWidth = 350;
        
        // Calculate ideal position (next to the node)
        let left = rect.right + 20;
        let top = rect.top - 50;
        
        // Check if panel would go off screen to the right
        if (left + panelWidth > window.innerWidth) {
            left = rect.left - panelWidth - 20;
        }
        
        // Check if panel would go off screen at the top
        if (top < 70) { // Account for header
            top = 70;
        }
        
        // Set panel position
        detailsPanel.style.left = `${left}px`;
        detailsPanel.style.top = `${top}px`;
        
        // Show the panel
        detailsPanel.style.display = 'flex';
        
        // Add event listeners for related concepts
        detailsPanel.querySelectorAll('.related-concept').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                // In a real implementation, this would find and select the related node
                alert(`Navigate to related concept: ${this.textContent}`);
            });
        });
    }
    
    // Toggle fullscreen for inline visualization
    function toggleFullscreenInline(container, button) {
        const isAlreadyFullscreen = container.classList.contains('is-fullscreen');
        
        if (!isAlreadyFullscreen) {
            // Save the current position
            container.dataset.originalParent = container.parentNode;
            container.dataset.originalNextSibling = container.nextSibling ? container.nextSibling.id : 'none';
            
            // Move to body and make fullscreen
            document.body.appendChild(container);
            container.classList.add('is-fullscreen');
            button.textContent = 'Exit Fullscreen';
            
            // Update the SVG height for better viewing
            const svg = container.querySelector('svg');
            svg.setAttribute('height', 'calc(100vh - 80px)');
        } else {
            // Remove fullscreen
            container.classList.remove('is-fullscreen');
            button.textContent = 'Full Screen';
            
            // Reset SVG height
            const svg = container.querySelector('svg');
            svg.setAttribute('height', '400');
            
            // Return to original position if possible
            const originalParent = document.getElementById('document-body');
            if (originalParent) {
                originalParent.appendChild(container);
            }
        }
        
        // Recreate the visualization to fit the new size
        createD3TreeInline(container.querySelector('svg'), treeData);
    }
    
    // Toggle more options panel
    function toggleMoreOptionsPanel(container) {
        const optionsPanel = container.querySelector('.more-options-panel');
        optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
    }
    
    // Show files used for a tree
    function showTreeFiles(files) {
        // This would show a panel with the files used to generate the tree
        let filesList = files.map(file => file.name).join(', ');
        alert(`Files used: ${filesList}`);
    }
    
    // Export as JSON
    function exportAsJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        downloadFile(jsonString, 'knowledge-tree.json', 'application/json');
    }
    
    // Export as Markdown
    function exportAsMarkdown(data) {
        let markdown = `# ${data.name}\n\n`;
        
        // Recursive function to process nodes
        function processNode(node, level) {
            if (!node) return '';
            
            let result = '';
            
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    // Add heading with appropriate level
                    result += `${'#'.repeat(level + 1)} ${child.name}\n\n`;
                    
                    // Add description if available
                    if (child.description) {
                        result += `${child.description}\n\n`;
                    }
                    
                    // Process children recursively
                    result += processNode(child, level + 1);
                });
            }
            
            return result;
        }
        
        markdown += processNode(data, 1);
        
        // Download the markdown
        downloadFile(markdown, 'knowledge-tree.md', 'text/markdown');
    }
    
    // Export as SVG
    function exportAsSVG(svgElement) {
        // Clone the SVG element to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);
        
        // Add inline stylesheet
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
        
        // Convert to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        // Download
        downloadFile(svgString, 'knowledge-tree.svg', 'image/svg+xml');
    }
    
    // Helper function to download files
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
    
    // Get mock tree data for demonstration
    function getMockTreeData() {
        return {
            "name": "Document Structure",
            "children": [
                {
                    "name": "Introduction",
                    "description": "Provides background information and sets context for the document.",
                    "children": [
                        {
                            "name": "Background",
                            "description": "Historical context and previous work related to the topic.",
                            "children": []
                        },
                        {
                            "name": "Research Questions",
                            "description": "The main questions or hypotheses being explored in the document.",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Methodology",
                    "description": "Details of the approach, techniques, and procedures used.",
                    "children": [
                        {
                            "name": "Data Collection",
                            "description": "Methods used to gather information for analysis.",
                            "children": [
                                {
                                    "name": "Surveys",
                                    "description": "Structured questionnaires used to collect responses.",
                                    "children": []
                                },
                                {
                                    "name": "Interviews",
                                    "description": "In-depth conversations with subjects to gather qualitative data.",
                                    "children": []
                                }
                            ]
                        },
                        {
                            "name": "Analysis Techniques",
                            "description": "Statistical and analytical methods applied to the collected data.",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Results",
                    "description": "Findings and outcomes derived from the research.",
                    "children": [
                        {
                            "name": "Key Findings",
                            "description": "Most significant discoveries and insights from the analysis.",
                            "children": []
                        },
                        {
                            "name": "Statistical Analysis",
                            "description": "Numerical evaluation of data patterns and significance.",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Discussion",
                    "description": "Interpretation of results and their broader context.",
                    "children": [
                        {
                            "name": "Implications",
                            "description": "Consequences and applications of the findings.",
                            "children": []
                        },
                        {
                            "name": "Limitations",
                            "description": "Constraints and boundaries of the research methodology.",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Conclusion",
                    "description": "Summary of findings and final thoughts on the research.",
                    "children": []
                }
            ]
        };
    }
    
    // Make functions available globally
    window.notebookUI = {
        createD3TreeInline,
        toggleFullscreenInline,
        showNodeDetails,
        handleDragStart,
        downloadFile,
        toggleMoreOptionsPanel,
        showTreeFiles,
        exportAsJSON,
        exportAsMarkdown,
        exportAsSVG
    };
});