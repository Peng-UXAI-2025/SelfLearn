/**
 * API Service for the Web Notebook application
 * Handles all API interactions, file processing, and data storage
 */

// Store API keys (in a real app, these would be secured server-side)
// These placeholders would be replaced with actual keys in a production environment
const API_KEYS = {
    openai: 'your-openai-api-key',
    gemini: 'your-gemini-api-key'
};

// Store generated trees and their related data
const treeStorage = {
    // Format: { id: { treeData: {...}, files: [...], model: 'openai', timestamp: Date, structure: '...' } }
};

// API endpoints
const API_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
};

/**
 * Process documents with the selected AI model
 * @param {Array} files - Array of File objects
 * @param {String} model - Model identifier ('openai' or 'gemini')
 * @param {String} customStructure - Optional custom structure guidance
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function processDocuments(files, model, customStructure = '', progressCallback = null) {
    try {
        // Update progress
        if (progressCallback) progressCallback({ status: 'extracting', progress: 10 });
        
        // Extract text from documents
        const textContents = await extractTextFromFiles(files, progressCallback);
        
        // Update progress
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 40 });
        
        // Process with selected model
        let treeData;
        
        if (model === 'openai') {
            treeData = await processWithOpenAI(textContents, customStructure, progressCallback);
        } else if (model === 'gemini') {
            treeData = await processWithGemini(textContents, customStructure, progressCallback);
        } else {
            throw new Error('Invalid model selected');
        }
        
        // Store the result with a unique ID
        const treeId = generateUniqueId();
        treeStorage[treeId] = {
            treeData: treeData,
            files: files.map(f => f.name),
            model: model,
            timestamp: new Date(),
            structure: customStructure
        };
        
        // Update progress
        if (progressCallback) progressCallback({ status: 'complete', progress: 100 });
        
        return {
            treeId: treeId,
            treeData: treeData
        };
    } catch (error) {
        console.error('Error processing documents:', error);
        if (progressCallback) progressCallback({ status: 'error', message: error.message });
        throw error;
    }
}

/**
 * Extract text content from files
 * @param {Array} files - Array of File objects
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<String>} - Extracted text content
 */
async function extractTextFromFiles(files, progressCallback) {
    // Combine text from all files
    let allText = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileText;
        
        // Update progress
        if (progressCallback) {
            const extractionProgress = 10 + (i / files.length) * 25; // 10-35% progress during extraction
            progressCallback({ status: 'extracting', progress: extractionProgress, file: file.name });
        }
        
        // Extract text based on file type
        if (file.type === 'application/pdf') {
            fileText = await extractTextFromPDF(file);
        } else if (file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            fileText = await extractTextFromDOC(file);
        } else {
            throw new Error('Unsupported file type: ' + file.type);
        }
        
        allText += `\n--- FILE: ${file.name} ---\n\n${fileText}\n\n`;
    }
    
    return allText;
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<String>} - Extracted text
 */
async function extractTextFromPDF(file) {
    // In a real implementation, this would use a PDF parsing library
    // For example, pdf.js or a server-side PDF parser
    
    // For this prototype, we'll simulate PDF parsing
    return new Promise((resolve) => {
        // Simulate processing delay
        setTimeout(() => {
            resolve(`Simulated text extraction from PDF file: ${file.name}\n
Content simulated for demonstration purposes.
This would contain the actual extracted text from the PDF file.
Multiple pages and sections would be properly extracted and formatted.`);
        }, 500);
    });
}

/**
 * Extract text from DOC/DOCX file
 * @param {File} file - DOC file
 * @returns {Promise<String>} - Extracted text
 */
async function extractTextFromDOC(file) {
    // In a real implementation, this would use a DOCX parsing library
    // For example, mammoth.js or a server-side Word parser
    
    // For this prototype, we'll simulate Word document parsing
    return new Promise((resolve) => {
        // Simulate processing delay
        setTimeout(() => {
            resolve(`Simulated text extraction from Word document: ${file.name}\n
Content simulated for demonstration purposes.
This would contain the actual extracted text from the Word document.
Formatting, tables, and structure would be properly preserved.`);
        }, 500);
    });
}

