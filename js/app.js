/**
 * Web Notebook Application
 * Main JavaScript file that initializes the application and integrates all modules
 */

// Application namespace
const WebNotebook = (function() {
    // Private variables 
    let currentDocument = null;
    let isInitialized = false;

    // Initialize the application when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('WebNotebook application initialized');
        
        // Initialize storage first
        WebNotebook.Utils.Storage.initialize();
        
        // Initialize UI components
        WebNotebook.Interface.FileManager.initialize();
        WebNotebook.Interface.ViewModes.initialize();
        WebNotebook.Interface.ContextMenu.initialize();
        WebNotebook.Interface.DragDrop.initialize();
        WebNotebook.Interface.RoadmapTracker.initialize();
        
        // Initialize search functionality
        WebNotebook.Utils.Search.initialize();
        
        // Initialize AI Copilot
        WebNotebook.Copilot.initialize();
        
        // Initialize Knowledge Tree
        WebNotebook.KnowledgeTree.initialize();
        
        // Add event listeners to all common UI elements
        addGlobalEventListeners();
        
        // Load last accessed document if available
        loadLastDocument();
        
        isInitialized = true;
    });
    
    /**
     * Add event listeners to global UI elements
     */
    function addGlobalEventListeners() {
        // Header elements
        document.getElementById('document-title').addEventListener('input', updateDocumentTitle);
        document.getElementById('document-title').addEventListener('blur', saveCurrentDocument);
        
        // Menu toggle
        document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
        
        // Formatting tools
        initializeFormattingTools();
        
        // AI tools dropdown
        document.getElementById('ai-tools-btn').addEventListener('click', toggleAIDropdown);
        
        // Document body
        const documentBody = document.getElementById('document-body');
        documentBody.addEventListener('focus', function() {
            this.classList.add('editing');
        });
        
        documentBody.addEventListener('blur', function() {
            this.classList.remove('editing');
            saveCurrentDocument();
        });
        
        documentBody.addEventListener('input', function() {
            // Auto-save after a delay
            debounce(saveCurrentDocument, 1000)();
        });
        
        // Global click handler for closing dropdowns
        document.addEventListener('click', function(event) {
            // Close AI dropdown if clicking outside
            if (!event.target.matches('#ai-tools-btn') && !event.target.closest('#ai-dropdown')) {
                const dropdown = document.getElementById('ai-dropdown');
                if (dropdown.style.display === 'block') {
                    dropdown.style.display = 'none';
                }
            }
            
            // Close other open dropdowns or menus
            closeOpenMenus(event);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Tree/Icon view toggle buttons
        document.getElementById('tree-view-btn').addEventListener('click', function() {
            WebNotebook.Interface.ViewModes.switchViewMode('tree');
        });
        
        document.getElementById('icon-view-btn').addEventListener('click', function() {
            WebNotebook.Interface.ViewModes.switchViewMode('icon');
        });
        
        // AI Copilot button
        document.getElementById('copilot-btn').addEventListener('click', function() {
            WebNotebook.Copilot.toggleCopilot();
        });
        
        // Doc Summary button
        document.getElementById('doc-summary-btn').addEventListener('click', showDocSummaryWindow);
        
        // AI Assistant button
        document.getElementById('ai-assistant-btn').addEventListener('click', showAIAssistantWindow);
        
        // Summarize Text button
        document.getElementById('summarize-btn').addEventListener('click', function() {
            const selectedText = getSelectedText();
            if (selectedText) {
                WebNotebook.Copilot.processManualText(selectedText);
            } else {
                alert('Please select some text to summarize.');
            }
        });
    }
    
    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The time to wait in milliseconds
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    /**
     * Get selected text from the document
     * @returns {string} - Selected text
     */
    function getSelectedText() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            return range.toString();
        }
        return '';
    }
    
    /**
     * Close open menus when clicking outside them
     * @param {Event} event - Click event
     */
    function closeOpenMenus(event) {
        // Close context menu if open
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu && contextMenu.style.display === 'block' && !event.target.closest('.context-menu')) {
            contextMenu.style.display = 'none';
        }
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentDocument();
            
            // Show a save indicator
            showSaveIndicator();
        }
        
        // Ctrl/Cmd + F to search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            WebNotebook.Utils.Search.showSearchUI();
        }
        
        // Ctrl/Cmd + C to capture selected text when copilot is active
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && WebNotebook.Copilot.isMonitoring()) {
            // Let the default copy happen first
            setTimeout(() => {
                const selectedText = getSelectedText();
                if (selectedText) {
                    WebNotebook.Copilot.ClipboardMonitor.manualCapture(selectedText);
                }
            }, 100);
        }
    }
    
    /**
     * Show a temporary save indicator
     */
    function showSaveIndicator() {
        const saveIndicator = document.createElement('div');
        saveIndicator.className = 'save-indicator';
        saveIndicator.textContent = 'Document Saved';
        
        document.body.appendChild(saveIndicator);
        
        setTimeout(() => {
            saveIndicator.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(saveIndicator);
            }, 300);
        }, 1500);
    }
    
    /**
     * Update document title and breadcrumb
     */
    function updateDocumentTitle() {
        const title = document.getElementById('document-title').textContent;
        WebNotebook.Interface.FileManager.updateBreadcrumb(title);
        
        // Update document tab title
        document.title = title + ' - Web Notebook';
        
        // Mark document as modified
        if (currentDocument) {
            currentDocument.modified = true;
        }
    }
    
    /**
     * Save current document content
     */
    function saveCurrentDocument() {
        WebNotebook.Interface.FileManager.saveCurrentDocument();
        
        // Save as last accessed document
        saveLastDocument();
    }
    
    /**
     * Save the current document as the last accessed one
     */
    function saveLastDocument() {
        const selectedNode = WebNotebook.Interface.FileManager.getSelectedNode();
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            if (nodeId) {
                const settings = WebNotebook.Utils.Storage.loadSettings();
                settings.lastDocument = nodeId;
                WebNotebook.Utils.Storage.saveSettings(settings);
            }
        }
    }
    
    /**
     * Load the last accessed document
     */
    function loadLastDocument() {
        const settings = WebNotebook.Utils.Storage.loadSettings();
        if (settings.lastDocument) {
            const node = document.querySelector(`.node-content[data-id="${settings.lastDocument}"]`);
            if (node) {
                WebNotebook.Interface.FileManager.selectNode(node);
            } else {
                // If node not found, try to create a default document
                createDefaultDocument();
            }
        } else {
            // No last document, create a default one
            createDefaultDocument();
        }
    }
    
    /**
     * Create a default document if none exists
     */
    function createDefaultDocument() {
        // Check if there are any documents
        const nodesData = WebNotebook.Utils.Storage.loadNodesData();
        
        if (Object.keys(nodesData).length === 0) {
            // Create a welcome document
            const welcomeNodeId = WebNotebook.Interface.FileManager.createNode(
                'Welcome to Web Notebook', 
                'file', 
                null
            );
            
            // Create content for welcome document
            const welcomeContent = `
                <h1>Welcome to Web Notebook</h1>
                <p>This is your personal knowledge management and learning platform. Here are some tips to get started:</p>
                <h2>Key Features</h2>
                <ul>
                    <li><strong>File Management:</strong> Create and organize notes, knowledge points, and learning roadmaps</li>
                    <li><strong>AI Copilot:</strong> Extract content automatically from your clipboard</li>
                    <li><strong>Knowledge Tree:</strong> Visualize and organize your knowledge</li>
                </ul>
                <h2>Quick Tips</h2>
                <ul>
                    <li>Use the <strong>AI Tools</strong> button to access AI-powered features</li>
                    <li>Right-click in the sidebar to create new items</li>
                    <li>Toggle between tree and icon views using the buttons in the header</li>
                </ul>
                <p>Let's get started building your knowledge base!</p>
            `;
            
            // Get the node and update its content
            const welcomeNode = document.querySelector(`.node-content[data-id="${welcomeNodeId}"]`);
            if (welcomeNode) {
                const nodeData = WebNotebook.Utils.Storage.getNodeById(welcomeNodeId);
                if (nodeData) {
                    nodeData.content = welcomeContent;
                    WebNotebook.Utils.Storage.saveNode(welcomeNodeId, nodeData);
                }
                
                // Select the welcome node
                WebNotebook.Interface.FileManager.selectNode(welcomeNode);
            }
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        
        // Update content area spacing
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.classList.toggle('full-width', sidebar.classList.contains('collapsed'));
        }
    }
    
    /**
     * Toggle AI tools dropdown
     */
    function toggleAIDropdown() {
        const dropdown = document.getElementById('ai-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
    
    /**
     * Show document summary window
     */
    function showDocSummaryWindow() {
        const docSummaryWindow = document.getElementById('doc-summary-window');
        if (docSummaryWindow) {
            // Reset file list
            const filesList = document.getElementById('uploaded-files-list');
            if (filesList) {
                filesList.innerHTML = '';
            }
            
            // Reset generate button
            const generateBtn = document.getElementById('generate-summary-btn');
            if (generateBtn) {
                generateBtn.disabled = true;
            }
            
            docSummaryWindow.style.display = 'flex';
        }
    }
    
    /**
     * Show AI assistant window
     */
    function showAIAssistantWindow() {
        // This would show an AI chat assistant window
        alert('AI Assistant functionality will be available in a future update.');
    }
    
    /**
     * Initialize the formatting tools
     */
    function initializeFormattingTools() {
        const formatButtons = document.querySelectorAll('.tool-button');
        
        formatButtons.forEach(button => {
            button.addEventListener('click', function() {
                const title = this.getAttribute('title');
                
                // Apply formatting based on button clicked
                if (title === 'Bold') {
                    document.execCommand('bold', false, null);
                    this.classList.toggle('active');
                } else if (title === 'Italic') {
                    document.execCommand('italic', false, null);
                    this.classList.toggle('active');
                } else if (title === 'Underline') {
                    document.execCommand('underline', false, null);
                    this.classList.toggle('active');
                } else if (title === 'Heading 1') {
                    applyHeadingFormat('h1');
                } else if (title === 'Heading 2') {
                    applyHeadingFormat('h2');
                } else if (title === 'Heading 3') {
                    applyHeadingFormat('h3');
                } else if (title === 'Bullet List') {
                    document.execCommand('insertUnorderedList', false, null);
                } else if (title === 'Numbered List') {
                    document.execCommand('insertOrderedList', false, null);
                } else if (title === 'To-do List') {
                    insertTodoList();
                } else if (title === 'Add Link') {
                    const url = prompt('Enter the URL:');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                } else if (title === 'Add Image') {
                    const imageUrl = prompt('Enter the image URL:');
                    if (imageUrl) {
                        document.execCommand('insertImage', false, imageUrl);
                    }
                }
                
                // Return focus to the editor
                document.getElementById('document-body').focus();
            });
        });
        
        // Check for formatting and update button states on selection change
        document.addEventListener('selectionchange', updateFormatButtonStates);
    }
    
    /**
     * Update formatting tool button states based on current selection
     */
    function updateFormatButtonStates() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const formatButtons = document.querySelectorAll('.tool-button');
        
        formatButtons.forEach(button => {
            const title = button.getAttribute('title');
            
            // Check if format is active
            if (title === 'Bold' && document.queryCommandState('bold')) {
                button.classList.add('active');
            } else if (title === 'Bold') {
                button.classList.remove('active');
            }
            
            if (title === 'Italic' && document.queryCommandState('italic')) {
                button.classList.add('active');
            } else if (title === 'Italic') {
                button.classList.remove('active');
            }
            
            if (title === 'Underline' && document.queryCommandState('underline')) {
                button.classList.add('active');
            } else if (title === 'Underline') {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * Apply heading format to selected text
     * @param {string} headingType - h1, h2, or h3
     */
    function applyHeadingFormat(headingType) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
                // Create new heading element
                const heading = document.createElement(headingType);
                heading.textContent = selectedText;
                
                // Replace selected text with heading
                range.deleteContents();
                range.insertNode(heading);
                
                // Move cursor to end of heading
                const newRange = document.createRange();
                newRange.setStartAfter(heading);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    }
    
    /**
     * Insert a todo list item
     */
    function insertTodoList() {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Create todo item
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            todoItem.innerHTML = '<input type="checkbox"> <span contenteditable="true">Todo item</span>';
            
            // Insert todo item
            range.deleteContents();
            range.insertNode(todoItem);
            
            // Add event listener for checkbox
            const checkbox = todoItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                const span = this.nextElementSibling;
                if (this.checked) {
                    span.style.textDecoration = 'line-through';
                    span.style.opacity = '0.7';
                } else {
                    span.style.textDecoration = 'none';
                    span.style.opacity = '1';
                }
                
                // Save document
                saveCurrentDocument();
            });
            
            // Focus on the editable span
            const span = todoItem.querySelector('span');
            span.focus();
            
            // Select all text in the span
            const textRange = document.createRange();
            textRange.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(textRange);
        }
    }
    
    // Return public methods and properties
    return {
        // Public methods
        saveCurrentDocument,
        toggleSidebar,
        getSelectedText,
        createDefaultDocument,
        isInitialized: () => isInitialized
    };
})();