/**
 * Study Spaces Module
 * Manages study spaces and knowledge items with hierarchical tree structure
 */

(function() {
    // Create study spaces namespace
    window.studySpaces = {    /**
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
            itemContent.addEventListener('click', () => {
                openKnowledgeItem(item.id);
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
     * Search knowledge tree
     * @param {string} searchText - Text to search for
     */
    function searchKnowledgeTree(searchText) {
        // Show simple alert for now
        if (searchText.trim()) {
            alert(`Searching for: ${searchText}\n\nSearch functionality will be implemented in a future update.`);
        }
    }
};
    
    // Store current active space
    let currentSpace = null;
    
    // Store current active item
    let currentItem = null;
    
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
                        content: '<h2>HTML Basics</h2><p>HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.</p><h3>Key Concepts</h3><ul><li>Elements and Tags</li><li>Attributes</li><li>Document Structure</li><li>Semantic Markup</li></ul><p>HTML elements are the building blocks of HTML pages. They are represented by tags, which label pieces of content.</p>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: [
                            {
                                id: 'html-elements',
                                title: 'HTML Elements',
                                subtitle: 'Basic building blocks',
                                status: 'completed',
                                content: '<h2>HTML Elements</h2><p>HTML elements are the building blocks of HTML pages. An HTML element is defined by a start tag, some content, and an end tag.</p><h3>Example</h3><pre>&lt;tagname&gt;Content goes here...&lt;/tagname&gt;</pre><p>Common HTML elements include headings, paragraphs, lists, links, and images.</p>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString(),
                                children: []
                            },
                            {
                                id: 'html-attributes',
                                title: 'HTML Attributes',
                                subtitle: 'Additional element information',
                                status: 'in-progress',
                                content: '<h2>HTML Attributes</h2><p>HTML attributes provide additional information about HTML elements.</p><h3>Key Points</h3><ul><li>Attributes are always specified in the start tag</li><li>Attributes usually come in name/value pairs like: name="value"</li><li>Common attributes include class, id, src, href, and style</li></ul>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString(),
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'css-basics',
                        title: 'CSS Basics',
                        subtitle: 'Styling web pages',
                        status: 'in-progress',
                        content: '<h2>CSS Basics</h2><p>CSS (Cascading Style Sheets) is used to style and layout web pages.</p><h3>Key Concepts</h3><ul><li>Selectors</li><li>Properties</li><li>Values</li><li>Box Model</li></ul><p>CSS describes how HTML elements should be displayed on screen, paper, or in other media.</p>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
                    },
                    {
                        id: 'javascript-basics',
                        title: 'JavaScript Basics',
                        subtitle: 'Client-side programming',
                        status: 'not-started',
                        content: '<h2>JavaScript Basics</h2><p>JavaScript is a scripting language used to create and control dynamic website content.</p><h3>Key Concepts</h3><ul><li>Variables and Data Types</li><li>Functions</li><li>Objects</li><li>DOM Manipulation</li></ul><p>JavaScript enables interactive web pages and is an essential part of web applications.</p>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
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
                        content: '<h2>Design Thinking Methodology</h2><p>Design thinking is a non-linear, iterative process that teams use to understand users, challenge assumptions, redefine problems and create innovative solutions to prototype and test.</p><h3>The Five Stages of Design Thinking</h3><ol><li><strong>Empathize</strong>: Research user needs</li><li><strong>Define</strong>: State user needs and problems</li><li><strong>Ideate</strong>: Challenge assumptions and create ideas</li><li><strong>Prototype</strong>: Start creating solutions</li><li><strong>Test</strong>: Test your solutions</li></ol>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: [
                            {
                                id: 'empathize-stage',
                                title: 'Empathize Stage',
                                subtitle: 'Understanding user needs',
                                status: 'completed',
                                content: '<h2>Empathize Stage in Design Thinking</h2><p>The Empathize stage is about understanding the user and their needs through research.</p><h3>Common Methods</h3><ul><li>User interviews</li><li>Observation</li><li>Surveys and questionnaires</li><li>Empathy mapping</li></ul><p>The goal is to set aside your own assumptions and gain real insight into users and their needs.</p>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString(),
                                children: []
                            },
                            {
                                id: 'define-stage',
                                title: 'Define Stage',
                                subtitle: 'Framing the problem',
                                status: 'in-progress',
                                content: '<h2>Define Stage in Design Thinking</h2><p>The Define stage is about processing and synthesizing the information gathered during the Empathize stage.</p><h3>Key Activities</h3><ul><li>Analyzing user research</li><li>Identifying patterns</li><li>Defining user needs and problems</li><li>Creating user personas</li><li>Developing problem statements</li></ul>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString(),
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'wireframing',
                        title: 'Wireframing',
                        subtitle: 'Creating low-fidelity mockups',
                        status: 'in-progress',
                        content: '<h2>Wireframing Basics</h2><p>Wireframes are simplified visual representations of a final interface, focusing on layout, structure, and functionality rather than visual design.</p><h3>Purpose of Wireframing</h3><ul><li>Clarify interface before development begins</li><li>Get stakeholder approval on layout and functionality</li><li>Focus on usability without distraction of visual design</li></ul>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
                    },
                    {
                        id: 'user-research',
                        title: 'User Research',
                        subtitle: 'Understanding user needs',
                        status: 'not-started',
                        content: '',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
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
                        content: '<h2>Node.js Basics</h2><p>Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser.</p><h3>Key Concepts</h3><ul><li>Event-driven, non-blocking I/O model</li><li>Single-threaded event loop</li><li>CommonJS module system</li><li>NPM (Node Package Manager)</li></ul><p>Node.js allows developers to use JavaScript for server-side scripting to produce dynamic web page content before the page is sent to the user\'s web browser.</p>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
                    },
                    {
                        id: 'rest-apis',
                        title: 'REST APIs',
                        subtitle: 'API design principles',
                        status: 'in-progress',
                        content: '<h2>REST API Design</h2><p>REST (Representational State Transfer) is an architectural style for designing networked applications.</p><h3>RESTful API Principles</h3><ul><li>Stateless client-server communication</li><li>Cacheable responses</li><li>Uniform interface</li><li>Layered system</li></ul><h3>Common HTTP Methods</h3><ul><li>GET: Retrieve data</li><li>POST: Create data</li><li>PUT: Update data</li><li>DELETE: Remove data</li></ul>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
                    },
                    {
                        id: 'database-design',
                        title: 'Database Design',
                        subtitle: 'SQL and NoSQL databases',
                        status: 'not-started',
                        content: '',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        children: []
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
        // Reset current item and space
        currentItem = null;
        currentSpace = null;
        
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
        const totalItems = countTotalItems(space.items);
        const completedItems = countCompletedItems(space.items);
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
     * Count total items in a space including children (recursive)
     * @param {Array} items - Items array
     * @returns {number} - Total count
     */
    function countTotalItems(items) {
        if (!items || !Array.isArray(items)) return 0;
        
        let count = items.length;
        
        for (const item of items) {
            if (item.children && Array.isArray(item.children)) {
                count += countTotalItems(item.children);
            }
        }
        
        return count;
    }
    
    /**
     * Count completed items in a space including children (recursive)
     * @param {Array} items - Items array
     * @returns {number} - Completed count
     */
    function countCompletedItems(items) {
        if (!items || !Array.isArray(items)) return 0;
        
        let count = 0;
        
        for (const item of items) {
            if (item.status === 'completed') {
                count++;
            }
            
            if (item.children && Array.isArray(item.children)) {
                count += countCompletedItems(item.children);
            }
        }
        
        return count;
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
        // Reset current item
        currentItem = null;
        
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
        const totalItems = countTotalItems(currentSpace.items);
        const completedItems = countCompletedItems(currentSpace.items);
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
            <span class="count">${currentSpace.items ? currentSpace.items.length : 0}</span>
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
        
        // Count children if any
        const hasChildren = item.children && item.children.length > 0;
        const childrenCount = hasChildren ? item.children.length : 0;
        
        // Add children counter if has children
        const childrenElement = hasChildren ? 
            `<span class="children-counter">${childrenCount} sub-pages</span>` : '';
        
        itemElement.innerHTML = `
            <div class="knowledge-status ${statusClass}"></div>
            <div class="knowledge-content">
                <h3 class="knowledge-title">${item.title}</h3>
                <p class="knowledge-subtitle">${item.subtitle || ''}</p>
                <div class="knowledge-meta">
                    <span>Updated ${formattedDate}</span>
                    ${childrenElement}
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
        
        // Find item in the current space
        const item = findKnowledgeItemInHierarchy(currentSpace.items, itemId);
        if (!item) return;
        
        // Store current item as active
        currentItem = item;
        
        // Show knowledge content page with tree navigation
        showKnowledgeContentWithTree(currentSpace.id, item);
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
                openKnowledgeItem(pathItemId);
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
     * @param {string} itemName - Optional item name
     * @param {string} spaceName - Optional space name
     * @param {string} parentName - Optional parent item name
     */
    function updateBreadcrumb(itemName = null, spaceName = null, parentName = null) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        if (itemName && spaceName && parentName) {
            breadcrumb.innerHTML = `
                <span class="file-title">Dashboard / ${spaceName} / ${parentName} / ${itemName}</span>
            `;
        } else if (itemName && spaceName) {
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
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', window.studySpaces.initialize);
})();