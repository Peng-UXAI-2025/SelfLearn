/**
 * Web Notebook Application
 * Main JavaScript file that initializes the application and handles core functionality
 */

// Global variables
let currentViewMode = 'tree'; // 'tree' or 'icon'
let selectedNode = null;
let isDragging = false;
let draggedNode = null;
let documentData = {}; // Store document content

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Web Notebook initialized');
    
    // Initialize main components
    initializeInterface();
    initializeContextMenu();
    initializeAITools();
    
    // Add event listeners to elements
    addEventListeners();
});

/**
 * Initialize the user interface
 */
function initializeInterface() {
    // Set up view mode switching
    document.getElementById('tree-view-btn').addEventListener('click', function() {
        switchViewMode('tree');
    });
    
    document.getElementById('icon-view-btn').addEventListener('click', function() {
        switchViewMode('icon');
    });
    
    // Initialize sidebar toggle
    document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
    
    // Initialize file/node selection
    initializeNodeSelection();
}

/**
 * Add event listeners to various UI elements
 */
function addEventListeners() {
    // Header elements
    document.getElementById('document-title').addEventListener('input', updateBreadcrumb);
    document.getElementById('document-title').addEventListener('blur', saveCurrentDocument);
    
    // Sidebar actions
    document.getElementById('new-file-btn').addEventListener('click', showNewItemModal);
    document.getElementById('search-btn').addEventListener('click', toggleSearch);
    
    // Formatting tools
    initializeFormattingTools();
    
    // Modal close buttons
    document.querySelectorAll('.close-modal-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // AI dropdown
    document.getElementById('ai-tools-btn').addEventListener('click', toggleAIDropdown);
    document.getElementById('copilot-btn').addEventListener('click', toggleCopilot);
    document.getElementById('doc-summary-btn').addEventListener('click', showDocSummary);
    
    // Document body
    document.getElementById('document-body').addEventListener('focus', function() {
        this.classList.add('editing');
    });
    
    document.getElementById('document-body').addEventListener('blur', function() {
        this.classList.remove('editing');
        saveCurrentDocument();
    });
    
    // Document click handler (for closing dropdowns)
    document.addEventListener('click', function(event) {
        // Close AI dropdown if clicking outside
        if (!event.target.matches('#ai-tools-btn') && !event.target.closest('#ai-dropdown')) {
            const dropdown = document.getElementById('ai-dropdown');
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            }
        }
        
        // Close context menu if clicking outside
        if (!event.target.closest('.context-menu')) {
            const contextMenu = document.querySelector('.context-menu');
            if (contextMenu.style.display === 'block') {
                contextMenu.style.display = 'none';
            }
        }
    });
}

/**
 * Initialize the formatting tools
 */
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
                insertTodoList();
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

/**
 * Apply heading format to selected text
 * @param {string} headingType - h1, h2, or h3
 */
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

/**
 * Insert a todo list item
 */
function insertTodoList() {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create todo item
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = '<input type="checkbox"> <span contenteditable="true">Todo item</span>';
        
        // Insert todo item
        range.deleteContents();
        range.insertNode(todoItem);
        
        // Add event listener for checkbox
        const checkbox = todoItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            const span = this.nextElementSibling;
            if (this.checked) {
                span.style.textDecoration = 'line-through';
                span.style.opacity = '0.7';
            } else {
                span.style.textDecoration = 'none';
                span.style.opacity = '1';
            }
            
            // Save document
            saveCurrentDocument();
        });
        
        // Focus on the editable span
        const span = todoItem.querySelector('span');
        span.focus();
        
        // Select all text in the span
        const textRange = document.createRange();
        textRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(textRange);
    }
}

/**
 * Initialize node selection in the tree/icon view
 */
