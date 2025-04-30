/**
 * File Manager Module
 * Handles file/node management operations including create, delete, rename,
 * selection, and content loading/saving
 */

// Create necessary namespaces
WebNotebook.Interface = WebNotebook.Interface || {};
WebNotebook.Interface.FileManager = (function() {
    // Private variables
    let selectedNode = null;
    let documentData = {};
    
    // Node ID counter for generating unique IDs
    let nodeIdCounter = Date.now();
    
    /**
     * Initialize the file manager
     */
    function initialize() {
        console.log('File Manager initialized');
        
        // Load data from storage
        documentData = WebNotebook.Utils.Storage.loadNodesData();
        
        // Initialize node event listeners
        initializeNodeSelection();
        
        // Set up document title and content listeners
        setupDocumentListeners();
        
        // Set up the "New File" button
        document.getElementById('new-file-btn').addEventListener('click', showNewItemModal);
    }
    
    /**
     * Initialize node selection in the tree/icon view
     */
    function initializeNodeSelection() {
        // For tree view nodes
        document.querySelectorAll('.node-content').forEach(node => {
            // Generate a unique ID if not already present
            if (!node.dataset.id) {
                node.dataset.id = generateNodeId();
            }
            
            node.addEventListener('click', function(e) {
                // Only select if not clicking on expand/collapse
                if (!e.target.classList.contains('expand-collapse')) {
                    selectNode(this);
                }
            });
        });
        
        // For icon view nodes
        document.querySelectorAll('.grid-item').forEach(node => {
            // Generate a unique ID if not already present
            if (!node.dataset.id) {
                node.dataset.id = generateNodeId();
            }
            
            node.addEventListener('click', function() {
                selectNode(this);
            });
        });
    }
    
    /**
     * Set up document editing listeners
     */
    function setupDocumentListeners() {
        const documentTitle = document.getElementById('document-title');
        const documentBody = document.getElementById('document-body');
        
        // Title change listener
        documentTitle.addEventListener('input', function() {
            updateBreadcrumb(this.textContent);
        });
        
        // Save on blur
        documentTitle.addEventListener('blur', saveCurrentDocument);
        documentBody.addEventListener('blur', saveCurrentDocument);
    }
    
    /**
     * Generate a unique node ID
     * @returns {string} Unique node ID
     */
    function generateNodeId() {
        return 'node_' + (nodeIdCounter++) + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Select a node and load its content
     * @param {Element} node Node element to select
     */
    function selectNode(node) {
        // Save current document first
        if (selectedNode) {
            saveCurrentDocument();
        }
        
        // Deselect previously selected node
        if (selectedNode) {
            selectedNode.classList.remove('selected');
            
            // Also deselect corresponding node in other view
            const nodeId = selectedNode.dataset.id;
            if (nodeId) {
                const isTreeView = selectedNode.classList.contains('node-content');
                const otherViewNode = isTreeView 
                    ? document.querySelector(`.grid-item[data-id="${nodeId}"]`)
                    : document.querySelector(`.node-content[data-id="${nodeId}"]`);
                
                if (otherViewNode) {
                    otherViewNode.classList.remove('selected');
                }
            }
        }
        
        // Select new node
        node.classList.add('selected');
        selectedNode = node;
        
        // Also select corresponding node in other view
        const nodeId = node.dataset.id;
        if (nodeId) {
            const isTreeView = node.classList.contains('node-content');
            const otherViewNode = isTreeView 
                ? document.querySelector(`.grid-item[data-id="${nodeId}"]`)
                : document.querySelector(`.node-content[data-id="${nodeId}"]`);
            
            if (otherViewNode) {
                otherViewNode.classList.add('selected');
            }
        }
        
        // Update the document content based on the selected node
        loadDocumentContent(node);
    }
    
    /**
     * Load document content based on selected node
     * @param {Element} node Selected node
     */
    function loadDocumentContent(node) {
        const nodeId = node.dataset.id;
        const nodeType = node.getAttribute('data-type');
        const nodeName = node.querySelector('.node-name, .item-name').textContent;
        
        // Update document title
        const documentTitle = document.getElementById('document-title');
        documentTitle.textContent = nodeName;
        
        // Update breadcrumb
        updateBreadcrumb(nodeName);
        
        // Check if we have stored content for this node
        if (documentData[nodeId]) {
            document.getElementById('document-body').innerHTML = documentData[nodeId].content;
            return;
        }
        
        // Otherwise, create default content based on node type
        let content = '';
        
        switch(nodeType) {
            case 'file':
                content = `<h2>${nodeName}</h2><p>This is a file note. You can add your content here.</p>`;
                break;
            case 'knowledge':
                content = `<h2>${nodeName}</h2><p>This is a knowledge note that contains specific information about a concept or topic.</p>`;
                break;
            case 'roadmap':
                content = `<h2>${nodeName}</h2><p>This is a learning roadmap. It represents a structured learning path.</p>
                    <h3>Progress</h3>
                    <div class="progress-tracker">
                        <div class="progress-bar-container">
                            <div class="progress-label">Overall Progress:</div>
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar" style="width: 0%;"></div>
                                <div class="progress-percentage">0%</div>
                            </div>
                        </div>
                    </div>
                    <h3>Learning Steps</h3>
                    <p>Define the key learning steps for this roadmap. Right-click and select "New Knowledge Point" to add steps.</p>`;
                break;
            case 'folder':
                content = `<h2>${nodeName}</h2><p>This is a folder that can contain multiple files and notes.</p>
                    <p>Right-click and select "New File" to add content to this folder.</p>`;
                break;
            case 'ai-note':
                content = `<h2>${nodeName}</h2><p>This is an AI-generated note created by the AI Copilot.</p>`;
                break;
            default:
                content = `<p>Start writing your document here...</p>`;
        }
        
        document.getElementById('document-body').innerHTML = content;
        
        // Store this initial content
        documentData[nodeId] = {
            id: nodeId,
            title: nodeName,
            type: nodeType,
            content: content,
            status: node.getAttribute('data-status') || 'not-started',
            lastModified: new Date().toISOString()
        };
        
        // Save to storage
        WebNotebook.Utils.Storage.saveNodesData(documentData);
    }
    
    /**
     * Save the current document's content
     */
    function saveCurrentDocument() {
        if (!selectedNode) return;
        
        const nodeId = selectedNode.dataset.id;
        if (!nodeId) return;
        
        const title = document.getElementById('document-title').textContent;
        const content = document.getElementById('document-body').innerHTML;
        
        // Store in our data object
        if (!documentData[nodeId]) {
            documentData[nodeId] = {
                id: nodeId,
                type: selectedNode.getAttribute('data-type') || 'file',
                status: selectedNode.getAttribute('data-status') || 'not-started'
            };
        }
        
        documentData[nodeId].title = title;
        documentData[nodeId].content = content;
        documentData[nodeId].lastModified = new Date().toISOString();
        
        // Save to storage
        WebNotebook.Utils.Storage.saveNodesData(documentData);
        
        // Update node name if changed
        const nodeName = selectedNode.querySelector('.node-name, .item-name');
        if (nodeName && nodeName.textContent !== title) {
            nodeName.textContent = title;
            
            // Update in other view too
            const isTreeView = selectedNode.classList.contains('node-content');
            const otherViewNode = isTreeView 
                ? document.querySelector(`.grid-item[data-id="${nodeId}"] .item-name`)
                : document.querySelector(`.node-content[data-id="${nodeId}"] .node-name`);
            
            if (otherViewNode) {
                otherViewNode.textContent = title;
            }
        }
    }
    
    /**
     * Update the breadcrumb with the current document path
     * @param {string} title Document title
     */
    function updateBreadcrumb(title) {
        const currentTitle = document.querySelector('.file-title.current');
        if (currentTitle) {
            currentTitle.textContent = title || 'Untitled Document';
        }
        
        // If selected node has a parent folder, update the parent part of breadcrumb
        if (selectedNode) {
            const isTreeView = selectedNode.classList.contains('node-content');
            if (isTreeView) {
                const treeNode = selectedNode.closest('.tree-node');
                if (treeNode) {
                    const parentNode = treeNode.parentElement.closest('.tree-node');
                    if (parentNode) {
                        const parentName = parentNode.querySelector('.node-name').textContent;
                        const parentTitle = document.querySelector('.file-title:not(.current)');
                        if (parentTitle) {
                            parentTitle.textContent = parentName;
                        }
                    } else {
                        // If no parent, reset the first part of breadcrumb
                        const parentTitle = document.querySelector('.file-title:not(.current)');
                        if (parentTitle) {
                            parentTitle.textContent = 'My Notebook';
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Create a new node (file, folder, knowledge point, roadmap)
     * @param {string} name Node name
     * @param {string} type Node type
     * @param {Element|null} parent Parent node element
     * @returns {string} The ID of the new node
     */
    function createNode(name, type, parent = null) {
        // Generate a unique ID
        const nodeId = generateNodeId();
        
        // Create node for tree view
        const treeNode = document.createElement('li');
        treeNode.className = 'tree-node';
        
        let nodeIcon = '';
        switch(type) {
            case 'file': nodeIcon = '📄'; break;
            case 'folder': nodeIcon = '📁'; break;
            case 'knowledge': nodeIcon = '💡'; break;
            case 'roadmap': nodeIcon = '🗺️'; break;
            case 'ai-note': nodeIcon = '🤖'; break;
        }
        
        treeNode.innerHTML = `
            <div class="node-content" data-type="${type}" data-id="${nodeId}">
                ${(type === 'folder' || type === 'roadmap' || type === 'knowledge') ? '<span class="expand-collapse">▶</span>' : '<span style="width: 15px; display: inline-block;"></span>'}
                <span class="node-icon">${nodeIcon}</span>
                <span class="node-name">${name}</span>
            </div>
            ${(type === 'folder' || type === 'roadmap' || type === 'knowledge') ? '<ul class="node-children" style="display: none;"></ul>' : ''}
        `;
        
        // Add to parent if provided, otherwise to root
        if (parent) {
            // Make sure parent is a folder or roadmap or knowledge
            const parentType = parent.getAttribute('data-type');
            if (parentType === 'folder' || parentType === 'roadmap' || parentType === 'knowledge') {
                const childrenContainer = parent.nextElementSibling;
                if (childrenContainer && childrenContainer.classList.contains('node-children')) {
                    childrenContainer.appendChild(treeNode);
                    
                    // Expand parent if not already expanded
                    const expandCollapse = parent.querySelector('.expand-collapse');
                    if (expandCollapse && !expandCollapse.classList.contains('expanded')) {
                        childrenContainer.style.display = 'block';
                        expandCollapse.classList.add('expanded');
                        expandCollapse.textContent = '▼';
                    }
                }
            } else {
                // If parent is not a folder, roadmap, or knowledge, add to root
                document.querySelector('.tree-root').appendChild(treeNode);
            }
        } else {
            document.querySelector('.tree-root').appendChild(treeNode);
        }
        
        // Create node for icon view if appropriate 
        if (type === 'folder' || type === 'roadmap' || type === 'file' || parent === null) {
            const iconViewContainer = document.querySelector('.knowledge-view.icon-view');
            
            // Find or create the appropriate section
            let sectionTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            let section = Array.from(iconViewContainer.querySelectorAll('.grid-section-title')).find(title => title.textContent === sectionTitle)?.parentElement;
            
            if (!section) {
                section = document.createElement('div');
                section.className = 'grid-section';
                section.innerHTML = `
                    <h3 class="grid-section-title">${sectionTitle}</h3>
                    <div class="grid-items"></div>
                `;
                iconViewContainer.appendChild(section);
            }
            
            // Create grid item
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            gridItem.setAttribute('data-type', type);
            gridItem.setAttribute('data-id', nodeId);
            
            gridItem.innerHTML = `
                <div class="item-icon">${nodeIcon}</div>
                <div class="item-name">${name}</div>
            `;
            
            // Add to section
            section.querySelector('.grid-items').appendChild(gridItem);
        }
        
        // Initialize event listeners for the new nodes
        initializeNodeSelection();
        
        // Store node data
        documentData[nodeId] = {
            id: nodeId,
            title: name,
            type: type,
            content: '',
            parentId: parent ? parent.dataset.id : null,
            status: 'not-started',
            lastModified: new Date().toISOString(),
            dateCreated: new Date().toISOString()
        };
        
        // Save to storage
        WebNotebook.Utils.Storage.saveNodesData(documentData);
        
        return nodeId;
    }
    
    /**
     * Delete a node and its children (if any)
     * @param {Element} node Node element to delete
     */
    function deleteNode(node) {
        if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) {
            return;
        }
        
        const nodeId = node.dataset.id;
        const isTreeView = node.classList.contains('node-content');
        
        // Remove from tree view
        if (isTreeView) {
            const treeNode = node.closest('.tree-node');
            if (treeNode) {
                // First, check if it has children and delete their data too
                const childrenContainer = treeNode.querySelector('.node-children');
                if (childrenContainer) {
                    const childNodes = childrenContainer.querySelectorAll('.node-content');
                    childNodes.forEach(childNode => {
                        const childId = childNode.dataset.id;
                        if (childId && documentData[childId]) {
                            delete documentData[childId];
                        }
                    });
                }
                // Then remove the tree node itself
                treeNode.remove();
            }
        } else {
            // Remove from icon view
            node.remove();
        }
        
        // Remove corresponding node in other view
        if (nodeId) {
            if (isTreeView) {
                const iconViewNode = document.querySelector(`.grid-item[data-id="${nodeId}"]`);
                if (iconViewNode) {
                    iconViewNode.remove();
                }
            } else {
                const treeViewNode = document.querySelector(`.node-content[data-id="${nodeId}"]`);
                if (treeViewNode) {
                    const treeNode = treeViewNode.closest('.tree-node');
                    if (treeNode) {
                        // Delete children data from storage first
                        const childrenContainer = treeNode.querySelector('.node-children');
                        if (childrenContainer) {
                            const childNodes = childrenContainer.querySelectorAll('.node-content');
                            childNodes.forEach(childNode => {
                                const childId = childNode.dataset.id;
                                if (childId && documentData[childId]) {
                                    delete documentData[childId];
                                }
                            });
                        }
                        // Then remove the node
                        treeNode.remove();
                    }
                }
            }
            
            // Remove document data
            if (documentData[nodeId]) {
                delete documentData[nodeId];
                WebNotebook.Utils.Storage.saveNodesData(documentData);
            }
        }
        
        // If the deleted node was selected, reset the editor
        if (node === selectedNode || node.dataset.id === selectedNode?.dataset.id) {
            selectedNode = null;
            document.getElementById('document-title').textContent = 'Untitled Document';
            document.getElementById('document-body').innerHTML = '<p>Start writing your document here...</p>';
            updateBreadcrumb('Untitled Document');
        }
    }
    
    /**
     * Rename a node
     * @param {Element} node Node element to rename
     */
    function renameNode(node) {
        const nodeName = node.querySelector('.node-name, .item-name');
        const currentName = nodeName.textContent;
        
        const newName = prompt('Enter new name:', currentName);
        if (newName && newName.trim() !== '') {
            // Update node name
            nodeName.textContent = newName;
            
            // Update corresponding node in other view
            const nodeId = node.dataset.id;
            if (nodeId) {
                const isTreeView = node.classList.contains('node-content');
                const otherViewNode = isTreeView 
                    ? document.querySelector(`.grid-item[data-id="${nodeId}"] .item-name`)
                    : document.querySelector(`.node-content[data-id="${nodeId}"] .node-name`);
                
                if (otherViewNode) {
                    otherViewNode.textContent = newName;
                }
                
                // Update stored document data
                if (documentData[nodeId]) {
                    documentData[nodeId].title = newName;
                    WebNotebook.Utils.Storage.saveNodesData(documentData);
                }
            }
            
            // Update document title if this is the selected node
            if (node === selectedNode || node.dataset.id === selectedNode?.dataset.id) {
                document.getElementById('document-title').textContent = newName;
                updateBreadcrumb(newName);
            }
        }
    }
    
    /**
     * Update the status of a node (completed, in-progress, not-started)
     * @param {Element} node Node element to update
     * @param {string} status New status ('completed', 'in-progress', 'not-started')
     */
    function updateNodeStatus(node, status) {
        const nodeId = node.dataset.id;
        
        // Update data attribute
        node.setAttribute('data-status', status);
        
        // Add or update status indicator
        let statusIndicator = node.querySelector('.status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('span');
            statusIndicator.className = 'status-indicator';
            node.appendChild(statusIndicator);
        }
        
        // Clear existing classes and add the new one
        statusIndicator.className = 'status-indicator ' + status;
        
        // Update indicator content
        switch(status) {
            case 'completed':
                statusIndicator.textContent = '✅';
                break;
            case 'in-progress':
                statusIndicator.textContent = '🕓';
                break;
            case 'not-started':
                statusIndicator.textContent = '❌';
                break;
        }
        
        // Update corresponding node in other view
        if (nodeId) {
            const isTreeView = node.classList.contains('node-content');
            const otherViewNode = isTreeView 
                ? document.querySelector(`.grid-item[data-id="${nodeId}"]`)
                : document.querySelector(`.node-content[data-id="${nodeId}"]`);
            
            if (otherViewNode) {
                // Update data attribute
                otherViewNode.setAttribute('data-status', status);
                
                // Add or update status indicator
                let otherStatusIndicator = otherViewNode.querySelector('.status-indicator');
                if (!otherStatusIndicator) {
                    otherStatusIndicator = document.createElement('span');
                    otherStatusIndicator.className = 'status-indicator';
                    otherViewNode.appendChild(otherStatusIndicator);
                }
                
                // Clear existing classes and add the new one
                otherStatusIndicator.className = 'status-indicator ' + status;
                
                // Update indicator content based on status
                switch(status) {
                    case 'completed':
                        otherStatusIndicator.textContent = '✅';
                        break;
                    case 'in-progress':
                        otherStatusIndicator.textContent = '🕓';
                        break;
                    case 'not-started':
                        otherStatusIndicator.textContent = '❌';
                        break;
                }
            }
        }
        
        // Update stored document data
        if (nodeId && documentData[nodeId]) {
            documentData[nodeId].status = status;
            WebNotebook.Utils.Storage.saveNodesData(documentData);
        }
        
        // If this is a roadmap, update progress bar
        if (node.getAttribute('data-type') === 'roadmap') {
            WebNotebook.Interface.RoadmapTracker.updateRoadmapProgress(node);
        }
    }
    
    /**
     * Show the modal dialog for creating a new item
     * @param {string} type Optional type to preselect ('file', 'folder', 'knowledge', 'roadmap')
     * @param {Element} parentNode Optional parent node
     */
    function showNewItemModal(type = null, parentNode = null) {
        const modal = document.getElementById('new-item-modal');
        
        // Initialize if not already done
        if (!modal.dataset.initialized) {
            initializeNewItemDialog();
            modal.dataset.initialized = 'true';
        }
        
        modal.style.display = 'flex';
        
        // Clear previous values
        document.getElementById('new-item-name').value = '';
        document.querySelectorAll('.item-type').forEach(t => t.classList.remove('selected'));
        
        // Preselect type if provided
        if (type) {
            const typeElement = document.querySelector(`.item-type[data-type="${type}"]`);
            if (typeElement) {
                typeElement.classList.add('selected');
            }
        }
        
        // Set parent node if provided
        if (parentNode) {
            modal.dataset.parentNodeId = parentNode.dataset.id || '';
        } else {
            modal.dataset.parentNodeId = '';
        }
        
        // Focus on the name input
        document.getElementById('new-item-name').focus();
    }
    
    /**
     * Initialize the New Item Dialog
     */
    function initializeNewItemDialog() {
        // Item type selection
        document.querySelectorAll('.item-type').forEach(type => {
            type.addEventListener('click', function() {
                // Deselect all types
                document.querySelectorAll('.item-type').forEach(t => t.classList.remove('selected'));
                
                // Select this type
                this.classList.add('selected');
            });
        });
        
        // Create button
        document.getElementById('create-item-btn').addEventListener('click', createNewItem);
        
        // Cancel button and close icon
        const closeElements = document.querySelectorAll('#new-item-modal .close-modal-btn, #new-item-modal .cancel-btn');
        closeElements.forEach(el => {
            el.addEventListener('click', function() {
                document.getElementById('new-item-modal').style.display = 'none';
            });
        });
        
        // Handle Enter key in name input
        document.getElementById('new-item-name').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                createNewItem();
            }
        });
    }
    
    /**
     * Create a new item based on dialog input
     */
    function createNewItem() {
        // Get values from form
        const nameInput = document.getElementById('new-item-name');
        const itemName = nameInput.value.trim();
        
        if (!itemName) {
            alert('Please enter a name for the item');
            return;
        }
        
        // Get selected type
        const selectedType = document.querySelector('.item-type.selected');
        if (!selectedType) {
            alert('Please select an item type');
            return;
        }
        
        const itemType = selectedType.getAttribute('data-type');
        
        // Get parent node if one was set
        const modal = document.getElementById('new-item-modal');
        const parentNodeId = modal.dataset.parentNodeId;
        
        let parentNode = null;
        if (parentNodeId) {
            parentNode = document.querySelector(`.node-content[data-id="${parentNodeId}"]`);
        }
        
        // Create the new node
        const newNodeId = createNode(itemName, itemType, parentNode);
        
        // Close modal
        modal.style.display = 'none';
        
        // Select the new node
        const newNode = document.querySelector(`.node-content[data-id="${newNodeId}"]`);
        if (newNode) {
            selectNode(newNode);
        }
    }
    
    /**
     * Get the currently selected node
     * @returns {Element|null} The currently selected node
     */
    function getSelectedNode() {
        return selectedNode;
    }
    
    // Public API
    return {
        initialize,
        selectNode,
        saveCurrentDocument,
        updateBreadcrumb,
        createNode,
        deleteNode,
        renameNode,
        updateNodeStatus,
        showNewItemModal,
        getSelectedNode
    };
})();