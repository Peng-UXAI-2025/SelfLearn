/**
 * View Modes Module
 * Handles switching between tree view and icon view display modes
 */

WebNotebook.Interface = WebNotebook.Interface || {};
WebNotebook.Interface.ViewModes = (function() {
    // Private variables
    let currentViewMode = 'tree'; // 'tree' or 'icon'
    
    /**
     * Initialize the view modes module
     */
    function initialize() {
        console.log('View Modes module initialized');
        
        // Load preferred view mode from storage
        const savedMode = WebNotebook.Utils.Storage.loadViewMode();
        
        // Set up view mode switching buttons
        setupViewModeButtons();
        
        // Set initial view mode
        switchViewMode(savedMode || 'tree');
    }
    
    /**
     * Set up view mode switching buttons
     */
    function setupViewModeButtons() {
        // Tree view button
        document.getElementById('tree-view-btn').addEventListener('click', function() {
            switchViewMode('tree');
        });
        
        // Icon view button
        document.getElementById('icon-view-btn').addEventListener('click', function() {
            switchViewMode('icon');
        });
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
        } else if (mode === 'icon') {
            treeView.style.display = 'none';
            iconView.style.display = 'block';
            treeBtn.classList.remove('active');
            iconBtn.classList.add('active');
            currentViewMode = 'icon';
        }
        
        // Save preference
        WebNotebook.Utils.Storage.saveViewMode(mode);
    }
    
    /**
     * Get current view mode
     * @returns {string} Current view mode ('tree' or 'icon')
     */
    function getCurrentViewMode() {
        return currentViewMode;
    }
    
    /**
     * Synchronize the content between tree and icon views
     * Used when adding new nodes or updating existing ones
     */
    function syncViews() {
        // This would be used for more complex synchronization when needed
        // For now, most of our synchronization is handled in the FileManager module
        // when creating, deleting, or updating nodes
    }
    
    /**
     * Refresh the current view
     * Useful after bulk operations or data imports
     */
    function refreshCurrentView() {
        // This would rebuild the entire view from the data model
        // For now, we'll implement a simple version that just reapplies the current view mode
        switchViewMode(currentViewMode);
    }
    
    // Public API
    return {
        initialize,
        switchViewMode,
        getCurrentViewMode,
        syncViews,
        refreshCurrentView
    };
})();