/**
 * Node Notes Module
 * Manages notes associated with knowledge tree nodes
 */

(function() {
    // Create nodeNotes namespace
    window.nodeNotes = {};
    
    // Storage for node notes
    let notesData = {};
    
    /**
     * Initialize the node notes module
     */
    window.nodeNotes.initialize = function() {
        // Load saved notes from storage
        loadNotesFromStorage();
        
        console.log("Node notes module initialized");
    };
    
    /**
     * Load notes from local storage
     */
    function loadNotesFromStorage() {
        try {
            const savedNotes = window.storage.getItem('nodeNotes');
            if (savedNotes) {
                notesData = savedNotes;
            }
        } catch (err) {
            console.error("Error loading notes from storage:", err);
            notesData = {};
        }
    }
    
    /**
     * Save notes to local storage
     */
    function saveNotesToStorage() {
        try {
            window.storage.setItem('nodeNotes', notesData);
        } catch (err) {
            console.error("Error saving notes to storage:", err);
        }
    }
    
    /**
     * Get notes for a specific node
     * @param {string} nodeId - The node ID
     * @returns {Array} - Array of notes for the node
     */
    window.nodeNotes.getNotesForNode = function(nodeId) {
        if (!nodeId) return [];
        
        // Initialize if not exists
        if (!notesData[nodeId]) {
            notesData[nodeId] = [];
        }
        
        return notesData[nodeId];
    };
    
    /**
     * Add a note to a node
     * @param {string} nodeId - The node ID
     * @param {string} noteText - The note text
     * @returns {Object} - The added note object
     */
    window.nodeNotes.addNote = function(nodeId, noteText) {
        if (!nodeId || !noteText.trim()) return null;
        
        // Initialize if not exists
        if (!notesData[nodeId]) {
            notesData[nodeId] = [];
        }
        
        // Create note object
        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            text: noteText.trim(),
            createdAt: new Date().toISOString()
        };
        
        // Add to node's notes
        notesData[nodeId].unshift(newNote);
        
        // Save to storage
        saveNotesToStorage();
        
        return newNote;
    };
    
    /**
     * Delete a note from a node
     * @param {string} nodeId - The node ID
     * @param {string} noteId - The note ID to delete
     * @returns {boolean} - Success status
     */
    window.nodeNotes.deleteNote = function(nodeId, noteId) {
        if (!nodeId || !noteId || !notesData[nodeId]) return false;
        
        // Find the note index
        const noteIndex = notesData[nodeId].findIndex(note => note.id === noteId);
        
        if (noteIndex === -1) return false;
        
        // Remove the note
        notesData[nodeId].splice(noteIndex, 1);
        
        // Save to storage
        saveNotesToStorage();
        
        return true;
    };
    
    /**
     * Show notes modal for a node
     * @param {Object} nodeData - The node data
     */
    window.nodeNotes.showNotesModal = function(nodeData) {
        if (!nodeData || !nodeData.id) {
            console.error("Invalid node data");
            return;
        }
        
        // Get notes for this node
        const notes = window.nodeNotes.getNotesForNode(nodeData.id);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Notes for "${nodeData.title}"</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="new-note">Add New Note</label>
                        <textarea id="new-note" placeholder="Enter your note here..."></textarea>
                        <button id="add-note-btn" class="btn btn-primary">Add Note</button>
                    </div>
                    
                    <h4 id="notes-list-header">${notes.length > 0 ? 'Notes List' : 'No notes yet'}</h4>
                    <div id="notes-list">
                        ${renderNotesList(notes)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Add note button
        modal.querySelector('#add-note-btn').addEventListener('click', () => {
            const noteText = modal.querySelector('#new-note').value;
            
            if (noteText.trim()) {
                // Add the note
                const newNote = window.nodeNotes.addNote(nodeData.id, noteText);
                
                // Clear input
                modal.querySelector('#new-note').value = '';
                
                // Update notes list
                const notesList = modal.querySelector('#notes-list');
                const notesHeader = modal.querySelector('#notes-list-header');
                
                // Update header
                notesHeader.textContent = 'Notes List';
                
                // Add new note to the list
                if (newNote) {
                    const noteElement = createNoteElement(newNote, nodeData.id);
                    
                    // Add at the beginning
                    if (notesList.firstChild) {
                        notesList.insertBefore(noteElement, notesList.firstChild);
                    } else {
                        notesList.appendChild(noteElement);
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
        
        // Add styles if not already in the document
        if (!document.getElementById('node-notes-styles')) {
            addNodeNotesStyles();
        }
    };
    
    /**
     * Render notes list HTML
     * @param {Array} notes - Array of note objects
     * @returns {string} - HTML for notes list
     */
    function renderNotesList(notes) {
        if (!notes || notes.length === 0) {
            return '';
        }
        
        let html = '';
        
        notes.forEach(note => {
            html += `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="note-text">${formatNoteText(note.text)}</div>
                    <div class="note-meta">
                        <span class="note-date">${formatDate(new Date(note.createdAt))}</span>
                        <button class="delete-note-btn" title="Delete Note">×</button>
                    </div>
                </div>
            `;
        });
        
        return html;
    }
    
    /**
     * Format note text (handle line breaks, URLs, etc.)
     * @param {string} text - Note text
     * @returns {string} - Formatted HTML
     */
    function formatNoteText(text) {
        if (!text) return '';
        
        // Escape HTML
        let safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Convert URLs to links
        safeText = safeText.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank">$1</a>'
        );
        
        // Convert line breaks to <br>
        safeText = safeText.replace(/\n/g, '<br>');
        
        return safeText;
    }
    
    /**
     * Format date for display
     * @param {Date} date - Date to format
     * @returns {string} - Formatted date
     */
    function formatDate(date) {
        if (!date) return '';
        
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'Just now';
        } else if (diffMin < 60) {
            return `${diffMin} min ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hours ago`;
        } else if (diffDay === 1) {
            return 'Yesterday';
        } else if (diffDay < 7) {
            return `${diffDay} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    /**
     * Create a note element with event handlers
     * @param {Object} note - Note object
     * @param {string} nodeId - Node ID
     * @returns {HTMLElement} - Note element
     */
    function createNoteElement(note, nodeId) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.dataset.noteId = note.id;
        
        noteElement.innerHTML = `
            <div class="note-text">${formatNoteText(note.text)}</div>
            <div class="note-meta">
                <span class="note-date">${formatDate(new Date(note.createdAt))}</span>
                <button class="delete-note-btn" title="Delete Note">×</button>
            </div>
        `;
        
        // Add delete button handler
        noteElement.querySelector('.delete-note-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this note?')) {
                // Delete the note
                const deleted = window.nodeNotes.deleteNote(nodeId, note.id);
                
                if (deleted) {
                    // Remove element from DOM
                    noteElement.remove();
                    
                    // Update header if no notes left
                    const modal = this.closest('.modal-content');
                    if (modal) {
                        const notesList = modal.querySelector('#notes-list');
                        const notesHeader = modal.querySelector('#notes-list-header');
                        
                        if (!notesList.children.length) {
                            notesHeader.textContent = 'No notes yet';
                        }
                    }
                }
            }
        });
        
        return noteElement;
    }
    
    /**
     * Add CSS styles for node notes
     */
    function addNodeNotesStyles() {
        const style = document.createElement('style');
        style.id = 'node-notes-styles';
        style.textContent = `
            /* Notes Modal Styles */
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
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: #233749;
                color: white;
                border-radius: 8px 8px 0 0;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .modal-body {
                padding: 20px;
                overflow-y: auto;
            }
            
            /* Form Styles */
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .form-group textarea {
                width: 100%;
                height: 80px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 10px;
                resize: vertical;
            }
            
            .btn {
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                border: none;
            }
            
            .btn-primary {
                background-color: #233749;
                color: white;
            }
            
            .btn-primary:hover {
                background-color: #1a2a38;
            }
            
            /* Notes List Styles */
            #notes-list-header {
                margin-top: 20px;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #eee;
                color: #333;
            }
            
            #notes-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .note-item {
                background-color: #f9f9f9;
                border-left: 3px solid #233749;
                margin-bottom: 15px;
                padding: 12px;
                border-radius: 4px;
            }
            
            .note-text {
                margin-bottom: 8px;
                line-height: 1.5;
                white-space: pre-wrap;
            }
            
            .note-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #777;
            }
            
            .note-date {
                font-style: italic;
            }
            
            .delete-note-btn {
                background: none;
                border: none;
                color: #e74c3c;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .delete-note-btn:hover {
                background-color: #e74c3c;
                color: white;
            }
            
            /* View Notes Button in Tree */
            .view-notes-btn {
                margin-top: 10px;
                background-color: #233749;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .view-notes-btn:hover {
                background-color: #1a2a38;
            }
            
            .node-details-controls {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', window.nodeNotes.initialize);
})();