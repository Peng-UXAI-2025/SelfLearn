/**
 * Knowledge API Module
 * Handles API calls to AI services for knowledge processing
 */

(function() {
    // Create knowledge API namespace
    window.knowledgeApi = {};
    
    // API endpoints for different models
    const API_ENDPOINTS = {
        'gpt-4o': 'https://api.openai.com/v1/chat/completions',
        'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    };
    
    // API keys (in a real app, these would be securely stored)
    // Initialize with environment variables if available
    let OPENAI_API_KEY = '';
    let GEMINI_API_KEY = '';
    
    // Initialize keys if window.API_KEYS exists
    if (window.API_KEYS) {
        OPENAI_API_KEY = window.API_KEYS.openai || '';
        GEMINI_API_KEY = window.API_KEYS.gemini || '';
        console.log('API keys initialized from env.js');
    }
    
    /**
     * Set API keys
     * @param {Object} keys - Object containing API keys
     */
    window.knowledgeApi.setApiKeys = function(keys) {
        if (keys.openai) OPENAI_API_KEY = keys.openai;
        if (keys.gemini) GEMINI_API_KEY = keys.gemini;
        console.log('API keys set:', 
            keys.openai ? 'OpenAI key provided' : 'No OpenAI key', 
            keys.gemini ? 'Gemini key provided' : 'No Gemini key');
    };
    
    /**
     * Check if API keys are available and prompt if needed
     * @param {string} model - The model being used ('gpt-4o' or 'gemini-2.0-flash')
     * @returns {Promise<boolean>} - Whether keys are available
     */
    window.knowledgeApi.ensureApiKeys = async function(model) {
        // If we're using OpenAI and don't have an API key
        if (model === 'gpt-4o' && !OPENAI_API_KEY) {
            // Try to load from storage first
            const storedKey = window.storage.getItem('openai_api_key');
            if (storedKey) {
                OPENAI_API_KEY = storedKey;
                return true;
            }
            
            // Show error message instead of using prompt()
            window.knowledgeApi.showStatusMessage(
                "OpenAI API key required. Please add your API key in the API Settings.", 
                true
            );
            return false;
        }
        
        // If we're using Gemini and don't have an API key
        if (model === 'gemini-2.0-flash' && !GEMINI_API_KEY) {
            // Try to load from storage first
            const storedKey = window.storage.getItem('gemini_api_key');
            if (storedKey) {
                GEMINI_API_KEY = storedKey;
                return true;
            }
            
            // Show error message instead of using prompt()
            window.knowledgeApi.showStatusMessage(
                "Gemini API key required. Please add your API key in the API Settings.", 
                true
            );
            return false;
        }
        
        return true;
    };
    
    /**
     * Show status message
     * @param {string} message - Status message
     * @param {boolean} isError - Whether this is an error message
     * @param {HTMLElement} container - Container element (optional)
     */
    window.knowledgeApi.showStatusMessage = function(message, isError = false, container = null) {
        const statusMessage = document.createElement('div');
        statusMessage.className = isError ? 'status-message status-error' : 'status-message status-info';
        statusMessage.textContent = message;
        
        if (container) {
            container.appendChild(statusMessage);
            
            // Auto-hide after 10 seconds for non-error messages
            if (!isError) {
                setTimeout(() => {
                    statusMessage.remove();
                }, 10000);
            }
        } else {
            // Create a floating message if no container specified
            statusMessage.style.position = 'fixed';
            statusMessage.style.top = '20px';
            statusMessage.style.left = '50%';
            statusMessage.style.transform = 'translateX(-50%)';
            statusMessage.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
            statusMessage.style.color = isError ? '#721c24' : '#155724';
            statusMessage.style.padding = '10px 20px';
            statusMessage.style.borderRadius = '4px';
            statusMessage.style.zIndex = '1000';
            statusMessage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            
            document.body.appendChild(statusMessage);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusMessage.remove();
            }, 5000);
        }
    };
    
    /**
     * Call OpenAI API with retry mechanism
     * @param {Array} notes - Array of notes
     * @param {string} structure - Optional custom structure
     * @param {number} retryCount - Current retry count
     * @param {number} maxRetries - Maximum retries
     * @returns {Promise<string>} - API response
     */
    window.knowledgeApi.callOpenAI = async function(notes, structure, retryCount = 0, maxRetries = 3) {
        // Check if we have an API key
        if (!await window.knowledgeApi.ensureApiKeys('gpt-4o')) {
            throw new Error('OpenAI API key is required');
        }
        
        const messages = [
            {
                role: "system",
                content: "You are an expert knowledge organizer, skilled at creating hierarchical structures from fragmented information. Your task is to organize pieces of information into a coherent knowledge tree."
            },
            {
                role: "user",
                content: window.knowledgeApi.formatOpenAIPrompt(notes, structure)
            }
        ];
        
        try {
            const response = await fetch(API_ENDPOINTS['gpt-4o'], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-2024-08-06",
                    messages: messages,
                    max_tokens: 4000
                })
            });
            
            // Handle rate limiting
            if (response.status === 429) {
                if (retryCount < maxRetries) {
                    const retryAfter = response.headers.get('Retry-After') || Math.pow(2, retryCount + 1);
                    const waitTime = parseInt(retryAfter) * 1000;
                    
                    window.knowledgeApi.showStatusMessage(`Rate limited by OpenAI. Retrying in ${waitTime/1000} seconds...`);
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return window.knowledgeApi.callOpenAI(notes, structure, retryCount + 1, maxRetries);
                } else {
                    window.knowledgeApi.showStatusMessage("Maximum retry attempts reached for OpenAI API. Try switching to Gemini model.", true);
                    throw new Error("Rate limit exceeded. Maximum retries reached.");
                }
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
            }
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error("Invalid response format from OpenAI API");
            }
        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            throw error;
        }
    };
    
    /**
     * Call Gemini API with retry mechanism
     * @param {Array} notes - Array of notes
     * @param {string} structure - Optional custom structure
     * @param {number} retryCount - Current retry count
     * @param {number} maxRetries - Maximum retries
     * @returns {Promise<string>} - API response
     */
    window.knowledgeApi.callGemini = async function(notes, structure, retryCount = 0, maxRetries = 3) {
        // Check if we have an API key
        if (!await window.knowledgeApi.ensureApiKeys('gemini-2.0-flash')) {
            throw new Error('Gemini API key is required');
        }
        
        const formattedPrompt = window.knowledgeApi.formatGeminiPrompt(notes, structure);
        
        try {
            const response = await fetch(`${API_ENDPOINTS['gemini-2.0-flash']}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: formattedPrompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 4000
                    }
                })
            });
            
            // Handle rate limiting
            if (response.status === 429) {
                if (retryCount < maxRetries) {
                    const retryAfter = response.headers.get('Retry-After') || Math.pow(2, retryCount + 1);
                    const waitTime = parseInt(retryAfter) * 1000;
                    
                    window.knowledgeApi.showStatusMessage(`Rate limited by Gemini. Retrying in ${waitTime/1000} seconds...`);
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return window.knowledgeApi.callGemini(notes, structure, retryCount + 1, maxRetries);
                } else {
                    window.knowledgeApi.showStatusMessage("Maximum retry attempts reached for Gemini API. Try switching to OpenAI model.", true);
                    throw new Error("Rate limit exceeded. Maximum retries reached.");
                }
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
            }
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response format from Gemini API");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error;
        }
    };
    
    /**
     * Format prompt for OpenAI
     * @param {Array} notes - Array of notes
     * @param {string} structure - Optional custom structure
     * @returns {string} - Formatted prompt
     */
    window.knowledgeApi.formatOpenAIPrompt = function(notes, structure) {
        let prompt = `Create a hierarchical knowledge tree from the following notes and information snippets.\n\n`;
        
        // Add notes
        prompt += `### Notes:\n`;
        notes.forEach((note, index) => {
            prompt += `${index + 1}. ${note}\n`;
        });
        
        // Add structure if provided
        if (structure && structure.trim()) {
            prompt += `\n### Suggested structure (use this as a guide, but feel free to modify):\n${structure}\n`;
        }
        
        prompt += `\n### Instructions:
1. Organize the notes into a coherent hierarchical knowledge tree
2. Create meaningful categories and subcategories
3. Place each note in the appropriate location in the hierarchy
4. Add brief explanations for key concepts
5. Identify connections between different branches

Format your response as JSON with the following structure:
{
  "title": "Main Topic",
  "summary": "Brief overview of the entire knowledge domain",
  "children": [
    {
      "title": "Category 1",
      "summary": "Description of this category",
      "content": "Detailed information including relevant notes",
      "children": [
        {
          "title": "Subcategory 1.1",
          "summary": "Description of this subcategory",
          "content": "Detailed information including relevant notes",
          "children": []
        }
      ]
    }
  ]
}`;
        
        return prompt;
    };
    
    /**
     * Format prompt for Gemini
     * @param {Array} notes - Array of notes
     * @param {string} structure - Optional custom structure
     * @returns {string} - Formatted prompt
     */
    window.knowledgeApi.formatGeminiPrompt = function(notes, structure) {
        let prompt = `You are an expert knowledge organizer. Create a hierarchical knowledge tree from the following notes and information snippets.\n\n`;
        
        // Add notes
        prompt += `### Notes:\n`;
        notes.forEach((note, index) => {
            prompt += `${index + 1}. ${note}\n`;
        });
        
        // Add structure if provided
        if (structure && structure.trim()) {
            prompt += `\n### Suggested structure (use this as a guide, but feel free to modify):\n${structure}\n`;
        }
        
        prompt += `\n### Instructions:
1. Organize the notes into a coherent hierarchical knowledge tree
2. Create meaningful categories and subcategories
3. Place each note in the appropriate location in the hierarchy
4. Add brief explanations for key concepts
5. Identify connections between different branches

Format your response as JSON with the following structure:
{
  "title": "Main Topic",
  "summary": "Brief overview of the entire knowledge domain",
  "children": [
    {
      "title": "Category 1",
      "summary": "Description of this category",
      "content": "Detailed information including relevant notes",
      "children": [
        {
          "title": "Subcategory 1.1",
          "summary": "Description of this subcategory",
          "content": "Detailed information including relevant notes",
          "children": []
        }
      ]
    }
  ]
}

Respond with ONLY the JSON, no other text before or after it.`;
        
        return prompt;
    };
    
    /**
     * Process notes using selected model
     * @param {Array} notes - Array of notes
     * @param {string} structure - Optional custom structure
     * @param {string} model - Selected AI model
     * @returns {Promise<string>} - API response
     */
    window.knowledgeApi.processNotes = async function(notes, structure, model = 'gpt-4o') {
        window.knowledgeApi.showStatusMessage(`Processing with ${model}...`);
        
        try {
            if (model === 'gpt-4o') {
                return await window.knowledgeApi.callOpenAI(notes, structure);
            } else if (model === 'gemini-2.0-flash') {
                return await window.knowledgeApi.callGemini(notes, structure);
            } else {
                throw new Error("Unsupported model selected");
            }
        } catch (error) {
            window.knowledgeApi.showStatusMessage(`Error: ${error.message}`, true);
            throw error;
        }
    };
    
    /**
     * Process clipboard text
     * @param {string} text - Text to process
     * @param {string} action - Processing action
     * @param {string} model - Selected AI model
     * @returns {Promise<string>} - Processed text
     */
    window.knowledgeApi.processClipboardText = async function(text, action, model = 'gpt-4o') {
        if (!text.trim()) {
            throw new Error("No text provided for processing");
        }
        
        // Check if we have an API key
        if (!await window.knowledgeApi.ensureApiKeys(model)) {
            throw new Error(`${model === 'gpt-4o' ? 'OpenAI' : 'Gemini'} API key is required`);
        }
        
        let prompt = '';
        
        switch (action) {
            case 'summarize':
                prompt = `Summarize the following text into a concise set of key points:\n\n${text}`;
                break;
            case 'qa':
                prompt = `Convert the following text into a question and answer format, extracting the most important information:\n\n${text}`;
                break;
            case 'tree-node':
                prompt = `Convert the following text into a knowledge node with a title, summary, and key content:\n\n${text}`;
                break;
            default:
                prompt = `Process the following text: ${text}`;
        }
        
        try {
            let response;
            
            if (model === 'gpt-4o') {
                const messages = [
                    {
                        role: "system",
                        content: "You are an expert at extracting and organizing knowledge from text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ];
                
                const apiResponse = await fetch(API_ENDPOINTS['gpt-4o'], {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-2024-08-06",
                        messages: messages,
                        max_tokens: 2000
                    })
                });
                
                const data = await apiResponse.json();
                
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
                }
                
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    response = data.choices[0].message.content;
                } else {
                    throw new Error("Invalid response format from OpenAI API");
                }
            } else if (model === 'gemini-2.0-flash') {
                const apiResponse = await fetch(`${API_ENDPOINTS['gemini-2.0-flash']}?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 2000
                        }
                    })
                });
                
                const data = await apiResponse.json();
                
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
                }
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    response = data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid response format from Gemini API");
                }
            } else {
                throw new Error("Unsupported model selected");
            }
            
            return response;
        } catch (error) {
            console.error("Error processing clipboard text:", error);
            throw error;
        }
    };
    
    /**
     * Process text with custom prompt
     * @param {string} text - Text to process
     * @param {string} customPrompt - Custom processing prompt
     * @param {string} model - Selected AI model
     * @returns {Promise<string>} - Processed text
     */
    window.knowledgeApi.processTextWithCustomPrompt = async function(text, customPrompt, model = 'gpt-4o') {
        if (!text.trim()) {
            throw new Error("No text provided for processing");
        }
        
        if (!customPrompt.trim()) {
            throw new Error("No custom prompt provided");
        }
        
        // Check if we have an API key
        if (!await window.knowledgeApi.ensureApiKeys(model)) {
            throw new Error(`${model === 'gpt-4o' ? 'OpenAI' : 'Gemini'} API key is required`);
        }
        
        const prompt = `${customPrompt}\n\nText to process:\n\n${text}`;
        
        try {
            let response;
            
            if (model === 'gpt-4o') {
                const messages = [
                    {
                        role: "system",
                        content: "You are an expert at extracting and organizing knowledge from text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ];
                
                const apiResponse = await fetch(API_ENDPOINTS['gpt-4o'], {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-2024-08-06",
                        messages: messages,
                        max_tokens: 2000
                    })
                });
                
                const data = await apiResponse.json();
                
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
                }
                
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    response = data.choices[0].message.content;
                } else {
                    throw new Error("Invalid response format from OpenAI API");
                }
            } else if (model === 'gemini-2.0-flash') {
                const apiResponse = await fetch(`${API_ENDPOINTS['gemini-2.0-flash']}?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 2000
                        }
                    })
                });
                
                const data = await apiResponse.json();
                
                if (data.error) {
                    throw new Error(`API Error: ${data.error.message || "Unknown error"}`);
                }
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    response = data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid response format from Gemini API");
                }
            } else {
                throw new Error("Unsupported model selected");
            }
            
            return response;
        } catch (error) {
            console.error("Error processing text with custom prompt:", error);
            throw error;
        }
    };
    
    // Initialize API keys from storage if available
    document.addEventListener('DOMContentLoaded', function() {
        const openaiKey = window.storage.getItem('openai_api_key');
        const geminiKey = window.storage.getItem('gemini_api_key');
        
        if (openaiKey || geminiKey) {
            window.knowledgeApi.setApiKeys({
                openai: openaiKey,
                gemini: geminiKey
            });
        }
    });
})();