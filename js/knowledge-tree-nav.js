/**
 * Knowledge Node Navigator Module
 * Enhanced version that properly connects tree visualization nodes to content pages
 */

(function() {
    // Create namespace
    window.nodeNavigator = {};
    
    // Store active nodes for navigation
    let activeTreeData = null;
    let currentNodeId = null;
    
    /**
     * Initialize with tree data
     * @param {Object} treeData - The knowledge tree data
     */
    window.nodeNavigator.initialize = function(treeData) {
        activeTreeData = treeData;
        
        // Set node IDs if they don't exist
        ensureNodeIds(treeData);
        
        console.log("Knowledge node navigator initialized");
    };
    
    /**
     * Ensure all nodes have unique IDs
     * @param {Object} node - Tree node to process
     * @param {string} parentId - Parent node ID (for hierarchical IDs)
     */
    function ensureNodeIds(node, parentId = 'root') {
        if (!node.id) {
            // Create ID from title or assign random ID
            node.id = node.title ? 
                `${parentId}-${node.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 
                `${parentId}-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child, index) => {
                ensureNodeIds(child, node.id);
            });
        }
    }
    
    /**
     * Handle node click from visualization
     * @param {Object} nodeData - The clicked node data
     */
    window.nodeNavigator.handleNodeClick = function(nodeData) {
        // Store current node ID
        currentNodeId = nodeData.id;
        
        // Navigate to the node's content page
        navigateToNodePage(nodeData);
    };
    
    /**
     * Navigate to a node's content page
     * @param {Object} nodeData - The node data
     */
    function navigateToNodePage(nodeData) {
        // Create content page container
        const contentPage = document.createElement('div');
        contentPage.className = 'knowledge-content-page';
        
        // Add breadcrumb navigation
        const breadcrumb = createBreadcrumb(nodeData);
        contentPage.appendChild(breadcrumb);
        
        // Add content header
        const header = document.createElement('div');
        header.className = 'content-header';
        
        header.innerHTML = `
            <div class="content-title">
                <h1>${nodeData.title}</h1>
                <div class="content-subtitle">${nodeData.summary || ''}</div>
            </div>
            <div class="content-actions">
                <button class="edit-node-btn">
                    <i class="icon-edit"></i> Edit
                </button>
                <button class="back-to-tree-btn">
                    <i class="icon-tree"></i> Back to Tree
                </button>
            </div>
        `;
        
        // Add event listeners for buttons
        header.querySelector('.edit-node-btn').addEventListener('click', () => {
            showEditNodeModal(nodeData);
        });
        
        header.querySelector('.back-to-tree-btn').addEventListener('click', () => {
            showTreeVisualization();
        });
        
        contentPage.appendChild(header);
        
        // Add content body
        const body = document.createElement('div');
        body.className = 'content-body';
        
        // Format the content with proper HTML
        body.innerHTML = nodeData.content || nodeData.summary || 'No detailed content available for this node.';
        
        contentPage.appendChild(body);
        
        // Add children section if there are child nodes
        if (nodeData.children && nodeData.children.length > 0) {
            const childrenSection = document.createElement('div');
            childrenSection.className = 'children-section';
            
            const childrenTitle = document.createElement('h2');
            childrenTitle.className = 'children-title';
            childrenTitle.innerHTML = `Sub-topics <span class="children-counter">${nodeData.children.length}</span>`;
            childrenSection.appendChild(childrenTitle);
            
            const childrenList = document.createElement('div');
            childrenList.className = 'children-list';
            
            // Add each child as a clickable item
            nodeData.children.forEach(child => {
                const childItem = createChildItem(child);
                childrenList.appendChild(childItem);
            });
            
            childrenSection.appendChild(childrenList);
            
            // Add "Add child" button
            const addChildButton = document.createElement('div');
            addChildButton.className = 'add-child-button';
            addChildButton.innerHTML = `<i class="icon-plus"></i> Add New Sub-topic`;
            
            addChildButton.addEventListener('click', () => {
                showAddChildModal(nodeData);
            });
            
            childrenSection.appendChild(addChildButton);
            
            contentPage.appendChild(childrenSection);
        }
        
        // Replace current content with the node page
        const contentArea = document.querySelector('.content');
        contentArea.innerHTML = '';
        contentArea.appendChild(contentPage);
        
        // Update document title
        document.title = `${nodeData.title} - SelfLearn`;
        document.getElementById('document-title').textContent = nodeData.title;
    }
    
    /**
     * Create breadcrumb for node navigation
     * @param {Object} nodeData - Current node data
     * @returns {HTMLElement} - Breadcrumb element
     */
    function createBreadcrumb(nodeData) {
        // Find path to node
        const path = findPathToNode(activeTreeData, nodeData.id);
        
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        
        let breadcrumbHTML = `<a href="#" class="to-dashboard">Dashboard</a>`;
        breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
        breadcrumbHTML += `<a href="#" class="to-tree">Knowledge Tree</a>`;
        
        // Add path segments
        if (path && path.length > 0) {
            for (let i = 0; i < path.length - 1; i++) { // Skip the current node
                const segment = path[i];
                breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
                breadcrumbHTML += `<a href="#" class="to-path-item" data-id="${segment.id}">${segment.title}</a>`;
            }
        }
        
        // Add current node
        breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
        breadcrumbHTML += `<span>${nodeData.title}</span>`;
        
        breadcrumb.innerHTML = breadcrumbHTML;
        
        // Add click handlers
        breadcrumb.querySelector('.to-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            if (window.studySpaces && typeof window.studySpaces.showWelcomeDashboard === 'function') {
                window.studySpaces.showWelcomeDashboard();
            }
        });
        
        breadcrumb.querySelector('.to-tree').addEventListener('click', (e) => {
            e.preventDefault();
            showTreeVisualization();
        });
        
        // Add handlers for path items
        breadcrumb.querySelectorAll('.to-path-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const nodeId = e.target.getAttribute('data-id');
                const node = findNodeById(activeTreeData, nodeId);
                if (node) {
                    navigateToNodePage(node);
                }
            });
        });
        
        return breadcrumb;
    }
    
    /**
     * Find path to node in tree (DFS)
     * @param {Object} root - Root node
     * @param {string} nodeId - Target node ID
     * @param {Array} currentPath - Current path (for recursion)
     * @returns {Array|null} - Path to node or null if not found
     */
    function findPathToNode(root, nodeId, currentPath = []) {
        // Clone path to avoid reference issues
        const path = [...currentPath];
        
        // Add current node to path
        path.push({
            id: root.id,
            title: root.title
        });
        
        // Check if this is the target node
        if (root.id === nodeId) {
            return path;
        }
        
        // Check children if any
        if (root.children && Array.isArray(root.children)) {
            for (const child of root.children) {
                const result = findPathToNode(child, nodeId, path);
                if (result) {
                    return result;
                }
            }
        }
        
        // Not found in this branch
        return null;
    }
    
    /**
     * Find node by ID
     * @param {Object} root - Root node
     * @param {string} nodeId - Target node ID
     * @returns {Object|null} - Node object or null if not found
     */
    function findNodeById(root, nodeId) {
        // Check if this is the target node
        if (root.id === nodeId) {
            return root;
        }
        
        // Check children if any
        if (root.children && Array.isArray(root.children)) {
            for (const child of root.children) {
                const result = findNodeById(child, nodeId);
                if (result) {
                    return result;
                }
            }
        }
        
        // Not found in this branch
        return null;
    }
    
    /**
     * Create child item element
     * @param {Object} child - Child node data
     * @returns {HTMLElement} - Child item element
     */
    function createChildItem(child) {
        const itemElement = document.createElement('div');
        itemElement.className = 'child-knowledge-item';
        itemElement.dataset.nodeId = child.id;
        
        // Count grandchildren if any
        const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
        const childrenCount = hasChildren ? child.children.length : 0;
        
        // Add children counter if has children
        const childrenElement = hasChildren ? 
            `<span class="children-counter">${childrenCount} sub-topics</span>` : '';
        
        itemElement.innerHTML = `
            <div class="knowledge-content">
                <h3 class="knowledge-title">${child.title}</h3>
                <p class="knowledge-subtitle">${child.summary || ''}</p>
                <div class="knowledge-meta">
                    ${childrenElement}
                </div>
            </div>
        `;
        
        // Add click event to navigate to child node
        itemElement.addEventListener('click', () => {
            navigateToNodePage(child);
        });
        
        return itemElement;
    }
    
    /**
     * Show the tree visualization
     */
    function showTreeVisualization() {
        // Create visualization container
        const vizContainer = document.createElement('div');
        vizContainer.className = 'ai-window';
        
        // Make sure width matches the document body
        const docBodyWidth = document.querySelector('.body-area').offsetWidth;
        vizContainer.style.width = docBodyWidth + 'px';
        
        vizContainer.innerHTML = `
            <div class="ai-window-header">
                <div class="window-drag-handle">
                    <span>Knowledge Tree</span>
                </div>
                <div class="window-controls">
                    <button class="export-btn">Export</button>
                    <button class="fullscreen-btn">Full Screen</button>
                    <button class="close-btn">Close</button>
                </div>
            </div>
            <div class="ai-window-body">
                <div class="visualization-container">
                    <svg width="100%" height="500" class="tree-svg"></svg>
                </div>
                <div class="more-options-panel" style="display: none;">
                    <button class="export-json-btn">Export as JSON</button>
                    <button class="export-markdown-btn">Export as Markdown</button>
                    <button class="export-svg-btn">Export as SVG</button>
                </div>
            </div>
        `;
        
        // Replace current content with the visualization
        const contentArea = document.querySelector('.content');
        contentArea.innerHTML = '';
        contentArea.appendChild(vizContainer);
        
        // Create D3 visualization
        if (window.treeVisualizer && typeof window.treeVisualizer.createVisualization === 'function') {
            const svg = vizContainer.querySelector('svg');
            window.treeVisualizer.createVisualization(svg, activeTreeData);
            
            // Add node click handler
            svg.querySelectorAll('.node').forEach(node => {
                node.addEventListener('click', function() {
                    const nodeId = this.getAttribute('data-node-id');
                    if (nodeId) {
                        const nodeData = findNodeById(activeTreeData, nodeId);
                        if (nodeData) {
                            window.nodeNavigator.handleNodeClick(nodeData);
                        }
                    }
                });
            });
        }
        
        // Add event listeners
        vizContainer.querySelector('.close-btn').addEventListener('click', function() {
            vizContainer.remove();
        });
        
        vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
            window.utils.toggleFullscreen(vizContainer, this);
            
            // Re-create visualization with new dimensions
            if (window.treeVisualizer && typeof window.treeVisualizer.createVisualization === 'function') {
                const svg = vizContainer.querySelector('svg');
                window.treeVisualizer.createVisualization(svg, activeTreeData);
            }
        });
        
        vizContainer.querySelector('.export-btn').addEventListener('click', function() {
            // Toggle export options panel
            const panel = vizContainer.querySelector('.more-options-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Setup export buttons
        setupExportButtons(vizContainer);
    }
    
    /**
     * Setup export buttons
     * @param {HTMLElement} container - Container element
     */
    function setupExportButtons(container) {
        // Export as JSON
        container.querySelector('.export-json-btn').addEventListener('click', function() {
            const jsonString = JSON.stringify(activeTreeData, null, 2);
            window.utils.downloadFile(jsonString, 'knowledge-tree.json', 'application/json');
        });
        
        // Export as Markdown
        container.querySelector('.export-markdown-btn').addEventListener('click', function() {
            const markdown = convertTreeToMarkdown(activeTreeData);
            window.utils.downloadFile(markdown, 'knowledge-tree.md', 'text/markdown');
        });
        
        // Export as SVG
        container.querySelector('.export-svg-btn').addEventListener('click', function() {
            const svg = container.querySelector('svg');
            if (window.treeVisualizer && typeof window.treeVisualizer.exportSvg === 'function') {
                const svgData = window.treeVisualizer.exportSvg(svg);
                window.utils.downloadFile(svgData, 'knowledge-tree.svg', 'image/svg+xml');
            }
        });
    }
    
    /**
     * Show modal to edit node
     * @param {Object} nodeData - Node data to edit
     */
    function showEditNodeModal(nodeData) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Knowledge Node</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="node-title">Title</label>
                        <input type="text" id="node-title" value="${nodeData.title || ''}">
                    </div>
                    <div class="form-group">
                        <label for="node-summary">Summary</label>
                        <textarea id="node-summary" rows="3">${nodeData.summary || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="node-content">Content</label>
                        <textarea id="node-content" rows="10">${nodeData.content || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button id="update-node-btn" class="btn btn-primary">Update</button>
                        <button id="delete-node-btn" class="btn btn-danger">Delete</button>
                        <button id="cancel-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#update-node-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('node-title').value.trim();
            const summary = document.getElementById('node-summary').value.trim();
            const content = document.getElementById('node-content').value.trim();
            
            // Validate
            if (!title) {
                alert('Please enter a title for the node');
                return;
            }
            
            // Update node data
            nodeData.title = title;
            nodeData.summary = summary;
            nodeData.content = content;
            
            // Close modal
            modal.remove();
            
            // Refresh the node page
            navigateToNodePage(nodeData);
        });
        
        modal.querySelector('#delete-node-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this node? All child nodes will also be deleted.')) {
                deleteNode(nodeData.id);
                
                // Close modal
                modal.remove();
                
                // Go back to tree view
                showTreeVisualization();
            }
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Delete node from tree
     * @param {string} nodeId - ID of node to delete
     * @returns {boolean} - True if node was deleted
     */
    function deleteNode(nodeId) {
        // Can't delete root node
        if (nodeId === activeTreeData.id) {
            alert('Cannot delete the root node');
            return false;
        }
        
        // Find parent node
        const result = findParentNode(activeTreeData, nodeId);
        if (!result) {
            return false;
        }
        
        const [parentNode, index] = result;
        
        // Remove node from parent's children
        parentNode.children.splice(index, 1);
        
        return true;
    }
    
    /**
     * Find parent node and index of child
     * @param {Object} root - Root node
     * @param {string} childId - Child node ID to find
     * @returns {Array|null} - [parentNode, index] or null if not found
     */
    function findParentNode(root, childId) {
        if (!root.children || !Array.isArray(root.children)) {
            return null;
        }
        
        // Check if child is direct descendant
        for (let i = 0; i < root.children.length; i++) {
            if (root.children[i].id === childId) {
                return [root, i];
            }
        }
        
        // Recursively check children
        for (const child of root.children) {
            const result = findParentNode(child, childId);
            if (result) {
                return result;
            }
        }
        
        return null;
    }
    
    /**
     * Show modal to add child node
     * @param {Object} parentNode - Parent node
     */
    function showAddChildModal(parentNode) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Child Node</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="parent-title">Parent</label>
                        <input type="text" id="parent-title" value="${parentNode.title}" disabled>
                    </div>
                    <div class="form-group">
                        <label for="node-title">Title</label>
                        <input type="text" id="node-title" placeholder="Enter title">
                    </div>
                    <div class="form-group">
                        <label for="node-summary">Summary</label>
                        <textarea id="node-summary" rows="3" placeholder="Enter summary"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="node-content">Content</label>
                        <textarea id="node-content" rows="10" placeholder="Enter content"></textarea>
                    </div>
                    <div class="form-actions">
                        <button id="add-node-btn" class="btn btn-primary">Add Child Node</button>
                        <button id="cancel-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#add-node-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('node-title').value.trim();
            const summary = document.getElementById('node-summary').value.trim();
            const content = document.getElementById('node-content').value.trim();
            
            // Validate
            if (!title) {
                alert('Please enter a title for the node');
                return;
            }
            
            // Create node ID from title (slug)
            const id = `${parentNode.id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36).substr(2, 5)}`;
            
            // Create new node
            const newNode = {
                id: id,
                title: title,
                summary: summary,
                content: content,
                children: []
            };
            
            // Add to parent's children
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(newNode);
            
            // Close modal
            modal.remove();
            
            // Refresh the parent node page
            navigateToNodePage(parentNode);
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Convert tree to Markdown
     * @param {Object} treeData - Tree data
     * @returns {string} - Markdown representation
     */
    function convertTreeToMarkdown(treeData) {
        let markdown = `# ${treeData.title}\n\n`;
        
        if (treeData.summary) {
            markdown += `${treeData.summary}\n\n`;
        }
        
        if (treeData.content) {
            markdown += `${treeData.content}\n\n`;
        }
        
        // Recursively add child nodes
        function addChildrenToMarkdown(node, level) {
            let result = '';
            
            if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                for (const child of node.children) {
                    // Add heading with appropriate level
                    result += `\n${'#'.repeat(level + 1)} ${child.title}\n\n`;
                    
                    // Add summary if available
                    if (child.summary) {
                        result += `${child.summary}\n\n`;
                    }
                    
                    // Add content if available
                    if (child.content) {
                        result += `${child.content}\n\n`;
                    }
                    
                    // Add children recursively
                    result += addChildrenToMarkdown(child, level + 1);
                }
            }
            
            return result;
        }
        
        markdown += addChildrenToMarkdown(treeData, 1);
        
        return markdown;
    }
    
    // Expose the functionality to the window object
    window.nodeNavigator = {
        initialize: window.nodeNavigator.initialize,
        handleNodeClick: window.nodeNavigator.handleNodeClick,
        showTreeVisualization: showTreeVisualization,
        navigateToNodePage: navigateToNodePage,
        findNodeById: findNodeById
    };
})();