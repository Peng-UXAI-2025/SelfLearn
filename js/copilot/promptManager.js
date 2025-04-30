/**
 * Prompt Manager Module
 * Handles AI prompt management for the Copilot functionality
 */

WebNotebook.Copilot = WebNotebook.Copilot || {};
WebNotebook.Copilot.PromptManager = (function() {
    // Default prompts for different content types
    const DEFAULT_PROMPTS = {
        summarize: 'Extract the key points from the following content and provide a concise summary:',
        qa: 'Convert the following content into a question and answer format, focusing on the most important information:',
        insert: 'Analyze the following content and identify the main concept, its key attributes, and relationships to other concepts:',
        custom: 'Process the following content:'
    };
    
    // User saved prompts
    let savedPrompts = [];
    
    /**
     * Initialize the prompt manager
     */
    function initialize() {
        console.log('Prompt Manager initialized');
        
        // Load saved prompts from storage
        loadSavedPrompts();
        
        // Set up the custom prompt textarea with default text
        setupCustomPromptField();
        
        // Set up prompt template buttons
        setupPromptTemplates();
    }
    
    /**
     * Set up the custom prompt field with default text and event handling
     */
    function setupCustomPromptField() {
        const customPromptField = document.getElementById('custom-prompt');
        if (!customPromptField) return;
        
        // Set default text
        customPromptField.value = DEFAULT_PROMPTS.custom;
        
        // Add focus handler to clear default text
        customPromptField.addEventListener('focus', function() {
            if (this.value === DEFAULT_PROMPTS.custom) {
                this.value = '';
            }
        });
        
        // Add blur handler to restore default text if empty
        customPromptField.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.value = DEFAULT_PROMPTS.custom;
            }
        });
    }
    
    /**
     * Set up prompt template buttons
     */
    function setupPromptTemplates() {
        // This would add template buttons near the custom prompt field
        // For now, we'll assume there's a container for template buttons
        const templateContainer = document.querySelector('.prompt-templates');
        if (!templateContainer) return;
        
        // Create template buttons for default prompts
        Object.entries(DEFAULT_PROMPTS).forEach(([key, prompt]) => {
            if (key === 'custom') return; // Skip the generic custom prompt
            
            const button = document.createElement('button');
            button.className = 'template-btn';
            button.setAttribute('data-template', key);
            button.textContent = capitalizeFirstLetter(key);
            
            button.addEventListener('click', function() {
                const customPromptField = document.getElementById('custom-prompt');
                if (customPromptField) {
                    customPromptField.value = prompt;
                }
            });
            
            templateContainer.appendChild(button);
        });
        
        // Add saved prompts if any
        savedPrompts.forEach(savedPrompt => {
            addPromptTemplateButton(savedPrompt);
        });
    }
    
    /**
     * Add a prompt template button for a saved prompt
     * @param {Object} savedPrompt - The saved prompt object
     */
    function addPromptTemplateButton(savedPrompt) {
        const templateContainer = document.querySelector('.prompt-templates');
        if (!templateContainer) return;
        
        const button = document.createElement('button');
        button.className = 'template-btn saved-template';
        button.setAttribute('data-template-id', savedPrompt.id);
        button.textContent = savedPrompt.name;
        
        button.addEventListener('click', function() {
            const customPromptField = document.getElementById('custom-prompt');
            if (customPromptField) {
                customPromptField.value = savedPrompt.prompt;
            }
        });
        
        templateContainer.appendChild(button);
    }
    
    /**
     * Save a custom prompt
     * @param {string} name - Name for the saved prompt
     * @param {string} prompt - The prompt text
     * @returns {string} - ID of the saved prompt
     */
    function savePrompt(name, prompt) {
        if (!name || !prompt) return null;
        
        const id = 'prompt_' + Date.now();
        const newPrompt = {
            id,
            name,
            prompt,
            created: new Date().toISOString()
        };
        
        // Add to saved prompts
        savedPrompts.push(newPrompt);
        
        // Save to storage
        saveToStorage();
        
        // Add template button
        addPromptTemplateButton(newPrompt);
        
        return id;
    }
    
    /**
     * Update a saved prompt
     * @param {string} id - ID of the prompt to update
     * @param {Object} updates - Properties to update (name, prompt)
     * @returns {boolean} - True if updated successfully
     */
    function updatePrompt(id, updates) {
        const promptIndex = savedPrompts.findIndex(p => p.id === id);
        if (promptIndex === -1) return false;
        
        // Update prompt
        if (updates.name) {
            savedPrompts[promptIndex].name = updates.name;
        }
        
        if (updates.prompt) {
            savedPrompts[promptIndex].prompt = updates.prompt;
        }
        
        // Save to storage
        saveToStorage();
        
        // Update template button if exists
        const button = document.querySelector(`.template-btn[data-template-id="${id}"]`);
        if (button && updates.name) {
            button.textContent = updates.name;
        }
        
        return true;
    }
    
    /**
     * Delete a saved prompt
     * @param {string} id - ID of the prompt to delete
     * @returns {boolean} - True if deleted successfully
     */
    function deletePrompt(id) {
        const promptIndex = savedPrompts.findIndex(p => p.id === id);
        if (promptIndex === -1) return false;
        
        // Remove from saved prompts
        savedPrompts.splice(promptIndex, 1);
        
        // Save to storage
        saveToStorage();
        
        // Remove template button if exists
        const button = document.querySelector(`.template-btn[data-template-id="${id}"]`);
        if (button) {
            button.parentNode.removeChild(button);
        }
        
        return true;
    }
    
    /**
     * Load saved prompts from storage
     */
    function loadSavedPrompts() {
        const settings = WebNotebook.Utils.Storage.loadSettings();
        
        if (settings.savedPrompts && Array.isArray(settings.savedPrompts)) {
            savedPrompts = settings.savedPrompts;
        }
    }
    
    /**
     * Save prompts to storage
     */
    function saveToStorage() {
        const settings = WebNotebook.Utils.Storage.loadSettings();
        settings.savedPrompts = savedPrompts;
        WebNotebook.Utils.Storage.saveSettings(settings);
    }
    
    /**
     * Get a prompt by action type or ID
     * @param {string} typeOrId - Action type or prompt ID
     * @returns {string} - The prompt text
     */
    function getPrompt(typeOrId) {
        // Check if it's a default prompt
        if (DEFAULT_PROMPTS[typeOrId]) {
            return DEFAULT_PROMPTS[typeOrId];
        }
        
        // Check if it's a saved prompt ID
        const savedPrompt = savedPrompts.find(p => p.id === typeOrId);
        if (savedPrompt) {
            return savedPrompt.prompt;
        }
        
        // Default to generic custom prompt
        return DEFAULT_PROMPTS.custom;
    }
    
    /**
     * Get all saved prompts
     * @returns {Array} - Array of saved prompt objects
     */
    function getSavedPrompts() {
        return [...savedPrompts];
    }
    
    /**
     * Show a dialog to save the current custom prompt
     */
    function showSavePromptDialog() {
        const customPromptField = document.getElementById('custom-prompt');
        if (!customPromptField) return;
        
        const promptText = customPromptField.value.trim();
        if (!promptText || promptText === DEFAULT_PROMPTS.custom) {
            alert('Please enter a custom prompt before saving.');
            return;
        }
        
        const promptName = prompt('Enter a name for this prompt template:');
        if (!promptName) return;
        
        // Save the prompt
        const id = savePrompt(promptName, promptText);
        
        if (id) {
            alert(`Prompt saved as "${promptName}".`);
        }
    }
    
    /**
     * Helper function to capitalize the first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} - Capitalized string
     */
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Public API
    return {
        initialize,
        savePrompt,
        updatePrompt,
        deletePrompt,
        getPrompt,
        getSavedPrompts,
        showSavePromptDialog
    };
})();