function initializeNodeSelection() {
    // Tree view nodes
    document.querySelectorAll('.node-content').forEach(node => {
        // Generate a unique ID if not already present
        if (!node.dataset.id) {
            node.dataset.id = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }
        
        node.addEventListener('click', function(e) {
            // Only select if not clicking on expand/collapse
            if (!e.target.classList.contains('expand-collapse')) {
                selectNode(this);
            }
            
            // Handle expand/collapse
            if (e.target.classList.contains('expand-collapse')) {
                const childrenContainer = this.nextElementSibling;
                if (childrenContainer && childrenContainer.classList.contains('node-children')) {
                    const isExpanded = e.target.classList.contains('expanded');
                    if (isExpanded) {
                        childrenContainer.style.display = 'none';
                        e.target.classList.remove('expanded');
                        e.target.textContent = '▶';
                    } else {
                        childrenContainer.style.display = 'block';
                        e.target.classList.add('expanded');
                        e.target.textContent = '▼';
                    }
                }
                e.stopPropagation(); // Prevent node selection
            }
        });
    });
    
    // Icon view nodes
    document.querySelectorAll('.grid-item').forEach(node => {
        // Generate a unique ID if not already present
        if (!node.dataset.id) {
            node.dataset.id = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }
        
        node.addEventListener('click', function() {
            selectNode(this);
        });
    });
}

/**
 * Select a node (tree or icon view)
 * @param {Element} node - The node to select
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
 * Save current document content
 */
function saveCurrentDocument() {
    if (!selectedNode) return;
    
    const nodeId = selectedNode.dataset.id;
    if (!nodeId) return;
    
    const title = document.getElementById('document-title').textContent;
    const content = document.getElementById('document-body').innerHTML;
    
    // Store in our data object
    documentData[nodeId] = {
        title: title,
        content: content,
        lastModified: new Date().toISOString()
    };
    
    // In a real app, we would save to localStorage or a backend server
    console.log(`Document ${nodeId} saved`);
    
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
 * Load document content based on selected node
 * @param {Element} node - The selected node
 */
function loadDocumentContent(node) {
    const nodeId = node.dataset.id;
    const nodeType = node.getAttribute('data-type');
    const nodeName = node.querySelector('.node-name, .item-name').textContent;
    
    // Update document title
    const documentTitle = document.getElementById('document-title');
    documentTitle.textContent = nodeName;
    
    // Update breadcrumb
    updateBreadcrumb();
    
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
            content = `<h2>${nodeName}</h2><p>This is a learning roadmap. It represents a structured learning path.</p><h3>Progress</h3><p>Track your progress as you go through this learning path.</p>`;
            break;
        case 'folder':
            content = `<h2>${nodeName}</h2><p>This is a folder that can contain multiple files and notes.</p><p>Right-click and select "New File" to add content to this folder.</p>`;
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
        title: nodeName,
        content: content,
        lastModified: new Date().toISOString()
    };
}

/**
 * Update the breadcrumb with current document title
 */
function updateBreadcrumb() {
    const title = document.getElementById('document-title').textContent;
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
                }
            }
        }
    }
}

/**
 * Switch between tree and icon view modes
 * @param {string} mode - 'tree' or 'icon'
 */
function switchViewMode(mode) {
    const treeView = document.querySelector('.knowledge-view.tree-view');
    const iconView = document.querySelector('.knowledge-view.icon-view');
    const treeBtn = document.getElementById('tree-view-btn');
    const iconBtn = document.getElementById('icon-view-btn');
    
    if (mode === 'tree') {
        treeView.style.display = 'block';
        iconView.style.display = 'none';
        treeBtn.classList.add('active');
        iconBtn.classList.remove('active');
        currentViewMode = 'tree';
    } else {
        treeView.style.display = 'none';
        iconView.style.display = 'block';
        treeBtn.classList.remove('active');
        iconBtn.classList.add('active');
        currentViewMode = 'icon';
    }
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

/**
 * Toggle search container visibility
 */
function toggleSearch() {
    const searchContainer = document.querySelector('.search-container');
    const isHidden = searchContainer.style.display === 'none';
    
    searchContainer.style.display = isHidden ? 'flex' : 'none';
    
    if (isHidden) {
        document.getElementById('search-input').focus();
        
        // Set up search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', function() {
            searchNodes(this.value);
        });
    }
    
    // Set up close button
    document.getElementById('close-search-btn').addEventListener('click', function() {
        searchContainer.style.display = 'none';
        clearSearch();
    });
}

/**
 * Search for nodes containing the query
 * @param {string} query - Search query
 */
