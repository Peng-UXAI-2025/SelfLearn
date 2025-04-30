/**
 * Text Processor Module
 * Processes clipboard text and provides roadmap functionality
 */

(function() {
    // Create text processor namespace
    window.textProcessor = {};
    
    // Store roadmap data
    let roadMap = [];
    
    /**
     * Process clipboard text
     * @param {string} text - Text to process
     * @param {string} action - Processing action (summarize, qa, tree-node)
     * @param {HTMLElement} windowElement - Window element
     */
    window.textProcessor.processText = async function(text, action, windowElement) {
        if (!text || !text.trim()) {
            window.knowledgeApi.showStatusMessage("No text to process", true, windowElement);
            return;
        }
        
        // Create loading indicator
        const loadingIndicator = window.utils.createLoadingIndicator();
        const contentArea = windowElement.querySelector('.clipboard-content');
        contentArea.appendChild(loadingIndicator);
        
        try {
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 20,
                status: `Processing text with ${action} action...`
            });
            
            // Get selected model
            const model = window.webNotebook.app.selectedModel;
            
            // Process with API based on action
            const processedText = await window.knowledgeApi.processClipboardText(text, action, model);
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 90,
                status: "Creating result..."
            });
            
            // Show processed result
            showProcessingResult(windowElement, processedText, action);
            
            // Save to history with processed result
            window.storage.saveClipboardItem(text, processedText);
            
            // Update progress
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 100,
                status: "Processing complete!"
            });
            
            // Remove loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 1000);
        } catch (error) {
            console.error("Error processing text:", error);
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 0,
                status: `Error: ${error.message}`,
                error: true
            });
            
            // Remove loading indicator after error delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 5000);
        }
    };
    
    /**
     * Process text with custom prompt
     * @param {string} text - Text to process
     * @param {string} customPrompt - Custom processing prompt
     * @param {HTMLElement} windowElement - Window element
     */
    window.textProcessor.processTextWithCustomPrompt = async function(text, customPrompt, windowElement) {
        if (!text || !text.trim()) {
            window.knowledgeApi.showStatusMessage("No text to process", true, windowElement);
            return;
        }
        
        if (!customPrompt || !customPrompt.trim()) {
            window.knowledgeApi.showStatusMessage("No custom prompt provided", true, windowElement);
            return;
        }
        
        // Create loading indicator
        const loadingIndicator = window.utils.createLoadingIndicator();
        const contentArea = windowElement.querySelector('.clipboard-content');
        contentArea.appendChild(loadingIndicator);
        
        try {
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 20,
                status: "Processing text with custom prompt..."
            });
            
            // Get selected model
            const model = window.webNotebook.app.selectedModel;
            
            // Process with API based on custom prompt
            const processedText = await window.knowledgeApi.processTextWithCustomPrompt(text, customPrompt, model);
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 90,
                status: "Creating result..."
            });
            
            // Show processed result
            showProcessingResult(windowElement, processedText, 'custom');
            
            // Save to history with processed result
            window.storage.saveClipboardItem(text, processedText);
            
            // Update progress
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 100,
                status: "Processing complete!"
            });
            
            // Remove loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 1000);
        } catch (error) {
            console.error("Error processing text with custom prompt:", error);
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 0,
                status: `Error: ${error.message}`,
                error: true
            });
            
            // Remove loading indicator after error delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 5000);
        }
    };
    
    /**
     * Show processing result
     * @param {HTMLElement} windowElement - Window element
     * @param {string} processedText - Processed text
     * @param {string} action - Processing action
     */
    function showProcessingResult(windowElement, processedText, action) {
        // Check if result panel already exists
        let resultPanel = windowElement.querySelector('.processing-result-panel');
        
        if (!resultPanel) {
            // Create result panel
            resultPanel = document.createElement('div');
            resultPanel.className = 'processing-result-panel';
            
            // Add to window
            windowElement.querySelector('.ai-window-body').appendChild(resultPanel);
        }
        
        // Create result title based on action
        let resultTitle = "Processing Result";
        switch (action) {
            case 'summarize':
                resultTitle = "Summary";
                break;
            case 'qa':
                resultTitle = "Question & Answer Format";
                break;
            case 'tree-node':
                resultTitle = "Knowledge Tree Node";
                break;
            case 'custom':
                resultTitle = "Custom Processing Result";
                break;
        }
        
        // Update result panel
        resultPanel.innerHTML = `
            <div class="result-header">${resultTitle}</div>
            <div class="result-content">${processedText}</div>
            <div class="result-actions">
                <button class="save-result-btn">Add to Document</button>
                <button class="discard-result-btn">Discard</button>
            </div>
        `;
        
        // Show the panel
        resultPanel.style.display = 'block';
        
        // Add action handlers
        resultPanel.querySelector('.save-result-btn').addEventListener('click', function() {
            // Add to document
            addProcessedTextToDocument(processedText, resultTitle);
            
            // Hide panel
            resultPanel.style.display = 'none';
        });
        
        resultPanel.querySelector('.discard-result-btn').addEventListener('click', function() {
            // Hide panel
            resultPanel.style.display = 'none';
        });
    }
    
    /**
     * Add processed text to document
     * @param {string} text - Processed text
     * @param {string} title - Section title
     */
    function addProcessedTextToDocument(text, title) {
        // Get document body
        const docBody = document.getElementById('document-body');
        
        // Create container for processed text
        const container = document.createElement('div');
        container.className = 'processed-content';
        
        // Add title and content
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        
        const contentElement = document.createElement('div');
        contentElement.innerHTML = text;
        
        container.appendChild(titleElement);
        container.appendChild(contentElement);
        
        // Add to document
        docBody.appendChild(container);
        
        // Save document
        const docTitle = document.getElementById('document-title').textContent;
        window.storage.saveDocument(docTitle, docBody.innerHTML);
        
        // Show confirmation message
        window.knowledgeApi.showStatusMessage("Content added to document");
    }
    
    /**
     * Initialize road map with data
     * @param {Array} data - Road map data array
     */
    window.textProcessor.initializeRoadMap = function(data) {
        if (Array.isArray(data)) {
            roadMap = data;
        }
    };
    
    /**
     * Show road map sidebar
     */
    window.textProcessor.showRoadMap = function() {
        const sidebar = document.getElementById('roadmap-sidebar');
        
        if (sidebar) {
            sidebar.style.display = 'flex';
            updateRoadMapDisplay();
        }
    };
    
    /**
     * Hide road map sidebar
     */
    window.textProcessor.hideRoadMap = function() {
        const sidebar = document.getElementById('roadmap-sidebar');
        
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    };
    
    /**
     * Add road map item
     * @param {string} title - Item title
     * @param {string} description - Item description
     * @param {number} progress - Progress percentage (0-100)
     * @param {number} parentId - Optional parent ID for nested items
     * @returns {number} - New item ID
     */
    window.textProcessor.addRoadMapItem = function(title, description, progress = 0, parentId = null) {
        const newItem = {
            id: Date.now(),
            title: title,
            description: description,
            progress: progress,
            parentId: parentId,
            children: []
        };
        
        if (parentId) {
            // Find parent and add as child
            const parent = findRoadMapItem(parentId);
            if (parent) {
                parent.children.push(newItem);
            } else {
                // If parent not found, add as top-level item
                roadMap.push(newItem);
            }
        } else {
            // Add as top-level item
            roadMap.push(newItem);
        }
        
        // Save road map
        window.storage.saveRoadMap(roadMap);
        
        // Update display
        updateRoadMapDisplay();
        
        return newItem.id;
    };
    
    /**
     * Update road map item
     * @param {number} id - Item ID
     * @param {Object} updates - Properties to update
     * @returns {boolean} - Success status
     */
    window.textProcessor.updateRoadMapItem = function(id, updates) {
        const item = findRoadMapItem(id);
        
        if (!item) {
            return false;
        }
        
        // Update properties
        if (updates.title !== undefined) item.title = updates.title;
        if (updates.description !== undefined) item.description = updates.description;
        if (updates.progress !== undefined) item.progress = updates.progress;
        
        // Save road map
        window.storage.saveRoadMap(roadMap);
        
        // Update display
        updateRoadMapDisplay();
        
        return true;
    };
    
    /**
     * Delete road map item
     * @param {number} id - Item ID
     * @returns {boolean} - Success status
     */
    window.textProcessor.deleteRoadMapItem = function(id) {
        // Handle top-level items
        for (let i = 0; i < roadMap.length; i++) {
            if (roadMap[i].id === id) {
                roadMap.splice(i, 1);
                
                // Save road map
                window.storage.saveRoadMap(roadMap);
                
                // Update display
                updateRoadMapDisplay();
                
                return true;
            }
        }
        
        // Handle nested items
        for (const item of roadMap) {
            if (deleteChildItem(item, id)) {
                // Save road map
                window.storage.saveRoadMap(roadMap);
                
                // Update display
                updateRoadMapDisplay();
                
                return true;
            }
        }
        
        return false;
    };
    
    /**
     * Delete child item recursively
     * @param {Object} parent - Parent item
     * @param {number} id - Item ID to delete
     * @returns {boolean} - Success status
     */
    function deleteChildItem(parent, id) {
        if (!parent.children) return false;
        
        for (let i = 0; i < parent.children.length; i++) {
            if (parent.children[i].id === id) {
                parent.children.splice(i, 1);
                return true;
            }
            
            if (deleteChildItem(parent.children[i], id)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Find road map item by ID
     * @param {number} id - Item ID
     * @returns {Object|null} - Found item or null
     */
    function findRoadMapItem(id) {
        // Helper function to search recursively
        function findItem(items) {
            for (const item of items) {
                if (item.id === id) {
                    return item;
                }
                
                if (item.children && item.children.length > 0) {
                    const found = findItem(item.children);
                    if (found) return found;
                }
            }
            
            return null;
        }
        
        return findItem(roadMap);
    }
    
    /**
     * Update road map display
     */
    function updateRoadMapDisplay() {
        const itemsContainer = document.getElementById('roadmap-items');
        if (!itemsContainer) return;
        
        itemsContainer.innerHTML = '';
        
        if (roadMap.length === 0) {
            itemsContainer.innerHTML = '<p>No items in road map. Click "Add Item" to create one.</p>';
            return;
        }
        
        // Render items recursively
        function renderItems(items, level = 0) {
            const list = document.createElement('ul');
            list.className = 'roadmap-items-list';
            list.style.paddingLeft = level > 0 ? '20px' : '0';
            list.style.listStyle = 'none';
            
            items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'roadmap-item';
                listItem.dataset.id = item.id;
                
                // Create progress bar
                const progressBar = document.createElement('div');
                progressBar.className = 'roadmap-progress-bar';
                progressBar.innerHTML = `
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                    <span class="progress-text">${item.progress}%</span>
                `;
                
                // Create item content
                listItem.innerHTML = `
                    <div class="roadmap-item-header">
                        <h4>${item.title}</h4>
                        <div class="roadmap-item-actions">
                            <button class="edit-item-btn">Edit</button>
                            <button class="delete-item-btn">Delete</button>
                        </div>
                    </div>
                    <p class="roadmap-item-description">${item.description}</p>
                `;
                
                // Insert progress bar
                listItem.querySelector('.roadmap-item-header').after(progressBar);
                
                // Add action handlers
                listItem.querySelector('.edit-item-btn').addEventListener('click', function() {
                    editRoadMapItem(item);
                });
                
                listItem.querySelector('.delete-item-btn').addEventListener('click', function() {
                    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                        window.textProcessor.deleteRoadMapItem(item.id);
                    }
                });
                
                // Add to list
                list.appendChild(listItem);
                
                // Add children if any
                if (item.children && item.children.length > 0) {
                    const childrenList = renderItems(item.children, level + 1);
                    listItem.appendChild(childrenList);
                }
            });
            
            return list;
        }
        
        itemsContainer.appendChild(renderItems(roadMap));
        
        // Add CSS if not already present
        if (!document.getElementById('roadmap-styles')) {
            const style = document.createElement('style');
            style.id = 'roadmap-styles';
            style.textContent = `
                .roadmap-items-list {
                    margin: 0;
                    padding: 0;
                }
                .roadmap-item {
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                    border-left: 3px solid #233749;
                }
                .roadmap-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .roadmap-item-header h4 {
                    margin: 0;
                }
                .roadmap-item-actions {
                    display: flex;
                    gap: 5px;
                }
                .roadmap-item-actions button {
                    padding: 3px 8px;
                    font-size: 12px;
                    border-radius: 3px;
                    border: 1px solid #ddd;
                    background-color: #fff;
                    cursor: pointer;
                }
                .roadmap-item-description {
                    margin: 5px 0 10px;
                    font-size: 14px;
                }
                .roadmap-progress-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 5px 0;
                }
                .progress-track {
                    flex: 1;
                    height: 8px;
                    background-color: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background-color: #233749;
                    border-radius: 4px;
                }
                .progress-text {
                    font-size: 12px;
                    color: #555;
                    width: 40px;
                    text-align: right;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Edit road map item
     * @param {Object} item - Item to edit
     */
    function editRoadMapItem(item) {
        // Create modal for editing
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Road Map Item</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="item-title">Title:</label>
                        <input type="text" id="item-title" value="${item.title}">
                    </div>
                    <div class="form-group">
                        <label for="item-description">Description:</label>
                        <textarea id="item-description">${item.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="item-progress">Progress (${item.progress}%):</label>
                        <input type="range" id="item-progress" min="0" max="100" value="${item.progress}">
                        <span id="progress-value">${item.progress}%</span>
                    </div>
                    <div class="form-actions">
                        <button id="save-item-btn">Save Changes</button>
                        <button id="cancel-edit-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Update progress value display
        const progressInput = modal.querySelector('#item-progress');
        const progressValue = modal.querySelector('#progress-value');
        progressInput.addEventListener('input', function() {
            progressValue.textContent = this.value + '%';
        });
        
        // Close button
        modal.querySelector('.modal-close-btn').addEventListener('click', function() {
            modal.remove();
        });
        
        // Cancel button
        modal.querySelector('#cancel-edit-btn').addEventListener('click', function() {
            modal.remove();
        });
        
        // Save button
        modal.querySelector('#save-item-btn').addEventListener('click', function() {
            const title = modal.querySelector('#item-title').value.trim();
            const description = modal.querySelector('#item-description').value.trim();
            const progress = parseInt(modal.querySelector('#item-progress').value);
            
            if (!title) {
                alert('Title is required');
                return;
            }
            
            window.textProcessor.updateRoadMapItem(item.id, {
                title: title,
                description: description,
                progress: progress
            });
            
            modal.remove();
        });
        
        // Close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add form styles if not present
        if (!document.getElementById('form-styles')) {
            const style = document.createElement('style');
            style.id = 'form-styles';
            style.textContent = `
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input[type="text"],
                .form-group textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .form-group textarea {
                    height: 100px;
                    resize: vertical;
                }
                .form-group input[type="range"] {
                    width: 80%;
                    vertical-align: middle;
                }
                #progress-value {
                    display: inline-block;
                    width: 15%;
                    text-align: right;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                .form-actions button {
                    padding: 8px 15px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                }
                #save-item-btn {
                    background-color: #233749;
                    color: white;
                }
                #cancel-edit-btn {
                    background-color: #f5f5f5;
                    border: 1px solid #ddd;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Load road map on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Load road map data from storage
        const savedRoadMap = window.storage.getRoadMap();
        if (savedRoadMap) {
            roadMap = savedRoadMap;
        }
        
        // Set up road map sidebar buttons
        const showRoadMapBtn = document.getElementById('show-roadmap-btn');
        if (showRoadMapBtn) {
            showRoadMapBtn.addEventListener('click', window.textProcessor.showRoadMap);
        }
        
        const closeRoadMapBtn = document.querySelector('.close-roadmap-btn');
        if (closeRoadMapBtn) {
            closeRoadMapBtn.addEventListener('click', window.textProcessor.hideRoadMap);
        }
        
        const addRoadMapItemBtn = document.getElementById('add-roadmap-item-btn');
        if (addRoadMapItemBtn) {
            addRoadMapItemBtn.addEventListener('click', function() {
                // Open modal to add new item
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add Road Map Item</h3>
                            <button class="modal-close-btn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="new-item-title">Title:</label>
                                <input type="text" id="new-item-title" placeholder="Enter title">
                            </div>
                            <div class="form-group">
                                <label for="new-item-description">Description:</label>
                                <textarea id="new-item-description" placeholder="Enter description"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="new-item-progress">Progress:</label>
                                <input type="range" id="new-item-progress" min="0" max="100" value="0">
                                <span id="new-progress-value">0%</span>
                            </div>
                            <div class="form-actions">
                                <button id="add-new-item-btn">Add Item</button>
                                <button id="cancel-add-btn">Cancel</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Update progress value display
                const progressInput = modal.querySelector('#new-item-progress');
                const progressValue = modal.querySelector('#new-progress-value');
                progressInput.addEventListener('input', function() {
                    progressValue.textContent = this.value + '%';
                });
                
                // Close button
                modal.querySelector('.modal-close-btn').addEventListener('click', function() {
                    modal.remove();
                });
                
                // Cancel button
                modal.querySelector('#cancel-add-btn').addEventListener('click', function() {
                    modal.remove();
                });
                
                // Add button
                modal.querySelector('#add-new-item-btn').addEventListener('click', function() {
                    const title = modal.querySelector('#new-item-title').value.trim();
                    const description = modal.querySelector('#new-item-description').value.trim();
                    const progress = parseInt(modal.querySelector('#new-item-progress').value);
                    
                    if (!title) {
                        alert('Title is required');
                        return;
                    }
                    
                    window.textProcessor.addRoadMapItem(title, description, progress);
                    modal.remove();
                });
                
                // Close when clicking outside
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            });
        }
        
        const editRoadMapBtn = document.getElementById('edit-roadmap-btn');
        if (editRoadMapBtn) {
            editRoadMapBtn.addEventListener('click', function() {
                // Show edit mode
                const items = document.querySelectorAll('.roadmap-item-actions');
                items.forEach(item => {
                    item.style.display = item.style.display === 'flex' ? 'none' : 'flex';
                });
                
                // Toggle button text
                this.textContent = this.textContent === 'Edit Road Map' ? 'Done Editing' : 'Edit Road Map';
            });
        }
    });
})();