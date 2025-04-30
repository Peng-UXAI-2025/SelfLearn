/**
 * AI Processor Module
 * Handles AI processing of content for the Copilot functionality
 */

// Initialize namespace
window.WebNotebook = window.WebNotebook || {};
WebNotebook.Copilot = WebNotebook.Copilot || {};
WebNotebook.Copilot.AIProcessor = (function() {
    // Private variables
    let processingQueue = [];
    let isProcessing = false;
    
    /**
     * Initialize the AI processor
     */
    function initialize() {
        console.log('AI Processor initialized');
        
        // Set up event listeners for process buttons
        setupProcessButtons();
    }
    
    /**
     * Set up process buttons event listeners
     */
    function setupProcessButtons() {
        const processButtons = document.querySelectorAll('.process-btn');
        
        processButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const capturedText = document.getElementById('captured-text');
                
                if (capturedText && capturedText.textContent.trim()) {
                    if (action === 'custom') {
                        const customPrompt = document.getElementById('custom-prompt');
                        if (customPrompt) {
                            processContent(capturedText.textContent, 'custom', customPrompt.value);
                        } else {
                            processContent(capturedText.textContent, 'custom', '');
                        }
                    } else {
                        processContent(capturedText.textContent, action);
                    }
                } else {
                    alert('No content captured yet. Copy some text first or enter it manually.');
                }
            });
        });
    }
    
    /**
     * Analyze content and suggest processing options
     * @param {string} content - The content to analyze
     */
    function analyzeContent(content) {
        // In a real implementation, this would send the content to an AI API
        // for analysis and suggestion of processing options
        
        // For now, we'll simulate the analysis with a basic approach
        const contentLength = content.length;
        const hasBulletPoints = content.includes('•') || content.includes('-') || content.includes('*');
        const hasQuestions = content.includes('?');
        
        // Update suggestions based on content characteristics
        const summarizeBtn = document.querySelector('.process-btn[data-action="summarize"]');
        const qaBtn = document.querySelector('.process-btn[data-action="qa"]');
        
        if (summarizeBtn) {
            if (contentLength > 200) {
                summarizeBtn.textContent = 'Summarize into Key Points';
                summarizeBtn.style.display = 'block';
            } else {
                summarizeBtn.textContent = 'Extract Key Concepts';
                summarizeBtn.style.display = 'block';
            }
        }
        
        if (qaBtn) {
            if (hasQuestions) {
                qaBtn.textContent = 'Extract Q&A Pairs';
                qaBtn.style.display = 'block';
            } else if (contentLength > 150) {
                qaBtn.textContent = 'Convert to Q&A Format';
                qaBtn.style.display = 'block';
            } else {
                qaBtn.textContent = 'Generate Questions from Content';
                qaBtn.style.display = 'block';
            }
        }
    }
    
    /**
     * Process content with a specific action
     * @param {string} content - The content to process
     * @param {string} action - The action to perform ('summarize', 'qa', 'insert', 'custom')
     * @param {string} [customPrompt] - Optional custom prompt for 'custom' action
     */
    function processContent(content, action, customPrompt = '') {
        // Add to processing queue
        processingQueue.push({
            content,
            action,
            customPrompt,
            timestamp: new Date().toISOString()
        });
        
        // Start processing if not already in progress
        if (!isProcessing) {
            processNextInQueue();
        }
    }
    
    /**
     * Process the next item in the queue
     */
    function processNextInQueue() {
        if (processingQueue.length === 0) {
            isProcessing = false;
            return;
        }
        
        isProcessing = true;
        const item = processingQueue.shift();
        
        // Show processing indicator
        showProcessingIndicator();
        
        // In a real implementation, this would call an AI API
        // For now, we'll simulate the processing with timeouts and predefined responses
        setTimeout(() => {
            const result = simulateAIProcessing(item.content, item.action, item.customPrompt);
            
            // Hide processing indicator
            hideProcessingIndicator();
            
            // Display the result
            displayProcessingResult(result, item);
            
            // Process next item if any
            if (processingQueue.length > 0) {
                processNextInQueue();
            } else {
                isProcessing = false;
            }
            
            // Add to history
            if (WebNotebook.Copilot.HistoryTracker && WebNotebook.Copilot.HistoryTracker.addHistoryItem) {
                WebNotebook.Copilot.HistoryTracker.addHistoryItem({
                    type: 'process',
                    action: item.action,
                    content: item.content,
                    result: result,
                    timestamp: new Date().toISOString()
                });
            }
        }, 1500); // Simulate processing time
    }
    
    /**
     * Simulate AI processing of content
     * @param {string} content - The content to process
     * @param {string} action - The action to perform
     * @param {string} customPrompt - Custom prompt (for 'custom' action)
     * @returns {Object} - The processing result
     */
    function simulateAIProcessing(content, action, customPrompt) {
        // In a real implementation, this would call an AI API
        // For now, we'll return simulated results based on the action
        
        const contentWords = content.split(/\s+/).filter(w => w.length > 0);
        const contentSentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
        
        let result = {
            action,
            originalContent: content,
            processedContent: ''
        };
        
        switch (action) {
            case 'summarize':
                // Generate a simulated summary
                if (contentSentences.length <= 3) {
                    result.processedContent = `Key points:\n- ${contentSentences.join('\n- ')}`;
                } else {
                    const selectedSentences = [];
                    // Select first, middle, and last sentences for a simple summary
                    selectedSentences.push(contentSentences[0]);
                    if (contentSentences.length > 2) {
                        selectedSentences.push(contentSentences[Math.floor(contentSentences.length / 2)]);
                    }
                    selectedSentences.push(contentSentences[contentSentences.length - 1]);
                    
                    result.processedContent = `Key points:\n- ${selectedSentences.join('\n- ')}`;
                }
                break;
                
            case 'qa':
                // Generate simulated Q&A pairs
                result.processedContent = generateQAPairs(content);
                break;
                
            case 'insert':
                // This would normally prepare the content for insertion into the knowledge tree
                result.processedContent = `New Knowledge Node:\n\n${content}`;
                result.nodeType = 'knowledge';
                result.nodeName = content.split(/[.!?]/)[0].substring(0, 40) + (content.split(/[.!?]/)[0].length > 40 ? '...' : '');
                break;
                
            case 'custom':
                // Process with custom prompt
                result.processedContent = `Processed with custom prompt: "${customPrompt}"\n\n${content}`;
                break;
                
            default:
                result.processedContent = content;
        }
        
        return result;
    }
    
    /**
     * Generate Q&A pairs from content
     * @param {string} content - The content to convert to Q&A format
     * @returns {string} - Q&A formatted content
     */
    function generateQAPairs(content) {
        const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
        let qaPairs = '';
        
        // Check if the content already has questions
        const questionSentences = sentences.filter(s => s.trim().includes('?'));
        
        if (questionSentences.length > 0) {
            // Extract existing questions and create answers
            questionSentences.forEach(question => {
                const answer = generateSimpleAnswer(question);
                qaPairs += `Q: ${question.trim()}?\nA: ${answer}\n\n`;
            });
        } else {
            // Generate questions from content
            for (let i = 0; i < Math.min(sentences.length, 3); i++) {
                const question = generateQuestionFromSentence(sentences[i]);
                qaPairs += `Q: ${question}\nA: ${sentences[i].trim()}\n\n`;
            }
        }
        
        return qaPairs;
    }
    
    /**
     * Generate a question from a sentence
     * @param {string} sentence - The sentence to generate a question from
     * @returns {string} - A question
     */
    function generateQuestionFromSentence(sentence) {
        sentence = sentence.trim();
        // Simple approach: identify key entities and create a 'what/how/why' question
        if (sentence.toLowerCase().includes('is ')) {
            return `What ${sentence.substring(sentence.toLowerCase().indexOf('is '))}?`;
        } else if (sentence.toLowerCase().includes('are ')) {
            return `What ${sentence.substring(sentence.toLowerCase().indexOf('are '))}?`;
        } else if (sentence.toLowerCase().includes('was ')) {
            return `What ${sentence.substring(sentence.toLowerCase().indexOf('was '))}?`;
        } else if (sentence.toLowerCase().includes('were ')) {
            return `What ${sentence.substring(sentence.toLowerCase().indexOf('were '))}?`;
        } else {
            // Generic question based on the first few words
            const words = sentence.split(' ');
            if (words.length >= 3) {
                return `What is the significance of ${words.slice(0, 3).join(' ')}?`;
            } else {
                return `Can you explain more about ${sentence}?`;
            }
        }
    }
    
    /**
     * Generate a simple answer from a question
     * @param {string} question - The question to generate an answer for
     * @returns {string} - A simulated answer
     */
    function generateSimpleAnswer(question) {
        // Simple approach: extract key terms and create a basic answer
        const questionWords = question.toLowerCase().split(' ');
        
        // Remove question words and punctuation
        const keyTerms = questionWords.filter(w => 
            !['what', 'why', 'how', 'when', 'where', 'who', 'which', 'is', 'are', 'was', 'were', '?'].includes(w.toLowerCase())
        );
        
        if (keyTerms.length > 0) {
            // Use the last few terms to craft an answer
            const terms = keyTerms.slice(Math.max(0, keyTerms.length - 3));
            return `This relates to ${terms.join(' ')} as mentioned in the passage.`;
        } else {
            return `This is addressed in the content provided.`;
        }
    }
    
    /**
     * Show a processing indicator
     */
    function showProcessingIndicator() {
        // Check if there's already an indicator
        let indicator = document.querySelector('.processing-indicator');
        
        if (!indicator) {
            // Create the indicator
            indicator = document.createElement('div');
            indicator.className = 'processing-indicator';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-status">Processing content with AI...</div>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
            `;
            
            // Add to the copilot body
            const copilotBody = document.querySelector('.copilot-body');
            if (copilotBody) {
                copilotBody.appendChild(indicator);
            }
            
            // Animate progress bar
            setTimeout(() => {
                const progressBar = indicator.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '30%';
                    
                    setTimeout(() => {
                        progressBar.style.width = '60%';
                    }, 500);
                }
            }, 100);
        }
    }
    
    /**
     * Hide the processing indicator
     */
    function hideProcessingIndicator() {
        const indicator = document.querySelector('.processing-indicator');
        if (indicator) {
            // Complete the progress bar animation
            const progressBar = indicator.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            // Remove after a short delay
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 500);
        }
    }
    
    /**
     * Display the processing result
     * @param {Object} result - The processing result
     * @param {Object} item - The processing item
     */
    function displayProcessingResult(result, item) {
        // Remove any existing result display
        const existingResult = document.querySelector('.processing-result');
        if (existingResult) {
            existingResult.parentNode.removeChild(existingResult);
        }
        
        // Create result display
        const resultDisplay = document.createElement('div');
        resultDisplay.className = 'processing-result';
        
        // Add title based on action
        let title = '';
        switch (result.action) {
            case 'summarize':
                title = 'Content Summary';
                break;
            case 'qa':
                title = 'Q&A Format';
                break;
            case 'insert':
                title = 'Knowledge Node';
                break;
            case 'custom':
                title = 'Custom Processing';
                break;
            default:
                title = 'Processing Result';
        }
        
        // Format the processed content - preserve line breaks
        const formattedContent = result.processedContent.replace(/\n/g, '<br>');
        
        resultDisplay.innerHTML = `
            <button class="close-result">&times;</button>
            <h4>${title}</h4>
            <div class="result-content">${formattedContent}</div>
            <div class="result-actions">
                ${result.action === 'insert' ? `
                    <button class="insert-node-btn">Add to Knowledge Tree</button>
                ` : ''}
                <button class="copy-result-btn">Copy to Clipboard</button>
                <button class="save-result-btn">Save as Note</button>
            </div>
        `;
        
        // Add to the copilot body
        const copilotBody = document.querySelector('.copilot-body');
        if (copilotBody) {
            copilotBody.appendChild(resultDisplay);
        }
        
        // Setup event listeners for result actions
        setupResultActions(resultDisplay, result);
    }
    
    /**
     * Set up event listeners for result action buttons
     * @param {Element} resultDisplay - The result display element
     * @param {Object} result - The processing result
     */
    function setupResultActions(resultDisplay, result) {
        // Close button
        const closeBtn = resultDisplay.querySelector('.close-result');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                resultDisplay.parentNode.removeChild(resultDisplay);
            });
        }
        
        // Copy to clipboard button
        const copyBtn = resultDisplay.querySelector('.copy-result-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                // Use the Clipboard API
                navigator.clipboard.writeText(result.processedContent).then(() => {
                    // Show success feedback
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = 'Copy to Clipboard';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    
                    // Fallback method
                    const textArea = document.createElement('textarea');
                    textArea.value = result.processedContent;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    // Show success feedback
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = 'Copy to Clipboard';
                    }, 2000);
                });
            });
        }
        
        // Save as note button
        const saveBtn = resultDisplay.querySelector('.save-result-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                // Create a new file/note with the processed content
                const nodeName = result.action === 'insert' ? result.nodeName : generateNodeName(result);
                const nodeType = result.action === 'insert' ? result.nodeType : 'file';
                
                // Get the selected node (as potential parent)
                if (WebNotebook.Interface && WebNotebook.Interface.FileManager) {
                    const selectedNode = WebNotebook.Interface.FileManager.getSelectedNode();
                    
                    // Create the new node
                    const newNodeId = WebNotebook.Interface.FileManager.createNode(
                        nodeName,
                        nodeType,
                        selectedNode
                    );
                    
                    // Show feedback
                    this.textContent = 'Saved!';
                    setTimeout(() => {
                        this.textContent = 'Save as Note';
                        // Close the result display
                        resultDisplay.parentNode.removeChild(resultDisplay);
                    }, 1500);
                } else {
                    alert('File Manager not available');
                }
            });
        }
        
        // Insert to knowledge tree button (for 'insert' action)
        const insertBtn = resultDisplay.querySelector('.insert-node-btn');
        if (insertBtn) {
            insertBtn.addEventListener('click', function() {
                if (WebNotebook.Interface && WebNotebook.Interface.FileManager) {
                    // Get the knowledge tree root or current node
                    const selectedNode = WebNotebook.Interface.FileManager.getSelectedNode();
                    
                    // Create a new knowledge node
                    const newNodeId = WebNotebook.Interface.FileManager.createNode(
                        result.nodeName,
                        'knowledge',
                        selectedNode
                    );
                    
                    // Show feedback
                    this.textContent = 'Added!';
                    setTimeout(() => {
                        this.textContent = 'Add to Knowledge Tree';
                        // Close the result display
                        resultDisplay.parentNode.removeChild(resultDisplay);
                    }, 1500);
                } else {
                    alert('File Manager not available');
                }
            });
        }
    }
    
    /**
     * Generate a node name based on the processing result
     * @param {Object} result - The processing result
     * @returns {string} - A generated node name
     */
    function generateNodeName(result) {
        let prefix = '';
        
        switch (result.action) {
            case 'summarize':
                prefix = 'Summary: ';
                break;
            case 'qa':
                prefix = 'Q&A: ';
                break;
            case 'custom':
                prefix = 'Note: ';
                break;
            default:
                prefix = 'Note: ';
        }
        
        // Extract first line or sentence for the name
        const content = result.processedContent;
        const firstLine = content.split('\n')[0];
        
        if (firstLine.length > 40) {
            return prefix + firstLine.substring(0, 40) + '...';
        } else {
            return prefix + firstLine;
        }
    }
    
    /**
     * Process content with a custom prompt
     * @param {string} content - The content to process
     * @param {string} prompt - The custom prompt
     */
    function processWithCustomPrompt(content, prompt) {
        if (!content || !prompt) return;
        
        processContent(content, 'custom', prompt);
    }
    
    // Public API
    return {
        initialize,
        analyzeContent,
        processContent,
        processWithCustomPrompt,
        displayProcessingResult
    };
})();