function searchNodes(query) {
    if (!query) {
        clearSearch();
        return;
    }
    
    query = query.toLowerCase();
    
    // Search in both views
    const allNodes = document.querySelectorAll('.node-content, .grid-item');
    
    allNodes.forEach(node => {
        const nodeName = node.querySelector('.node-name, .item-name').textContent.toLowerCase();
        
        if (nodeName.includes(query)) {
            node.classList.add('search-match');
            
            // If in tree view, expand parent nodes
            if (node.classList.contains('node-content')) {
                expandParents(node);
            }
        } else {
            node.classList.remove('search-match');
        }
    });
}

/**
 * Clear search highlights
 */
function clearSearch() {
    document.querySelectorAll('.search-match').forEach(node => {
        node.classList.remove('search-match');
    });
}

/**
 * Expand parent nodes to show a search result
 * @param {Element} node - The node to show
 */
function expandParents(node) {
    const treeNode = node.closest('.tree-node');
    if (!treeNode) return;
    
    const parentUl = treeNode.parentElement;
    if (!parentUl || !parentUl.classList.contains('node-children')) return;
    
    // Make sure parent ul is visible
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
 * Initialize context menu functionality
 */
function initializeContextMenu() {
    const contextMenu = document.querySelector('.context-menu');
    
    // Add right-click event to tree nodes
    document.querySelectorAll('.node-content, .grid-item').forEach(node => {
        node.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            // Position the context menu
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            contextMenu.style.display = 'block';
            
            // Store reference to the right-clicked node
            contextMenu.dataset.targetNodeId = this.dataset.id || '';
            
            // Select the node
            selectNode(this);
            
            // Adjust menu items based on node type
            const nodeType = this.getAttribute('data-type');
            
            // Show/hide status menu items based on node type
            const statusItems = contextMenu.querySelectorAll('[data-action^="status-"]');
            if (nodeType === 'file' || nodeType === 'knowledge' || nodeType === 'roadmap') {
                statusItems.forEach(item => item.style.display = 'block');
            } else {
                statusItems.forEach(item => item.style.display = 'none');
            }
        });
    });
    
    // Context menu item actions
    contextMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const nodeId = contextMenu.dataset.targetNodeId;
            
            // Find the node
            const node = document.querySelector(`.node-content[data-id="${nodeId}"], .grid-item[data-id="${nodeId}"]`);
            
            if (node) {
                switch(action) {
                    case 'new-file':
                        showNewItemModal('file', node);
                        break;
                    case 'new-folder':
                        showNewItemModal('folder', node);
                        break;
                    case 'new-knowledge':
                        showNewItemModal('knowledge', node);
                        break;
                    case 'new-roadmap':
                        showNewItemModal('roadmap', node);
                        break;
                    case 'rename':
                        renameNode(node);
                        break;
                    case 'delete':
                        deleteNode(node);
                        break;
                    case 'status-completed':
                        updateNodeStatus(node, 'completed');
                        break;
                    case 'status-inprogress':
                        updateNodeStatus(node, 'in-progress');
                        break;
                    case 'status-notstarted':
                        updateNodeStatus(node, 'not-started');
                        break;
                }
            }
            
            // Hide context menu
            contextMenu.style.display = 'none';
        });
    });
}

/**
 * Show the New Item modal
 * @param {string} type - Optional type to preselect
 * @param {Element} parentNode - Optional parent node
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
            
            // Show parent selection if needed - not implemented in this simplified version
        });
    });
    
    // Create button
    document.getElementById('create-item-btn').addEventListener('click', createNewItem);
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
 * Create a new node in the tree/icon view
 * @param {string} name - Node name
 * @param {string} type - Node type
 * @param {Element} parent - Parent node (optional)
 * @returns {string} - The ID of the new node
 */
