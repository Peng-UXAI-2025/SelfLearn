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

// API token allocation (2000 tokens for each model)
const API_TOKENS = {
    openai: 2000,
    gemini: 2000
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
        
        // Extract text from files
        const extractedContent = await extractTextFromFiles(files, progressCallback);
        
        // Update progress
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 40 });
        
        // Process with selected model
        let treeData;
        
        if (model === 'openai') {
            treeData = await processWithOpenAI(extractedContent, customStructure, progressCallback);
        } else if (model === 'gemini') {
            treeData = await processWithGemini(extractedContent, customStructure, progressCallback);
        } else {
            throw new Error('Invalid model selected');
        }
        
        // Store the result with a unique ID
        const treeId = generateUniqueId();
        treeStorage[treeId] = {
            treeData: treeData,
            files: files.map(f => f.name),
            fileContents: extractedContent,
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
 * @returns {Promise<Object>} - Extracted text content and metadata
 */
async function extractTextFromFiles(files, progressCallback) {
    // Object to store all extracted content
    const extractedContent = {
        combinedText: '',
        files: []
    };
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileContent = {
            name: file.name,
            type: file.type,
            size: file.size,
            text: '',
            sections: [],
            metadata: {}
        };
        
        // Update progress
        if (progressCallback) {
            const extractionProgress = 10 + (i / files.length) * 25; // 10-35% progress during extraction
            progressCallback({ status: 'extracting', progress: extractionProgress, file: file.name });
        }
        
        try {
            // Extract text based on file type
            if (file.type === 'application/pdf') {
                const pdfData = await extractTextFromPDF(file);
                fileContent.text = pdfData.text;
                fileContent.sections = pdfData.sections;
                fileContent.metadata = pdfData.metadata;
            } else if (file.type === 'application/msword' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const docData = await extractTextFromDOC(file);
                fileContent.text = docData.text;
                fileContent.sections = docData.sections;
                fileContent.metadata = docData.metadata;
            } else {
                // For other files, read as plain text
                fileContent.text = await readFileAsText(file);
                fileContent.sections = splitIntoSections(fileContent.text);
            }
            
            // Add to combined text
            extractedContent.combinedText += `\n--- FILE: ${file.name} ---\n\n${fileContent.text}\n\n`;
            extractedContent.files.push(fileContent);
            
        } catch (error) {
            console.error(`Error extracting content from ${file.name}:`, error);
            fileContent.text = `Error extracting content: ${error.message}`;
            extractedContent.files.push(fileContent);
        }
    }
    
    return extractedContent;
}

/**
 * Split text into sections
 * @param {String} text - Text content to split
 * @returns {Array} - Array of sections
 */
function splitIntoSections(text) {
    if (!text) return [];
    
    // Simple section detection based on blank lines and headings
    const lines = text.split('\n');
    const sections = [];
    let currentSection = { title: 'Untitled Section', content: '' };
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Check for potential heading (simple heuristic)
        if (trimmedLine && trimmedLine.length < 100 && 
            (trimmedLine === trimmedLine.toUpperCase() || 
             /^[A-Z][\w\s]+[:.?!]?$/.test(trimmedLine))) {
            
            // Save previous section if it has content
            if (currentSection.content.trim()) {
                sections.push(currentSection);
            }
            
            // Start new section
            currentSection = { title: trimmedLine, content: '' };
        } else {
            // Add to current section
            currentSection.content += line + '\n';
        }
    });
    
    // Add the last section
    if (currentSection.content.trim()) {
        sections.push(currentSection);
    }
    
    return sections;
}

