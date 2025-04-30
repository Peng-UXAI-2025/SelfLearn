/**
 * Tree Editor Module
 * Provides functionality for creating and editing knowledge trees
 */

WebNotebook.KnowledgeTree = WebNotebook.KnowledgeTree || {};
WebNotebook.KnowledgeTree.TreeEditor = (function() {
    // Private variables
    let treeEditorContainer = null;
    let currentView = 'mind-map'; // 'mind-map' or 'hierarchical'
    let currentTree = null;
    let selectedNode = null;
    
    // D3.js related variables
    let svg = null;
    let treeLayout = null;
    let linkGroup = null;
    let nodeGroup = null;
    let zoom = null;
    
    /**
     * Initialize the tree editor
     */
    function initialize() {
        console.log('Tree Editor initialized');
        
        // Get the tree editor container
        treeEditorContainer = document.querySelector('.knowledge-tree-editor');
        
        if (!treeEditorContainer) {
            console.error('Tree editor container not found');
            return;
        }
        
        // Set up view toggle buttons
        document.getElementById('mind-map-view-btn').addEventListener('click', () => switchView('mind-map'));
        document.getElementById('hierarchical-view-btn').addEventListener('click', () => switchView('hierarchical'));
        
        // Set up other buttons
        document.getElementById('add-node-btn').addEventListener('click', showAddNodeDialog);
        document.getElementById('export-tree-btn').addEventListener('click', showExportOptions);
        document.getElementById('close-tree-editor-btn').addEventListener('click', hideTreeEditor);
        
        // Initialize D3.js visualization
        initializeD3();
    }
    
    /**
     * Initialize D3.js for the mind map visualization
     */
    function initializeD3() {
        if (!window.d3) {
            console.error('D3.js library not loaded');
            return;
        }
        
        // Get the SVG element
        svg = d3.select('#mind-map-svg');
        
        // Set up zoom behavior
        zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', handleZoom);
            
        svg.call(zoom);
        
        // Create groups for links and nodes
        const g = svg.append('g')
            .attr('class', 'svg-container');
            
        linkGroup = g.append('g')
            .attr('class', 'links');
            
        nodeGroup = g.append('g')
            .attr('class', 'nodes');
        
        // Create D3 tree layout
        treeLayout = d3.tree()
            .nodeSize([50, 150])
            .separation((a, b) => a.parent === b.parent ? 1.2 : 2);
    }
    
    /**
     * Handle zoom events for the SVG
     */
    function handleZoom(event) {
        d3.select('.svg-container')
            .attr('transform', event.transform);
    }
    
    /**
     * Show the tree editor
     * @param {Object|string} tree - Tree data or node ID to load
     */
    function showTreeEditor(tree) {
        if (!treeEditorContainer) return;
        
        // Show the container
        treeEditorContainer.style.display = 'flex';
        
        // Load the tree data
        if (typeof tree === 'string') {
            // It's a node ID, load it and its children
            loadTreeFromNode(tree);
        } else if (tree && typeof tree === 'object') {
            // It's a tree data object
            currentTree = tree;
            renderTree();
        } else {
            // Create a new empty tree
            createNewTree();
        }
        
        // Default to mind map view
        switchView('mind-map');
        
        // Reset zoom
        resetZoom();
    }
    
    /**
     * Hide the tree editor
     */
    function hideTreeEditor() {
        if (!treeEditorContainer) return;
        
        treeEditorContainer.style.display = 'none';
        currentTree = null;
        selectedNode = null;
    }
    
    /**
     * Switch between mind map and hierarchical views
     * @param {string} view - View mode to switch to ('mind-map' or 'hierarchical')
     */
    function switchView(view) {
        if (!treeEditorContainer) return;
        
        const mindMapView = treeEditorContainer.querySelector('.mind-map-view');
        const hierarchicalView = treeEditorContainer.querySelector('.hierarchical-view');
        const mindMapBtn = document.getElementById('mind-map-view-btn');
        const hierarchicalBtn = document.getElementById('hierarchical-view-btn');
        
        if (view === 'mind-map') {
            mindMapView.style.display = 'block';
            hierarchicalView.style.display = 'none';
            mindMapBtn.classList.add('active');
            hierarchicalBtn.classList.remove('active');
            currentView = 'mind-map';
            
            // Update mind map visualization
            renderMindMap();
        } else if (view === 'hierarchical') {
            mindMapView.style.display = 'none';
            hierarchicalView.style.display = 'block';
            mindMapBtn.classList.remove('active');
            hierarchicalBtn.classList.add('active');
            currentView = 'hierarchical';
            
            // Update hierarchical view
            renderHierarchicalView();
        }
    }
    
    /**
     * Create a new empty tree
     */
    function createNewTree() {
        const newTree = {
            id: 'tree_' + Date.now(),
            name: 'New Knowledge Tree',
            type: 'knowledge',
            children: []
        };
        
        currentTree = newTree;
        renderTree();
    }
    
    /**
     * Load tree data from a node and its children
     * @param {string} nodeId - ID of the node to load
     */
    function loadTreeFromNode(nodeId) {
        // Get the node data
        const nodeData = WebNotebook.Utils.Storage.getNodeById(nodeId);
        
        if (!nodeData) {
            console.error('Node not found:', nodeId);
            return;
        }
        
        // Create tree root from this node
        const treeRoot = {
            id: nodeData.id,
            name: nodeData.title,
            type: nodeData.type,
            children: []
        };
        
        // Load children recursively
        loadChildrenRecursively(treeRoot);
        
        currentTree = treeRoot;
        renderTree();
    }
    
    /**
     * Recursively load children for a tree node
     * @param {Object} parentNode - Parent node to load children for
     */
    function loadChildrenRecursively(parentNode) {
        // Get all nodes
        const nodesData = WebNotebook.Utils.Storage.loadNodesData();
        
        // Find children of this parent
        Object.values(nodesData).forEach(node => {
            if (node.parentId === parentNode.id) {
                // Create child node
                const childNode = {
                    id: node.id,
                    name: node.title,
                    type: node.type,
                    children: []
                };
                
                // Add to parent's children
                parentNode.children.push(childNode);
                
                // Recursively load this child's children
                loadChildrenRecursively(childNode);
            }
        });
    }
    
    /**
     * Render the current tree based on view mode
     */
    function renderTree() {
        if (!currentTree) return;
        
        if (currentView === 'mind-map') {
            renderMindMap();
        } else {
            renderHierarchicalView();
        }
    }
    
    /**
     * Render the mind map visualization using D3.js
     */
    function renderMindMap() {
        if (!currentTree || !svg) return;
        
        // Clear existing visualization
        linkGroup.selectAll('*').remove();
        nodeGroup.selectAll('*').remove();
        
        // Create hierarchy
        const root = d3.hierarchy(currentTree);
        
        // Apply tree layout
        treeLayout(root);
        
        // Draw links
        const links = linkGroup.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d => {
                // Create curved path
                return `M${d.source.y},${d.source.x}
                        C${(d.source.y + d.target.y) / 2},${d.source.x}
                         ${(d.source.y + d.target.y) / 2},${d.target.x}
                         ${d.target.y},${d.target.x}`;
            });
        
        // Draw nodes
        const nodes = nodeGroup.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node ${d.data.id === selectedNode?.id ? 'selected' : ''}`)
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', handleNodeClick);
        
        // Add circles to nodes
        nodes.append('circle')
            .attr('r', 7)
            .style('fill', d => getNodeColor(d.data.type));
        
        // Add labels to nodes
        nodes.append('text')
            .attr('dy', '.35em')
            .attr('x', d => d.children ? -12 : 12)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name);
            
        // Add node type icons
        nodes.append('text')
            .attr('class', 'node-icon')
            .attr('dy', '.35em')
            .attr('y', -20)
            .style('text-anchor', 'middle')
            .text(d => getNodeIcon(d.data.type));
        
        // Center the visualization
        centerTree();
    }
    
    /**
     * Render the hierarchical tree view
     */
    function renderHierarchicalView() {
        if (!currentTree) return;
        
        const hierarchicalView = treeEditorContainer.querySelector('.hierarchical-view');
        hierarchicalView.innerHTML = '';
        
        // Create hierarchical tree
        const treeElement = document.createElement('ul');
        treeElement.className = 'hierarchical-tree';
        
        // Create root node
        const rootItem = createHierarchicalNode(currentTree);
        treeElement.appendChild(rootItem);
        
        // Add to view
        hierarchicalView.appendChild(treeElement);
    }
    
    /**
     * Create a hierarchical view node element
     * @param {Object} nodeData - Node data
     * @returns {Element} - The created node element
     */
    function createHierarchicalNode(nodeData) {
        // Create node list item
        const listItem = document.createElement('li');
        listItem.className = 'h-tree-node';
        listItem.dataset.id = nodeData.id;
        
        // Create node content
        const nodeContent = document.createElement('div');
        nodeContent.className = 'h-node-content';
        nodeContent.dataset.id = nodeData.id;
        
        if (selectedNode && selectedNode.id === nodeData.id) {
            nodeContent.classList.add('selected');
        }
        
        // Add expand/collapse toggle if has children
        if (nodeData.children && nodeData.children.length > 0) {
            const expandBtn = document.createElement('span');
            expandBtn.className = 'expand-collapse expanded';
            expandBtn.textContent = '▼';
            expandBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const childrenContainer = this.closest('.h-tree-node').querySelector('.h-node-children');
                if (childrenContainer) {
                    if (childrenContainer.style.display === 'none') {
                        childrenContainer.style.display = 'block';
                        this.textContent = '▼';
                        this.classList.add('expanded');
                    } else {
                        childrenContainer.style.display = 'none';
                        this.textContent = '▶';
                        this.classList.remove('expanded');
                    }
                }
            });
            nodeContent.appendChild(expandBtn);
        } else {
            // Placeholder for alignment
            const spacer = document.createElement('span');
            spacer.style.width = '20px';
            spacer.style.display = 'inline-block';
            nodeContent.appendChild(spacer);
        }
        
        // Add node icon
        const nodeIcon = document.createElement('span');
        nodeIcon.className = 'node-icon';
        nodeIcon.textContent = getNodeIcon(nodeData.type);
        nodeIcon.style.color = getNodeColor(nodeData.type);
        nodeContent.appendChild(nodeIcon);
        
        // Add node name
        const nodeName = document.createElement('span');
        nodeName.className = 'node-text';
        nodeName.textContent = nodeData.name;
        nodeContent.appendChild(nodeName);
        
        // Add action buttons
        const actionBtns = document.createElement('div');
        actionBtns.className = 'node-actions';
        
        // Add button
        const addBtn = document.createElement('button');
        addBtn.title = 'Add Child';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showAddNodeDialog(nodeData.id);
        });
        actionBtns.appendChild(addBtn);
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.title = 'Edit';
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showEditNodeDialog(nodeData.id);
        });
        actionBtns.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteNode(nodeData.id);
        });
        actionBtns.appendChild(deleteBtn);
        
        nodeContent.appendChild(actionBtns);
        
        // Add click handler
        nodeContent.addEventListener('click', function() {
            selectNode(nodeData);
        });
        
        listItem.appendChild(nodeContent);
        
        // Create children container if needed
        if (nodeData.children && nodeData.children.length > 0) {
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'h-node-children';
            
            // Add children
            nodeData.children.forEach(childData => {
                const childItem = createHierarchicalNode(childData);
                childrenContainer.appendChild(childItem);
            });
            
            listItem.appendChild(childrenContainer);
        }
        
        return listItem;
    }
    
    /**
     * Handle node click in mind map view
     * @param {Event} event - Click event
     * @param {Object} d - D3 node data
     */
    function handleNodeClick(event, d) {
        selectNode(d.data);
        event.stopPropagation();
    }
    
    /**
     * Select a node in the tree
     * @param {Object} node - Node data
     */
    function selectNode(node) {
        selectedNode = node;
        
        // Update D3 visualization
        if (currentView === 'mind-map') {
            nodeGroup.selectAll('.node')
                .classed('selected', d => d.data.id === node.id);
        } else {
            // Update hierarchical view
            const hierarchicalView = treeEditorContainer.querySelector('.hierarchical-view');
            hierarchicalView.querySelectorAll('.h-node-content')
                .forEach(el => {
                    if (el.dataset.id === node.id) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
        }
        
        // Show node details in a panel or update UI
        showNodeDetailsPanel(node);
    }
    
    /**
     * Get color for a node type
     * @param {string} type - Node type
     * @returns {string} - Color hex code
     */
    function getNodeColor(type) {
        const nodeType = WebNotebook.KnowledgeTree.NodeTypes.getNodeType(type);
        return nodeType ? nodeType.color : '#888888';
    }
    
    /**
     * Get icon for a node type
     * @param {string} type - Node type
     * @returns {string} - Icon character
     */
    function getNodeIcon(type) {
        return WebNotebook.KnowledgeTree.NodeTypes.getNodeIcon(type);
    }
    
    /**
     * Reset zoom to center the tree
     */
    function resetZoom() {
        if (!svg || !zoom) return;
        
        // Get SVG dimensions
        const svgWidth = svg.node().clientWidth;
        const svgHeight = svg.node().clientHeight;
        
        // Reset zoom transform
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity
                .translate(svgWidth / 2, svgHeight / 2)
                .scale(0.8));
    }
    
    /**
     * Center the tree visualization
     */
    function centerTree() {
        if (!svg || !zoom) return;
        
        // Get SVG dimensions
        const svgWidth = svg.node().clientWidth;
        const svgHeight = svg.node().clientHeight;
        
        // Reset zoom transform
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity
                .translate(svgWidth / 2, svgHeight / 2)
                .scale(0.8));
    }
    
    /**
     * Show the node details panel
     * @param {Object} node - Node data
     */
    function showNodeDetailsPanel(node) {
        // This would display a panel with node details and editing options
        console.log('Selected node:', node);
        
        // In a real implementation, this would show a panel with node properties
    }
    
    /**
     * Show dialog to add a new node
     * @param {string} [parentId] - Optional parent node ID
     */
    function showAddNodeDialog(parentId) {
        // This would show a dialog to add a new node
        
        // For now, just create a new node with a prompt
        const nodeName = prompt('Enter name for new node:');
        if (!nodeName) return;
        
        addNode(nodeName, 'knowledge', parentId);
    }
    
    /**
     * Show dialog to edit a node
     * @param {string} nodeId - ID of the node to edit
     */
    function showEditNodeDialog(nodeId) {
        // Find the node in the tree
        const node = findNodeInTree(currentTree, nodeId);
        if (!node) return;
        
        // For now, just use a prompt
        const newName = prompt('Edit node name:', node.name);
        if (!newName || newName === node.name) return;
        
        // Update node name
        updateNodeName(nodeId, newName);
    }
    
    /**
     * Add a new node to the tree
     * @param {string} name - Node name
     * @param {string} type - Node type
     * @param {string} [parentId] - Optional parent node ID
     * @returns {Object} - The new node
     */
    function addNode(name, type, parentId) {
        // Create new node
        const newNode = {
            id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            type: type || 'knowledge',
            children: []
        };
        
        // If parent ID is specified, add as child
        if (parentId) {
            const parentNode = findNodeInTree(currentTree, parentId);
            if (parentNode) {
                parentNode.children.push(newNode);
            } else {
                // Parent not found, add to root
                currentTree.children.push(newNode);
            }
        } else {
            // No parent, add to root
            currentTree.children.push(newNode);
        }
        
        // Re-render the tree
        renderTree();
        
        return newNode;
    }
    
    /**
     * Update a node's name
     * @param {string} nodeId - ID of the node to update
     * @param {string} newName - New name for the node
     */
    function updateNodeName(nodeId, newName) {
        // Find the node
        const node = findNodeInTree(currentTree, nodeId);
        if (!node) return;
        
        // Update name
        node.name = newName;
        
        // Re-render the tree
        renderTree();
    }
    
    /**
     * Delete a node from the tree
     * @param {string} nodeId - ID of the node to delete
     */
    function deleteNode(nodeId) {
        if (!confirm('Are you sure you want to delete this node and all its children?')) {
            return;
        }
        
        // Recursively find and remove the node
        function removeNode(parent, nodeId) {
            if (!parent || !parent.children) return false;
            
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                
                if (child.id === nodeId) {
                    // Found the node, remove it
                    parent.children.splice(i, 1);
                    return true;
                }
                
                // Check this child's children
                if (removeNode(child, nodeId)) {
                    return true;
                }
            }
            
            return false;
        }
        
        // Start from the root
        removeNode(currentTree, nodeId);
        
        // If we deleted the selected node, clear selection
        if (selectedNode && selectedNode.id === nodeId) {
            selectedNode = null;
        }
        
        // Re-render the tree
        renderTree();
    }
    
    /**
     * Find a node in the tree by ID
     * @param {Object} root - Root node to start search from
     * @param {string} nodeId - ID of the node to find
     * @returns {Object|null} - The found node or null
     */
    function findNodeInTree(root, nodeId) {
        if (root.id === nodeId) {
            return root;
        }
        
        if (root.children) {
            for (const child of root.children) {
                const found = findNodeInTree(child, nodeId);
                if (found) return found;
            }
        }
        
        return null;
    }
    
    /**
     * Show export options dialog
     */
    function showExportOptions() {
        // This would show a dialog with export options
        
        // For now, just export as JSON
        exportAsJSON();
    }
    
    /**
     * Export the current tree as JSON
     */
    function exportAsJSON() {
        if (!currentTree) return;
        
        // Create a JSON string
        const jsonString = JSON.stringify(currentTree, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTree.name.replace(/\s+/g, '_')}_tree.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export the current tree as Markdown
     */
    function exportAsMarkdown() {
        if (!currentTree) return;
        
        // Convert tree to Markdown
        let markdown = `# ${currentTree.name}\n\n`;
        
        // Function to add nodes recursively
        function addNodesMarkdown(node, depth) {
            const indent = '#'.repeat(depth + 1);
            markdown += `${indent} ${node.name}\n\n`;
            
            if (node.children && node.children.length > 0) {
                for (const child of node.children) {
                    addNodesMarkdown(child, depth + 1);
                }
            }
        }
        
        // Process all children of root
        if (currentTree.children && currentTree.children.length > 0) {
            for (const child of currentTree.children) {
                addNodesMarkdown(child, 1);
            }
        }
        
        // Create a blob and download link
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTree.name.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Public API
    return {
        initialize,
        showTreeEditor,
        hideTreeEditor,
        switchView,
        addNode,
        deleteNode,
        updateNodeName,
        exportAsJSON,
        exportAsMarkdown
    };
})();