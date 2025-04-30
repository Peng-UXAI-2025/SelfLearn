/**
 * Copilot Module
 * Main module for the AI Copilot functionality
 * Integrates clipboard monitoring, AI processing, prompts, and history
 */

WebNotebook.Copilot = WebNotebook.Copilot || {};

// Main Copilot Module
WebNotebook.Copilot = (function() {
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
        
        // Make the copilot window draggable
        makeCopilotDraggable();
    }
    
    /**
     * Toggle the copilot window visibility
     */
    function toggleCopilot() {
        const copilotPopup = document.getElementById('copilot-popup');
        if (!copilotPopup) return;
        
        if (copilotPopup.style.display === 'flex') {
            copilotPopup.style.display = 'none';
        } else {
            copilotPopup.style.display = 'flex';
        }
    }
    
    /**
     * Show the copilot window
     */
    function showCopilot() {
        const copilotPopup = document.getElementById('copilot-popup');
        if (copilotPopup) {
            copilotPopup.style.display = 'flex';
        }
    }
    
    /**
     * Hide the copilot window
     */
    function hideCopilot() {
        const copilotPopup = document.getElementById('copilot-popup');
        if (copilotPopup) {
            copilotPopup.style.display = 'none';
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
        const capturedTextElement = document.getElementById('captured-text');
        if (capturedTextElement) {
            capturedTextElement.textContent = text;
        }
        
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
     * Is the copilot currently visible?
     * @returns {boolean} - True if copilot is visible
     */
    function isVisible() {
        const copilotPopup = document.getElementById('copilot-popup');
        return copilotPopup && copilotPopup.style.display === 'flex';
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
    }
    
    /**
     * Show settings dialog for the Copilot
     */
    function showSettings() {
        // This would show a settings dialog for the Copilot
        // For now, we'll just log to console
        console.log('Showing Copilot settings');
        
        // You would create a modal here with settings
        alert('Copilot settings dialog not implemented yet.');
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
        showSettings
    };
})();