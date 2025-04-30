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
    let activeWindow = null;
    
    /**
     * Start monitoring clipboard
     * @param {HTMLElement} windowElement - Window element
     */
    window.clipboardMonitor.startMonitoring = function(windowElement) {
        if (isMonitoring) return;
        
        isMonitoring = true;
        window.webNotebook.app.clipboardMonitorActive = true;
        activeWindow = windowElement;
        
        // Show status message
        updateClipboardStatus(windowElement, true);
        
        // Show clipboard content container
        const contentContainer = windowElement.querySelector('.clipboard-content');
        if (contentContainer) {
            contentContainer.style.display = 'block';
        }
        
        // Show clipboard history container
        const historyContainer = windowElement.querySelector('.clipboard-history');
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
        if (activeWindow) {
            updateClipboardStatus(activeWindow, false);
            
            // Hide clipboard content container
            const contentContainer = activeWindow.querySelector('.clipboard-content');
            if (contentContainer) {
                contentContainer.style.display = 'none';
            }
        }
        
        // Remove event listener
        document.removeEventListener('paste', handlePasteEvent);
        
        // Reset active window
        activeWindow = null;
        
        console.log("Clipboard monitoring stopped");
    };
    
    /**
     * Handle paste event
     * @param {Event} e - Paste event
     */
    function handlePasteEvent(e) {
        if (!isMonitoring || !activeWindow) return;
        
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
        if (!activeWindow) return;
        
        const statusElement = activeWindow.querySelector('.clipboard-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <p>Clipboard monitoring requires permission to access your clipboard. 
                Please copy text and press Ctrl+V (or Cmd+V) in this window to grant permission.</p>
            `;
        }
    }
    
    /**
     * Process clipboard text
     * @param {string} text - Clipboard text
     */
    function processClipboardText(text) {
        if (!isMonitoring || !activeWindow) return;
        
        // Display the text
        const textPreview = activeWindow.querySelector('#captured-text');
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
     * @param {HTMLElement} windowElement - Window element
     * @param {boolean} active - Whether monitoring is active
     */
    function updateClipboardStatus(windowElement, active) {
        const statusElement = windowElement.querySelector('.clipboard-status');
        if (!statusElement) return;
        
        if (active) {
            statusElement.innerHTML = '<p>Clipboard monitoring is active. Copy text from anywhere to process it.</p>';
            statusElement.classList.add('active');
            statusElement.classList.remove('inactive');
        } else {
            statusElement.innerHTML = '<p>Clipboard monitoring is inactive. Click "Start Monitoring" to begin capturing copied text.</p>';
            statusElement.classList.remove('active');
            statusElement.classList.add('inactive');
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
        if (!activeWindow) return;
        
        const historyList = activeWindow.querySelector('#clipboard-history-list');
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
        if (!activeWindow) return;
        
        const textPreview = activeWindow.querySelector('#captured-text');
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
                        // Focus the clipboard window
                        if (activeWindow) {
                            activeWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
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
})();