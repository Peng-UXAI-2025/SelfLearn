/**
 * Clipboard Monitor Module
 * Handles monitoring the system clipboard for copied text
 * to support the AI Copilot functionality
 */

WebNotebook.Copilot = WebNotebook.Copilot || {};
WebNotebook.Copilot.ClipboardMonitor = (function() {
    // Private variables
    let isMonitoring = false;
    let lastCapturedText = '';
    let monitorInterval = null;
    const POLLING_INTERVAL = 1000; // Check clipboard every second
    
    /**
     * Initialize the clipboard monitor
     */
    function initialize() {
        console.log('Clipboard Monitor initialized');
        
        // Set up clipboard monitor toggle
        setupToggle();
        
        // Load last monitoring state from settings
        const settings = WebNotebook.Utils.Storage.loadSettings();
        if (settings.clipboardMonitorEnabled) {
            startMonitoring();
            document.getElementById('clipboard-monitor-toggle').checked = true;
        }
    }
    
    /**
     * Set up the clipboard monitor toggle switch
     */
    function setupToggle() {
        const toggle = document.getElementById('clipboard-monitor-toggle');
        if (!toggle) return;
        
        toggle.addEventListener('change', function() {
            if (this.checked) {
                startMonitoring();
            } else {
                stopMonitoring();
            }
            
            // Save preference to settings
            const settings = WebNotebook.Utils.Storage.loadSettings();
            settings.clipboardMonitorEnabled = this.checked;
            WebNotebook.Utils.Storage.saveSettings(settings);
        });
    }
    
    /**
     * Start monitoring the clipboard
     */
    function startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        
        // Show notification
        showNotification('Clipboard monitoring started', 'The AI Copilot will capture any text you copy.');
        
        // Start polling the clipboard
        monitorInterval = setInterval(checkClipboard, POLLING_INTERVAL);
    }
    
    /**
     * Stop monitoring the clipboard
     */
    function stopMonitoring() {
        if (!isMonitoring) return;
        
        isMonitoring = false;
        
        // Clear the interval
        if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = null;
        }
        
        // Show notification
        showNotification('Clipboard monitoring stopped', 'The AI Copilot will no longer capture copied text.');
    }
    
    /**
     * Check the clipboard for new text
     */
    function checkClipboard() {
        // We need to use the browser's clipboard API
        // This requires user permission and needs to be called from a user action
        // For demonstration purposes, we'll use a simulated approach
        
        // In a real implementation, this would use navigator.clipboard.readText()
        // but that requires user permission and a secure context (HTTPS)
        simulateClipboardCheck();
    }
    
    /**
     * Simulate checking the clipboard
     * In a real implementation, this would be replaced with actual clipboard access
     */
    function simulateClipboardCheck() {
        // This is a placeholder for the actual clipboard reading logic
        // For testing, we'll provide a way to manually "paste" text into the copilot
        
        document.addEventListener('paste', function(e) {
            if (!isMonitoring) return;
            
            // Get the pasted text
            const text = e.clipboardData.getData('text');
            if (!text || text === lastCapturedText) return;
            
            // Process the new text
            processNewClipboardContent(text);
            lastCapturedText = text;
        });
    }
    
    /**
     * Handle new content detected in the clipboard
     * @param {string} text - The text content captured from the clipboard
     */
    function processNewClipboardContent(text) {
        // Trim and verify it's not empty
        const trimmedText = text.trim();
        if (!trimmedText) return;
        
        // Only process if it's significantly different (to avoid duplicates)
        if (isSimilarToLastCapture(trimmedText)) return;
        
        // Update the displayed captured content
        updateCapturedContent(trimmedText);
        
        // Show notification
        showCaptureNotification(trimmedText);
        
        // Send to AI processor for analysis
        WebNotebook.Copilot.AIProcessor.analyzeContent(trimmedText);
        
        // Add to history
        WebNotebook.Copilot.HistoryTracker.addHistoryItem({
            type: 'capture',
            content: trimmedText,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Check if the new content is very similar to the last captured content
     * @param {string} text - The new text to check
     * @returns {boolean} - True if the text is similar to the last capture
     */
    function isSimilarToLastCapture(text) {
        // If no last capture, then it's not similar
        if (!lastCapturedText) return false;
        
        // If they're exactly the same, they're similar
        if (text === lastCapturedText) return true;
        
        // If one is a substring of the other, they're similar
        if (text.includes(lastCapturedText) || lastCapturedText.includes(text)) {
            // But only if the length ratio is close
            const lengthRatio = Math.min(text.length, lastCapturedText.length) / 
                                Math.max(text.length, lastCapturedText.length);
            return lengthRatio > 0.8;
        }
        
        return false;
    }
    
    /**
     * Update the displayed captured content in the copilot window
     * @param {string} text - The text to display
     */
    function updateCapturedContent(text) {
        const capturedTextElement = document.getElementById('captured-text');
        if (capturedTextElement) {
            capturedTextElement.textContent = text;
        }
    }
    
    /**
     * Show a notification that new content was captured
     * @param {string} text - The captured text
     */
    function showCaptureNotification(text) {
        // Create a short preview for the notification
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        
        showNotification('New content captured', preview, [
            { label: 'View', action: showCopilot },
            { label: 'Ignore', action: null }
        ]);
    }
    
    /**
     * Show a notification to the user
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {Array} [actions] - Optional array of action buttons
     */
    function showNotification(title, message, actions = []) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.clipboard-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'clipboard-notification';
        
        // Add content
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📋</div>
                <div class="notification-message">
                    <strong>${title}</strong>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        // Add action buttons if provided
        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'notification-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                
                if (action.action) {
                    button.addEventListener('click', () => {
                        action.action();
                        hideNotification(notification);
                    });
                } else {
                    button.addEventListener('click', () => {
                        hideNotification(notification);
                    });
                }
                
                actionsContainer.appendChild(button);
            });
            
            notification.appendChild(actionsContainer);
        }
        
        // Add to the document
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds if no actions
        if (actions.length === 0) {
            setTimeout(() => {
                hideNotification(notification);
            }, 5000);
        }
    }
    
    /**
     * Hide a notification with animation
     * @param {Element} notification - The notification element to hide
     */
    function hideNotification(notification) {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300); // Match the animation duration
    }
    
    /**
     * Show the copilot window
     */
    function showCopilot() {
        const copilot = document.getElementById('copilot-popup');
        if (copilot) {
            copilot.style.display = 'flex';
        }
    }
    
    /**
     * Manually capture text (for testing or direct user input)
     * @param {string} text - The text to capture
     */
    function manualCapture(text) {
        if (!text || !text.trim()) return;
        
        processNewClipboardContent(text.trim());
    }
    
    // Public API
    return {
        initialize,
        startMonitoring,
        stopMonitoring,
        manualCapture,
        isMonitoring: () => isMonitoring
    };
})();