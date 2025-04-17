/**
 * Main script file for Web Notebook
 * Handles document editing and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    window.uploadedFiles = []; // Store uploaded files
    let isDragging = false;
    let startY, currentDragTarget;
    let dragPlaceholder = null;
    let dropTarget = null;
    let selectedNode = null; // Currently selected node
    
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
                    this.classList.toggle('active');
                } else if (title === 'Italic') {
                    document.execCommand('italic', false, null);
                    this.classList.toggle('active');
                } else if (title === 'Underline') {
                    document.execCommand('underline', false, null);
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
                // Use the API version from the integration module
                if (typeof window.generateTreeInline === 'function') {
                    window.generateTreeInline(windowElement);
                }
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
                const selectedModel = this.getAttribute('data-model');
                
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
        // Clear previous files if needed
        // window.uploadedFiles = []; // Uncomment to replace instead of append
        
        for (let file of files) {
            // Check file type
            if (file.type === 'application/pdf' || 
                file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'text/plain') {
                
                // Check if file already exists in the array
                const fileExists = window.uploadedFiles.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (!fileExists) {
                    // Add to uploaded files array
                    window.uploadedFiles.push(file);
                    
                    // Display in UI
                    displayUploadedFile(file);
                }
            } else {
                alert('Please upload PDF, Word, or text documents only.');
            }
        }
        
        // Update files list in manage files dropdown
        updateFilesDropdown();
        
        // Enable generate button if files were uploaded
        if (window.uploadedFiles.length > 0) {
            const generateBtn = document.querySelector('#generate-btn');
            if (generateBtn) {
                generateBtn.classList.remove('disabled');
            }
        }
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
        window.uploadedFiles = window.uploadedFiles.filter(file => file.name !== fileName);
        
        // Update files dropdown
        updateFilesDropdown();
        
        // Disable generate button if no files left
        if (window.uploadedFiles.length === 0) {
            const generateBtn = document.querySelector('#generate-btn');
            if (generateBtn) {
                generateBtn.classList.add('disabled');
            }
        }
    }

    // Update files in the manage files dropdown
    function updateFilesDropdown() {
        const filesList = document.querySelector('.files-dropdown .files-list');
        
        if (!filesList) return;
        
        if (window.uploadedFiles.length === 0) {
            filesList.textContent = 'No files uploaded';
            return;
        }
        
        filesList.innerHTML = '';
        window.uploadedFiles.forEach(file => {
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
    
    // Helper function to download files (for exports)
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
    
    // Expose utility functions to the global scope for other modules to use
    window.notebookUI = {
        handleDragStart,
        downloadFile,
        toggleMoreOptionsPanel: function(container) {
            const optionsPanel = container.querySelector('.more-options-panel');
            if (optionsPanel) {
                optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
            }
        }
    };
});