/**
 * Utility functions for WebNotebook
 * Contains shared helper functions used across the application
 */

(function() {
    // Create utils namespace
    window.utils = {};

    /**
     * Apply heading format to selected text
     * @param {string} headingType - h1, h2, or h3
     */
    window.utils.applyHeadingFormat = function(headingType) {
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
    };

    /**
     * Insert a to-do list
     */
    window.utils.insertTodoList = function() {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Create to-do list container
            const todoList = document.createElement('div');
            todoList.className = 'todo-list';
            
            // Create a single to-do item
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            todoItem.innerHTML = '<input type="checkbox"> <span contenteditable="true">New task</span>';
            
            // Add event listener for checkbox
            const checkbox = todoItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    this.nextElementSibling.style.textDecoration = 'line-through';
                    this.nextElementSibling.style.opacity = '0.6';
                } else {
                    this.nextElementSibling.style.textDecoration = 'none';
                    this.nextElementSibling.style.opacity = '1';
                }
            });
            
            // Add the item to the list
            todoList.appendChild(todoItem);
            
            // Insert the list
            range.deleteContents();
            range.insertNode(todoList);
            
            // Select the task text for immediate editing
            const taskText = todoItem.querySelector('span');
            const taskRange = document.createRange();
            taskRange.selectNodeContents(taskText);
            selection.removeAllRanges();
            selection.addRange(taskRange);
        }
    };

    /**
     * Insert window at cursor position
     * @param {HTMLElement} windowElement - Window element to insert
     */
    window.utils.insertWindowAtCursor = function(windowElement) {
        // Get the current selection or cursor position
        const selection = window.getSelection();
        let insertPoint;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Create a new range at the selection
            insertPoint = range.startContainer;
            
            // If the selection is in the document body, use that point
            // Otherwise, append to the end of the document body
            if (!document.getElementById('document-body').contains(insertPoint)) {
                insertPoint = document.getElementById('document-body');
                insertPoint.appendChild(document.createElement('div')); // Add placeholder
                insertPoint = insertPoint.lastChild;
            }
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            windowElement.style.width = docBodyWidth + 'px';
            
            // Insert it inline at the cursor position
            if (insertPoint.nodeType === 3) { // Text node
                const parentNode = insertPoint.parentNode;
                const textContent = insertPoint.textContent;
                const offset = range.startOffset;
                
                // Split the text node if needed
                if (offset > 0 && offset < textContent.length) {
                    const afterText = textContent.substring(offset);
                    insertPoint.textContent = textContent.substring(0, offset);
                    
                    const afterNode = document.createTextNode(afterText);
                    parentNode.insertBefore(windowElement, insertPoint.nextSibling);
                    parentNode.insertBefore(afterNode, windowElement.nextSibling);
                } else if (offset === 0) {
                    parentNode.insertBefore(windowElement, insertPoint);
                } else {
                    parentNode.insertBefore(windowElement, insertPoint.nextSibling);
                }
            } else { // Element node
                insertPoint.appendChild(windowElement);
            }
        } else {
            // If no selection, append to the end of the document body
            const docBody = document.getElementById('document-body');
            
            // Make sure width matches the document body
            const docBodyWidth = document.querySelector('.body-area').offsetWidth;
            windowElement.style.width = docBodyWidth + 'px';
            
            // Append to the document body
            docBody.appendChild(windowElement);
        }
    };

    /**
     * Create a loading indicator
     * @returns {HTMLElement} - Loading indicator element
     */
    window.utils.createLoadingIndicator = function() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-status">Processing...</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        `;
        
        return loadingDiv;
    };

    /**
     * Update progress indicator
     * @param {HTMLElement} indicator - Loading indicator element
     * @param {Object} progress - Progress information
     */
    window.utils.updateProgressIndicator = function(indicator, progress) {
        if (!indicator) return;
        
        const statusElement = indicator.querySelector('.loading-status');
        const progressBar = indicator.querySelector('.progress-bar');
        
        if (!statusElement || !progressBar) return;
        
        // Update progress bar width
        progressBar.style.width = `${progress.progress}%`;
        
        // Update status text
        if (progress.status) {
            statusElement.textContent = progress.status;
        }
        
        // Handle error state
        if (progress.error) {
            indicator.classList.add('error');
        }
    };

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} fileName - File name
     * @param {string} contentType - Content type
     */
    window.utils.downloadFile = function(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    };

    /**
     * Show notification popup
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {Array} actions - Array of action objects with label and callback
     */
    window.utils.showNotification = function(title, message, actions = []) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'clipboard-notification';
        
        // Add title and message
        let notificationHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-text">${message}</div>
        `;
        
        // Add actions if any
        if (actions.length > 0) {
            notificationHTML += '<div class="notification-actions">';
            actions.forEach((action, index) => {
                notificationHTML += `<button data-action-index="${index}">${action.label}</button>`;
            });
            notificationHTML += '</div>';
        }
        
        notification.innerHTML = notificationHTML;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Add event listeners for actions
        if (actions.length > 0) {
            notification.querySelectorAll('.notification-actions button').forEach(button => {
                button.addEventListener('click', function() {
                    const actionIndex = parseInt(this.getAttribute('data-action-index'));
                    if (actions[actionIndex] && typeof actions[actionIndex].callback === 'function') {
                        actions[actionIndex].callback();
                    }
                    // Remove notification
                    notification.remove();
                });
            });
        }
        
        // Auto-remove after 5 seconds if no actions
        if (actions.length === 0) {
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    };

    /**
     * Create element with text and attributes
     * @param {string} tag - Element tag name
     * @param {string} text - Text content
     * @param {Object} attributes - Attributes to set
     * @returns {HTMLElement} - Created element
     */
    window.utils.createElement = function(tag, text, attributes = {}) {
        const element = document.createElement(tag);
        
        if (text) {
            element.textContent = text;
        }
        
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        
        return element;
    };

    /**
     * Format date to readable string
     * @param {Date} date - Date to format
     * @returns {string} - Formatted date string
     */
    window.utils.formatDate = function(date) {
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
    };

    /**
     * Generate unique ID
     * @returns {string} - Unique ID
     */
    window.utils.generateUniqueId = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    };

    /**
     * Toggle fullscreen mode for a container
     * @param {HTMLElement} container - Container element
     * @param {HTMLElement} button - Button element that triggered fullscreen
     */
    window.utils.toggleFullscreen = function(container, button) {
        const isAlreadyFullscreen = container.classList.contains('is-fullscreen');
        
        if (!isAlreadyFullscreen) {
            // Save the current position
            container.dataset.originalParent = container.parentNode.id || '';
            container.dataset.originalNextSibling = container.nextSibling ? container.nextSibling.id || '' : 'none';
            
            // Move to body and make fullscreen
            document.body.appendChild(container);
            container.classList.add('is-fullscreen');
            button.textContent = 'Exit Fullscreen';
            
            // Update the SVG height for better viewing if it exists
            const svg = container.querySelector('svg');
            if (svg) {
                svg.style.height = 'calc(100vh - 80px)';
            }
        } else {
            // Remove fullscreen
            container.classList.remove('is-fullscreen');
            button.textContent = 'Full Screen';
            
            // Reset SVG height if it exists
            const svg = container.querySelector('svg');
            if (svg) {
                svg.style.height = '400px';
            }
            
            // Return to original position if possible
            const docBody = document.getElementById('document-body');
            if (docBody) {
                docBody.appendChild(container);
            }
        }
    };

    /**
     * Extract text content from HTML
     * @param {string} html - HTML string
     * @returns {string} - Plain text content
     */
    window.utils.extractTextFromHtml = function(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    };
})();