/**
 * Read file as text (fallback method for other file types)
 * @param {File} file - File object
 * @returns {Promise<String>} - File content as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Extract text from PDF file using PDF.js library
 * @param {File} file - PDF file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function extractTextFromPDF(file) {
    try {
        // Load PDF.js dynamically if not available
        if (typeof pdfjsLib === 'undefined') {
            // In a production app, you would include PDF.js in your dependencies
            // For now, we'll load it from a CDN
            await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js');
            
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
        }
        
        // Convert file to ArrayBuffer
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdfDocument = await loadingTask.promise;
        
        // Extract metadata
        const metadata = await pdfDocument.getMetadata();
        
        // Extract text from each page
        const numPages = pdfDocument.numPages;
        let fullText = '';
        const sections = [];
        
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            const pageText = strings.join(' ');
            
            // Add page number as metadata
            fullText += `[Page ${i}]\n${pageText}\n\n`;
            
            // Add as a section
            sections.push({
                title: `Page ${i}`,
                content: pageText
            });
        }
        
        return {
            text: fullText,
            sections: sections,
            metadata: metadata.info || {}
        };
    } catch (error) {
        console.error("Error extracting PDF content:", error);
        
        // Fallback to basic file reading
        return {
            text: await readFileAsText(file),
            sections: [],
            metadata: { error: error.message }
        };
    }
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File object
 * @returns {Promise<ArrayBuffer>} - File content as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Load script dynamically
 * @param {String} url - Script URL
 * @returns {Promise} - Promise that resolves when script is loaded
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Extract text from DOC/DOCX file
 * @param {File} file - DOC file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function extractTextFromDOC(file) {
    try {
        // In a production app, you would use a library like Mammoth.js
        // For now, we'll implement a basic reader with raw text
        
        const text = await readFileAsText(file);
        const sections = splitIntoSections(text);
        
        return {
            text: text,
            sections: sections,
            metadata: { fileName: file.name }
        };
    } catch (error) {
        console.error("Error extracting Word document content:", error);
        
        // Fallback to basic file reading
        return {
            text: await readFileAsText(file),
            sections: [],
            metadata: { error: error.message }
        };
    }
}

/**
 * Process text with OpenAI API
 * @param {Object} extractedContent - Extracted text content and metadata
 * @param {String} customStructure - Optional custom structure guidance
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function processWithOpenAI(extractedContent, customStructure, progressCallback) {
    try {
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 50, model: 'OpenAI' });
        
        // Prepare the prompt
        const prompt = createOpenAIPrompt(extractedContent, customStructure);
        
        // In a real implementation, this would make an actual API call
        // For this prototype, we'll generate a dynamic tree based on the content
        
        if (progressCallback) progressCallback({ status: 'processing', progress: 75, model: 'OpenAI' });
        
        // Generate dynamic tree based on extracted content
        const treeData = generateDynamicTree(extractedContent, customStructure, 'openai');
        
        if (progressCallback) progressCallback({ status: 'finalizing', progress: 90, model: 'OpenAI' });
        
        return treeData;
    } catch (error) {
        console.error('Error processing with OpenAI:', error);
        throw new Error('Failed to process with OpenAI: ' + error.message);
    }
}

/**
 * Process text with Gemini API
 * @param {Object} extractedContent - Extracted text content and metadata
 * @param {String} customStructure - Optional custom structure guidance
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Tree data object
 */
async function processWithGemini(extractedContent, customStructure, progressCallback) {
    try {
        if (progressCallback) progressCallback({ status: 'analyzing', progress: 50, model: 'Gemini' });
        
        // Prepare the prompt
        const prompt = createGeminiPrompt(extractedContent, customStructure);
        
        // In a real implementation, this would make an actual API call
        // For this prototype, we'll generate a dynamic tree based on the content
        
        if (progressCallback) progressCallback({ status: 'processing', progress: 75, model: 'Gemini' });
        
        // Generate dynamic tree based on extracted content
        const treeData = generateDynamicTree(extractedContent, customStructure, 'gemini');
        
        if (progressCallback) progressCallback({ status: 'finalizing', progress: 90, model: 'Gemini' });
        
        return treeData;
    } catch (error) {
        console.error('Error processing with Gemini:', error);
        throw new Error('Failed to process with Gemini: ' + error.message);
    }
}

/**
 * Generate a dynamic tree based on the extracted content
 * @param {Object} extractedContent - Extracted content and metadata
 * @param {String} customStructure - Custom structure guidance
 * @param {String} model - Model identifier ('openai' or 'gemini')
 * @returns {Object} - Tree data object
 */
