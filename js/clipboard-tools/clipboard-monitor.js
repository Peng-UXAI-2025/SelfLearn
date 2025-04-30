/**
 * Clipboard Monitor Module
 * Provides functionality to monitor and capture clipboard content
 */

(function() {
    // Create clipboard monitor namespace
    window.clipboardMonitor = {};
    
    // Store monitoring state
    let isMonitoring = false;
    let clipboardHistory = [];
    let activeContainer = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    /**
     * Initialize clipboard copilot
     */
    window.clipboardMonitor.initialize = function() {
        // Create floating container if not exists
        if (!document.getElementById('clipboard-copilot-container')) {
            createFloatingCopilot();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        console.log("Clipboard copilot initialized");
    };
    
    /**
     * Create floating copilot container
     */
    function createFloatingCopilot() {
        const container = document.createElement('div');
        container.id = 'clipboard-copilot-container';
        container.className = 'clipboard-copilot-container';
        
        container.innerHTML = `
            <div class="clipboard-copilot-header">
                <h3>Clipboard Copilot</h3>
                <div class="clipboard-copilot-controls">
                    <label class="toggle-switch">
                        <input type="checkbox" id="monitoring-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Monitor</span>
                    <button class="minimize-btn">_</button>
                    <button class="close-btn">×</button>
                </div>
            </div>
            <div class="clipboard-copilot-body">
                <div class="clipboard-status">
                    <div class="status-indicator inactive"></div>
                    <div class="clipboard-status-text">
                        Clipboard monitoring is inactive. Toggle the switch to begin capturing copied text.
                    </div>
                </div>
                <div class="clipboard-content" style="display: none">
                    <h3>Captured Text:</h3>
                    <div id="captured-text" class="text-preview"></div>
                    <div class="processing-options">
                        <h3>Processing Options:</h3>
                        <button class="process-btn" data-action="summarize">
                            Summarize
                        </button>
                        <button class="process-btn" data-action="qa">Convert to Q&A</button>
                        <button class="process-btn" data-action="tree-node">
                            Add to Knowledge Tree
                        </button>
                    </div>
                    <div class="custom-processing">
                        <h3>Custom Processing:</h3>
                        <textarea
                          id="custom-prompt"
                          placeholder="Enter custom instructions for processing the text..."
                        ></textarea>
                        <button id="custom-process-btn">Process</button>
                    </div>
                </div>
                <div class="clipboard-history" style="display: none">
                    <h3>Clipboard History:</h3>
                    <div id="clipboard-history-list"></div>
                </div>
            </div>
        `;
        
        // Add to document body
        document.body.appendChild(container);
        activeContainer = container;
        
        return container;
    }
    
    /**
     * Setup event listeners for copilot
     */
    function setupEventListeners() {
        if (!activeContainer) return;
        
        // Monitoring toggle
        const monitoringToggle = activeContainer.querySelector('#monitoring-toggle');
        if (monitoringToggle) {
            monitoringToggle.addEventListener('change', function() {
                if (this.checked) {
                    window.clipboardMonitor.startMonitoring();
                } else {
                    window.clipboardMonitor.stopMonitoring();
                }
            });
        }
        
        // Minimize button
        const minimizeBtn = activeContainer.querySelector('.minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function() {
                activeContainer.classList.toggle('minimized');
                this.textContent = activeContainer.classList.contains('minimized') ? '□' : '_';
            });
        }
        
        // Close button
        const closeBtn = activeContainer.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                // Stop monitoring if active
                if (isMonitoring) {
                    window.clipboardMonitor.stopMonitoring();
                }
                
                // Hide container
                activeContainer.style.display = 'none';
            });
        }
        
        // Draggable header
        const header = activeContainer.querySelector('.clipboard-copilot-header');
        if (header) {
            header.addEventListener('mousedown', startDragging);
        }
        
        // Processing buttons
        const processButtons = activeContainer.querySelectorAll('.process-btn');
        processButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const textElement = activeContainer.querySelector('#captured-text');
                const text = textElement ? textElement.textContent : "";
                
                if (text.trim()) {
                    window.textProcessor.processText(text, action, activeContainer);
                }
            });
        });
        
        // Custom processing button
        const customProcessBtn = activeContainer.querySelector('#custom-process-btn');
        if (customProcessBtn) {
            customProcessBtn.addEventListener('click', function() {
                const customPrompt = activeContainer.querySelector('#custom-prompt').value;
                const textElement = activeContainer.querySelector('#captured-text');
                const text = textElement ? textElement.textContent : "";
                
                if (text.trim() && customPrompt.trim()) {
                    window.textProcessor.processTextWithCustomPrompt(text, customPrompt, activeContainer);
                }
            });
        }
        
        // Global drag handling
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
    
    /**
     * Start dragging the copilot window
     * @param {Event} e - Mouse event
     */
    function startDragging(e) {
        if (!activeContainer) return;
        
        // Only handle left mouse button
        if (e.button !== 0) return;
        
        e.preventDefault();
        
        // Get initial positions
        const rect = activeContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        isDragging = true;
        activeContainer.classList.add('dragging');
    }
    
    /**
     * Handle drag move
     * @param {Event} e - Mouse event
     */
    function handleDragMove(e) {
        if (!isDragging || !activeContainer) return;
        
        e.preventDefault();
        
        // Update position
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Constrain to window bounds
        const maxX = window.innerWidth - activeContainer.offsetWidth;
        const maxY = window.innerHeight - activeContainer.offsetHeight;
        
        activeContainer.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        activeContainer.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    }
    
    /**
     * Handle drag end
     */
    function handleDragEnd() {
        if (!isDragging || !activeContainer) return;
        
        isDragging = false;
        activeContainer.classList.remove('dragging');
    }
    
    /**
     * Start monitoring clipboard
     */
    window.clipboardMonitor.startMonitoring = function() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        window.webNotebook.app.clipboardMonitorActive = true;
        
        // Show status message
        updateClipboardStatus(true);
        
        // Show clipboard content container
        const contentContainer = activeContainer.querySelector('.clipboard-content');
        if (contentContainer) {
            contentContainer.style.display = 'block';
        }
        
        // Show clipboard history container
        const historyContainer = activeContainer.querySelector('.clipboard-history');
        if (historyContainer) {
            historyContainer.style.display = 'block';
            
            // Load history from storage
            loadClipboardHistory(historyContainer);
        }
        
        // Start monitoring
        document.addEventListener('paste', handlePasteEvent);
        
        // Try to get initial clipboard content (may be restricted by browser)
        tryReadClipboard();
        
        console.log("Clipboard monitoring started");
    };
    
    /**
     * Stop monitoring clipboard
     */
    window.clipboardMonitor.stopMonitoring = function() {
        if (!isMonitoring) return;
        
        isMonitoring = false;
        window.webNotebook.app.clipboardMonitorActive = false;
        
        // Update status
        if (activeContainer) {
            updateClipboardStatus(false);
            
            // Hide clipboard content container
            const contentContainer = activeContainer.querySelector('.clipboard-content');
            if (contentContainer) {
                contentContainer.style.display = 'none';
            }
        }
        
        // Remove event listener
        document.removeEventListener('paste', handlePasteEvent);
        
        console.log("Clipboard monitoring stopped");
    };
    
    /**
     * Show clipboard copilot
     */
    window.clipboardMonitor.showClipboardCopilot = function() {
        if (!activeContainer) {
            createFloatingCopilot();
            setupEventListeners();
        }
        
        activeContainer.style.display = 'flex';
    };
    
    /**
     * Handle paste event
     * @param {Event} e - Paste event
     */
    function handlePasteEvent(e) {
        if (!isMonitoring || !activeContainer) return;
        
        // Get clipboard text
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');
        
        if (pastedText && pastedText.trim()) {
            processClipboardText(pastedText);
        }
    }
    
    /**
     * Try to read clipboard directly (may be restricted by browser)
     */
    async function tryReadClipboard() {
        try {
            // This requires secure context and user permission
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    processClipboardText(text);
                }
            }
        } catch (error) {
            console.log("Could not read clipboard directly:", error);
            showClipboardPermissionMessage();
        }
    }
    
    /**
     * Show clipboard permission message
     */
    function showClipboardPermissionMessage() {
        if (!activeContainer) return;
        
        const statusText = activeContainer.querySelector('.clipboard-status-text');
        if (statusText) {
            statusText.innerHTML = 
                'Clipboard monitoring requires permission to access your clipboard. ' +
                'Please copy text and press Ctrl+V (or Cmd+V) in this window to grant permission.';
        }
    }
    
    /**
     * Process clipboard text
     * @param {string} text - Clipboard text
     */
    function processClipboardText(text) {
        if (!isMonitoring || !activeContainer) return;
        
        // Display the text
        const textPreview = activeContainer.querySelector('#captured-text');
        if (textPreview) {
            // Limit preview to 500 characters
            const limitedText = text.length > 500 
                ? text.substring(0, 500) + '...'
                : text;
            
            textPreview.textContent = limitedText;
        }
        
        // Add to history
        addToClipboardHistory(text);
        
        // Update history display
        updateHistoryDisplay();
        
        // Show notification
        showClipboardNotification(text);
    }
    
    /**
     * Update clipboard status display
     * @param {boolean} active - Whether monitoring is active
     */
    function updateClipboardStatus(active) {
        if (!activeContainer) return;
        
        const statusIndicator = activeContainer.querySelector('.status-indicator');
        const statusText = activeContainer.querySelector('.clipboard-status-text');
        
        if (!statusIndicator || !statusText) return;
        
        if (active) {
            statusIndicator.classList.remove('inactive');
            statusIndicator.classList.add('active');
            statusText.textContent = 'Clipboard monitoring is active. Copy text from anywhere to process it.';
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('inactive');
            statusText.textContent = 'Clipboard monitoring is inactive. Toggle the switch to begin capturing copied text.';
        }
        
        // Update toggle state
        const monitoringToggle = activeContainer.querySelector('#monitoring-toggle');
        if (monitoringToggle) {
            monitoringToggle.checked = active;
        }
    }
    
    /**
     * Add text to clipboard history
     * @param {string} text - Clipboard text
     */
    function addToClipboardHistory(text) {
        // Add to in-memory history
        clipboardHistory.unshift({
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // Limit history to 10 items in memory
        if (clipboardHistory.length > 10) {
            clipboardHistory.pop();
        }
        
        // Save to storage
        window.storage.saveClipboardItem(text);
    }
    
    /**
     * Load clipboard history from storage
     * @param {HTMLElement} historyContainer - History container element
     */
    function loadClipboardHistory(historyContainer) {
        const storageHistory = window.storage.getClipboardHistory();
        
        if (storageHistory && storageHistory.length > 0) {
            // Update in-memory history
            clipboardHistory = storageHistory.slice(0, 10).map(item => ({
                text: item.original,
                timestamp: item.timestamp,
                processed: item.processed
            }));
            
            // Update display
            updateHistoryDisplay();
        } else {
            const historyList = historyContainer.querySelector('#clipboard-history-list');
            if (historyList) {
                historyList.innerHTML = '<p>No clipboard history available</p>';
            }
        }
    }
    
    /**
     * Update history display
     */
    function updateHistoryDisplay() {
        if (!activeContainer) return;
        
        const historyList = activeContainer.querySelector('#clipboard-history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (clipboardHistory.length === 0) {
            historyList.innerHTML = '<p>No clipboard history available</p>';
            return;
        }
        
        clipboardHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Format timestamp
            const timestamp = new Date(item.timestamp);
            const formattedTime = window.utils.formatDate(timestamp);
            
            // Create preview text (limit to 50 chars)
            const previewText = item.text.length > 50
                ? item.text.substring(0, 50) + '...'
                : item.text;
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <strong>Clipboard ${index + 1}</strong>
                    <span class="history-timestamp">${formattedTime}</span>
                </div>
                <div class="history-preview">${previewText}</div>
            `;
            
            // Add click handler to select this item
            historyItem.addEventListener('click', function() {
                selectHistoryItem(item);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    /**
     * Select history item
     * @param {Object} item - History item
     */
    function selectHistoryItem(item) {
        if (!activeContainer) return;
        
        const textPreview = activeContainer.querySelector('#captured-text');
        if (textPreview) {
            // Limit preview to 500 characters
            const limitedText = item.text.length > 500 
                ? item.text.substring(0, 500) + '...'
                : item.text;
            
            textPreview.textContent = limitedText;
        }
    }
    
    /**
     * Show clipboard notification
     * @param {string} text - Clipboard text
     */
    function showClipboardNotification(text) {
        // Create preview text (limit to 50 chars)
        const previewText = text.length > 50
            ? text.substring(0, 50) + '...'
            : text;
        
        // Show notification with action buttons
        window.utils.showNotification(
            'New Clipboard Content',
            `Captured ${text.length} characters: "${previewText}"`,
            [
                {
                    label: 'Process',
                    callback: function() {
                        // Ensure copilot is visible
                        window.clipboardMonitor.showClipboardCopilot();
                    }
                },
                {
                    label: 'Ignore',
                    callback: function() {
                        // Do nothing
                    }
                }
            ]
        );
    }
    
    /**
     * Clear clipboard history
     */
    window.clipboardMonitor.clearHistory = function() {
        clipboardHistory = [];
        window.storage.clearClipboardHistory();
        updateHistoryDisplay();
    };
    
    /**
     * Get clipboard history
     * @returns {Array} - Clipboard history array
     */
    window.clipboardMonitor.getHistory = function() {
        return clipboardHistory;
    };
    
    // Initialize clipboard copilot when the page loads
    document.addEventListener('DOMContentLoaded', window.clipboardMonitor.initialize);
})();