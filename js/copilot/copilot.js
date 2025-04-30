/**
 * Copilot Module
 * Main module for the AI Copilot functionality
 * Integrates clipboard monitoring, AI processing, prompts, and history
 */

WebNotebook.Copilot = WebNotebook.Copilot || {};

// Main Copilot Module
WebNotebook.Copilot = (function() {
    // Private variables
    let isActive = false;
    let copilotPopup = null;
    let capturedTextElement = null;
    
    /**
     * Initialize the Copilot module and all its components
     */
    function initialize() {
        console.log('Copilot module initialized');
        
        // Initialize submodules
        WebNotebook.Copilot.ClipboardMonitor.initialize();
        WebNotebook.Copilot.AIProcessor.initialize();
        WebNotebook.Copilot.PromptManager.initialize();
        WebNotebook.Copilot.HistoryTracker.initialize();
        
        // Set up the copilot UI
        setupCopilotUI();
        
        // Get UI elements
        copilotPopup = document.getElementById('copilot-popup');
        capturedTextElement = document.getElementById('captured-text');
        
        // Load previous state
        loadCopilotState();
    }
    
    /**
     * Set up the Copilot user interface elements
     */
    function setupCopilotUI() {
        // Set up copilot button
        const copilotBtn = document.getElementById('copilot-btn');
        if (copilotBtn) {
            copilotBtn.addEventListener('click', toggleCopilot);
        }
        
        // Set up close button
        const closeBtn = document.querySelector('#copilot-popup .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideCopilot);
        }
        
        // Set up clipboard monitor toggle
        const monitorToggle = document.getElementById('clipboard-monitor-toggle');
        if (monitorToggle) {
            monitorToggle.addEventListener('change', function() {
                if (this.checked) {
                    WebNotebook.Copilot.ClipboardMonitor.startMonitoring();
                } else {
                    WebNotebook.Copilot.ClipboardMonitor.stopMonitoring();
                }
                
                // Save the toggle state
                saveCopilotState();
            });
        }
        
        // Add paste handling for captured content area
        setupPasteHandling();
        
        // Make the copilot window draggable
        makeCopilotDraggable();
    }
    
    /**
     * Set up paste handling for manual content capture
     */
    function setupPasteHandling() {
        const capturedTextArea = document.getElementById('captured-text');
        if (!capturedTextArea) return;
        
        // Make it editable
        capturedTextArea.setAttribute('contenteditable', 'true');
        
        // Add paste handler
        capturedTextArea.addEventListener('paste', function(e) {
            // Prevent the default paste action
            e.preventDefault();
            
            // Get text from clipboard
            const text = e.clipboardData.getData('text/plain');
            
            // Replace current content
            capturedTextArea.textContent = text;
            
            // Analyze the content for suggestions
            WebNotebook.Copilot.AIProcessor.analyzeContent(text);
        });
        
        // Add input handler to update suggestions on manual typing
        capturedTextArea.addEventListener('input', function() {
            const text = this.textContent.trim();
            if (text.length > 10) { // Only analyze if there's enough text
                WebNotebook.Copilot.AIProcessor.analyzeContent(text);
            }
        });
    }
    
    /**
     * Toggle the copilot window visibility
     */
    function toggleCopilot() {
        if (!copilotPopup) {
            copilotPopup = document.getElementById('copilot-popup');
        }
        
        if (!copilotPopup) return;
        
        if (copilotPopup.style.display === 'flex') {
            hideCopilot();
        } else {
            showCopilot();
        }
    }
    
    /**
     * Show the copilot window
     */
    function showCopilot() {
        if (!copilotPopup) {
            copilotPopup = document.getElementById('copilot-popup');
        }
        
        if (copilotPopup) {
            copilotPopup.style.display = 'flex';
            isActive = true;
            
            // If clipboard monitoring is on, check for content in clipboard
            if (WebNotebook.Copilot.ClipboardMonitor.isMonitoring()) {
                checkClipboardOnActivation();
            }
        }
    }
    
    /**
     * Hide the copilot window
     */
    function hideCopilot() {
        if (!copilotPopup) {
            copilotPopup = document.getElementById('copilot-popup');
        }
        
        if (copilotPopup) {
            copilotPopup.style.display = 'none';
            isActive = false;
        }
    }
    
    /**
     * Check clipboard when copilot is activated
     */
    function checkClipboardOnActivation() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(text => {
                    if (text && text.trim()) {
                        updateCapturedContent(text);
                        WebNotebook.Copilot.AIProcessor.analyzeContent(text);
                    }
                })
                .catch(err => {
                    console.error('Failed to read clipboard:', err);
                });
        }
    }
    
    /**
     * Update the captured content display
     * @param {string} text - The text to display
     */
    function updateCapturedContent(text) {
        if (!capturedTextElement) {
            capturedTextElement = document.getElementById('captured-text');
        }
        
        if (capturedTextElement) {
            capturedTextElement.textContent = text;
        }
    }
    
    /**
     * Make the copilot window draggable
     */
    function makeCopilotDraggable() {
        const copilotPopup = document.getElementById('copilot-popup');
        const copilotHeader = document.querySelector('#copilot-popup .copilot-header');
        
        if (!copilotPopup || !copilotHeader) return;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        // Mouse down event on header starts dragging
        copilotHeader.addEventListener('mousedown', function(e) {
            // Only start drag if not clicking on the close button
            if (e.target.classList.contains('close-btn')) return;
            
            isDragging = true;
            copilotPopup.classList.add('dragging');
            
            // Get the initial mouse position relative to the popup
            const rect = copilotPopup.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
        
        // Mouse move event updates position while dragging
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            // Calculate new position
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            
            // Apply new position, ensuring it stays within viewport
            copilotPopup.style.left = Math.max(0, Math.min(window.innerWidth - copilotPopup.offsetWidth, newLeft)) + 'px';
            copilotPopup.style.top = Math.max(0, Math.min(window.innerHeight - copilotPopup.offsetHeight, newTop)) + 'px';
        });
        
        // Mouse up event ends dragging
        document.addEventListener('mouseup', function() {
            isDragging = false;
            copilotPopup.classList.remove('dragging');
        });
    }
    
    /**
     * Process text manually pasted or entered by the user
     * @param {string} text - Text to process
     */
    function processManualText(text) {
        if (!text || !text.trim()) {
            alert('Please enter some text to process.');
            return;
        }
        
        // Update captured content display
        updateCapturedContent(text);
        
        // Show the copilot
        showCopilot();
        
        // Analyze content for processing suggestions
        WebNotebook.Copilot.AIProcessor.analyzeContent(text);
        
        // Add to history
        WebNotebook.Copilot.HistoryTracker.addHistoryItem({
            type: 'capture',
            content: text,
            timestamp: new Date().toISOString(),
            source: 'manual'
        });
    }
    
    /**
     * Process content with a specific action
     * @param {string} content - Content to process
     * @param {string} action - Action to take ('summarize', 'qa', 'insert', 'custom')
     * @param {string} [customPrompt] - Custom prompt for 'custom' action
     */
    function processContent(content, action, customPrompt) {
        if (!content || !content.trim()) {
            alert('No content to process.');
            return;
        }
        
        // Show the copilot
        showCopilot();
        
        // Process the content
        WebNotebook.Copilot.AIProcessor.processContent(content, action, customPrompt);
    }
    
    /**
     * Save the current state of the copilot
     */
    function saveCopilotState() {
        const settings = WebNotebook.Utils.Storage.loadSettings();
        
        settings.copilot = settings.copilot || {};
        settings.copilot.isMonitoring = WebNotebook.Copilot.ClipboardMonitor.isMonitoring();
        
        // Save position if it's been moved
        if (copilotPopup && copilotPopup.style.left) {
            settings.copilot.position = {
                left: copilotPopup.style.left,
                top: copilotPopup.style.top
            };
        }
        
        WebNotebook.Utils.Storage.saveSettings(settings);
    }
    
    /**
     * Load the saved state of the copilot
     */
    function loadCopilotState() {
        const settings = WebNotebook.Utils.Storage.loadSettings();
        
        if (settings.copilot) {
            // Restore clipboard monitoring state
            if (settings.copilot.isMonitoring) {
                WebNotebook.Copilot.ClipboardMonitor.startMonitoring();
                
                // Update toggle switch
                const toggle = document.getElementById('clipboard-monitor-toggle');
                if (toggle) toggle.checked = true;
            }
            
            // Restore position
            if (settings.copilot.position && copilotPopup) {
                copilotPopup.style.left = settings.copilot.position.left;
                copilotPopup.style.top = settings.copilot.position.top;
            }
        }
    }
    
    /**
     * Is the copilot currently visible?
     * @returns {boolean} - True if copilot is visible
     */
    function isVisible() {
        return isActive;
    }
    
    /**
     * Is clipboard monitoring active?
     * @returns {boolean} - True if monitoring is active
     */
    function isMonitoring() {
        return WebNotebook.Copilot.ClipboardMonitor.isMonitoring();
    }
    
    /**
     * Start clipboard monitoring
     */
    function startMonitoring() {
        WebNotebook.Copilot.ClipboardMonitor.startMonitoring();
        
        // Update toggle switch if it exists
        const toggle = document.getElementById('clipboard-monitor-toggle');
        if (toggle) {
            toggle.checked = true;
        }
        
        // Save state
        saveCopilotState();
    }
    
    /**
     * Stop clipboard monitoring
     */
    function stopMonitoring() {
        WebNotebook.Copilot.ClipboardMonitor.stopMonitoring();
        
        // Update toggle switch if it exists
        const toggle = document.getElementById('clipboard-monitor-toggle');
        if (toggle) {
            toggle.checked = false;
        }
        
        // Save state
        saveCopilotState();
    }
    
    /**
     * Show settings dialog for the Copilot
     */
    function showSettings() {
        // Create settings dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'flex';
        
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>AI Copilot Settings</h3>
                    <button class="close-modal-btn">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="default-prompt">Default Processing Prompt</label>
                        <textarea id="default-prompt" rows="4">${WebNotebook.Copilot.PromptManager.getPrompt('custom')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="settings-autostart" ${WebNotebook.Copilot.ClipboardMonitor.isMonitoring() ? 'checked' : ''}>
                            Automatically start clipboard monitoring on startup
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Saved Prompts</label>
                        <div id="saved-prompts-list">
                            ${getSavedPromptsHTML()}
                        </div>
                        <button id="add-new-prompt-btn" class="primary-btn">Add New Prompt</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="settings-save-btn" class="primary-btn">Save Settings</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(dialog);
        
        // Set up event listeners
        dialog.querySelector('.close-modal-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Add new prompt button
        dialog.querySelector('#add-new-prompt-btn').addEventListener('click', () => {
            WebNotebook.Copilot.PromptManager.showSavePromptDialog();
            
            // Refresh the saved prompts list
            dialog.querySelector('#saved-prompts-list').innerHTML = getSavedPromptsHTML();
        });
        
        // Save settings button
        dialog.querySelector('#settings-save-btn').addEventListener('click', () => {
            // Save default prompt
            const defaultPrompt = dialog.querySelector('#default-prompt').value;
            if (defaultPrompt) {
                WebNotebook.Copilot.PromptManager.updateDefaultPrompt(defaultPrompt);
            }
            
            // Save autostart preference
            const autostart = dialog.querySelector('#settings-autostart').checked;
            const settings = WebNotebook.Utils.Storage.loadSettings();
            settings.copilot = settings.copilot || {};
            settings.copilot.autostart = autostart;
            WebNotebook.Utils.Storage.saveSettings(settings);
            
            // Close dialog
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * Generate HTML for saved prompts list
     * @returns {string} HTML for saved prompts list
     */
    function getSavedPromptsHTML() {
        const savedPrompts = WebNotebook.Copilot.PromptManager.getSavedPrompts();
        if (savedPrompts.length === 0) {
            return '<p>No saved prompts yet. Add one using the button below.</p>';
        }
        
        let html = '<ul class="saved-prompts-list">';
        savedPrompts.forEach(prompt => {
            html += `
                <li>
                    <strong>${prompt.name}</strong> 
                    <div class="prompt-actions">
                        <button class="prompt-edit-btn" data-id="${prompt.id}">Edit</button>
                        <button class="prompt-delete-btn" data-id="${prompt.id}">Delete</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        
        return html;
    }
    
    // Public API
    return {
        initialize,
        showCopilot,
        hideCopilot,
        toggleCopilot,
        processManualText,
        processContent,
        isVisible,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        showSettings,
        updateCapturedContent
    };
})();