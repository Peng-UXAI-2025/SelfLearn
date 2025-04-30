/**
 * Tree Generator Module
 * Handles generating knowledge trees from notes and other content
 */

(function() {
    // Create tree generator namespace
    window.treeGenerator = {};
    
    // Store notes array for processing
    let notes = [];
    let knowledgeTree = null;
    
    /**
     * Add note from textarea
     * @param {HTMLElement} textarea - Textarea containing note
     * @param {HTMLElement} windowElement - Window element
     */
    window.treeGenerator.addNoteFromTextarea = function(textarea, windowElement) {
        const noteText = textarea.value.trim();
        
        if (!noteText) {
            window.knowledgeApi.showStatusMessage("Please enter note text", true, windowElement);
            return;
        }
        
        // Check if there are multiple lines
        const noteLines = noteText.split('\n').filter(line => line.trim());
        
        if (noteLines.length > 1) {
            // Add each line as a separate note
            noteLines.forEach(line => {
                if (line.trim()) {
                    addSingleNote(line.trim(), windowElement);
                }
            });
        } else {
            // Add as a single note
            addSingleNote(noteText, windowElement);
        }
        
        // Clear textarea
        textarea.value = '';
        
        // Update generate button state
        updateGenerateButton(windowElement);
    };
    
    /**
     * Add a single note to the list
     * @param {string} noteText - Note text
     * @param {HTMLElement} windowElement - Window element
     */
    function addSingleNote(noteText, windowElement) {
        // Add to notes array
        notes.push(noteText);
        
        // Add to UI
        const notesContainer = windowElement.querySelector('#notes-container');
        const noNotesMessage = windowElement.querySelector('#no-notes-message');
        
        // Remove "no notes" message if it exists
        if (noNotesMessage) {
            noNotesMessage.style.display = 'none';
        }
        
        // Create note card
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <span class="remove-btn" title="Remove note">&times;</span>
            <p>${noteText}</p>
        `;
        
        // Add remove functionality
        const removeBtn = noteCard.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            // Remove from array
            const index = notes.indexOf(noteText);
            if (index > -1) {
                notes.splice(index, 1);
            }
            
            // Remove from UI
            noteCard.remove();
            
            // Show "no notes" message if no notes left
            if (notes.length === 0 && windowElement.querySelector('#no-notes-message')) {
                windowElement.querySelector('#no-notes-message').style.display = 'block';
            }
            
            // Update generate button state
            updateGenerateButton(windowElement);
        });
        
        notesContainer.appendChild(noteCard);
    }
    
    /**
     * Clear all notes
     * @param {HTMLElement} windowElement - Window element
     */
    window.treeGenerator.clearNotes = function(windowElement) {
        if (notes.length === 0) return;
        
        if (confirm('Are you sure you want to clear all notes?')) {
            notes = [];
            const notesContainer = windowElement.querySelector('#notes-container');
            notesContainer.innerHTML = '<p id="no-notes-message">No notes added yet.</p>';
            
            // Update generate button state
            updateGenerateButton(windowElement);
        }
    };
    
    /**
     * Update generate button state
     * @param {HTMLElement} windowElement - Window element
     */
    function updateGenerateButton(windowElement) {
        const generateBtn = windowElement.querySelector('#generate-notes-tree-btn');
        if (generateBtn) {
            generateBtn.disabled = notes.length === 0;
            if (notes.length === 0) {
                generateBtn.classList.add('disabled');
            } else {
                generateBtn.classList.remove('disabled');
            }
        }
    }
    
    /**
     * Generate knowledge tree
     * @param {HTMLElement} windowElement - Window element
     * @param {string} model - AI model to use
     */
    window.treeGenerator.generateKnowledgeTree = async function(windowElement, model) {
        if (notes.length === 0) {
            window.knowledgeApi.showStatusMessage("Please add some notes first", true, windowElement);
            return;
        }
        
        // Show loading indicator
        const windowTopArea = windowElement.querySelector('.notes-input-area');
        const loadingIndicator = window.utils.createLoadingIndicator();
        windowTopArea.appendChild(loadingIndicator);
        
        // Get structure if defined
        const structureTextarea = windowElement.querySelector('#notes-structure-textarea');
        const structure = structureTextarea ? structureTextarea.value.trim() : '';
        
        try {
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 10,
                status: "Generating knowledge tree..."
            });
            
            // Call API to process notes
            const result = await window.knowledgeApi.processNotes(notes, structure, model);
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 50,
                status: "Parsing result..."
            });
            
            // Extract JSON from the response
            let jsonData;
            try {
                // Try to find JSON in the response
                const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```([\s\S]*?)```/) || result.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } else {
                    throw new Error("Could not extract JSON from response");
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                console.log("Raw response:", result);
                throw new Error("Failed to parse knowledge tree structure. Please try again.");
            }
            
            // Store the knowledge tree
            knowledgeTree = jsonData;
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 75,
                status: "Creating visualization..."
            });
            
            // Replace the notes window with a visualization
            createTreeVisualizationWindow(windowElement, knowledgeTree, model);
            
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 100,
                status: "Knowledge tree generated successfully!"
            });
            
            // Save tree to storage
            const treeId = window.utils.generateUniqueId();
            window.storage.saveKnowledgeTree(treeId, knowledgeTree);
            
            // Hide loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 1000);
        } catch (error) {
            console.error("Error generating knowledge tree:", error);
            window.utils.updateProgressIndicator(loadingIndicator, {
                progress: 0,
                status: `Error: ${error.message}`,
                error: true
            });
            
            // Hide loading indicator after a delay
            setTimeout(() => {
                loadingIndicator.remove();
            }, 5000);
        }
    };
    
    /**
     * Create tree visualization window
     * @param {HTMLElement} originalWindow - Original window element
     * @param {Object} treeData - Tree data
     * @param {string} model - AI model used
     */
    function createTreeVisualizationWindow(originalWindow, treeData, model) {
        // Create a visualization container to replace the original window
        const vizContainer = document.createElement('div');
        vizContainer.className = 'ai-window';
        vizContainer.dataset.treeId = window.utils.generateUniqueId();
        
        // Make sure width matches the document body
        const docBodyWidth = document.querySelector('.body-area').offsetWidth;
        vizContainer.style.width = docBodyWidth + 'px';
        
        vizContainer.innerHTML = `
            <div class="ai-window-header">
                <div class="window-drag-handle">
                    <span>Knowledge Tree (${model === 'gpt-4o' ? 'OpenAI' : 'Gemini'})</span>
                </div>
                <div class="window-controls">
                    <button class="files-btn">Notes</button>
                    <button class="more-options-btn">Export</button>
                    <button class="fullscreen-btn">Full Screen</button>
                    <button class="close-btn">Close</button>
                </div>
            </div>
            <div class="ai-window-body">
                <div class="visualization-container">
                    <svg width="100%" height="400" class="tree-svg"></svg>
                </div>
                <div class="more-options-panel" style="display: none;">
                    <button class="export-json-btn">Export as JSON</button>
                    <button class="export-markdown-btn">Export as Markdown</button>
                    <button class="export-svg-btn">Export as SVG</button>
                </div>
                <div class="knowledge-details" style="display: none;"></div>
            </div>
        `;
        
        // Replace the original window with the visualization
        originalWindow.parentNode.replaceChild(vizContainer, originalWindow);
        
        // Create D3 visualization
        window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
        
        // Add drag handle functionality
        const dragHandle = vizContainer.querySelector('.window-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function(e) {
                window.webNotebook.handleDragStart(e, vizContainer);
            });
        }
        
        // Add event listeners
        vizContainer.querySelector('.close-btn').addEventListener('click', function() {
            vizContainer.remove();
        });
        
        vizContainer.querySelector('.fullscreen-btn').addEventListener('click', function() {
            window.utils.toggleFullscreen(vizContainer, this);
            
            // Re-create visualization with new dimensions
            window.treeVisualizer.createVisualization(vizContainer.querySelector('svg'), treeData);
        });
        
        vizContainer.querySelector('.files-btn').addEventListener('click', function() {
            showTreeNotes(notes);
        });
        
        vizContainer.querySelector('.more-options-btn').addEventListener('click', function() {
            window.webNotebook.toggleMoreOptionsPanel(vizContainer);
        });
        
        // Setup export buttons
        setupExportButtons(vizContainer, treeData);
    }
    
    /**
     * Show tree notes
     * @param {Array} notesList - List of notes
     */
    function showTreeNotes(notesList) {
        // Create modal for notes
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Notes Used for Knowledge Tree</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="notes-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add notes to list
        const notesList_element = modal.querySelector('.notes-list');
        if (notesList.length === 0) {
            notesList_element.innerHTML = '<p>No notes available</p>';
        } else {
            notesList.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'modal-note-item';
                noteElement.textContent = note;
                notesList_element.appendChild(noteElement);
            });
        }
        
        // Add close button functionality
        modal.querySelector('.modal-close-btn').addEventListener('click', function() {
            modal.remove();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add styles for modal if not already in document
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background-color: white;
                    border-radius: 5px;
                    width: 80%;
                    max-width: 600px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #ddd;
                }
                .modal-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                }
                .modal-body {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                }
                .notes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .modal-note-item {
                    padding: 10px;
                    background-color: #f5f5f5;
                    border-left: 3px solid #233749;
                    border-radius: 3px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Setup export buttons
     * @param {HTMLElement} container - Container element
     * @param {Object} treeData - Tree data
     */
    function setupExportButtons(container, treeData) {
        // Export as JSON
        container.querySelector('.export-json-btn').addEventListener('click', function() {
            const jsonString = JSON.stringify(treeData, null, 2);
            window.utils.downloadFile(jsonString, 'knowledge-tree.json', 'application/json');
        });
        
        // Export as Markdown
        container.querySelector('.export-markdown-btn').addEventListener('click', function() {
            const markdown = convertTreeToMarkdown(treeData);
            window.utils.downloadFile(markdown, 'knowledge-tree.md', 'text/markdown');
        });
        
        // Export as SVG
        container.querySelector('.export-svg-btn').addEventListener('click', function() {
            const svg = container.querySelector('svg');
            const svgData = window.treeVisualizer.exportSvg(svg);
            window.utils.downloadFile(svgData, 'knowledge-tree.svg', 'image/svg+xml');
        });
    }
    
    /**
     * Convert tree to Markdown
     * @param {Object} treeData - Tree data
     * @returns {string} - Markdown representation
     */
    function convertTreeToMarkdown(treeData) {
        let markdown = `# ${treeData.title}\n\n`;
        markdown += `${treeData.summary}\n\n`;
        
        // Recursively add child nodes
        function addChildToMarkdown(node, level) {
            let result = '';
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    // Add heading with appropriate level
                    result += `\n${'#'.repeat(level + 2)} ${child.title}\n\n`;
                    
                    // Add summary and content
                    result += `${child.summary}\n\n`;
                    if (child.content) {
                        result += `${child.content}\n\n`;
                    }
                    
                    // Add children recursively
                    result += addChildToMarkdown(child, level + 1);
                });
            }
            return result;
        }
        
        markdown += addChildToMarkdown(treeData, 0);
        
        return markdown;
    }
})();