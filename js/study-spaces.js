/**
 * Study Spaces Module
 * Manages study spaces and knowledge items
 */

(function() {
    // Create study spaces namespace
    window.studySpaces = {};
    
    // Store current active space
    let currentSpace = null;
    
    /**
     * Initialize study spaces module
     */
    window.studySpaces.initialize = function() {
        // Check if we have any spaces in storage
        const spaces = window.storage.getStudySpaces();
        
        // Create default spaces if none exist
        if (!spaces || Object.keys(spaces).length === 0) {
            createDefaultSpaces();
        }
        
        console.log("Study spaces module initialized");
    };
    
    /**
     * Create default study spaces
     */
    function createDefaultSpaces() {
        const defaultSpaces = {
            'front-end': {
                id: 'front-end',
                name: 'Front End Development',
                description: 'Web technologies like HTML, CSS, JavaScript, and modern frameworks',
                icon: 'code',
                coverClass: 'front-end-cover',
                createdAt: new Date().toISOString(),
                items: [
                    {
                        id: 'html-basics',
                        title: 'HTML Basics',
                        subtitle: 'Structure and semantics',
                        status: 'completed',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'css-layout',
                        title: 'CSS Layout',
                        subtitle: 'Flexbox and Grid',
                        status: 'in-progress',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'javascript-es6',
                        title: 'JavaScript ES6+',
                        subtitle: 'Modern JavaScript features',
                        status: 'not-started',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    }
                ]
            },
            'ux-design': {
                id: 'ux-design',
                name: 'UX Design',
                description: 'User experience principles, UI design, and prototyping tools',
                icon: 'brush',
                coverClass: 'ux-design-cover',
                createdAt: new Date().toISOString(),
                items: [
                    {
                        id: 'design-thinking',
                        title: 'Design Thinking',
                        subtitle: 'Problem-solving methodology',
                        status: 'completed',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'wireframing',
                        title: 'Wireframing',
                        subtitle: 'Creating low-fidelity mockups',
                        status: 'in-progress',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'user-research',
                        title: 'User Research',
                        subtitle: 'Understanding user needs',
                        status: 'not-started',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    }
                ]
            },
            'back-end': {
                id: 'back-end',
                name: 'Back End Development',
                description: 'Server-side programming, databases, and API development',
                icon: 'server',
                coverClass: 'back-end-cover',
                createdAt: new Date().toISOString(),
                items: [
                    {
                        id: 'nodejs-basics',
                        title: 'Node.js Basics',
                        subtitle: 'Server-side JavaScript',
                        status: 'completed',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'rest-apis',
                        title: 'REST APIs',
                        subtitle: 'API design principles',
                        status: 'in-progress',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    },
                    {
                        id: 'database-design',
                        title: 'Database Design',
                        subtitle: 'SQL and NoSQL databases',
                        status: 'not-started',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString()
                    }
                ]
            }
        };
        
        // Save to storage
        window.storage.setStudySpaces(defaultSpaces);
        
        return defaultSpaces;
    }
    
    /**
     * Show welcome dashboard
     */
    window.studySpaces.showWelcomeDashboard = function() {
        // Get current spaces
        const spaces = window.storage.getStudySpaces();
        
        // Create welcome dashboard
        const dashboard = document.createElement('div');
        dashboard.className = 'welcome-dashboard';
        
        // Add header
        dashboard.innerHTML = `
            <div class="welcome-header">
                <h1>SelfLearn</h1>
                <p>Your personal learning space for self-directed education</p>
            </div>
            <div class="study-spaces-grid">
                <!-- Space cards will be inserted here -->
            </div>
        `;
        
        // Get grid container
        const grid = dashboard.querySelector('.study-spaces-grid');
        
        // Add space cards
        if (spaces && Object.keys(spaces).length > 0) {
            Object.values(spaces).forEach(space => {
                grid.appendChild(createStudySpaceCard(space));
            });
        }
        
        // Add "Create new space" card
        const createCard = document.createElement('div');
        createCard.className = 'study-space-card create-space-card';
        createCard.innerHTML = `
            <div class="add-icon">+</div>
            <h3>Create New Space</h3>
            <p>Start organizing a new learning topic</p>
        `;
        
        createCard.addEventListener('click', () => {
            showCreateSpaceModal();
        });
        
        grid.appendChild(createCard);
        
        // Replace current content with dashboard
        const contentArea = document.querySelector('.content');
        contentArea.innerHTML = '';
        contentArea.appendChild(dashboard);
        
        // Update document title
        document.title = 'SelfLearn - Dashboard';
        document.getElementById('document-title').textContent = 'SelfLearn';
        
        // Update breadcrumb
        updateBreadcrumb();
    };
    
    /**
     * Create study space card
     * @param {Object} space - Study space data
     * @returns {HTMLElement} - Card element
     */
    function createStudySpaceCard(space) {
        const card = document.createElement('div');
        card.className = 'study-space-card';
        card.dataset.spaceId = space.id;
        
        // Calculate stats
        const totalItems = space.items ? space.items.length : 0;
        const completedItems = space.items ? space.items.filter(item => item.status === 'completed').length : 0;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        card.innerHTML = `
            <div class="card-cover ${space.coverClass}"></div>
            <div class="card-content">
                <h3>${space.name}</h3>
                <p>${space.description}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="space-stats">
                    <span>${completedItems}/${totalItems} completed</span>
                    <span>${progressPercentage}% progress</span>
                </div>
            </div>
        `;
        
        // Add click event to open space
        card.addEventListener('click', () => {
            window.studySpaces.openStudySpace(space.id);
        });
        
        return card;
    }
    
    /**
     * Show modal to create new study space
     */
    window.studySpaces.showCreateSpaceModal = function() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Create New Study Space</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="space-name">Space Name</label>
                        <input type="text" id="space-name" placeholder="e.g., Machine Learning">
                    </div>
                    <div class="form-group">
                        <label for="space-description">Description</label>
                        <textarea id="space-description" placeholder="Briefly describe what you want to learn"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="space-cover">Cover Color Theme</label>
                        <select id="space-cover">
                            <option value="blue-gradient">Blue Gradient</option>
                            <option value="purple-gradient">Purple Gradient</option>
                            <option value="green-gradient">Green Gradient</option>
                            <option value="orange-gradient">Orange Gradient</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button id="create-space-btn" class="btn btn-primary">Create Space</button>
                        <button id="cancel-space-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-space-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#create-space-btn').addEventListener('click', () => {
            // Get form values
            const name = document.getElementById('space-name').value.trim();
            const description = document.getElementById('space-description').value.trim();
            const coverSelect = document.getElementById('space-cover');
            const coverValue = coverSelect.options[coverSelect.selectedIndex].value;
            
            // Validate
            if (!name) {
                alert('Please enter a name for your study space');
                return;
            }
            
            // Create space ID from name (slug)
            const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            // Create space object
            const newSpace = {
                id: id,
                name: name,
                description: description || 'No description provided',
                icon: 'book',
                coverClass: getCoverClassFromValue(coverValue),
                createdAt: new Date().toISOString(),
                items: []
            };
            
            // Save space to storage
            const spaces = window.storage.getStudySpaces() || {};
            spaces[id] = newSpace;
            window.storage.setStudySpaces(spaces);
            
            // Close modal
            modal.remove();
            
            // Refresh dashboard
            window.studySpaces.showWelcomeDashboard();
            
            // Update sidebar if exists
            if (window.sidebar && typeof window.sidebar.updateContent === 'function') {
                window.sidebar.updateContent();
            }
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    
    /**
     * Get cover class from select value
     * @param {string} value - Selected value
     * @returns {string} - CSS class
     */
    function getCoverClassFromValue(value) {
        switch(value) {
            case 'blue-gradient':
                return 'back-end-cover';
            case 'purple-gradient':
                return 'front-end-cover';
            case 'green-gradient':
                return 'back-end-cover';
            case 'orange-gradient':
                return 'ux-design-cover';
            default:
                return 'front-end-cover';
        }
    }
    
    /**
     * Open a study space
     * @param {string} spaceId - Space ID
     */
    window.studySpaces.openStudySpace = function(spaceId) {
        // Get spaces from storage
        const spaces = window.storage.getStudySpaces();
        
        if (!spaces || !spaces[spaceId]) {
            console.error(`Study space not found: ${spaceId}`);
            return;
        }
        
        // Set current space
        currentSpace = spaces[spaceId];
        
        // Create space page
        const spacePage = document.createElement('div');
        spacePage.className = 'study-space-page';
        
        // Add breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        breadcrumb.innerHTML = `
            <a href="#" class="to-dashboard">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <span>${currentSpace.name}</span>
        `;
        
        // Add breadcrumb click handler
        breadcrumb.querySelector('.to-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.showWelcomeDashboard();
        });
        
        spacePage.appendChild(breadcrumb);
        
        // Add header
        const header = document.createElement('div');
        header.className = 'space-header';
        
        // Calculate stats
        const totalItems = currentSpace.items ? currentSpace.items.length : 0;
        const completedItems = currentSpace.items ? currentSpace.items.filter(item => item.status === 'completed').length : 0;
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        header.innerHTML = `
            <div class="space-title">
                <div class="space-icon ${currentSpace.id}">
                    <i class="icon-${currentSpace.icon || 'book'}"></i>
                </div>
                <div class="space-name">
                    <h1>${currentSpace.name}</h1>
                    <p>${progressPercentage}% complete (${completedItems}/${totalItems})</p>
                </div>
            </div>
            <div class="space-actions">
                <button class="action-btn">
                    <i class="icon-settings"></i> Edit Space
                </button>
                <button class="action-btn primary add-knowledge-btn">
                    <i class="icon-plus"></i> Add Knowledge
                </button>
            </div>
        `;
        
        // Add event listener for edit space button
        header.querySelector('.action-btn').addEventListener('click', () => {
            showEditSpaceModal(currentSpace);
        });
        
        // Add event listener for add knowledge button
        header.querySelector('.add-knowledge-btn').addEventListener('click', () => {
            showAddKnowledgeModal(currentSpace.id);
        });
        
        spacePage.appendChild(header);
        
        // Add knowledge items
        const knowledgeSection = document.createElement('div');
        knowledgeSection.className = 'knowledge-items';
        
        // Add section title
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.innerHTML = `
            Knowledge Items
            <span class="count">${totalItems}</span>
        `;
        
        knowledgeSection.appendChild(sectionTitle);
        
        // Add knowledge list
        const knowledgeList = document.createElement('div');
        knowledgeList.className = 'knowledge-list';
        
        // Add items if available
        if (currentSpace.items && currentSpace.items.length > 0) {
            currentSpace.items.forEach(item => {
                knowledgeList.appendChild(createKnowledgeItem(item));
            });
        } else {
            // Show empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">📚</div>
                <h3>No knowledge items yet</h3>
                <p>Start adding items to track your learning progress</p>
                <button class="add-first-item-btn">Add First Item</button>
            `;
            
            // Add event listener for add first item button
            emptyState.querySelector('.add-first-item-btn').addEventListener('click', () => {
                showAddKnowledgeModal(currentSpace.id);
            });
            
            knowledgeList.appendChild(emptyState);
        }
        
        knowledgeSection.appendChild(knowledgeList);
        
        // Add "Add knowledge" button at the bottom
        const addButton = document.createElement('div');
        addButton.className = 'add-knowledge';
        addButton.innerHTML = `
            <i class="icon-plus"></i> Add New Knowledge Item
        `;
        
        addButton.addEventListener('click', () => {
            showAddKnowledgeModal(currentSpace.id);
        });
        
        knowledgeSection.appendChild(addButton);
        
        spacePage.appendChild(knowledgeSection);
        
        // Replace current content with space page
        const contentArea = document.querySelector('.content');
        contentArea.innerHTML = '';
        contentArea.appendChild(spacePage);
        
        // Update document title
        document.title = `${currentSpace.name} - SelfLearn`;
        document.getElementById('document-title').textContent = currentSpace.name;
        
        // Update breadcrumb
        updateBreadcrumb(currentSpace.name);
        
        // Update sidebar active item if exists
        if (window.sidebar) {
            // Update content first
            if (typeof window.sidebar.updateContent === 'function') {
                window.sidebar.updateContent();
            }
            
            // Set active space
            if (typeof window.sidebar.setActiveSpace === 'function') {
                window.sidebar.setActiveSpace(spaceId);
            }
        }
    };
    
    /**
     * Create knowledge item element
     * @param {Object} item - Knowledge item data
     * @returns {HTMLElement} - Item element
     */
    function createKnowledgeItem(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'knowledge-item';
        itemElement.dataset.itemId = item.id;
        
        // Set status class
        let statusClass = 'status-not-started';
        if (item.status === 'completed') {
            statusClass = 'status-completed';
        } else if (item.status === 'in-progress') {
            statusClass = 'status-in-progress';
        }
        
        // Format date
        const dateUpdated = new Date(item.dateUpdated);
        const formattedDate = window.utils.formatDate(dateUpdated);
        
        itemElement.innerHTML = `
            <div class="knowledge-status ${statusClass}"></div>
            <div class="knowledge-content">
                <h3 class="knowledge-title">${item.title}</h3>
                <p class="knowledge-subtitle">${item.subtitle || ''}</p>
                <div class="knowledge-meta">
                    <span>Updated ${formattedDate}</span>
                </div>
            </div>
        `;
        
        // Add click event to open knowledge item
        itemElement.addEventListener('click', () => {
            openKnowledgeItem(item.id);
        });
        
        return itemElement;
    }
    
    /**
     * Open knowledge item
     * @param {string} itemId - Knowledge item ID
     */
    function openKnowledgeItem(itemId) {
        if (!currentSpace || !currentSpace.items) return;
        
        // Find item
        const item = currentSpace.items.find(i => i.id === itemId);
        if (!item) return;
        
        // Show edit modal with item data
        showEditKnowledgeModal(currentSpace.id, item);
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
                status: status,
                dateCreated: new Date().toISOString(),
                dateUpdated: new Date().toISOString()
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
                
                // Refresh space view
                window.studySpaces.openStudySpace(spaceId);
            }
            
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
                const itemIndex = spaces[spaceId].items.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                    // Update properties
                    spaces[spaceId].items[itemIndex].title = title;
                    spaces[spaceId].items[itemIndex].subtitle = subtitle;
                    spaces[spaceId].items[itemIndex].status = status;
                    spaces[spaceId].items[itemIndex].dateUpdated = new Date().toISOString();
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Refresh space view
                    window.studySpaces.openStudySpace(spaceId);
                }
            }
            
            // Close modal
            modal.remove();
        });
        
        modal.querySelector('#delete-item-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this knowledge item?')) {
                // Remove item from space
                const spaces = window.storage.getStudySpaces();
                if (spaces && spaces[spaceId]) {
                    // Filter out the item
                    spaces[spaceId].items = spaces[spaceId].items.filter(i => i.id !== item.id);
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Refresh space view
                    window.studySpaces.openStudySpace(spaceId);
                }
                
                // Close modal
                modal.remove();
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
     * Show modal to edit study space
     * @param {Object} space - Study space to edit
     */
    function showEditSpaceModal(space) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Edit Study Space</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="space-name">Space Name</label>
                        <input type="text" id="space-name" value="${space.name}">
                    </div>
                    <div class="form-group">
                        <label for="space-description">Description</label>
                        <textarea id="space-description">${space.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="space-cover">Cover Color Theme</label>
                        <select id="space-cover">
                            <option value="blue-gradient" ${space.coverClass === 'back-end-cover' ? 'selected' : ''}>Blue Gradient</option>
                            <option value="purple-gradient" ${space.coverClass === 'front-end-cover' ? 'selected' : ''}>Purple Gradient</option>
                            <option value="green-gradient" ${space.coverClass === 'back-end-cover' ? 'selected' : ''}>Green Gradient</option>
                            <option value="orange-gradient" ${space.coverClass === 'ux-design-cover' ? 'selected' : ''}>Orange Gradient</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button id="update-space-btn" class="btn btn-primary">Update Space</button>
                        <button id="delete-space-btn" class="btn btn-danger">Delete Space</button>
                        <button id="cancel-space-btn" class="btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-space-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#update-space-btn').addEventListener('click', () => {
            // Get form values
            const name = document.getElementById('space-name').value.trim();
            const description = document.getElementById('space-description').value.trim();
            const coverSelect = document.getElementById('space-cover');
            const coverValue = coverSelect.options[coverSelect.selectedIndex].value;
            
            // Validate
            if (!name) {
                alert('Please enter a name for your study space');
                return;
            }
            
            // Update space in storage
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[space.id]) {
                // Update properties
                spaces[space.id].name = name;
                spaces[space.id].description = description || 'No description provided';
                spaces[space.id].coverClass = getCoverClassFromValue(coverValue);
                
                // Save to storage
                window.storage.setStudySpaces(spaces);
                
                // Update current space
                currentSpace = spaces[space.id];
                
                // Refresh space view
                window.studySpaces.openStudySpace(space.id);
                
                // Update sidebar if exists
                if (window.sidebar && typeof window.sidebar.updateContent === 'function') {
                    window.sidebar.updateContent();
                }
            }
            
            // Close modal
            modal.remove();
        });
        
        modal.querySelector('#delete-space-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this study space? All knowledge items will be lost.')) {
                // Remove space from storage
                const spaces = window.storage.getStudySpaces();
                if (spaces && spaces[space.id]) {
                    delete spaces[space.id];
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Go back to dashboard
                    window.studySpaces.showWelcomeDashboard();
                    
                    // Update sidebar if exists
                    if (window.sidebar && typeof window.sidebar.updateContent === 'function') {
                        window.sidebar.updateContent();
                    }
                }
                
                // Close modal
                modal.remove();
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
     * Update breadcrumb with current location
     * @param {string} spaceName - Optional current space name
     */
    function updateBreadcrumb(spaceName = null) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        if (spaceName) {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard / ${spaceName}</span>
            `;
        } else {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard</span>
            `;
        }
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', window.studySpaces.initialize);
})();