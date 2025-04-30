/**
 * Context Menu Module
 * Handles right-click context menu for file management operations
 */

WebNotebook.Interface = WebNotebook.Interface || {};
WebNotebook.Interface.ContextMenu = (function() {
    // Private variables
    let contextMenu = null;
    
    /**
     * Initialize the context menu module
     */
    function initialize() {
        console.log('Context Menu module initialized');
        
        contextMenu = document.querySelector('.context-menu');
        
        if (!contextMenu) {
            console.error('Context menu element not found in the DOM');
            return;
        }
        
        // Set up right-click handling for nodes
        setupNodeContextMenu();
        
        // Set up context menu actions
        setupMenuActions();
        
        // Setup background context menu for empty areas
        setupBackgroundContextMenu();
        
        // Close menu when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.context-menu')) {
                hideContextMenu();
            }
        });
        
        // Also close on window scroll
        window.addEventListener('scroll', hideContextMenu);
        
        // And close on window resize
        window.addEventListener('resize', hideContextMenu);
    }
    
    /**
     * Set up right-click handling for nodes in tree and icon views
     */
    function setupNodeContextMenu() {
        // Add context menu to tree view nodes
        document.querySelectorAll('.node-content').forEach(node => {
            node.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showContextMenuForNode(this, e.pageX, e.pageY);
            });
        });
        
        // Add context menu to icon view nodes
        document.querySelectorAll('.grid-item').forEach(node => {
            node.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showContextMenuForNode(this, e.pageX, e.pageY);
            });
        });
    }
    
    /**
     * Set up right-click menu for background/empty areas
     */
    function setupBackgroundContextMenu() {
        // Handle right-click on empty areas in tree view
        document.querySelectorAll('.knowledge-view').forEach(view => {
            view.addEventListener('contextmenu', function(e) {
                // Only trigger if clicking directly on the view container, not on nodes
                if (e.target === this || e.target.classList.contains('tree-root') || e.target.classList.contains('grid-items')) {
                    e.preventDefault();
                    showContextMenuForRoot(e.pageX, e.pageY);
                }
            });
        });
    }
    
    /**
     * Set up the context menu item click handlers
     */
    function setupMenuActions() {
        contextMenu.querySelectorAll('li[data-action]').forEach(item => {
            item.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const targetNodeId = contextMenu.dataset.targetNodeId;
                
                // Find the target node (or null for root operations)
                let targetNode = null;
                if (targetNodeId && targetNodeId !== 'root') {
                    targetNode = document.querySelector(`.node-content[data-id="${targetNodeId}"], .grid-item[data-id="${targetNodeId}"]`);
                }
                
                executeAction(action, targetNode);
                hideContextMenu();
            });
        });
    }
    
    /**
     * Show the context menu for a specific node
     * @param {Element} node - The node element
     * @param {number} x - X position for the menu
     * @param {number} y - Y position for the menu
     */
    function showContextMenuForNode(node, x, y) {
        // Set target node ID in the menu's dataset
        contextMenu.dataset.targetNodeId = node.dataset.id || '';
        
        // Position the menu
        positionMenu(x, y);
        
        // Show the menu
        contextMenu.style.display = 'block';
        
        // Select the node to indicate current context
        WebNotebook.Interface.FileManager.selectNode(node);
        
        // Configure menu items based on node type
        configureMenuItemsForNode(node);
    }
    
    /**
     * Show context menu for root level operations (click on background)
     * @param {number} x - X position for the menu
     * @param {number} y - Y position for the menu
     */
    function showContextMenuForRoot(x, y) {
        // Mark as root-level operation
        contextMenu.dataset.targetNodeId = 'root';
        
        // Position the menu
        positionMenu(x, y);
        
        // Show the menu
        contextMenu.style.display = 'block';
        
        // Configure menu for root context
        configureMenuItemsForRoot();
    }
    
    /**
     * Configure which menu items to show based on node type
     * @param {Element} node - The node element
     */
    function configureMenuItemsForNode(node) {
        const nodeType = node.getAttribute('data-type');
        
        // Show/hide status menu items based on node type
        const statusItems = contextMenu.querySelectorAll('[data-action^="status-"]');
        const canHaveStatus = nodeType === 'file' || nodeType === 'knowledge' || nodeType === 'roadmap' || nodeType === 'ai-note';
        
        statusItems.forEach(item => {
            item.style.display = canHaveStatus ? 'block' : 'none';
            
            // Highlight current status if set
            if (canHaveStatus) {
                const currentStatus = node.getAttribute('data-status');
                const itemStatus = item.getAttribute('data-action').replace('status-', '');
                
                if (currentStatus === itemStatus) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
        
        // Show/hide new item options based on whether the node can have children
        const newItems = contextMenu.querySelectorAll('[data-action^="new-"]');
        const canHaveChildren = nodeType === 'folder' || nodeType === 'roadmap' || nodeType === 'knowledge';
        
        newItems.forEach(item => {
            item.style.display = canHaveChildren ? 'block' : 'none';
        });
        
        // Always show rename and delete for all nodes
        const renameItem = contextMenu.querySelector('[data-action="rename"]');
        const deleteItem = contextMenu.querySelector('[data-action="delete"]');
        
        if (renameItem) renameItem.style.display = 'block';
        if (deleteItem) deleteItem.style.display = 'block';
    }
    
    /**
     * Configure menu items for root level context menu
     */
    function configureMenuItemsForRoot() {
        // Show all new item options
        const newItems = contextMenu.querySelectorAll('[data-action^="new-"]');
        newItems.forEach(item => {
            item.style.display = 'block';
        });
        
        // Hide status items
        const statusItems = contextMenu.querySelectorAll('[data-action^="status-"]');
        statusItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Hide rename and delete (can't rename/delete root)
        const renameItem = contextMenu.querySelector('[data-action="rename"]');
        const deleteItem = contextMenu.querySelector('[data-action="delete"]');
        
        if (renameItem) renameItem.style.display = 'none';
        if (deleteItem) deleteItem.style.display = 'none';
    }
    
    /**
     * Position the context menu to ensure it's fully visible in the viewport
     * @param {number} x - Desired X position
     * @param {number} y - Desired Y position
     */
    function positionMenu(x, y) {
        // First set position to properly calculate menu dimensions
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';
        
        // Get menu dimensions
        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust X position if menu would go off-screen on the right
        if (x + menuWidth > viewportWidth) {
            x = viewportWidth - menuWidth - 5; // 5px margin
        }
        
        // Adjust Y position if menu would go off-screen at the bottom
        if (y + menuHeight > viewportHeight) {
            y = viewportHeight - menuHeight - 5; // 5px margin
        }
        
        // Set final position
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    }
    
    /**
     * Hide the context menu
     */
    function hideContextMenu() {
        if (contextMenu) {
            contextMenu.style.display = 'none';
            
            // Reset active status on menu items
            contextMenu.querySelectorAll('.active').forEach(item => {
                item.classList.remove('active');
            });
        }
    }
    
    /**
     * Execute the selected context menu action
     * @param {string} action - The action to execute
     * @param {Element|null} node - The target node (null for root actions)
     */
    function executeAction(action, node) {
        switch(action) {
            case 'new-file':
                WebNotebook.Interface.FileManager.showNewItemModal('file', node);
                break;
            case 'new-folder':
                WebNotebook.Interface.FileManager.showNewItemModal('folder', node);
                break;
            case 'new-knowledge':
                WebNotebook.Interface.FileManager.showNewItemModal('knowledge', node);
                break;
            case 'new-roadmap':
                WebNotebook.Interface.FileManager.showNewItemModal('roadmap', node);
                break;
            case 'rename':
                if (node) WebNotebook.Interface.FileManager.renameNode(node);
                break;
            case 'delete':
                if (node) WebNotebook.Interface.FileManager.deleteNode(node);
                break;
            case 'status-completed':
                if (node) WebNotebook.Interface.FileManager.updateNodeStatus(node, 'completed');
                break;
            case 'status-inprogress':
                if (node) WebNotebook.Interface.FileManager.updateNodeStatus(node, 'in-progress');
                break;
            case 'status-notstarted':
                if (node) WebNotebook.Interface.FileManager.updateNodeStatus(node, 'not-started');
                break;
            default:
                console.warn('Unknown context menu action:', action);
        }
    }
    
    /**
     * Register a new context menu item
     * @param {string} actionName - The action identifier
     * @param {string} label - Display label for the menu item
     * @param {Function} handler - Function to call when menu item is clicked
     * @param {Function} condition - Function that returns true if item should be shown
     */
    function registerMenuItem(actionName, label, handler, condition) {
        // Create a new menu item
        const menuItem = document.createElement('li');
        menuItem.setAttribute('data-action', actionName);
        menuItem.textContent = label;
        
        // Add the item to the menu
        contextMenu.appendChild(menuItem);
        
        // Add click handler
        menuItem.addEventListener('click', function() {
            const targetNodeId = contextMenu.dataset.targetNodeId;
            let targetNode = null;
            
            if (targetNodeId && targetNodeId !== 'root') {
                targetNode = document.querySelector(`.node-content[data-id="${targetNodeId}"], .grid-item[data-id="${targetNodeId}"]`);
            }
            
            handler(targetNode);
            hideContextMenu();
        });
        
        // Store condition function for later evaluation
        menuItem.dataset.condition = condition.toString();
    }
    
    // Public API
    return {
        initialize,
        hideContextMenu,
        registerMenuItem
    };
})();