function createNode(name, type, parent = null) {
    // Generate a unique ID
    const nodeId = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
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
            ${(type === 'folder' || type === 'roadmap') ? '<span class="expand-collapse">▶</span>' : '<span style="width: 15px; display: inline-block;"></span>'}
            <span class="node-icon">${nodeIcon}</span>
            <span class="node-name">${name}</span>
        </div>
        ${(type === 'folder' || type === 'roadmap') ? '<ul class="node-children" style="display: none;"></ul>' : ''}
    `;
    
    // Add to parent if provided, otherwise to root
    if (parent) {
        // Make sure parent is a folder or roadmap
        const parentType = parent.getAttribute('data-type');
        if (parentType === 'folder' || parentType === 'roadmap') {
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
            // If parent is not a folder or roadmap, add to root
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
    initializeContextMenu();
    
    return nodeId;
}

/**
 * Rename a node
 * @param {Element} node - The node to rename
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
        }
        
        // Update document title if this is the selected node
        if (node === selectedNode || node.dataset.id === selectedNode?.dataset.id) {
            document.getElementById('document-title').textContent = newName;
            updateBreadcrumb();
            
            // Update stored document data
            if (documentData[nodeId]) {
                documentData[nodeId].title = newName;
            }
        }
    }
}

/**
 * Delete a node
 * @param {Element} node - The node to delete
 */
function deleteNode(node) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    const nodeId = node.dataset.id;
    const isTreeView = node.classList.contains('node-content');
    
    // Remove from tree view
    if (isTreeView) {
        const treeNode = node.closest('.tree-node');
        if (treeNode) {
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
                    treeNode.remove();
                }
            }
        }
        
        // Remove document data
        if (documentData[nodeId]) {
            delete documentData[nodeId];
        }
    }
    
    // If the deleted node was selected, reset the editor
    if (node === selectedNode || node.dataset.id === selectedNode?.dataset.id) {
        selectedNode = null;
        document.getElementById('document-title').textContent = 'Untitled Document';
        document.getElementById('document-body').innerHTML = '<p>Start writing your document here...</p>';
        updateBreadcrumb();
    }
}

/**
 * Update the status of a node
 * @param {Element} node - The node to update
 * @param {string} status - 'completed', 'in-progress', or 'not-started'
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
            
            // Update indicator content
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
    
    // If this is a roadmap, update progress bar
    if (node.getAttribute('data-type') === 'roadmap') {
        updateRoadmapProgress(node);
    }
}

/**
 * Update progress for a roadmap
 * @param {Element} roadmapNode - The roadmap node
 */
function updateRoadmapProgress(roadmapNode) {
    // Only process for tree view nodes
    if (!roadmapNode.classList.contains('node-content')) {
        const treeNode = document.querySelector(`.node-content[data-id="${roadmapNode.dataset.id}"]`);
        if (treeNode) {
            updateRoadmapProgress(treeNode);
        }
        return;
    }
    
    // Get all child nodes
    const childrenContainer = roadmapNode.nextElementSibling;
    if (!childrenContainer || !childrenContainer.classList.contains('node-children')) {
        return;
    }
    
    const childNodes = childrenContainer.querySelectorAll('.node-content');
    if (childNodes.length === 0) {
        return;
    }
    
    // Count completed items
    let completed = 0;
    childNodes.forEach(node => {
        if (node.getAttribute('data-status') === 'completed') {
            completed++;
        }
    });
    
    // Calculate progress percentage
    const progress = Math.round((completed / childNodes.length) * 100);
    
    // Update progress indicator
    let progressIndicator = roadmapNode.querySelector('.progress-indicator');
    if (!progressIndicator) {
        progressIndicator = document.createElement('div');
        progressIndicator.className = 'progress-indicator';
        roadmapNode.appendChild(progressIndicator);
    }
    
    progressIndicator.style.width = `${progress}%`;
    
    // Update icon view as well
    const iconViewNode = document.querySelector(`.grid-item[data-id="${roadmapNode.dataset.id}"]`);
    if (iconViewNode) {
        let iconProgressBar = iconViewNode.querySelector('.progress-bar');
        if (!iconProgressBar) {
            iconProgressBar = document.createElement('div');
            iconProgressBar.className = 'progress-bar';
            iconViewNode.appendChild(iconProgressBar);
        }
        
        iconProgressBar.style.width = `${progress}%`;
    }
}

/**
 * Initialize AI Tools
 */
function initializeAITools() {
    // Initialize AI Copilot
    initializeAICopilot();
    
    // Initialize Document Summary
    initializeDocSummary();
}

/**
 * Initialize AI Copilot
 */
function initializeAICopilot() {
    // Add close button handler
    const copilotPopup = document.getElementById('copilot-popup');
    if (copilotPopup) {
        copilotPopup.querySelector('.close-btn').addEventListener('click', function() {
            copilotPopup.style.display = 'none';
        });
    }
    
    // Add clipboard monitor toggle handler
    const clipboardToggle = document.getElementById('clipboard-monitor-toggle');
    if (clipboardToggle) {
        clipboardToggle.addEventListener('change', function() {
            if (this.checked) {
                startClipboardMonitoring();
            } else {
                stopClipboardMonitoring();
            }
        });
    }
    
    // Add process button handlers
    document.querySelectorAll('.process-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            processWithAI(action);
        });
    });
}

/**
 * Toggle AI Tools dropdown
 */
function toggleAIDropdown() {
    const dropdown = document.getElementById('ai-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

/**
 * Toggle Copilot display
 */
function toggleCopilot() {
    const copilot = document.getElementById('copilot-popup');
    copilot.style.display = copilot.style.display === 'flex' ? 'none' : 'flex';
    
    // Hide the AI dropdown
    document.getElementById('ai-dropdown').style.display = 'none';
}

/**
 * Start monitoring clipboard for content
 * Note: This is a simplified implementation for demo purposes
 * In a real app, you would use the Clipboard API with proper permissions
 */
function startClipboardMonitoring() {
    // In a real app, this would use the Clipboard API
    // For this demo, we'll just simulate it with a sample text
    setTimeout(() => {
        const sampleText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam viverra nunc vel magna feugiat, in fermentum lectus rutrum.";
        document.getElementById('captured-text').textContent = sampleText;
    }, 2000);
    
    console.log('Clipboard monitoring started');
}

/**
 * Stop monitoring clipboard
 */
function stopClipboardMonitoring() {
    console.log('Clipboard monitoring stopped');
}

/**
 * Process captured content with AI
 * @param {string} action - The processing action to perform
 */
function processWithAI(action) {
    const capturedText = document.getElementById('captured-text').textContent;
    
    if (!capturedText || capturedText === 'No content captured yet. Copy text from anywhere to start.') {
        alert('No content captured to process');
        return;
    }
    
    // For demonstration purposes only - in a real app this would call an AI API
    let result = '';
    switch(action) {
        case 'summarize':
            result = `<h3>Summary</h3><p>This is a summary of the captured text that highlights the key points.</p>`;
            break;
        case 'qa':
            result = `<h3>Q&A Format</h3><p><strong>Q: What is the main topic?</strong></p><p>A: The main topic is...</p>`;
            break;
        case 'insert':
            // Create a new AI note in the knowledge structure
            const nodeId = createNode('AI Generated Note', 'ai-note');
            const node = document.querySelector(`.node-content[data-id="${nodeId}"]`);
            
            if (node) {
                // Select the new node
                selectNode(node);
                
                // Update document content
                document.getElementById('document-body').innerHTML = `
                    <h2>AI Generated Note</h2>
                    <p><em>Generated from captured text:</em></p>
                    <blockquote>${capturedText}</blockquote>
                    <h3>Analysis</h3>
                    <p>This is an AI analysis of the captured content.</p>
                `;
                
                // Save document
                saveCurrentDocument();
            }
            
            // Close the copilot popup
            document.getElementById('copilot-popup').style.display = 'none';
            
            return;
        case 'custom':
            const customPrompt = document.getElementById('custom-prompt').value;
            if (!customPrompt) {
                alert('Please enter a custom prompt');
                return;
            }
            result = `<h3>Custom Processing</h3><p>Result based on prompt: "${customPrompt}"</p>`;
            break;
    }
    
    // Display processing result
    const resultDiv = document.createElement('div');
    resultDiv.className = 'processing-result';
    resultDiv.innerHTML = `
        <button class="close-result">&times;</button>
        <h4>Processing Result</h4>
        <div class="result-content">${result}</div>
        <div class="result-actions">
            <button class="process-btn" data-action="insert-result">Insert as Note</button>
            <button class="process-btn" data-action="copy-result">Copy to Clipboard</button>
        </div>
    `;
    
    // Add close button handler
    resultDiv.querySelector('.close-result').addEventListener('click', function() {
        resultDiv.remove();
    });
    
    // Add result action handlers
    resultDiv.querySelector('[data-action="insert-result"]').addEventListener('click', function() {
        // Create a new AI note in the knowledge structure
        const nodeId = createNode('AI Processing Result', 'ai-note');
        const node = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        
        if (node) {
            // Select the new node
            selectNode(node);
            
            // Update document content
            document.getElementById('document-body').innerHTML = `
                <h2>AI Processing Result</h2>
                <p><em>Generated from captured text:</em></p>
                <blockquote>${capturedText}</blockquote>
                ${result}
            `;
            
            // Save document
            saveCurrentDocument();
        }
        
        // Close the copilot popup
        document.getElementById('copilot-popup').style.display = 'none';
    });
    
    resultDiv.querySelector('[data-action="copy-result"]').addEventListener('click', function() {
        // In a real app, this would use clipboard API
        alert('Result copied to clipboard');
    });
    
    // Add to copilot body
    document.querySelector('.copilot-body').appendChild(resultDiv);
}

/**
 * Initialize Document Summary
 */
function initializeDocSummary() {
    const summaryWindow = document.getElementById('doc-summary-window');
    if (!summaryWindow) return;
    
    // Add file input change handler
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', function() {
            handleFileUpload(this.files);
        });
    }
    
    // Set up drop zone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '#f0f0f0';
        });
        
        dropZone.addEventListener('dragleave', function() {
            this.style.backgroundColor = '';
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
            
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files);
            }
        });
    }
    
    // Set up generate button
    const generateButton = document.getElementById('generate-summary-btn');
    if (generateButton) {
        generateButton.addEventListener('click', generateDocumentSummary);
    }
}

/**
 * Show Document Summary window
 */
function showDocSummary() {
    const summaryWindow = document.getElementById('doc-summary-window');
    summaryWindow.style.display = 'flex';
    
    // Hide the AI dropdown
    document.getElementById('ai-dropdown').style.display = 'none';
}

/**
 * Handle file upload for document summary
 * @param {FileList} files - Uploaded files
 */
function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    const filesList = document.getElementById('uploaded-files-list');
    
    // Clear existing files list
    filesList.innerHTML = '';
    
    // Add each file to the list
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="remove-file">&times;</span>
        `;
        
        // Add remove handler
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            fileItem.remove();
            
            // Disable generate button if no files left
            if (filesList.children.length === 0) {
                document.getElementById('generate-summary-btn').disabled = true;
            }
        });
        
        filesList.appendChild(fileItem);
    });
    
    // Enable generate button
    document.getElementById('generate-summary-btn').disabled = false;
}

