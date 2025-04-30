/**
 * Web Notebook Application
 * Main JavaScript file that initializes the application and integrates all modules
 */

// Application namespace
const WebNotebook = (function() {
    // Initialize the application when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('WebNotebook application initialized');
        
        // Initialize storage first (changed from WebNotebook.Storage to WebNotebook.Utils.Storage)
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
        document.getElementById('document-body').addEventListener('focus', function() {
            this.classList.add('editing');
        });
        
        document.getElementById('document-body').addEventListener('blur', function() {
            this.classList.remove('editing');
            saveCurrentDocument();
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
        });
    }
    
    /**
     * Update document title and breadcrumb
     */
    function updateDocumentTitle() {
        const title = document.getElementById('document-title').textContent;
        WebNotebook.Interface.FileManager.updateBreadcrumb(title);
    }
    
    /**
     * Save current document content
     */
    function saveCurrentDocument() {
        WebNotebook.Interface.FileManager.saveCurrentDocument();
    }
    
    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    /**
     * Toggle AI tools dropdown
     */
    function toggleAIDropdown() {
        const dropdown = document.getElementById('ai-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
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
        saveCurrentDocument: saveCurrentDocument,
        toggleSidebar: toggleSidebar
    };
})();