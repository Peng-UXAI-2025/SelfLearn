/**
 * Drag and Drop Module
 * Handles the drag and drop functionality for nodes in the file management interface
 */

WebNotebook.Interface = WebNotebook.Interface || {};
WebNotebook.Interface.DragDrop = (function() {
    // Private variables
    let isDragging = false;
    let draggedNode = null;
    let dragOverNode = null;
    let dropPlaceholder = null;
    let dragGhost = null;
    
    /**
     * Initialize the drag and drop functionality
     */
    function initialize() {
        console.log('Drag and Drop module initialized');
        
        // Make nodes draggable
        setupDraggableNodes();
        
        // Make appropriate containers droppable
        setupDropTargets();
    }
    
    /**
     * Set up all nodes to be draggable
     */
    function setupDraggableNodes() {
        // Make all nodes draggable
        document.querySelectorAll('.node-content, .grid-item').forEach(node => {
            makeDraggable(node);
        });
    }
    
    /**
     * Make a node element draggable
     * @param {Element} node - The node element to make draggable
     */
    function makeDraggable(node) {
        node.setAttribute('draggable', 'true');
        
        // Drag start event
        node.addEventListener('dragstart', function(e) {
            isDragging = true;
            draggedNode = this;
            
            // Set drag data
            e.dataTransfer.setData('text/plain', this.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Create and set a drag ghost image
            createDragGhost(this, e);
            
            // Add dragging class for visual feedback
            this.classList.add('dragging');
            
            // Delay slightly to ensure the ghost image is used
            setTimeout(() => {
                this.style.opacity = '0.4';
            }, 0);
        });
        
        // Drag end event
        node.addEventListener('dragend', function() {
            isDragging = false;
            this.classList.remove('dragging');
            this.style.opacity = '1';
            
            // Remove drag ghost if it exists
            if (dragGhost && dragGhost.parentNode) {
                dragGhost.parentNode.removeChild(dragGhost);
            }
            
            // Remove drag-over class from all potential drop targets
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            // Remove drop placeholders
            removeDropPlaceholders();
            
            draggedNode = null;
            dragOverNode = null;
        });
    }
    
    /**
     * Create a drag ghost (visual representation during drag)
     * @param {Element} node - The node being dragged
     * @param {DragEvent} e - The drag event
     */
    function createDragGhost(node, e) {
        // Remove any existing ghost
        if (dragGhost && dragGhost.parentNode) {
            dragGhost.parentNode.removeChild(dragGhost);
        }
        
        // Create a clone of the node for the ghost
        dragGhost = node.cloneNode(true);
        dragGhost.classList.add('drag-ghost');
        dragGhost.style.position = 'absolute';
        dragGhost.style.top = '-1000px';
        dragGhost.style.left = '-1000px';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.zIndex = '9999';
        
        // Add to the document
        document.body.appendChild(dragGhost);
        
        // Set as drag image
        e.dataTransfer.setDragImage(dragGhost, 15, 15);
    }
    
    /**
     * Set up containers that can receive dropped nodes
     */
    function setupDropTargets() {
        // Make folders, knowledge nodes, and roadmaps droppable
        setupContainerNodes();
        
        // Make the node children containers (tree view) droppable for between-node drops
        setupChildrenContainers();
        
        // Make the root containers droppable for root-level drops
        setupRootContainers();
    }
    
    /**
     * Set up container nodes (folders, knowledge points, roadmaps) as drop targets
     */
    function setupContainerNodes() {
        const containerSelector = '.node-content[data-type="folder"], .node-content[data-type="roadmap"], .node-content[data-type="knowledge"], .grid-item[data-type="folder"], .grid-item[data-type="roadmap"], .grid-item[data-type="knowledge"]';
        
        document.querySelectorAll(containerSelector).forEach(node => {
            // Drag enter event - highlight potential drop target
            node.addEventListener('dragenter', function(e) {
                e.preventDefault();
                
                if (isDragging && draggedNode !== this) {
                    this.classList.add('drag-over');
                    dragOverNode = this;
                }
            });
            
            // Drag over event - needed to allow dropping
            node.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            // Drag leave event - remove highlight when leaving drop target
            node.addEventListener('dragleave', function(e) {
                if (e.target === this) {
                    this.classList.remove('drag-over');
                    if (dragOverNode === this) {
                        dragOverNode = null;
                    }
                }
            });
            
            // Drop event - handle the actual drop
            node.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.remove('drag-over');
                
                if (!draggedNode) return;
                
                const dropNodeId = this.dataset.id;
                const draggedNodeId = draggedNode.dataset.id;
                
                if (dropNodeId && draggedNodeId && dropNodeId !== draggedNodeId) {
                    // Add as a child of this container
                    moveNodeToContainer(draggedNodeId, dropNodeId);
                }
            });
        });
    }
    
    /**
     * Set up children containers for between-node dropping
     */
    function setupChildrenContainers() {
        document.querySelectorAll('.node-children').forEach(container => {
            // Drag over event - show drop placeholder
            container.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (!isDragging || !draggedNode) return;
                
                // Calculate best position for drop placeholder
                updateDropPlaceholder(container, e.clientY);
            });
            
            // Drag leave event - remove placeholder when leaving
            container.addEventListener('dragleave', function(e) {
                // Only remove if actually leaving the container (not just moving between children)
                if (!container.contains(e.relatedTarget)) {
                    removeDropPlaceholders();
                }
            });
            
            // Drop event - handle the drop between nodes
            container.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!draggedNode) return;
                
                const placeholder = document.querySelector('.drop-placeholder');
                if (placeholder) {
                    // Find the parent container and its associated node
                    const parentContainer = placeholder.closest('.node-children');
                    const parentNode = parentContainer.previousElementSibling;
                    
                    if (parentNode && parentNode.classList.contains('node-content')) {
                        const parentNodeId = parentNode.dataset.id;
                        const draggedNodeId = draggedNode.dataset.id;
                        
                        if (parentNodeId && draggedNodeId && parentNodeId !== draggedNodeId) {
                            // Get position index
                            const position = Array.from(parentContainer.children)
                                .filter(child => child.classList.contains('tree-node'))
                                .indexOf(placeholder.parentElement);
                            
                            // Move the node to this position
                            moveNodeToPosition(draggedNodeId, parentNodeId, position);
                        }
                    } else if (parentContainer.classList.contains('tree-root')) {
                        // Moving to root level
                        const draggedNodeId = draggedNode.dataset.id;
                        const position = Array.from(parentContainer.children)
                            .filter(child => child.classList.contains('tree-node'))
                            .indexOf(placeholder.parentElement);
                        
                        moveNodeToRootPosition(draggedNodeId, position);
                    }
                    
                    // Remove placeholder
                    removeDropPlaceholders();
                }
            });
        });
    }
    
    /**
     * Set up root containers as drop targets
     */
    function setupRootContainers() {
        document.querySelectorAll('.tree-root, .grid-items').forEach(container => {
            // Drag over event
            container.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                // Only process direct drops on the container (not on its children)
                if (e.target === this && isDragging && draggedNode) {
                    this.classList.add('drag-over');
                    
                    // If tree view, show drop placeholder at the end
                    if (this.classList.contains('tree-root')) {
                        updateDropPlaceholder(this, e.clientY);
                    }
                }
            });
            
            // Drag leave event
            container.addEventListener('dragleave', function(e) {
                if (e.target === this) {
                    this.classList.remove('drag-over');
                    removeDropPlaceholders();
                }
            });
            
            // Drop event - for drops directly on the root container
            container.addEventListener('drop', function(e) {
                // Only process if dropping directly on the container
                if (e.target === this) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.remove('drag-over');
                    
                    if (!draggedNode) return;
                    
                    // Move the node to the root level
                    const draggedNodeId = draggedNode.dataset.id;
                    
                    if (this.classList.contains('tree-root')) {
                        // Find position based on placeholder
                        const placeholder = document.querySelector('.drop-placeholder');
                        if (placeholder) {
                            const position = Array.from(this.children)
                                .filter(child => child.classList.contains('tree-node'))
                                .indexOf(placeholder.parentElement);
                            
                            moveNodeToRootPosition(draggedNodeId, position);
                        } else {
                            // Add at the end if no placeholder
                            moveNodeToRoot(draggedNodeId);
                        }
                    } else {
                        // For grid view, just move to root
                        moveNodeToRoot(draggedNodeId);
                    }
                    
                    removeDropPlaceholders();
                }
            });
        });
    }
    
    /**
     * Update the drop placeholder position based on mouse position
     * @param {Element} container - The container element
     * @param {number} clientY - Mouse Y position
     */
    function updateDropPlaceholder(container, clientY) {
        // Remove existing placeholders
        removeDropPlaceholders();
        
        // Get all tree nodes in this container
        const treeNodes = Array.from(container.children).filter(
            child => child.classList.contains('tree-node')
        );
        
        if (treeNodes.length === 0) {
            // Empty container - add placeholder at the end
            createDropPlaceholder(container);
            return;
        }
        
        // Find the closest node to the mouse position
        let closestNode = null;
        let closestDistance = Infinity;
        let insertBefore = true;
        
        treeNodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const nodeMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(clientY - nodeMiddle);
            
            if (distance < closestDistance) {
                closestNode = node;
                closestDistance = distance;
                insertBefore = clientY < nodeMiddle;
            }
        });
        
        // Create placeholder wrapper for proper positioning
        const placeholderWrapper = document.createElement('li');
        placeholderWrapper.className = 'tree-node placeholder-wrapper';
        
        // Create the actual placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholderWrapper.appendChild(placeholder);
        
        // Insert at the correct position
        if (insertBefore) {
            container.insertBefore(placeholderWrapper, closestNode);
        } else {
            container.insertBefore(placeholderWrapper, closestNode.nextSibling);
        }
    }
    
    /**
     * Create a drop placeholder in an empty container
     * @param {Element} container - The container element
     */
    function createDropPlaceholder(container) {
        // Create placeholder wrapper
        const placeholderWrapper = document.createElement('li');
        placeholderWrapper.className = 'tree-node placeholder-wrapper';
        
        // Create the actual placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholderWrapper.appendChild(placeholder);
        
        // Add to the container
        container.appendChild(placeholderWrapper);
    }
    
    /**
     * Remove all drop placeholders
     */
    function removeDropPlaceholders() {
        document.querySelectorAll('.placeholder-wrapper').forEach(el => {
            el.parentNode.removeChild(el);
        });
    }
    
    /**
     * Move a node to become a child of a container node
     * @param {string} nodeId - ID of the node to move
     * @param {string} containerId - ID of the target container node
     */
    function moveNodeToContainer(nodeId, containerId) {
        // Save current document first
        WebNotebook.Interface.FileManager.saveCurrentDocument();
        
        // Get the nodes
        const nodeToMove = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        const containerNode = document.querySelector(`.node-content[data-id="${containerId}"]`);
        
        if (!nodeToMove || !containerNode) {
            console.error('Could not find node or container for move operation');
            return;
        }
        
        // Check if moving a node into its own descendant
        if (isAncestor(nodeToMove, containerNode)) {
            alert('Cannot move a node into its own descendant');
            return;
        }
        
        // Get the tree node wrapper
        const treeNodeToMove = nodeToMove.closest('.tree-node');
        
        // Find the container's children list
        const containerChildren = containerNode.nextElementSibling;
        if (!containerChildren || !containerChildren.classList.contains('node-children')) {
            console.error('Container does not have a children list');
            return;
        }
        
        // Make sure the children container is visible
        containerChildren.style.display = 'block';
        
        // Update the expand/collapse toggle
        const expandToggle = containerNode.querySelector('.expand-collapse');
        if (expandToggle) {
            expandToggle.classList.add('expanded');
            expandToggle.textContent = '▼';
        }
        
        // Move the node
        containerChildren.appendChild(treeNodeToMove);
        
        // Update the data model
        updateNodeParent(nodeId, containerId);
        
        // Update the icon view
        syncIconView();
    }
    
    /**
     * Move a node to a specific position within a container
     * @param {string} nodeId - ID of the node to move
     * @param {string} containerId - ID of the target container node
     * @param {number} position - Index position to insert at
     */
    function moveNodeToPosition(nodeId, containerId, position) {
        // Save current document first
        WebNotebook.Interface.FileManager.saveCurrentDocument();
        
        // Get the nodes
        const nodeToMove = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        const containerNode = document.querySelector(`.node-content[data-id="${containerId}"]`);
        
        if (!nodeToMove || !containerNode) {
            console.error('Could not find node or container for move operation');
            return;
        }
        
        // Check if moving a node into its own descendant
        if (isAncestor(nodeToMove, containerNode)) {
            alert('Cannot move a node into its own descendant');
            return;
        }
        
        // Get the tree node wrapper
        const treeNodeToMove = nodeToMove.closest('.tree-node');
        
        // Find the container's children list
        const containerChildren = containerNode.nextElementSibling;
        if (!containerChildren || !containerChildren.classList.contains('node-children')) {
            console.error('Container does not have a children list');
            return;
        }
        
        // Make sure the children container is visible
        containerChildren.style.display = 'block';
        
        // Update the expand/collapse toggle
        const expandToggle = containerNode.querySelector('.expand-collapse');
        if (expandToggle) {
            expandToggle.classList.add('expanded');
            expandToggle.textContent = '▼';
        }
        
        // Get all child nodes
        const childNodes = Array.from(containerChildren.children).filter(
            child => child.classList.contains('tree-node')
        );
        
        // Insert at the specified position
        if (position >= childNodes.length) {
            containerChildren.appendChild(treeNodeToMove);
        } else {
            containerChildren.insertBefore(treeNodeToMove, childNodes[position]);
        }
        
        // Update the data model
        updateNodeParent(nodeId, containerId, position);
        
        // Update the icon view
        syncIconView();
    }
    
    /**
     * Move a node to the root level
     * @param {string} nodeId - ID of the node to move
     */
    function moveNodeToRoot(nodeId) {
        // Save current document first
        WebNotebook.Interface.FileManager.saveCurrentDocument();
        
        // Get the node
        const nodeToMove = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        
        if (!nodeToMove) {
            console.error('Could not find node for move operation');
            return;
        }
        
        // Get the tree node wrapper
        const treeNodeToMove = nodeToMove.closest('.tree-node');
        
        // Get the root container
        const rootContainer = document.querySelector('.tree-root');
        
        // Move the node
        rootContainer.appendChild(treeNodeToMove);
        
        // Update the data model
        updateNodeParent(nodeId, null);
        
        // Update the icon view
        syncIconView();
    }
    
    /**
     * Move a node to a specific position at the root level
     * @param {string} nodeId - ID of the node to move
     * @param {number} position - Index position to insert at
     */
    function moveNodeToRootPosition(nodeId, position) {
        // Save current document first
        WebNotebook.Interface.FileManager.saveCurrentDocument();
        
        // Get the node
        const nodeToMove = document.querySelector(`.node-content[data-id="${nodeId}"]`);
        
        if (!nodeToMove) {
            console.error('Could not find node for move operation');
            return;
        }
        
        // Get the tree node wrapper
        const treeNodeToMove = nodeToMove.closest('.tree-node');
        
        // Get the root container
        const rootContainer = document.querySelector('.tree-root');
        
        // Get all root level nodes
        const rootNodes = Array.from(rootContainer.children).filter(
            child => child.classList.contains('tree-node')
        );
        
        // Insert at the specified position
        if (position >= rootNodes.length) {
            rootContainer.appendChild(treeNodeToMove);
        } else {
            rootContainer.insertBefore(treeNodeToMove, rootNodes[position]);
        }
        
        // Update the data model
        updateNodeParent(nodeId, null, position);
        
        // Update the icon view
        syncIconView();
    }
    
    /**
     * Check if a node is an ancestor of another node
     * @param {Element} nodeA - The potential ancestor node
     * @param {Element} nodeB - The potential descendant node
     * @returns {boolean} True if nodeA is an ancestor of nodeB
     */
    function isAncestor(nodeA, nodeB) {
        // Get the IDs
        const nodeAId = nodeA.dataset.id;
        const nodeBId = nodeB.dataset.id;
        
        if (nodeAId === nodeBId) return true;
        
        // Get node B's tree node
        const treeBNode = nodeB.closest('.tree-node');
        
        // Check if node A is an ancestor of node B by walking up the tree
        let current = treeBNode.parentElement;
        
        while (current) {
            if (current.previousElementSibling && current.previousElementSibling.dataset.id === nodeAId) {
                return true;
            }
            current = current.parentElement.closest('.node-children');
        }
        
        return false;
    }
    
    /**
     * Update a node's parent in the data model
     * @param {string} nodeId - ID of the node to update
     * @param {string|null} parentId - ID of the new parent, or null for root
     * @param {number} [position] - Optional position among siblings
     */
    function updateNodeParent(nodeId, parentId, position = -1) {
        // Get the node data
        const nodesData = WebNotebook.Utils.Storage.loadNodesData();
        
        if (nodesData[nodeId]) {
            // Update parent reference
            nodesData[nodeId].parentId = parentId;
            
            // If position is specified, handle ordering
            if (position !== -1 && parentId) {
                // Find all siblings
                const siblings = Object.values(nodesData).filter(
                    node => node.parentId === parentId
                );
                
                // Sort them as they appear in the DOM
                const orderedSiblings = Array.from(
                    document.querySelectorAll(`.node-content[data-type]`)
                )
                .filter(node => {
                    const id = node.dataset.id;
                    return id && id !== nodeId && nodesData[id] && nodesData[id].parentId === parentId;
                })
                .map(node => node.dataset.id);
                
                // Insert the moved node at the specified position
                orderedSiblings.splice(position, 0, nodeId);
                
                // Update order values
                orderedSiblings.forEach((id, idx) => {
                    if (nodesData[id]) {
                        nodesData[id].order = idx;
                    }
                });
            }
            
            // Save the updated data
            WebNotebook.Utils.Storage.saveNodesData(nodesData);
        }
    }
    
    /**
     * Synchronize the icon view to match the tree view
     */
    function syncIconView() {
        // This would refresh the icon view based on the updated tree structure
        // For now, we'll just trigger a view refresh
        WebNotebook.Interface.ViewModes.refreshCurrentView();
    }
    
    /**
     * Make a newly created node draggable
     * @param {string} nodeId - ID of the new node
     */
    function initializeNodeDragDrop(nodeId) {
        const node = document.querySelector(`.node-content[data-id="${nodeId}"], .grid-item[data-id="${nodeId}"]`);
        if (node) {
            makeDraggable(node);
            
            // If it's a container type, make it a drop target too
            const type = node.getAttribute('data-type');
            if (type === 'folder' || type === 'roadmap' || type === 'knowledge') {
                setupContainerNodes();
                
                // Also set up its children container
                const childrenContainer = node.nextElementSibling;
                if (childrenContainer && childrenContainer.classList.contains('node-children')) {
                    setupChildrenContainers();
                }
            }
        }
    }
    
    // Public API
    return {
        initialize,
        initializeNodeDragDrop,
        makeNodeDraggable: makeDraggable
    };
})();