/**
 * Generate document summary from uploaded files
 * This is a simplified implementation for demonstration purposes
 */
function generateDocumentSummary() {
    // Check if files were uploaded
    const filesList = document.getElementById('uploaded-files-list');
    if (filesList.children.length === 0) {
        alert('Please upload at least one file to analyze');
        return;
    }
    
    // Create a temporary loading indicator
    const summaryWindow = document.getElementById('doc-summary-window');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Analyzing documents...</div>
    `;
    
    summaryWindow.querySelector('.modal-body').appendChild(loadingIndicator);
    
    // Simulate document analysis (would call PDF.js and AI API in a real implementation)
    setTimeout(() => {
        // Remove loading indicator
        loadingIndicator.remove();
        
        // Close summary window
        summaryWindow.style.display = 'none';
        
        // Create a new AI note with document summary
        const fileName = filesList.querySelector('.file-name').textContent;
        const nodeId = createNode(`Summary of ${fileName}`, 'ai-note');
        const node = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        
        if (node) {
            // Select the new node
            selectNode(node);
            
            // Update document content with a sample summary
            document.getElementById('document-body').innerHTML = `
                <h2>Document Summary: ${fileName}</h2>
                <h3>Overview</h3>
                <p>This document contains information about [topic]. It includes various sections covering [key points].</p>
                
                <h3>Key Concepts</h3>
                <ul>
                    <li><strong>Concept 1</strong>: Description of concept 1</li>
                    <li><strong>Concept 2</strong>: Description of concept 2</li>
                    <li><strong>Concept 3</strong>: Description of concept 3</li>
                </ul>
                
                <h3>Document Structure</h3>
                <ol>
                    <li><strong>Section 1</strong>: Overview of section 1</li>
                    <li><strong>Section 2</strong>: Overview of section 2</li>
                    <li><strong>Section 3</strong>: Overview of section 3</li>
                </ol>
                
                <h3>Summary</h3>
                <p>This document provides detailed information about [main topic]. The key takeaway is [main insight].</p>
            `;
            
            // Save document
            saveCurrentDocument();
        }
    }, 2000);
}