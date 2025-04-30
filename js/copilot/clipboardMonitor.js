/**
 * Clipboard Monitor Module
 * Handles monitoring the system clipboard for copied text
 * to support the AI Copilot functionality
 */

// Initialize namespace
window.WebNotebook = window.WebNotebook || {};
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
        
        // Set up paste event monitoring
        setupPasteListener();
        
        // Load last monitoring state from settings
        if (WebNotebook.Utils && WebNotebook.Utils.Storage) {
            const settings = WebNotebook.Utils.Storage.loadSettings();
            if (settings.copilot && settings.copilot.autostart) {
                startMonitoring();
                const toggle = document.getElementById('clipboard-monitor-toggle');
                if (toggle) toggle.checked = true;
            }
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
            if (WebNotebook.Utils && WebNotebook.Utils.Storage) {
                const settings = WebNotebook.Utils.Storage.loadSettings();
                settings.copilot = settings.copilot || {};
                settings.copilot.isMonitoring = this.checked;
                WebNotebook.Utils.Storage.saveSettings(settings);
            }
        });
    }
    
    /**
     * Set up global paste event listener
     */
    function setupPasteListener() {
        // Listen for paste events globally
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
     * Start monitoring the clipboard
     */
    function startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        
        // Show notification
        showNotification('Clipboard monitoring started', 'The AI Copilot will capture any text you copy.');
        
        // Try to use Clipboard API if available
        tryUsingClipboardAPI();
        
        // Start polling the clipboard as fallback
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
     * Try to use the Clipboard API if available and permitted
     */
    function tryUsingClipboardAPI() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            // Request permission by trying to read clipboard
            navigator.clipboard.readText()
                .then(text => {
                    console.log('Clipboard API access granted');
                    // If successful, we can use the API for monitoring
                    // Replace the interval with Clipboard API based monitoring
                    if (monitorInterval) {
                        clearInterval(monitorInterval);
                    }
                    
                    // Set up a new interval that uses the Clipboard API
                    monitorInterval = setInterval(() => {
                        navigator.clipboard.readText()
                            .then(newText => {
                                if (newText && newText !== lastCapturedText) {
                                    processNewClipboardContent(newText);
                                    lastCapturedText = newText;
                                }
                            })
                            .catch(err => {
                                console.error('Error reading clipboard:', err);
                            });
                    }, POLLING_INTERVAL);
                })
                .catch(err => {
                    console.log('Clipboard API access denied, using fallback:', err);
                    // Continue with fallback approach
                });
        }
    }
    
    /**
     * Check the clipboard for new text
     */
    function checkClipboard() {
        // This is a fallback for browsers that don't support Clipboard API
        // We rely on the paste event handling for most cases
        // This is just a periodic check in case we missed a copy event
        
        // For now, we don't do anything here as it's not possible to 
        // programmatically read the clipboard without user action in most browsers
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
        if (WebNotebook.Copilot && WebNotebook.Copilot.updateCapturedContent) {
            WebNotebook.Copilot.updateCapturedContent(trimmedText);
        }
        
        // Show notification
        showCaptureNotification(trimmedText);
        
        // Send to AI processor for analysis
        if (WebNotebook.Copilot.AIProcessor && WebNotebook.Copilot.AIProcessor.analyzeContent) {
            WebNotebook.Copilot.AIProcessor.analyzeContent(trimmedText);
        }
        
        // Add to history
        if (WebNotebook.Copilot.HistoryTracker && WebNotebook.Copilot.HistoryTracker.addHistoryItem) {
            WebNotebook.Copilot.HistoryTracker.addHistoryItem({
                type: 'capture',
                content: trimmedText,
                timestamp: new Date().toISOString()
            });
        }
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
        if (WebNotebook.Copilot && WebNotebook.Copilot.showCopilot) {
            WebNotebook.Copilot.showCopilot();
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

// Modify the showCopilot function in copilot.js
function showCopilot() {
    if (!copilotPopup) {
        copilotPopup = document.getElementById('copilot-popup');
    }
    
    if (copilotPopup) {
        // Make sure we're using display flex to properly show the popup
        copilotPopup.style.display = 'flex';
        
        // Add a small timeout to ensure styles are applied
        setTimeout(() => {
            // Force repaint
            copilotPopup.style.opacity = '0.99';
            setTimeout(() => {
                copilotPopup.style.opacity = '1';
            }, 50);
        }, 50);
        
        isActive = true;
        
        // If clipboard monitoring is on, check for content in clipboard
        if (WebNotebook.Copilot.ClipboardMonitor && 
            WebNotebook.Copilot.ClipboardMonitor.isMonitoring && 
            WebNotebook.Copilot.ClipboardMonitor.isMonitoring()) {
            checkClipboardOnActivation();
        }
    } else {
        console.error('Copilot popup element not found with ID: copilot-popup');
        alert('Could not display AI Copilot. Please check the console for errors.');
    }
}

// Add CSS fix to ensure the popup is visible
document.addEventListener('DOMContentLoaded', function() {
    // Add a style element to ensure the copilot-popup is properly styled
    const style = document.createElement('style');
    style.textContent = `
        .copilot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            max-width: 90vw;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            overflow: hidden;
            display: none; /* Initially hidden */
            flex-direction: column;
            max-height: 80vh;
        }
    `;
    document.head.appendChild(style);
});