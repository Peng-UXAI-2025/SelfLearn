/**
 * Study Spaces Module
 * Manages study spaces and knowledge items
 */

(function() {
    // Create study spaces namespace
    window.studySpaces = {};
    
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
                        subItems: [
                            {
                                id: 'empathize-stage',
                                title: 'Empathize Stage',
                                subtitle: 'Understanding user needs',
                                status: 'completed',
                                content: '<h2>Empathize Stage in Design Thinking</h2><p>The Empathize stage is about understanding the user and their needs through research.</p><h3>Common Methods</h3><ul><li>User interviews</li><li>Observation</li><li>Surveys and questionnaires</li><li>Empathy mapping</li></ul><p>The goal is to set aside your own assumptions and gain real insight into users and their needs.</p>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString()
                            },
                            {
                                id: 'define-stage',
                                title: 'Define Stage',
                                subtitle: 'Framing the problem',
                                status: 'in-progress',
                                content: '<h2>Define Stage in Design Thinking</h2><p>The Define stage is about processing and synthesizing the information gathered during the Empathize stage.</p><h3>Key Activities</h3><ul><li>Analyzing user research</li><li>Identifying patterns</li><li>Defining user needs and problems</li><li>Creating user personas</li><li>Developing problem statements</li></ul>',
                                dateCreated: new Date().toISOString(),
                                dateUpdated: new Date().toISOString()
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
                        subItems: []
                    },
                    {
                        id: 'user-research',
                        title: 'User Research',
                        subtitle: 'Understanding user needs',
                        status: 'not-started',
                        content: '',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        subItems: []
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
                        subItems: []
                    },
                    {
                        id: 'rest-apis',
                        title: 'REST APIs',
                        subtitle: 'API design principles',
                        status: 'in-progress',
                        content: '<h2>REST API Design</h2><p>REST (Representational State Transfer) is an architectural style for designing networked applications.</p><h3>RESTful API Principles</h3><ul><li>Stateless client-server communication</li><li>Cacheable responses</li><li>Uniform interface</li><li>Layered system</li></ul><h3>Common HTTP Methods</h3><ul><li>GET: Retrieve data</li><li>POST: Create data</li><li>PUT: Update data</li><li>DELETE: Remove data</li></ul>',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        subItems: []
                    },
                    {
                        id: 'database-design',
                        title: 'Database Design',
                        subtitle: 'SQL and NoSQL databases',
                        status: 'not-started',
                        content: '',
                        dateCreated: new Date().toISOString(),
                        dateUpdated: new Date().toISOString(),
                        subItems: []
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
        
        // Count sub-items if any
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const subItemsCount = hasSubItems ? item.subItems.length : 0;
        
        // Add sub-item counter if has sub-items
        const subItemsElement = hasSubItems ? 
            `<span class="sub-items-counter">${subItemsCount} sub-pages</span>` : '';
        
        itemElement.innerHTML = `
            <div class="knowledge-status ${statusClass}"></div>
            <div class="knowledge-content">
                <h3 class="knowledge-title">${item.title}</h3>
                <p class="knowledge-subtitle">${item.subtitle || ''}</p>
                <div class="knowledge-meta">
                    <span>Updated ${formattedDate}</span>
                    ${subItemsElement}
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
     * @param {string} subItemId - Optional sub-item ID
     */
    function openKnowledgeItem(itemId, subItemId = null) {
        if (!currentSpace || !currentSpace.items) return;
        
        // Find item
        const item = currentSpace.items.find(i => i.id === itemId);
        if (!item) return;
        
        // Store current item
        currentItem = item;
        
        // If subItemId provided, check if it exists
        if (subItemId) {
            // Find the sub-item
            const subItem = item.subItems?.find(si => si.id === subItemId);
            if (subItem) {
                // Show sub-item content page
                showSubItemContentPage(currentSpace.id, item, subItem);
                return;
            }
        }
        
        // Show content page for this knowledge item
        showKnowledgeContentPage(currentSpace.id, item);
    }
    
    /**
     * Show knowledge content page
     * @param {string} spaceId - Space ID
     * @param {Object} item - Knowledge item
     */
    function showKnowledgeContentPage(spaceId, item) {
        // Get the content area
        const contentArea = document.querySelector('.content');
        
        // Create content page
        const contentPage = document.createElement('div');
        contentPage.className = 'knowledge-content-page';
        
        // Add breadcrumb navigation
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        breadcrumb.innerHTML = `
            <a href="#" class="to-dashboard">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <a href="#" class="to-space">${currentSpace.name}</a>
            <span class="breadcrumb-separator">/</span>
            <span>${item.title}</span>
        `;
        
        // Add breadcrumb click handlers
        breadcrumb.querySelector('.to-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.showWelcomeDashboard();
        });
        
        breadcrumb.querySelector('.to-space').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.openStudySpace(spaceId);
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
                <button class="action-btn edit-content-btn">
                    <i class="icon-edit"></i> Edit
                </button>
            </div>
        `;
        
        // Add edit button handler
        header.querySelector('.edit-content-btn').addEventListener('click', () => {
            showEditKnowledgeModal(spaceId, item);
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
                    <p>This knowledge item doesn't have any content yet. Click the Edit button to add content.</p>
                </div>
            `;
        }
        
        contentPage.appendChild(body);
        
        // Add sub-items section if there are sub-items
        if (item.subItems && item.subItems.length > 0) {
            const subItemsSection = document.createElement('div');
            subItemsSection.className = 'sub-items-section';
            
            // Add section title
            const subItemsTitle = document.createElement('h2');
            subItemsTitle.className = 'sub-items-title';
            subItemsTitle.textContent = 'Sub-Knowledge Points';
            
            subItemsSection.appendChild(subItemsTitle);
            
            // Add sub-items list
            const subItemsList = document.createElement('div');
            subItemsList.className = 'sub-items-list';
            
            // Add each sub-item
            item.subItems.forEach(subItem => {
                subItemsList.appendChild(createSubKnowledgeItem(item.id, subItem));
            });
            
            subItemsSection.appendChild(subItemsList);
            
            // Add "Add sub-knowledge" button
            const addSubButton = document.createElement('div');
            addSubButton.className = 'add-sub-knowledge';
            addSubButton.innerHTML = `
                <i class="icon-plus"></i> Add New Sub-Knowledge Point
            `;
            
            addSubButton.addEventListener('click', () => {
                showAddSubKnowledgeModal(spaceId, item.id);
            });
            
            subItemsSection.appendChild(addSubButton);
            
            contentPage.appendChild(subItemsSection);
        } else {
            // If no sub-items, show add sub-knowledge button
            const addSubSection = document.createElement('div');
            addSubSection.className = 'add-sub-section';
            
            const addSubTitle = document.createElement('h2');
            addSubTitle.className = 'sub-items-title';
            addSubTitle.textContent = 'Sub-Knowledge Points';
            
            addSubSection.appendChild(addSubTitle);
            
            const addSubMessage = document.createElement('p');
            addSubMessage.className = 'sub-items-message';
            addSubMessage.textContent = 'No sub-knowledge points yet. Add one to organize your learning further.';
            
            addSubSection.appendChild(addSubMessage);
            
            const addSubButton = document.createElement('button');
            addSubButton.className = 'add-sub-btn';
            addSubButton.innerHTML = '<i class="icon-plus"></i> Add Sub-Knowledge Point';
            
            addSubButton.addEventListener('click', () => {
                showAddSubKnowledgeModal(spaceId, item.id);
            });
            
            addSubSection.appendChild(addSubButton);
            
            contentPage.appendChild(addSubSection);
        }
        
        // Replace current content with content page
        contentArea.innerHTML = '';
        contentArea.appendChild(contentPage);
        
        // Update document title
        document.title = `${item.title} - ${currentSpace.name} - SelfLearn`;
        document.getElementById('document-title').textContent = item.title;
        
        // Update breadcrumb
        updateBreadcrumb(item.title, currentSpace.name);
    }
    
    /**
     * Show sub-item content page
     * @param {string} spaceId - Space ID
     * @param {Object} parentItem - Parent knowledge item
     * @param {Object} subItem - Sub-knowledge item
     */
    function showSubItemContentPage(spaceId, parentItem, subItem) {
        // Get the content area
        const contentArea = document.querySelector('.content');
        
        // Create content page
        const contentPage = document.createElement('div');
        contentPage.className = 'knowledge-content-page';
        
        // Add breadcrumb navigation
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        breadcrumb.innerHTML = `
            <a href="#" class="to-dashboard">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <a href="#" class="to-space">${currentSpace.name}</a>
            <span class="breadcrumb-separator">/</span>
            <a href="#" class="to-parent">${parentItem.title}</a>
            <span class="breadcrumb-separator">/</span>
            <span>${subItem.title}</span>
        `;
        
        // Add breadcrumb click handlers
        breadcrumb.querySelector('.to-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.showWelcomeDashboard();
        });
        
        breadcrumb.querySelector('.to-space').addEventListener('click', (e) => {
            e.preventDefault();
            window.studySpaces.openStudySpace(spaceId);
        });
        
        breadcrumb.querySelector('.to-parent').addEventListener('click', (e) => {
            e.preventDefault();
            openKnowledgeItem(parentItem.id);
        });
        
        contentPage.appendChild(breadcrumb);
        
        // Add content header
        const header = document.createElement('div');
        header.className = 'content-header';
        
        // Get status class
        let statusClass = 'status-not-started';
        let statusText = 'Not Started';
        if (subItem.status === 'completed') {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (subItem.status === 'in-progress') {
            statusClass = 'status-in-progress';
            statusText = 'In Progress';
        }
        
        header.innerHTML = `
            <div class="content-title">
                <h1>${subItem.title}</h1>
                <div class="content-subtitle">${subItem.subtitle || ''}</div>
            </div>
            <div class="content-actions">
                <div class="content-status">
                    <span class="status-indicator ${statusClass}"></span>
                    <span class="status-text">${statusText}</span>
                </div>
                <button class="action-btn edit-content-btn">
                    <i class="icon-edit"></i> Edit
                </button>
            </div>
        `;
        
        // Add edit button handler
        header.querySelector('.edit-content-btn').addEventListener('click', () => {
            showEditSubKnowledgeModal(spaceId, parentItem.id, subItem);
        });
        
        contentPage.appendChild(header);
        
        // Add content body
        const body = document.createElement('div');
        body.className = 'content-body';
        
        // Check if content exists, if not show placeholder
        if (subItem.content) {
            body.innerHTML = subItem.content;
        } else {
            body.innerHTML = `
                <div class="empty-content">
                    <div class="empty-icon">📝</div>
                    <h3>No content yet</h3>
                    <p>This sub-knowledge item doesn't have any content yet. Click the Edit button to add content.</p>
                </div>
            `;
        }
        
        contentPage.appendChild(body);
        
        // Replace current content with content page
        contentArea.innerHTML = '';
        contentArea.appendChild(contentPage);
        
        // Update document title
        document.title = `${subItem.title} - ${currentSpace.name} - SelfLearn`;
        document.getElementById('document-title').textContent = subItem.title;
        
        // Update breadcrumb
        updateBreadcrumb(subItem.title, currentSpace.name, parentItem.title);
    }
    
    /**
     * Create sub-knowledge item element
     * @param {string} parentId - Parent item ID
     * @param {Object} subItem - Sub-knowledge item
     * @returns {HTMLElement} - Item element
     */
    function createSubKnowledgeItem(parentId, subItem) {
        const itemElement = document.createElement('div');
        itemElement.className = 'sub-knowledge-item';
        itemElement.dataset.itemId = subItem.id;
        itemElement.dataset.parentId = parentId;
        
        // Set status class
        let statusClass = 'status-not-started';
        if (subItem.status === 'completed') {
            statusClass = 'status-completed';
        } else if (subItem.status === 'in-progress') {
            statusClass = 'status-in-progress';
        }
        
        // Format date
        const dateUpdated = new Date(subItem.dateUpdated);
        const formattedDate = window.utils.formatDate(dateUpdated);
        
        itemElement.innerHTML = `
            <div class="knowledge-status ${statusClass}"></div>
            <div class="knowledge-content">
                <h3 class="knowledge-title">${subItem.title}</h3>
                <p class="knowledge-subtitle">${subItem.subtitle || ''}</p>
                <div class="knowledge-meta">
                    <span>Updated ${formattedDate}</span>
                </div>
            </div>
        `;
        
        // Add click event to open sub-knowledge item
        itemElement.addEventListener('click', () => {
            openKnowledgeItem(parentId, subItem.id);
        });
        
        return itemElement;
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
                subItems: []
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
                showKnowledgeContentPage(spaceId, newItem);
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
     * Show modal to add new sub-knowledge item
     * @param {string} spaceId - Space ID
     * @param {string} parentId - Parent item ID
     */
    function showAddSubKnowledgeModal(spaceId, parentId) {
        // Find parent item
        const spaces = window.storage.getStudySpaces();
        if (!spaces || !spaces[spaceId]) return;
        
        const parentItem = spaces[spaceId].items.find(item => item.id === parentId);
        if (!parentItem) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Add Sub-Knowledge Point</h3>
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
                        <button id="add-subitem-btn" class="btn btn-primary">Add Sub-Item</button>
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
        
        modal.querySelector('#add-subitem-btn').addEventListener('click', () => {
            // Get form values
            const title = document.getElementById('item-title').value.trim();
            const subtitle = document.getElementById('item-subtitle').value.trim();
            const content = document.getElementById('item-content').value;
            const status = document.querySelector('input[name="item-status"]:checked').value;
            
            // Validate
            if (!title) {
                alert('Please enter a title for your sub-knowledge item');
                return;
            }
            
            // Create item ID from title (slug)
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
            
            // Create sub-item object
            const newSubItem = {
                id: id,
                title: title,
                subtitle: subtitle || '',
                content: content || '',
                status: status,
                dateCreated: new Date().toISOString(),
                dateUpdated: new Date().toISOString()
            };
            
            // Add to parent item and save to storage
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[spaceId]) {
                const parentIndex = spaces[spaceId].items.findIndex(item => item.id === parentId);
                if (parentIndex !== -1) {
                    // Initialize subItems array if it doesn't exist
                    if (!spaces[spaceId].items[parentIndex].subItems) {
                        spaces[spaceId].items[parentIndex].subItems = [];
                    }
                    
                    // Add new sub-item
                    spaces[spaceId].items[parentIndex].subItems.push(newSubItem);
                    
                    // Update parent's dateUpdated
                    spaces[spaceId].items[parentIndex].dateUpdated = new Date().toISOString();
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Close modal
                    modal.remove();
                    
                    // Navigate to the new sub-item's content page
                    showSubItemContentPage(spaceId, spaces[spaceId].items[parentIndex], newSubItem);
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
                const itemIndex = spaces[spaceId].items.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                    // Update properties
                    spaces[spaceId].items[itemIndex].title = title;
                    spaces[spaceId].items[itemIndex].subtitle = subtitle;
                    spaces[spaceId].items[itemIndex].content = content;
                    spaces[spaceId].items[itemIndex].status = status;
                    spaces[spaceId].items[itemIndex].dateUpdated = new Date().toISOString();
                    
                    // Save to storage
                    window.storage.setStudySpaces(spaces);
                    
                    // Update current space
                    currentSpace = spaces[spaceId];
                    
                    // Close modal
                    modal.remove();
                    
                    // Refresh content page with updated content
                    showKnowledgeContentPage(spaceId, spaces[spaceId].items[itemIndex]);
                }
            }
        });
        
        modal.querySelector('#delete-item-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this knowledge item? All sub-items will also be deleted.')) {
                // Remove item from space
                const spaces = window.storage.getStudySpaces();
                if (spaces && spaces[spaceId]) {
                    // Filter out the item
                    spaces[spaceId].items = spaces[spaceId].items.filter(i => i.id !== item.id);
                    
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
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Show modal to edit sub-knowledge item
     * @param {string} spaceId - Space ID
     * @param {string} parentId - Parent item ID
     * @param {Object} subItem - Sub-knowledge item to edit
     */
    function showEditSubKnowledgeModal(spaceId, parentId, subItem) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header space-modal-header">
                    <h3>Edit Sub-Knowledge Item</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="item-title">Title</label>
                        <input type="text" id="item-title" value="${subItem.title}">
                    </div>
                    <div class="form-group">
                        <label for="item-subtitle">Subtitle (Optional)</label>
                        <input type="text" id="item-subtitle" value="${subItem.subtitle || ''}">
                    </div>
                    <div class="form-group">
                        <label for="item-content">Content</label>
                        <textarea id="item-content" rows="10" placeholder="Add your notes, code snippets, or other content here...">${subItem.content || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <div class="knowledge-status-selector">
                            <label class="status-option">
                                <input type="radio" name="item-status" value="not-started" ${subItem.status === 'not-started' ? 'checked' : ''}>
                                <span class="status-indicator status-not-started"></span>
                                Not Started
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="in-progress" ${subItem.status === 'in-progress' ? 'checked' : ''}>
                                <span class="status-indicator status-in-progress"></span>
                                In Progress
                            </label>
                            <label class="status-option">
                                <input type="radio" name="item-status" value="completed" ${subItem.status === 'completed' ? 'checked' : ''}>
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
                alert('Please enter a title for your sub-knowledge item');
                return;
            }
            
            // Update sub-item in space
            const spaces = window.storage.getStudySpaces();
            if (spaces && spaces[spaceId]) {
                // Find parent item
                const parentIndex = spaces[spaceId].items.findIndex(i => i.id === parentId);
                if (parentIndex !== -1) {
                    // Find sub-item index
                    const subItemIndex = spaces[spaceId].items[parentIndex].subItems.findIndex(si => si.id === subItem.id);
                    if (subItemIndex !== -1) {
                        // Update properties
                        spaces[spaceId].items[parentIndex].subItems[subItemIndex].title = title;
                        spaces[spaceId].items[parentIndex].subItems[subItemIndex].subtitle = subtitle;
                        spaces[spaceId].items[parentIndex].subItems[subItemIndex].content = content;
                        spaces[spaceId].items[parentIndex].subItems[subItemIndex].status = status;
                        spaces[spaceId].items[parentIndex].subItems[subItemIndex].dateUpdated = new Date().toISOString();
                        
                        // Update parent's dateUpdated
                        spaces[spaceId].items[parentIndex].dateUpdated = new Date().toISOString();
                        
                        // Save to storage
                        window.storage.setStudySpaces(spaces);
                        
                        // Update current space
                        currentSpace = spaces[spaceId];
                        
                        // Close modal
                        modal.remove();
                        
                        // Refresh content page with updated content
                        showSubItemContentPage(spaceId, spaces[spaceId].items[parentIndex], spaces[spaceId].items[parentIndex].subItems[subItemIndex]);
                    }
                }
            }
        });
        
        modal.querySelector('#delete-item-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this sub-knowledge item?')) {
                // Remove sub-item from parent
                const spaces = window.storage.getStudySpaces();
                if (spaces && spaces[spaceId]) {
                    // Find parent item
                    const parentIndex = spaces[spaceId].items.findIndex(i => i.id === parentId);
                    if (parentIndex !== -1) {
                        // Filter out the sub-item
                        spaces[spaceId].items[parentIndex].subItems = spaces[spaceId].items[parentIndex].subItems.filter(si => si.id !== subItem.id);
                        
                        // Update parent's dateUpdated
                        spaces[spaceId].items[parentIndex].dateUpdated = new Date().toISOString();
                        
                        // Save to storage
                        window.storage.setStudySpaces(spaces);
                        
                        // Update current space
                        currentSpace = spaces[spaceId];
                        
                        // Close modal
                        modal.remove();
                        
                        // Go back to parent item view
                        showKnowledgeContentPage(spaceId, spaces[spaceId].items[parentIndex]);
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