function generateDynamicTree(extractedContent, customStructure, model) {
    // Start with base tree
    const baseTree = {
        name: `Document Analysis`,
        children: []
    };
    
    // Update name based on first file
    if (extractedContent.files.length > 0) {
        const fileName = extractedContent.files[0].name;
        baseTree.name = `Analysis of ${fileName}`;
    }
    
    // Add model name prefix for Gemini
    if (model === 'gemini') {
        baseTree.name = `Gemini ${baseTree.name}`;
    }
    
    // Add top-level categories based on file content
    const documentStructureNode = {
        name: "Document Structure",
        description: "Analysis of the document's overall organization",
        children: []
    };
    
    const keyConceptsNode = {
        name: "Key Concepts",
        description: "Important ideas and terminology found in the document",
        children: []
    };
    
    // Process each file
    extractedContent.files.forEach((file, fileIndex) => {
        // Add file as a child under Document Structure
        const fileNode = {
            name: file.name,
            description: `Content extracted from ${file.name}`,
            children: []
        };
        
        // Add sections as children
        if (file.sections && file.sections.length > 0) {
            file.sections.forEach((section, sectionIndex) => {
                if (sectionIndex < 10) { // Limit to 10 sections per file for performance
                    fileNode.children.push({
                        name: section.title || `Section ${sectionIndex + 1}`,
                        description: section.content.substring(0, 200) + (section.content.length > 200 ? '...' : ''),
                        children: []
                    });
                }
            });
        } else {
            // If no sections, split text into chunks
            const textChunks = splitTextIntoChunks(file.text, 1000); // ~1000 chars per chunk
            textChunks.forEach((chunk, chunkIndex) => {
                if (chunkIndex < 5) { // Limit to 5 chunks per file
                    fileNode.children.push({
                        name: `Part ${chunkIndex + 1}`,
                        description: chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''),
                        children: []
                    });
                }
            });
        }
        
        documentStructureNode.children.push(fileNode);
        
        // Extract key concepts using basic NLP techniques
        const concepts = extractKeyConcepts(file.text);
        concepts.forEach(concept => {
            if (!keyConceptsNode.children.some(child => child.name === concept.term)) {
                keyConceptsNode.children.push({
                    name: concept.term,
                    description: concept.context,
                    children: []
                });
            }
        });
    });
    
    baseTree.children.push(documentStructureNode);
    baseTree.children.push(keyConceptsNode);
    
    // Add analysis section
    baseTree.children.push({
        name: "Analysis",
        description: "Critical evaluation of the document content",
        children: [
            {
                name: "Key Themes",
                description: "Major themes identified across the documents",
                children: []
            },
            {
                name: "Insights",
                description: "Important discoveries from the analysis",
                children: []
            }
        ]
    });
    
    // Add model-specific section
    if (model === 'gemini') {
        baseTree.children.push({
            name: "Gemini Insights",
            description: "Additional analysis from Gemini",
            children: [
                {
                    name: "Advanced Analysis",
                    description: "Deeper insights generated by Gemini",
                    children: []
                }
            ]
        });
    } else {
        baseTree.children.push({
            name: "OpenAI Recommendations",
            description: "Suggestions based on content analysis",
            children: [
                {
                    name: "Improvement Areas",
                    description: "Potential enhancements to the document",
                    children: []
                }
            ]
        });
    }
    
    // Add custom structure if provided
    if (customStructure && customStructure.trim()) {
        try {
            // Parse custom structure
            const customStructureNode = {
                name: "Custom Organization",
                description: "User-defined structure for the content",
                children: parseCustomStructure(customStructure.split('\n'))
            };
            
            baseTree.children.push(customStructureNode);
        } catch (error) {
            console.warn("Error parsing custom structure:", error);
        }
    }
    
    return baseTree;
}

/**
 * Extract key concepts from text using basic NLP techniques
 * @param {String} text - Document text
 * @returns {Array} - Array of key concepts
 */
