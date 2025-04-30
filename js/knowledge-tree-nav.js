/**
 * Knowledge Tree Navigation Module
 * Implements hierarchical knowledge tree functionality for SelfLearn notebook
 */

(function() {
    // Create knowledge tree namespace
    window.knowledgeTree = {};
    
    // Reference to the current space and item from studySpaces module
    let currentSpace = null;
    let currentItem = null;
    
    /**
     * Initialize knowledge tree navigation
     */
    window.knowledgeTree.initialize = function() {
        // Add click handlers to any knowledge items already in the DOM
        addKnowledgeItemClickHandlers();
        
        // Listen for DOM changes to handle dynamically added elements
        setupDOMObserver();
        
        console.log("Knowledge tree navigation initialized");
    };

    /**
     * Set up a MutationObserver to watch for DOM changes
     * This helps add click handlers to dynamically added knowledge items
     */
    function setupDOMObserver() {
        // Create an observer instance
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if we need to add click handlers
                    setTimeout(addKnowledgeItemClickHandlers, 100);
                }
            });
        });
        
        // Start observing the document body for DOM changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Open knowledge item with proper tree structure handling
     * @param {string} itemId - Knowledge item ID
     */
    window.knowledgeTree.openKnowledgeItem = function(itemId) {
        // Get current space from studySpaces if available
        if (window.studySpaces && typeof window.studySpaces.getCurrentSpace === 'function') {
            currentSpace = window.studySpaces.getCurrentSpace();
        }
        
        if (!currentSpace || !currentSpace.items) {
            console.error("Cannot open knowledge item: No current space available");
            return;
        }
        
        // Find item in the current space
        const item = findKnowledgeItemInHierarchy(currentSpace.items, itemId);
        if (!item) {
            console.error(`Knowledge item not found: ${itemId}`);
            return;
        }
        
        // Store current item as active
        currentItem = item;
        
        // Update current item in studySpaces if possible
        if (window.studySpaces && typeof window.studySpaces.setCurrentItem === 'function') {
            window.studySpaces.setCurrentItem(item);
        }
        
        // Show knowledge content with tree navigation
        showKnowledgeContentWithTree(currentSpace.id, item);
    };

    /**
     * Add click handlers to knowledge items
     * This function can be called whenever new items are added to the DOM
     */
    function addKnowledgeItemClickHandlers() {
        // Add handlers to main knowledge items
        document.querySelectorAll('.knowledge-item').forEach(item => {
            if (!item.hasAttribute('data-click-handler-added')) {
                const itemId = item.getAttribute('data-item-id');
                if (itemId) {
                    item.addEventListener('click', function() {
                        window.knowledgeTree.openKnowledgeItem(itemId);
                    });
                    item.setAttribute('data-click-handler-added', 'true');
                }
            }
        });
        
        // Add handlers to child knowledge items
        document.querySelectorAll('.child-knowledge-item').forEach(item => {
            if (!item.hasAttribute('data-click-handler-added')) {
                const itemId = item.getAttribute('data-item-id');
                if (itemId) {
                    item.addEventListener('click', function() {
                        window.knowledgeTree.openKnowledgeItem(itemId);
                    });
                    item.setAttribute('data-click-handler-added', 'true');
                }
            }
        });
        
        // Add handlers to tree items in sidebar
        document.querySelectorAll('.tree-item-content').forEach(item => {
            if (!item.hasAttribute('data-click-handler-added')) {
                // Find the closest tree-item to get the item ID
                const treeItem = item.closest('.tree-item');
                if (treeItem) {
                    const itemId = treeItem.getAttribute('data-item-id');
                    if (itemId) {
                        item.addEventListener('click', function(e) {
                            // Prevent triggering if clicking on expand/collapse button
                            if (e.target.classList.contains('expand-collapse-btn')) return;
                            window.knowledgeTree.openKnowledgeItem(itemId);
                        });
                        item.setAttribute('data-click-handler-added', 'true');
                    }
                }
            }
        });
    }

    /**
     * Find a knowledge item in the hierarchy (recursive search)
     * @param {Array} items - Array of items to search
     * @param {string} itemId - ID to find
     * @param {Array} path - Path accumulator for breadcrumb (optional)
     * @returns {Object|null} - Found item or null
     */
    function findKnowledgeItemInHierarchy(items, itemId, path = []) {
        if (!items || !Array.isArray(items)) return null;
        
        for (const item of items) {
            // Check if this is the item we're looking for
            if (item.id === itemId) {
                // If we found it, add the path information to the item
                item._path = path;
                return item;
            }
            
            // Check children if any
            if (item.children && Array.isArray(item.children)) {
                // Build the path for this level
                const newPath = [...path, {
                    id: item.id,
                    title: item.title
                }];
                
                // Recursively search in children
                const found = findKnowledgeItemInHierarchy(item.children, itemId, newPath);
                if (found) return found;
            }
        }
        
        return null;
    }

    /**
     * Show knowledge content with tree navigation
     * @param {string} spaceId - Space ID
     * @param {Object} item - Knowledge item
     */
    function showKnowledgeContentWithTree(spaceId, item) {
        // Get the content area
        const contentArea = document.querySelector('.content');
        
        // Create container with sidebar + content layout
        const pageContainer = document.createElement('div');
        pageContainer.className = 'notebook-container';
        
        // Create sidebar for tree navigation
        const sidebar = createKnowledgeTreeSidebar(currentSpace, item);
        pageContainer.appendChild(sidebar);
        
        // Create content page
        const contentPage = document.createElement('div');
        contentPage.className = 'knowledge-content-page';
        
        // Add breadcrumb navigation
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        
        // Build breadcrumb based on path
        let breadcrumbHTML = `<a href="#" class="to-dashboard">Dashboard</a>`;
        breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
        breadcrumbHTML += `<a href="#" class="to-space">${currentSpace.name}</a>`;
        
        // Add path segments if they exist
        if (item._path && item._path.length > 0) {
            item._path.forEach(segment => {
                breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
                breadcrumbHTML += `<a href="#" class="to-path-item" data-id="${segment.id}">${segment.title}</a>`;
            });
        }
        
        // Add current item
        breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
        breadcrumbHTML += `<span>${item.title}</span>`;
        
        breadcrumb.innerHTML = breadcrumbHTML;
        
        // Add breadcrumb click handlers
        breadcrumb.querySelector('.to-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.showWelcomeDashboard();
        });
        
        breadcrumb.querySelector('.to-space').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.openStudySpace(spaceId);
        });
        
        // Add click handlers for path items
        breadcrumb.querySelectorAll('.to-path-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pathItemId = e.target.dataset.id;
                window.knowledgeTree.openKnowledgeItem(pathItemId);
            });
        });
        
        contentPage.appendChild(breadcrumb);
        
        // Add content header
        const header = document.createElement('div');
        header.className = 'content-header';
        
        // Get status class
        let statusClass = 'status-not-started';
        let statusText = 'Not Started';
        if (item.status === 'completed') {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (item.status === 'in-progress') {
            statusClass = 'status-in-progress';
            statusText = 'In Progress';
        }
        
        header.innerHTML = `
            <div class="content-title">
                <h1>${item.title}</h1>
                <div class="content-subtitle">${item.subtitle || ''}</div>
            </div>
            <div class="content-actions">
                <div class="content-status">
                    <span class="status-indicator ${statusClass}"></span>
                    <span class="status-text">${statusText}</span>
                </div>
                <div class="header-buttons">
                    <button class="action-btn generate-tree-btn">
                        <i class="icon-tree"></i> Generate Tree
                    </button>
                    <button class="action-btn edit-content-btn">
                        <i class="icon-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
        
        // Add edit button handler
        header.querySelector('.edit-content-btn').addEventListener('click', () => {
            showEditKnowledgeModal(spaceId, item);
        });
        
        // Add generate tree button handler
        header.querySelector('.generate-tree-btn').addEventListener('click', () => {
            showGenerateTreeModal(spaceId, item);
        });
        
        contentPage.appendChild(header);
        
        // Add content body
        const body = document.createElement('div');
        body.className = 'content-body';
        
        // Check if content exists, if not show placeholder
        if (item.content) {
            body.innerHTML = item.content;
        } else {
            body.innerHTML = `
                <div class="empty-content">
                    <div class="empty-icon">📝</div>
                    <h3>No content yet</h3>
                    <p>This knowledge item doesn't have any content yet. Click the Edit button to add content, or use Generate Tree to create a structure automatically.</p>
                </div>
            `;
        }
        
        contentPage.appendChild(body);
        
        // If there are children, display them as sub-pages
        if (item.children && item.children.length > 0) {
            const childrenSection = document.createElement('div');
            childrenSection.className = 'children-section';
            
            const childrenTitle = document.createElement('h2');
            childrenTitle.className = 'children-title';
            childrenTitle.textContent = 'Sub-pages';
            childrenSection.appendChild(childrenTitle);
            
            const childrenList = document.createElement('div');
            childrenList.className = 'children-list';
            
            // Add each child as a clickable item
            item.children.forEach(child => {
                const childItem = createChildKnowledgeItem(child);
                childrenList.appendChild(childItem);
            });
            
            childrenSection.appendChild(childrenList);
            
            // Add "Add new sub-page" button
            const addChildButton = document.createElement('div');
            addChildButton.className = 'add-child-button';
            addChildButton.innerHTML = `<i class="icon-plus"></i> Add New Sub-page`;
            
            addChildButton.addEventListener('click', () => {
                showAddChildModal(spaceId, item);
            });
            
            childrenSection.appendChild(addChildButton);
            
            contentPage.appendChild(childrenSection);
        } else {
            // If no children, show add sub-page button
            const addChildSection = document.createElement('div');
            addChildSection.className = 'add-child-section';
            
            const childrenTitle = document.createElement('h2');
            childrenTitle.className = 'children-title';
            childrenTitle.textContent = 'Sub-pages';
            addChildSection.appendChild(childrenTitle);
            
            const addChildMessage = document.createElement('p');
            addChildMessage.className = 'children-message';
            addChildMessage.textContent = 'No sub-pages yet. Add one below or use Generate Tree to create a structure automatically.';
            
            addChildSection.appendChild(addChildMessage);
            
            const addChildButtons = document.createElement('div');
            addChildButtons.className = 'add-child-buttons';
            
            const addChildButton = document.createElement('button');
            addChildButton.className = 'add-child-btn';
            addChildButton.innerHTML = '<i class="icon-plus"></i> Add Sub-page';
            
            addChildButton.addEventListener('click', () => {
                showAddChildModal(spaceId, item);
            });
            
            const generateTreeButton = document.createElement('button');
            generateTreeButton.className = 'generate-tree-btn';
            generateTreeButton.innerHTML = '<i class="icon-tree"></i> Generate Tree Structure';
            
            generateTreeButton.addEventListener('click', () => {
                showGenerateTreeModal(spaceId, item);
            });
            
            addChildButtons.appendChild(addChildButton);
            addChildButtons.appendChild(generateTreeButton);
            
            addChildSection.appendChild(addChildButtons);
            
            contentPage.appendChild(addChildSection);
        }
        
        // Add content page to container
        pageContainer.appendChild(contentPage);
        
        // Replace current content with the new layout
        contentArea.innerHTML = '';
        contentArea.appendChild(pageContainer);
        
        // Update document title
        document.title = `${item.title} - ${currentSpace.name} - SelfLearn`;
        document.getElementById('document-title').textContent = item.title;
        
        // Update breadcrumb in header
        updateBreadcrumb(item.title, currentSpace.name);
        
        // Add click handlers to newly added elements
        addKnowledgeItemClickHandlers();
    }

    /**
     * Create knowledge tree sidebar
     * @param {Object} space - Current space
     * @param {Object} activeItem - Currently active item
     * @returns {HTMLElement} - Sidebar element
     */
    function createKnowledgeTreeSidebar(space, activeItem) {
        const sidebar = document.createElement('div');
        sidebar.className = 'knowledge-tree-sidebar';
        
        // Add sidebar header
        const header = document.createElement('div');
        header.className = 'tree-sidebar-header';
        header.innerHTML = `
            <h3>${space.name}</h3>
            <button class="collapse-sidebar-btn">◀</button>
        `;
        
        // Add collapse button functionality
        header.querySelector('.collapse-sidebar-btn').addEventListener('click', () => {
            toggleTreeSidebar(sidebar);
        });
        
        sidebar.appendChild(header);
        
        // Add search input
        const search = document.createElement('div');
        search.className = 'tree-search';
        search.innerHTML = `
            <input type="text" placeholder="Search pages...">
            <button class="search-btn">🔍</button>
        `;
        
        // Add search functionality
        const searchInput = search.querySelector('input');
        const searchBtn = search.querySelector('.search-btn');
        
        searchBtn.addEventListener('click', () => {
            searchKnowledgeTree(searchInput.value);
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchKnowledgeTree(searchInput.value);
            }
        });
        
        sidebar.appendChild(search);
        
        // Create tree navigation
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';
        
        // Generate tree from space items
        const tree = generateTreeFromItems(space.items, activeItem);
        treeContainer.appendChild(tree);
        
        sidebar.appendChild(treeContainer);
        
        // Add button to create new top-level item
        const addButton = document.createElement('div');
        addButton.className = 'add-top-item-btn';
        addButton.innerHTML = `<i class="icon-plus"></i> New Page`;
        
        addButton.addEventListener('click', () => {
            showAddKnowledgeModal(space.id);
        });
        
        sidebar.appendChild(addButton);
        
        return sidebar;
    }

    /**
     * Generate tree from items
     * @param {Array} items - Items array
     * @param {Object} activeItem - Currently active item
     * @returns {HTMLElement} - Tree element
     */
    function generateTreeFromItems(items, activeItem) {
        const treeList = document.createElement('ul');
        treeList.className = 'tree-list';
        
        // Error handling for empty or invalid items
        if (!items || !Array.isArray(items) || items.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'tree-empty';
            emptyMessage.textContent = 'No pages yet';
            treeList.appendChild(emptyMessage);
            return treeList;
        }
        
        // Generate tree nodes recursively
        items.forEach(item => {
            const treeItem = document.createElement('li');
            treeItem.className = 'tree-item';
            treeItem.dataset.itemId = item.id;
            
            // Check if this is the active item
            const isActive = activeItem && activeItem.id === item.id;
            if (isActive) {
                treeItem.classList.add('active');
            }
            
            // Get status class
            let statusClass = 'status-not-started';
            if (item.status === 'completed') {
                statusClass = 'status-completed';
            } else if (item.status === 'in-progress') {
                statusClass = 'status-in-progress';
            }
            
            // Check if item has children
            const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
            
            // Create item content
            const itemContent = document.createElement('div');
            itemContent.className = 'tree-item-content';
            
            // Add expand/collapse button if has children
            if (hasChildren) {
                const expandBtn = document.createElement('button');
                expandBtn.className = 'expand-collapse-btn';
                expandBtn.textContent = '▼';
                
                // Add click handler to expand/collapse
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering item click
                    toggleTreeItem(treeItem);
                });
                
                itemContent.appendChild(expandBtn);
            } else {
                // Add spacer if no children
                const spacer = document.createElement('span');
                spacer.className = 'tree-spacer';
                spacer.innerHTML = '&nbsp;&nbsp;';
                itemContent.appendChild(spacer);
            }
            
            // Add status indicator
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `tree-status-indicator ${statusClass}`;
            itemContent.appendChild(statusIndicator);
            
            // Add item title
            const itemTitle = document.createElement('span');
            itemTitle.className = 'tree-item-title';
            itemTitle.textContent = item.title;
            itemContent.appendChild(itemTitle);
            
            // Add click handler to navigate to item
            itemContent.addEventListener('click', (e) => {
                // Don't trigger if clicking on expand/collapse button
                if (e.target.classList.contains('expand-collapse-btn')) return;
                window.knowledgeTree.openKnowledgeItem(item.id);
            });
            
            treeItem.appendChild(itemContent);
            
            // Add children if any
            if (hasChildren) {
                const childrenList = generateTreeFromItems(item.children, activeItem);
                childrenList.classList.add('tree-children');
                
                // Check if this item or any child is active
                const isActiveOrHasActiveChild = isActive || 
                                            checkIfItemHasActiveChild(item, activeItem);
                
                // If not active or doesn't have active child, collapse it
                if (!isActiveOrHasActiveChild) {
                    childrenList.style.display = 'none';
                    itemContent.querySelector('.expand-collapse-btn').textContent = '►';
                }
                
                treeItem.appendChild(childrenList);
            }
            
            treeList.appendChild(treeItem);
        });
        
        return treeList;
    }

    /**
     * Create child knowledge item element
     * @param {Object} child - Child item
     * @returns {HTMLElement} - Item element
     */
    function createChildKnowledgeItem(child) {
        const itemElement = document.createElement('div');
        itemElement.className = 'child-knowledge-item';
        itemElement.dataset.itemId = child.id;
        
        // Set status class
        let statusClass = 'status-not-started';
        if (child.status === 'completed') {
            statusClass = 'status-completed';
        } else if (child.status === 'in-progress') {
            statusClass = 'status-in-progress';
        }
        
        // Count grandchildren if any
        const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
        const childrenCount = hasChildren ? child.children.length : 0;
        
        // Add children counter if has children
        const childrenElement = hasChildren ? 
            `<span class="children-counter">${childrenCount} sub-pages</span>` : '';
        
        itemElement.innerHTML = `
            <div class="knowledge-status ${statusClass}"></div>
            <div class="knowledge-content">
                <h3 class="knowledge-title">${child.title}</h3>
                <p class="knowledge-subtitle">${child.subtitle || ''}</p>
                <div class="knowledge-meta">
                    ${childrenElement}
                </div>
            </div>
        `;
        
        // Add click event to open child item
        itemElement.addEventListener('click', () => {
            window.knowledgeTree.openKnowledgeItem(child.id);
        });
        
        return itemElement;
    }

    /**
     * Toggle tree item expansion
     * @param {HTMLElement} treeItem - Tree item element
     */
    function toggleTreeItem(treeItem) {
        const childrenList = treeItem.querySelector('.tree-children');
        const expandBtn = treeItem.querySelector('.expand-collapse-btn');
        
        if (childrenList) {
            if (childrenList.style.display === 'none') {
                childrenList.style.display = 'block';
                expandBtn.textContent = '▼';
            } else {
                childrenList.style.display = 'none';
                expandBtn.textContent = '►';
            }
        }
    }

    /**
     * Toggle tree sidebar
     * @param {HTMLElement} sidebar - Sidebar element
     */
    function toggleTreeSidebar(sidebar) {
        sidebar.classList.toggle('collapsed');
        
        // Update button text
        const btn = sidebar.querySelector('.collapse-sidebar-btn');
        if (sidebar.classList.contains('collapsed')) {
            btn.textContent = '►';
        } else {
            btn.textContent = '◀';
        }
        
        // Update container layout
        const container = sidebar.closest('.notebook-container');
        if (container) {
            container.classList.toggle('sidebar-collapsed');
        }
    }

    /**
     * Check if item has active child (recursively)
     * @param {Object} item - Item to check
     * @param {Object} activeItem - Currently active item
     * @returns {boolean} - True if item has active child
     */
    function checkIfItemHasActiveChild(item, activeItem) {
        if (!item.children || !Array.isArray(item.children) || !activeItem) {
            return false;
        }
        
        for (const child of item.children) {
            if (child.id === activeItem.id) {
                return true;
            }
            
            if (checkIfItemHasActiveChild(child, activeItem)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Search knowledge tree
     * @param {string} searchText - Text to search for
     */
    function searchKnowledgeTree(searchText) {
        if (!searchText || !searchText.trim()) return;
        
        // Simple alert for now - this can be expanded in the future
        alert(`Searching for: "${searchText}"\n\nSearch functionality will be implemented in a future update.`);
    }

    /**
     * Show modal to add new knowledge item
     * @param {string} spaceId - Space ID
     */
    function showAddKnowledgeModal(spaceId) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Add Knowledge Item</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="item-title">Title</label>
                        <input type="text" id="item-title" placeholder="e.g., JavaScript Closures">
                    </div>
                    <div class="form-group">
                        <label for="item-subtitle">Subtitle (Optional)</label>
                        <input type="text" id="item-subtitle" placeholder="e.g., Understanding scope and closure concepts">
                    </div>
                    <div class="form-group">
                        <label for="item-content">Content (Optional)</label>
                        <textarea id="item-content" rows="8" placeholder="Add your notes, code snippets, or other content here..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <div class="knowledge-status-selector">
                            <label class="status-option">
                                <input type="radio" name="item-status" value="not-started" checked>
                                <span class="status-indicator status-not-started"></span>
                                Not Started
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="in-progress">
                                <span class="status-indicator status-in-progress"></span>
                                In Progress
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="completed">
                                <span class="status-indicator status-completed"></span>
                                Completed
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button id="add-item-btn" class="btn btn-primary">Add Item</button>
                        <button id="cancel-item-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-item-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#add-item-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('item-title').value.trim();
            const subtitle = document.getElementById('item-subtitle').value.trim();
            const content = document.getElementById('item-content').value;
            const status = document.querySelector('input[name="item-status"]:checked').value;
            
            // Validate
            if (!title) {
                alert('Please enter a title for your knowledge item');
                return;
            }
            
            // Create item ID from title (slug)
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
            
            // Create item object
            const newItem = {
                id: id,
                title: title,
                subtitle: subtitle || '',
                content: content || '',
                status: status,
                dateCreated: new Date().toISOString(),
                dateUpdated: new Date().toISOString(),
                children: [] // Add children array
            };
            
            // Add to space and save to storage
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[spaceId]) {
                if (!spaces[spaceId].items) {
                    spaces[spaceId].items = [];
                }
                spaces[spaceId].items.push(newItem);
                window.storage.setStudySpaces(spaces);
                
                // Update current space
                currentSpace = spaces[spaceId];
                
                // Close modal
                modal.remove();
                
                // Navigate to the new item's content page
                window.knowledgeTree.openKnowledgeItem(id);
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
     * Show modal to add child page
     * @param {string} spaceId - Space ID
     * @param {Object} parentItem - Parent item
     */
    function showAddChildModal(spaceId, parentItem) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Add Sub-page</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="item-parent">Parent</label>
                        <input type="text" id="item-parent" value="${parentItem.title}" disabled>
                    </div>
                    <div class="form-group">
                        <label for="item-title">Title</label>
                        <input type="text" id="item-title" placeholder="e.g., Advanced Concepts">
                    </div>
                    <div class="form-group">
                        <label for="item-subtitle">Subtitle (Optional)</label>
                        <input type="text" id="item-subtitle" placeholder="e.g., Deep dive into complex topics">
                    </div>
                    <div class="form-group">
                        <label for="item-content">Content (Optional)</label>
                        <textarea id="item-content" rows="8" placeholder="Add your notes, code snippets, or other content here..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <div class="knowledge-status-selector">
                            <label class="status-option">
                                <input type="radio" name="item-status" value="not-started" checked>
                                <span class="status-indicator status-not-started"></span>
                                Not Started
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="in-progress">
                                <span class="status-indicator status-in-progress"></span>
                                In Progress
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="completed">
                                <span class="status-indicator status-completed"></span>
                                Completed
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button id="add-child-btn" class="btn btn-primary">Add Sub-page</button>
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
        
        modal.querySelector('#add-child-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('item-title').value.trim();
            const subtitle = document.getElementById('item-subtitle').value.trim();
            const content = document.getElementById('item-content').value;
            const status = document.querySelector('input[name="item-status"]:checked').value;
            
            // Validate
            if (!title) {
                alert('Please enter a title for your sub-page');
                return;
            }
            
            // Create item ID from title (slug)
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
            
            // Create child item object
            const newChild = {
                id: id,
                title: title,
                subtitle: subtitle || '',
                content: content || '',
                status: status,
                dateCreated: new Date().toISOString(),
                dateUpdated: new Date().toISOString(),
                children: []
            };
            
            // Add to parent item and save to storage
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[spaceId]) {
                // Find the parent item in the hierarchy
                const updatedItems = addChildToHierarchy(spaces[spaceId].items, parentItem.id, newChild);
                if (updatedItems) {
                    // Update space items
                    spaces[spaceId].items = updatedItems;
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Close modal
                    modal.remove();
                    
                    // Navigate to the new child item
                    window.knowledgeTree.openKnowledgeItem(id);
                } else {
                    alert('Failed to add sub-page. Parent item not found.');
                }
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
     * Add child to hierarchy (recursive)
     * @param {Array} items - Items array
     * @param {string} parentId - Parent ID
     * @param {Object} newChild - New child item
     * @returns {Array|null} - Updated items or null if parent not found
     */
    function addChildToHierarchy(items, parentId, newChild) {
        if (!items || !Array.isArray(items)) return null;
        
        // Create a copy of the items array
        const updatedItems = [...items];
        
        for (let i = 0; i < updatedItems.length; i++) {
            // Check if this is the parent
            if (updatedItems[i].id === parentId) {
                // Initialize children array if it doesn't exist
                if (!updatedItems[i].children) {
                    updatedItems[i].children = [];
                }
                
                // Add new child
                updatedItems[i].children.push(newChild);
                
                // Update parent's dateUpdated
                updatedItems[i].dateUpdated = new Date().toISOString();
                
                return updatedItems;
            }
            
            // Check children if any
            if (updatedItems[i].children && Array.isArray(updatedItems[i].children)) {
                const updatedChildren = addChildToHierarchy(updatedItems[i].children, parentId, newChild);
                if (updatedChildren) {
                    updatedItems[i].children = updatedChildren;
                    
                    // Update parent's dateUpdated
                    updatedItems[i].dateUpdated = new Date().toISOString();
                    
                    return updatedItems;
                }
            }
        }
        
        return null;
    }

    /**
     * Show modal to edit knowledge item
     * @param {string} spaceId - Space ID
     * @param {Object} item - Knowledge item to edit
     */
    function showEditKnowledgeModal(spaceId, item) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Edit Knowledge Item</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="item-title">Title</label>
                        <input type="text" id="item-title" value="${item.title}">
                    </div>
                    <div class="form-group">
                        <label for="item-subtitle">Subtitle (Optional)</label>
                        <input type="text" id="item-subtitle" value="${item.subtitle || ''}">
                    </div>
                    <div class="form-group">
                        <label for="item-content">Content</label>
                        <textarea id="item-content" rows="10" placeholder="Add your notes, code snippets, or other content here...">${item.content || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <div class="knowledge-status-selector">
                            <label class="status-option">
                                <input type="radio" name="item-status" value="not-started" ${item.status === 'not-started' ? 'checked' : ''}>
                                <span class="status-indicator status-not-started"></span>
                                Not Started
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="in-progress" ${item.status === 'in-progress' ? 'checked' : ''}>
                                <span class="status-indicator status-in-progress"></span>
                                In Progress
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="completed" ${item.status === 'completed' ? 'checked' : ''}>
                                <span class="status-indicator status-completed"></span>
                                Completed
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button id="update-item-btn" class="btn btn-primary">Update</button>
                        <button id="delete-item-btn" class="btn btn-danger">Delete</button>
                        <button id="cancel-item-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-item-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#update-item-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('item-title').value.trim();
            const subtitle = document.getElementById('item-subtitle').value.trim();
            const content = document.getElementById('item-content').value;
            const status = document.querySelector('input[name="item-status"]:checked').value;
            
            // Validate
            if (!title) {
                alert('Please enter a title for your knowledge item');
                return;
            }
            
            // Update item in space
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[spaceId]) {
                // Find item index
                const itemIndex = findItemIndexInHierarchy(spaces[spaceId].items, item.id);
                if (itemIndex !== null) {
                    // Update properties while preserving the children array
                    const [parentArray, index] = itemIndex;
                    parentArray[index].title = title;
                    parentArray[index].subtitle = subtitle;
                    parentArray[index].content = content;
                    parentArray[index].status = status;
                    parentArray[index].dateUpdated = new Date().toISOString();
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Close modal
                    modal.remove();
                    
                    // Refresh content page with updated content
                    window.knowledgeTree.openKnowledgeItem(item.id);
                }
            }
        });
        
        modal.querySelector('#delete-item-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this knowledge item? All children items will also be deleted.')) {
                // Remove item from space
                const spaces = window.storage.getStudySpaces();
                if (spaces && spaces[spaceId]) {
                    // Find item in hierarchy
                    const itemIndex = findItemIndexInHierarchy(spaces[spaceId].items, item.id);
                    
                    if (itemIndex !== null) {
                        // Remove item from its parent array
                        const [parentArray, index] = itemIndex;
                        parentArray.splice(index, 1);
                        
                        // Save to storage
                        window.storage.setStudySpaces(spaces);
                        
                        // Update current space
                        currentSpace = spaces[spaceId];
                        
                        // Close modal
                        modal.remove();
                        
                        // Go back to space view
                        window.studySpaces.openStudySpace(spaceId);
                    }
                }
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
     * Find item index in hierarchy (recursive search)
     * @param {Array} items - Array of items to search
     * @param {string} itemId - ID to find
     * @returns {Array|null} - Array containing [parentArray, index] or null if not found
     */
    function findItemIndexInHierarchy(items, itemId) {
        if (!items || !Array.isArray(items)) return null;
        
        // Try to find in the current level
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId) {
                return [items, i];
            }
            
            // Check in children if any
            if (items[i].children && Array.isArray(items[i].children)) {
                const found = findItemIndexInHierarchy(items[i].children, itemId);
                if (found) {
                    return found;
                }
            }
        }
        
        return null;
    }

    /**
     * Show modal to generate tree using AI
     * @param {string} spaceId - Space ID
     * @param {Object} parentItem - Parent item
     */
    function showGenerateTreeModal(spaceId, parentItem) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Generate Knowledge Tree</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="generate-prompt">What topic would you like to create a knowledge tree for?</label>
                        <input type="text" id="generate-prompt" value="${parentItem.title}" placeholder="e.g., JavaScript Fundamentals">
                    </div>
                    <div class="form-group">
                        <label for="generate-depth">Depth Level</label>
                        <select id="generate-depth">
                            <option value="1">1 level (Basic)</option>
                            <option value="2" selected>2 levels (Standard)</option>
                            <option value="3">3 levels (Detailed)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="generate-model">AI Model</label>
                        <select id="generate-model">
                            <option value="gpt-4o" selected>OpenAI GPT-4o</option>
                            <option value="gemini-2.0-flash">Google Gemini</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button id="generate-tree-btn" class="btn btn-primary">Generate Tree</button>
                        <button id="cancel-generate-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-generate-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#generate-tree-btn').addEventListener('click', () => {
            // Get form values
            const prompt = document.getElementById('generate-prompt').value.trim();
            const depth = document.getElementById('generate-depth').value;
            const model = document.getElementById('generate-model').value;
            
            // Validate
            if (!prompt) {
                alert('Please enter a topic for the knowledge tree');
                return;
            }
            
            // Alert for now - actual implementation would use the treeGenerator module
            alert(`This will generate a knowledge tree for "${prompt}" with depth ${depth} using ${model} model.\n\nThis functionality requires API integration.`);
            
            // Close modal
            modal.remove();
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Update breadcrumb with current location
     * @param {string} itemName - Optional item name
     * @param {string} spaceName - Optional space name
     */
    function updateBreadcrumb(itemName = null, spaceName = null) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        if (itemName && spaceName) {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard / ${spaceName} / ${itemName}</span>
            `;
        } else if (spaceName) {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard / ${spaceName}</span>
            `;
        } else {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard</span>
            `;
        }
    }

    // Add a function to set current space directly (for integration)
    window.knowledgeTree.setCurrentSpace = function(space) {
        currentSpace = space;
    };

    // Add a function to set current item directly (for integration)
    window.knowledgeTree.setCurrentItem = function(item) {
        currentItem = item;
    };
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', window.knowledgeTree.initialize);
})();