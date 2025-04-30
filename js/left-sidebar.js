/**
 * Left Sidebar Module
 * Provides functionality for the hideable left sidebar with study spaces
 */

(function() {
    // Create sidebar namespace
    window.sidebar = {};
    
    // Store sidebar state
    let isSidebarVisible = false;
    
    /**
     * Initialize left sidebar
     */
    window.sidebar.initialize = function() {
        // Create sidebar if not exists
        if (!document.getElementById('left-sidebar')) {
            createSidebar();
        }
        
        // Add sidebar toggle button to header
        addToggleButton();
        
        console.log("Left sidebar initialized");
    };
    
    /**
     * Create sidebar element
     */
    function createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'left-sidebar';
        sidebar.className = 'left-sidebar';
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h3>Study Spaces</h3>
                <button class="sidebar-close">&times;</button>
            </div>
            <div class="sidebar-content">
                <div class="sidebar-section">
                    <div class="sidebar-section-title">Your Spaces</div>
                    <ul class="sidebar-spaces" id="sidebar-spaces-list">
                        <!-- Space items will be inserted here -->
                    </ul>
                </div>
            </div>
            <div class="sidebar-footer">
                <button class="sidebar-footer-btn" id="create-space-btn">
                    <i class="icon-plus"></i> Create New Space
                </button>
            </div>
        `;
        
        // Add to document body
        document.body.appendChild(sidebar);
        
        // Add event listeners
        sidebar.querySelector('.sidebar-close').addEventListener('click', window.sidebar.hideSidebar);
        
        // Create space button
        sidebar.querySelector('#create-space-btn').addEventListener('click', () => {
            // Trigger create space modal from study spaces module
            if (typeof showCreateSpaceModal === 'function') {
                showCreateSpaceModal();
            } else if (window.studySpaces && typeof window.studySpaces.showCreateSpaceModal === 'function') {
                window.studySpaces.showCreateSpaceModal();
            } else {
                // Fallback to a simple alert
                alert('Create space functionality not available');
            }
        });
        
        return sidebar;
    }
    
    /**
     * Add toggle button to header
     */
    function addToggleButton() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        // Check if button already exists
        if (header.querySelector('.sidebar-toggle')) return;
        
        // Create button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.title = 'Toggle Sidebar';
        toggleBtn.innerHTML = '☰';
        
        // Add to header (as first child)
        if (header.firstChild) {
            header.insertBefore(toggleBtn, header.firstChild);
        } else {
            header.appendChild(toggleBtn);
        }
        
        // Add event listener
        toggleBtn.addEventListener('click', window.sidebar.toggleSidebar);
    }
    
    /**
     * Update sidebar content with study spaces
     */
    window.sidebar.updateContent = function() {
        const spacesList = document.getElementById('sidebar-spaces-list');
        if (!spacesList) return;
        
        // Clear current content
        spacesList.innerHTML = '';
        
        // Get spaces from storage
        const spaces = window.storage.getStudySpaces() || {};
        
        // Add space items
        if (Object.keys(spaces).length > 0) {
            Object.values(spaces).forEach(space => {
                spacesList.appendChild(createSpaceItem(space));
            });
        } else {
            // Show empty message
            const emptyItem = document.createElement('li');
            emptyItem.className = 'sidebar-space-item empty';
            emptyItem.innerHTML = 'No spaces yet';
            spacesList.appendChild(emptyItem);
        }
    };
    
    /**
     * Create space item for sidebar
     * @param {Object} space - Study space data
     * @returns {HTMLElement} - Space item element
     */
    function createSpaceItem(space) {
        const item = document.createElement('li');
        item.className = 'sidebar-space-item';
        item.dataset.spaceId = space.id;
        
        // Calculate progress
        const totalItems = space.items ? space.items.length : 0;
        const completedItems = space.items ? space.items.filter(item => item.status === 'completed').length : 0;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        item.innerHTML = `
            <div class="sidebar-space-icon ${space.id}"></div>
            <div class="sidebar-space-name">${space.name}</div>
            <div class="space-progress">${progressPercentage}%</div>
        `;
        
        // Add click event
        item.addEventListener('click', () => {
            // Open space
            if (window.studySpaces && typeof window.studySpaces.openStudySpace === 'function') {
                window.studySpaces.openStudySpace(space.id);
                
                // Mark as active
                setActiveSpace(space.id);
                
                // Hide sidebar on mobile
                if (window.innerWidth <= 768) {
                    window.sidebar.hideSidebar();
                }
            }
        });
        
        return item;
    }
    
    /**
     * Set active space in sidebar
     * @param {string} spaceId - Space ID to set as active
     */
    function setActiveSpace(spaceId) {
        // Remove active class from all items
        const items = document.querySelectorAll('.sidebar-space-item');
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to specified space
        const activeItem = document.querySelector(`.sidebar-space-item[data-space-id="${spaceId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    window.sidebar.toggleSidebar = function() {
        const sidebar = document.getElementById('left-sidebar');
        const content = document.querySelector('.content');
        
        if (!sidebar) return;
        
        if (isSidebarVisible) {
            window.sidebar.hideSidebar();
        } else {
            window.sidebar.showSidebar();
        }
    };
    
    /**
     * Show sidebar
     */
    window.sidebar.showSidebar = function() {
        const sidebar = document.getElementById('left-sidebar');
        const content = document.querySelector('.content');
        
        if (!sidebar) return;
        
        // Update content
        window.sidebar.updateContent();
        
        // Show sidebar
        sidebar.classList.add('visible');
        if (content) {
            content.classList.add('sidebar-visible');
        }
        
        isSidebarVisible = true;
    };
    
    /**
     * Hide sidebar
     */
    window.sidebar.hideSidebar = function() {
        const sidebar = document.getElementById('left-sidebar');
        const content = document.querySelector('.content');
        
        if (!sidebar) return;
        
        // Hide sidebar
        sidebar.classList.remove('visible');
        if (content) {
            content.classList.remove('sidebar-visible');
        }
        
        isSidebarVisible = false;
    };
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', window.sidebar.initialize);
})();