/**
 * Process text with OpenAI API
 * @param {String} textContent - Extracted text content
 * @param {String} customStructure - Optional custom structure guidance
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function processWithOpenAI(textContent, customStructure, progressCallback) {
    try {
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 50, model: 'OpenAI' });
        
        // Prepare the prompt
        const prompt = createOpenAIPrompt(textContent, customStructure);
        
        // In a real implementation, this would make an actual API call
        // For this prototype, we'll simulate the API response
        
        // For demonstration, return simulated tree data
        // In reality, this would be the parsed response from OpenAI
        return await simulateAPIResponse('openai', progressCallback);
    } catch (error) {
        console.error('Error processing with OpenAI:', error);
        throw new Error('Failed to process with OpenAI: ' + error.message);
    }
}

/**
 * Process text with Gemini API
 * @param {String} textContent - Extracted text content
 * @param {String} customStructure - Optional custom structure guidance
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function processWithGemini(textContent, customStructure, progressCallback) {
    try {
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 50, model: 'Gemini' });
        
        // Prepare the prompt
        const prompt = createGeminiPrompt(textContent, customStructure);
        
        // In a real implementation, this would make an actual API call
        // For this prototype, we'll simulate the API response
        
        // For demonstration, return simulated tree data
        // In reality, this would be the parsed response from Gemini
        return await simulateAPIResponse('gemini', progressCallback);
    } catch (error) {
        console.error('Error processing with Gemini:', error);
        throw new Error('Failed to process with Gemini: ' + error.message);
    }
}

/**
 * Create prompt for OpenAI API
 * @param {String} textContent - Document text content
 * @param {String} customStructure - Custom structure guidance
 * @returns {Object} - Formatted prompt for OpenAI
 */
function createOpenAIPrompt(textContent, customStructure) {
    // Prepare system message
    const systemMessage = `You are an expert document analyzer that creates hierarchical knowledge trees from documents. 
Extract the main topics, subtopics, and key information from the provided document text.`;
    
    // Prepare user message
    let userMessage = `Analyze the following document text and create a hierarchical knowledge tree structure that captures its organization and content:

${textContent}`;
    
    // Add custom structure if provided
    if (customStructure && customStructure.trim()) {
        userMessage += `\n\nPlease try to follow this structure as a guide (but adapt it as needed to best fit the actual content):
${customStructure}`;
    }
    
    userMessage += `\n\nStructure your response as a JSON object with the following format:
{
  "name": "Document Title",
  "children": [
    {
      "name": "Main Topic 1",
      "children": [
        {
          "name": "Subtopic 1.1",
          "children": []
        },
        {
          "name": "Subtopic 1.2",
          "children": []
        }
      ]
    },
    {
      "name": "Main Topic 2",
      "children": []
    }
  ]
}

Ensure the tree accurately reflects the document's structure and content. Include all significant topics and subtopics.`;
    
    // Return formatted messages
    return {
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
        ]
    };
}

/**
 * Create prompt for Gemini API
 * @param {String} textContent - Document text content
 * @param {String} customStructure - Custom structure guidance
 * @returns {Object} - Formatted prompt for Gemini
 */
function createGeminiPrompt(textContent, customStructure) {
    // Similar to OpenAI but formatted for Gemini's API
    let prompt = `As an expert document analyzer, create a hierarchical knowledge tree from this document text. 

${textContent}`;
    
    // Add custom structure if provided
    if (customStructure && customStructure.trim()) {
        prompt += `\n\nPlease try to follow this structure as a guide (but adapt it as needed to best fit the actual content):
${customStructure}`;
    }
    
    prompt += `\n\nStructure your response as a JSON object with the following format:
{
  "name": "Document Title",
  "children": [
    {
      "name": "Main Topic 1",
      "children": [
        {
          "name": "Subtopic 1.1",
          "children": []
        },
        {
          "name": "Subtopic 1.2",
          "children": []
        }
      ]
    },
    {
      "name": "Main Topic 2",
      "children": []
    }
  ]
}

Ensure the tree accurately reflects the document's structure and content. Include all significant topics and subtopics.
Respond with ONLY the JSON, no other text before or after it.`;
    
    return {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };
}

