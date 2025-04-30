/**
 * Roadmap Tracker Module
 * Handles learning roadmap progression tracking and visualization
 */

WebNotebook.Interface = WebNotebook.Interface || {};
WebNotebook.Interface.RoadmapTracker = (function() {
    /**
     * Initialize the roadmap tracker
     */
    function initialize() {
        console.log('Roadmap Tracker initialized');
        
        // Update progress for all roadmap nodes
        updateAllRoadmaps();
        
        // Add listeners for status changes
        setupStatusListeners();
    }
    
    /**
     * Update progress indicators for all roadmap nodes
     */
    function updateAllRoadmaps() {
        // Update all roadmap nodes in tree view
        document.querySelectorAll('.node-content[data-type="roadmap"]').forEach(roadmapNode => {
            updateRoadmapProgress(roadmapNode);
        });
    }
    
    /**
     * Set up listeners for status changes on nodes
     */
    function setupStatusListeners() {
        // Listen for status changes via custom event
        document.addEventListener('statusChange', function(e) {
            // Find the nearest roadmap parent and update its progress
            const node = e.detail.node;
            
            if (node) {
                const roadmapParent = findRoadmapParent(node);
                if (roadmapParent) {
                    updateRoadmapProgress(roadmapParent);
                }
            }
        });
    }
    
    /**
     * Find the roadmap parent of a node
     * @param {Element} node - The node to find the roadmap parent for
     * @returns {Element|null} - The roadmap parent node or null if not found
     */
    function findRoadmapParent(node) {
        // In tree view
        if (node.classList.contains('node-content')) {
            let current = node.closest('.tree-node');
            
            // Walk up the tree to find a roadmap parent
            while (current) {
                const parentUl = current.parentElement;
                if (!parentUl || !parentUl.classList.contains('node-children')) {
                    return null;
                }
                
                const parentNode = parentUl.previousElementSibling;
                if (parentNode && parentNode.classList.contains('node-content') && 
                    parentNode.getAttribute('data-type') === 'roadmap') {
                    return parentNode;
                }
                
                current = parentUl.parentElement;
            }
        } 
        // In icon view - no real hierarchy, so use data model
        else if (node.classList.contains('grid-item')) {
            const nodeId = node.dataset.id;
            if (!nodeId) return null;
            
            // Get node data
            const nodesData = WebNotebook.Utils.Storage.loadNodesData();
            if (!nodesData[nodeId] || !nodesData[nodeId].parentId) return null;
            
            const parentId = nodesData[nodeId].parentId;
            const parentData = nodesData[parentId];
            
            if (parentData && parentData.type === 'roadmap') {
                return document.querySelector(`.node-content[data-id="${parentId}"]`);
            }
            
            // Check if there's a grandparent that's a roadmap
            if (parentData && parentData.parentId) {
                const grandparentId = parentData.parentId;
                const grandparentData = nodesData[grandparentId];
                
                if (grandparentData && grandparentData.type === 'roadmap') {
                    return document.querySelector(`.node-content[data-id="${grandparentId}"]`);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Update progress for a roadmap node
     * @param {Element} roadmapNode - The roadmap node element
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
        
        // Count items by status
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        
        childNodes.forEach(node => {
            const status = node.getAttribute('data-status');
            
            switch(status) {
                case 'completed':
                    completed++;
                    break;
                case 'in-progress':
                    inProgress++;
                    break;
                case 'not-started':
                default:
                    notStarted++;
                    break;
            }
        });
        
        const total = childNodes.length;
        
        // Calculate progress percentage
        const progress = Math.round((completed / total) * 100);
        
        // Update progress indicator in tree view
        let progressIndicator = roadmapNode.querySelector('.progress-indicator');
        if (!progressIndicator) {
            progressIndicator = document.createElement('span');
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
        
        // Update roadmap node data
        const nodeId = roadmapNode.dataset.id;
        if (nodeId) {
            const nodeData = WebNotebook.Utils.Storage.getNodeById(nodeId);
            if (nodeData) {
                nodeData.progressStats = {
                    total: total,
                    completed: completed,
                    inProgress: inProgress,
                    notStarted: notStarted,
                    percentage: progress
                };
                WebNotebook.Utils.Storage.saveNode(nodeId, nodeData);
            }
        }
        
        // Update content in document if it's currently selected
        updateDocumentProgress(roadmapNode, {
            total: total,
            completed: completed,
            inProgress: inProgress,
            notStarted: notStarted,
            percentage: progress
        });
    }
    
    /**
     * Update the document content with progress information
     * @param {Element} roadmapNode - The roadmap node
     * @param {Object} stats - Progress statistics
     */
    function updateDocumentProgress(roadmapNode, stats) {
        const selectedNode = WebNotebook.Interface.FileManager.getSelectedNode();
        
        // Only update if this roadmap is the selected node
        if (selectedNode && selectedNode.dataset.id === roadmapNode.dataset.id) {
            const documentBody = document.getElementById('document-body');
            
            // Find or create progress tracker in document
            let progressTracker = documentBody.querySelector('.progress-tracker');
            if (!progressTracker) {
                // Look for a heading about progress and insert after it
                const headings = Array.from(documentBody.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                const progressHeading = headings.find(h => h.textContent.toLowerCase().includes('progress'));
                
                if (progressHeading) {
                    progressTracker = document.createElement('div');
                    progressTracker.className = 'progress-tracker';
                    progressHeading.insertAdjacentElement('afterend', progressTracker);
                } else {
                    // If no progress heading, add at the top
                    progressTracker = document.createElement('div');
                    progressTracker.className = 'progress-tracker';
                    
                    if (documentBody.firstChild) {
                        documentBody.insertBefore(progressTracker, documentBody.firstChild);
                    } else {
                        documentBody.appendChild(progressTracker);
                    }
                }
            }
            
            // Update progress tracker content
            progressTracker.innerHTML = `
                <div class="progress-bar-container">
                    <div class="progress-label">Overall Progress: ${stats.percentage}%</div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar" style="width: ${stats.percentage}%;"></div>
                        <div class="progress-percentage">${stats.percentage}%</div>
                    </div>
                </div>
                <div class="progress-stats">
                    <div class="stat-item">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value">${stats.completed} of ${stats.total} (${Math.round((stats.completed / stats.total) * 100)}%)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">In Progress:</span>
                        <span class="stat-value">${stats.inProgress} of ${stats.total} (${Math.round((stats.inProgress / stats.total) * 100)}%)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Not Started:</span>
                        <span class="stat-value">${stats.notStarted} of ${stats.total} (${Math.round((stats.notStarted / stats.total) * 100)}%)</span>
                    </div>
                </div>
            `;
            
            // Save the document
            WebNotebook.Interface.FileManager.saveCurrentDocument();
        }
    }
    
    /**
     * Get the learning progress for a specific roadmap
     * @param {string} roadmapId - ID of the roadmap
     * @returns {Object|null} - Progress statistics or null if not found
     */
    function getRoadmapProgress(roadmapId) {
        // Get the roadmap node
        const roadmapNode = document.querySelector(`.node-content[data-id="${roadmapId}"]`);
        if (!roadmapNode || roadmapNode.getAttribute('data-type') !== 'roadmap') {
            return null;
        }
        
        // Calculate progress
        const nodeData = WebNotebook.Utils.Storage.getNodeById(roadmapId);
        if (nodeData && nodeData.progressStats) {
            return nodeData.progressStats;
        }
        
        // If stats aren't cached, calculate them now
        updateRoadmapProgress(roadmapNode);
        
        // Try again after update
        const updatedNodeData = WebNotebook.Utils.Storage.getNodeById(roadmapId);
        return updatedNodeData?.progressStats || null;
    }
    
    /**
     * Mark all items in a roadmap with a specific status
     * @param {string} roadmapId - ID of the roadmap
     * @param {string} status - Status to set ('completed', 'in-progress', 'not-started')
     */
    function markAllItems(roadmapId, status) {
        // Get the roadmap node
        const roadmapNode = document.querySelector(`.node-content[data-id="${roadmapId}"]`);
        if (!roadmapNode || roadmapNode.getAttribute('data-type') !== 'roadmap') {
            return;
        }
        
        // Get all child nodes
        const childrenContainer = roadmapNode.nextElementSibling;
        if (!childrenContainer || !childrenContainer.classList.contains('node-children')) {
            return;
        }
        
        const childNodes = childrenContainer.querySelectorAll('.node-content');
        
        // Update status for each child
        childNodes.forEach(node => {
            WebNotebook.Interface.FileManager.updateNodeStatus(node, status);
        });
        
        // Update progress
        updateRoadmapProgress(roadmapNode);
    }
    
    /**
     * Create a new learning step in a roadmap
     * @param {string} roadmapId - ID of the roadmap
     * @param {string} name - Name of the learning step
     * @param {string} type - Type of node ('knowledge' or 'file')
     * @returns {string|null} - ID of the new node or null on failure
     */
    function createLearningStep(roadmapId, name, type = 'knowledge') {
        // Get the roadmap node
        const roadmapNode = document.querySelector(`.node-content[data-id="${roadmapId}"]`);
        if (!roadmapNode || roadmapNode.getAttribute('data-type') !== 'roadmap') {
            return null;
        }
        
        // Create the new node as a child of the roadmap
        const newNodeId = WebNotebook.Interface.FileManager.createNode(name, type, roadmapNode);
        
        // Update roadmap progress
        updateRoadmapProgress(roadmapNode);
        
        return newNodeId;
    }
    
    // Public API
    return {
        initialize,
        updateRoadmapProgress,
        getRoadmapProgress,
        markAllItems,
        createLearningStep
    };
})();