document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let uploadedFiles = [];
    let selectedModel = 'openai';
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    let isFullscreen = false;
    let treeData = null;
    
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
        });
        
        // Make document body editable
        document.getElementById('document-body').addEventListener('focus', function() {
            this.classList.add('editing');
        });
        
        document.getElementById('document-body').addEventListener('blur', function() {
            this.classList.remove('editing');
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
            
            // Append to the document body
            docBody.appendChild(summaryWindow);
            
            // Initialize event handlers for the cloned window
            initializeClonedWindowHandlers(summaryWindow);
        }
    }
    
    // Initialize event handlers for cloned windows
    function initializeClonedWindowHandlers(windowElement) {
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
        
        // Show loading state (could add a spinner here)
        
        // Simulate API call delay
        setTimeout(() => {
            // Mock tree data
            treeData = getMockTreeData();
            
            // Create a visualization container to replace the summary window
            const vizContainer = document.createElement('div');
            vizContainer.className = 'ai-window';
            vizContainer.innerHTML = `
                <div class="ai-window-header">
                    <span>Doc Summary Tree</span>
                    <div class="window-controls">
                        <button class="files-btn">Files</button>
                        <button class="more-btn">More</button>
                        <button class="fullscreen-btn">Full Screen</button>
                        <button class="close-btn">Close</button>
                    </div>
                </div>
                <div class="ai-window-body">
                    <div class="visualization-container">
                        <svg width="100%" height="400" class="tree-svg"></svg>
                    </div>
                </div>
            `;
            
            // Replace the summary window with the visualization
            summaryWindow.parentNode.replaceChild(vizContainer, summaryWindow);
            
            // Create D3 visualization
            createD3TreeInline(vizContainer.querySelector('svg'), treeData);
            
            // Add event listeners
            vizContainer.querySelector('.close-btn').addEventListener('click', function() {
                vizContainer.remove();
            });
            
            vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
                toggleFullscreenInline(vizContainer, this);
            });
            
            vizContainer.querySelector('.files-btn').addEventListener('click', toggleFilesPanel);
            
            vizContainer.querySelector('.more-btn').addEventListener('click', toggleMoreOptions);
            
        }, 1500);
    }
    
    // Create D3 tree visualization inline
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
            .attr("transform", d => `translate(${d.y},${d.x})`);
        
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
    
    // Toggle files panel
    function toggleFilesPanel() {
        // This would show a panel with the files used to generate the tree
        // For this prototype, we'll just show an alert
        let filesList = uploadedFiles.map(file => file.name).join(', ');
        alert(`Files used: ${filesList}`);
    }

    // Toggle more options
    function toggleMoreOptions() {
        // This would show additional options like export
        // For this prototype, we'll just show an alert
        alert('Additional options: Export as PNG, Export as SVG, Export as JSON');
    }
    
    // Get mock tree data for demonstration
    function getMockTreeData() {
        return {
            "name": "Document Structure",
            "children": [
                {
                    "name": "Introduction",
                    "children": [
                        {
                            "name": "Background",
                            "children": []
                        },
                        {
                            "name": "Research Questions",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Methodology",
                    "children": [
                        {
                            "name": "Data Collection",
                            "children": [
                                {
                                    "name": "Surveys",
                                    "children": []
                                },
                                {
                                    "name": "Interviews",
                                    "children": []
                                }
                            ]
                        },
                        {
                            "name": "Analysis Techniques",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Results",
                    "children": [
                        {
                            "name": "Key Findings",
                            "children": []
                        },
                        {
                            "name": "Statistical Analysis",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Discussion",
                    "children": [
                        {
                            "name": "Implications",
                            "children": []
                        },
                        {
                            "name": "Limitations",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "Conclusion",
                    "children": []
                }
            ]
        };
    }
});