/**
 * Simulate API response for demonstration
 * @param {String} model - Model identifier
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function simulateAPIResponse(model, progressCallback) {
    // Update progress
    if (progressCallback) progressCallback({ status: 'processing', progress: 70, model: model });
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update progress again
    if (progressCallback) progressCallback({ status: 'finalizing', progress: 90, model: model });
    
    // Generate a slightly different tree based on the model
    let baseTree = {
        name: "Document Structure",
        children: [
            {
                name: "Introduction",
                children: [
                    {
                        name: "Background",
                        children: []
                    },
                    {
                        name: "Research Questions",
                        children: []
                    }
                ]
            },
            {
                name: "Methodology",
                children: [
                    {
                        name: "Data Collection",
                        children: [
                            {
                                name: "Surveys",
                                children: []
                            },
                            {
                                name: "Interviews",
                                children: []
                            }
                        ]
                    },
                    {
                        name: "Analysis Techniques",
                        children: []
                    }
                ]
            },
            {
                name: "Results",
                children: [
                    {
                        name: "Key Findings",
                        children: []
                    },
                    {
                        name: "Statistical Analysis",
                        children: []
                    }
                ]
            },
            {
                name: "Discussion",
                children: [
                    {
                        name: "Implications",
                        children: []
                    },
                    {
                        name: "Limitations",
                        children: []
                    }
                ]
            },
            {
                name: "Conclusion",
                children: []
            }
        ]
    };
    
    // Add some model-specific variations
    if (model === 'gemini') {
        baseTree.name = "Document Analysis by Gemini";
        // Add an extra node for Gemini
        baseTree.children.push({
            name: "Future Work",
            children: [
                {
                    name: "Proposed Extensions",
                    children: []
                }
            ]
        });
    } else {
        baseTree.name = "Document Analysis by OpenAI";
        // Add an extra level for OpenAI
        baseTree.children[2].children[0].children = [
            {
                name: "Primary Results",
                children: []
            },
            {
                name: "Secondary Observations",
                children: []
            }
        ];
    }
    
    // Simulate more processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return baseTree;
}

/**
 * Generate a unique ID for storing tree data
 * @returns {String} - Unique ID
 */
function generateUniqueId() {
    return 'tree_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get a previously generated tree by ID
 * @param {String} treeId - Tree identifier
 * @returns {Object|null} - Tree data or null if not found
 */
function getStoredTree(treeId) {
    return treeStorage[treeId] || null;
}

/**
 * Get all stored trees
 * @returns {Object} - Object containing all stored trees
 */
function getAllStoredTrees() {
    return treeStorage;
}

/**
 * Delete a stored tree
 * @param {String} treeId - Tree identifier
 * @returns {Boolean} - Success status
 */
function deleteStoredTree(treeId) {
    if (treeStorage[treeId]) {
        delete treeStorage[treeId];
        return true;
    }
    return false;
}

/**
 * Export a tree as JSON
 * @param {String} treeId - Tree identifier
 * @returns {String} - JSON string or null if not found
 */
function exportTreeAsJSON(treeId) {
    const tree = treeStorage[treeId];
    if (tree) {
        return JSON.stringify(tree.treeData, null, 2);
    }
    return null;
}

/**
 * Export a tree as Markdown
 * @param {String} treeId - Tree identifier
 * @returns {String} - Markdown string or null if not found
 */
function exportTreeAsMarkdown(treeId) {
    const tree = treeStorage[treeId];
    if (!tree) return null;
    
    let markdown = `# ${tree.treeData.name}\n\n`;
    
    // Recursive function to add nodes to markdown
    function addNodeToMarkdown(node, level) {
        let result = '';
        
        // Add children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                // Add heading based on level
                result += `${'#'.repeat(level + 1)} ${child.name}\n\n`;
                
                // Add children recursively
                result += addNodeToMarkdown(child, level + 1);
            });
        }
        
        return result;
    }
    
    markdown += addNodeToMarkdown(tree.treeData, 1);
    
    // Add metadata
    markdown += `---\n\n`;
    markdown += `Generated on: ${tree.timestamp.toLocaleString()}\n`;
    markdown += `Model: ${tree.model === 'openai' ? 'OpenAI' : 'Google Gemini'}\n`;
    markdown += `Files: ${tree.files.join(', ')}\n`;
    
    return markdown;
}

// Export functions for external use
window.docAPI = {
    processDocuments,
    getStoredTree,
    getAllStoredTrees,
    deleteStoredTree,
    exportTreeAsJSON,
    exportTreeAsMarkdown
};