function extractKeyConcepts(text) {
    if (!text) return [];
    
    // This is a simplified implementation for demonstration
    // In a real app, you would use a more sophisticated NLP approach
    
    const concepts = [];
    const words = text.split(/\s+/);
    const wordFrequency = {};
    
    // Count word frequency
    words.forEach(word => {
        // Clean the word
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 3) { // Skip short words
            wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
        }
    });
    
    // Find contexts for top words
    const topWords = Object.keys(wordFrequency)
        .filter(word => wordFrequency[word] > 2) // Words used more than twice
        .sort((a, b) => wordFrequency[b] - wordFrequency[a])
        .slice(0, 10); // Top 10 words
    
    topWords.forEach(word => {
        // Find context (simplified)
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]`, 'i');
        const match = text.match(regex);
        const context = match ? match[0].trim() : `Term appears ${wordFrequency[word]} times`;
        
        concepts.push({
            term: word.charAt(0).toUpperCase() + word.slice(1),
            frequency: wordFrequency[word],
            context: context
        });
    });
    
    return concepts;
}

/**
 * Split text into chunks
 * @param {String} text - Text to split
 * @param {Number} chunkSize - Approximate size of each chunk
 * @returns {Array} - Array of text chunks
 */
function splitTextIntoChunks(text, chunkSize = 1000) {
    if (!text) return [];
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);
        
        // Try to end at a sentence boundary
        if (end < text.length) {
            const sentenceEnd = text.substring(start, end + 100).search(/[.!?]\s/);
            if (sentenceEnd > 0) {
                end = start + sentenceEnd + 2;
            }
        }
        
        chunks.push(text.substring(start, end));
        start = end;
    }
    
    return chunks;
}

/**
 * Parse custom structure from text lines
 * @param {Array} lines - Array of text lines
 * @returns {Array} - Structured nodes
 */
function parseCustomStructure(lines) {
    const result = [];
    let lastLevel = 0;
    const stack = [result];
    
    lines.forEach(line => {
        if (!line.trim()) return;
        
        // Count leading spaces/dashes to determine level
        const trimmedLine = line.trimStart();
        const indentLevel = line.length - trimmedLine.length;
        const level = Math.floor(indentLevel / 2);
        
        // Extract the actual text (remove leading dash if present)
        let text = trimmedLine;
        if (text.startsWith('-')) {
            text = text.substring(1).trim();
        }
        
        if (text) {
            // Create node
            const node = {
                name: text,
                description: `User-defined: ${text}`,
                children: []
            };
            
            // Adjust stack if necessary
            if (level > lastLevel) {
                // Deeper level than before
                stack.push(stack[stack.length - 1][stack[stack.length - 1].length - 1].children);
            } else if (level < lastLevel) {
                // Higher level than before
                for (let i = 0; i < lastLevel - level; i++) {
                    stack.pop();
                }
            }
            
            // Add node to the current level
            stack[stack.length - 1].push(node);
            lastLevel = level;
        }
    });
    
    return result;
}

/**
 * Create prompt for OpenAI API
 * @param {Object} extractedContent - Extracted text content and metadata
 * @param {String} customStructure - Custom structure guidance
 * @returns {Object} - Formatted prompt for OpenAI
 */
function createOpenAIPrompt(extractedContent, customStructure) {
    // Prepare system message
    const systemMessage = `You are an expert document analyzer that creates hierarchical knowledge trees from documents. 
Extract the main topics, subtopics, and key information from the provided document text.`;
    
    // Prepare user message
    let userMessage = `Analyze the following document text and create a hierarchical knowledge tree structure that captures its organization and content:

${extractedContent.combinedText.substring(0, 10000)}`;
    
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
      "description": "Description of Main Topic 1",
      "children": [
        {
          "name": "Subtopic 1.1",
          "description": "Description of Subtopic 1.1",
          "children": []
        },
        {
          "name": "Subtopic 1.2",
          "description": "Description of Subtopic 1.2",
          "children": []
        }
      ]
    },
    {
      "name": "Main Topic 2",
      "description": "Description of Main Topic 2",
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
 * @param {Object} extractedContent - Extracted text content and metadata
 * @param {String} customStructure - Custom structure guidance
 * @returns {Object} - Formatted prompt for Gemini
 */
function createGeminiPrompt(extractedContent, customStructure) {
    // Similar to OpenAI but formatted for Gemini's API
    let prompt = `As an expert document analyzer, create a hierarchical knowledge tree from this document text. 

${extractedContent.combinedText.substring(0, 10000)}`;
    
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
      "description": "Description of Main Topic 1",
      "children": [
        {
          "name": "Subtopic 1.1",
          "description": "Description of Subtopic 1.1",
          "children": []
        },
        {
          "name": "Subtopic 1.2",
          "description": "Description of Subtopic 1.2",
          "children": []
        }
      ]
    },
    {
      "name": "Main Topic 2",
      "description": "Description of Main Topic 2",
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
        
        // Add description if available
        if (node.description) {
            result += `${node.description}\n\n`;
        }
        
        // Add children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                // Add heading based on level
                result += `${'#'.repeat(level + 1)} ${child.name}\n\n`;
                
                // Add description if available
                if (child.description) {
                    result += `${child.description}\n\n`;
                }
                
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
    markdown += `Model: ${tree.model === 'openai' ? 'OpenAI GPT-4o' : 'Google Gemini'}\n`;
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
    exportTreeAsMarkdown,
    API_TOKENS // Export token allocation for reference
};