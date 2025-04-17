/**
 * PDF Processor Module
 * Handles PDF extraction and document structure analysis
 */

// Store processed document data
const processedDocuments = new Map();

/**
 * Utility: Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Utility: Read file as plain text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Generate key themes from extracted concepts
 */
function generateThemesFromConcepts(concepts, text) {
    return concepts.filter(c => c.frequency >= 3).slice(0, 5).map(c => ({
        name: `Theme: ${c.term}`,
        description: c.context,
        children: []
    }));
}

/**
 * Generate basic insights from document content
 */
function generateInsightsFromContent(extractedContent) {
    const insights = [];
    if (extractedContent.combinedText.length > 10000) {
        insights.push({
            name: "Lengthy Document",
            description: "This document contains a large amount of text, suggesting it's comprehensive.",
            children: []
        });
    }
    const hasSections = extractedContent.files.some(file => file.sections && file.sections.length > 5);
    if (hasSections) {
        insights.push({
            name: "Structured Content",
            description: "Detected multiple sections, which suggests a well-organized document.",
            children: []
        });
    }
    return insights;
}


/**
 * Utility: Read file as ArrayBuffer
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Utility: Read file as plain text
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}


/**
 * Main function to process uploaded document files
 * @param {File[]}

/**
 * Extract text from PDF document
 * @param {File} file - PDF file to process
 * @returns {Promise<Object>} - Extracted content with text, sections and metadata
 */
async function extractTextFromPDF(file) {
    try {
        // Load PDF.js dynamically if not available
        if (typeof pdfjsLib === 'undefined') {
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
        
        // Extract text from each page with enhanced section detection
        const numPages = pdfDocument.numPages;
        let fullText = '';
        const sections = [];
        const fontSizes = {};
        
        // First pass - collect font size information across all pages to identify headings
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            
            // Collect font sizes and styles
            content.items.forEach(item => {
                const fontSize = item.transform[0]; // The first element of transform is horizontal scaling
                if (fontSize > 0) {
                    fontSizes[fontSize] = (fontSizes[fontSize] || 0) + 1;
                }
            });
        }
        
        // Calculate font size thresholds for headings
        const fontSizeEntries = Object.entries(fontSizes).map(([size, count]) => ({
            size: parseFloat(size),
            count: count
        }));
        
        // Sort by size (descending)
        fontSizeEntries.sort((a, b) => b.size - a.size);
        
        // Get common font sizes, assuming larger sizes are headings
        const headingFontSizes = new Set();
        let totalItems = 0;
        fontSizeEntries.forEach(entry => totalItems += entry.count);
        
        let cumulativeCount = 0;
        for (const entry of fontSizeEntries) {
            cumulativeCount += entry.count;
            headingFontSizes.add(entry.size);
            
            // If we've covered more than 15% of items, stop - assume rest are body text
            if (cumulativeCount / totalItems > 0.15) {
                break;
            }
        }
        
        // Calculate the most common font size (body text)
        let mostCommonFontSize = 0;
        let maxCount = 0;
        for (const [size, count] of Object.entries(fontSizes)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonFontSize = parseFloat(size);
            }
        }
        
        // Second pass - extract text and sections
        let currentSection = null;
        
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            let pageText = '';
            let lineTexts = [];
            let currentY = null;
            let currentLineText = '';
            
            // Group text items by line (similar y-position)
            for (let j = 0; j < content.items.length; j++) {
                const item = content.items[j];
                const text = item.str;
                const fontSize = item.transform[0];
                const y = item.transform[5]; // y-position
                
                // Add to page text
                pageText += text + ' ';
                
                // Group by line
                if (currentY === null || Math.abs(y - currentY) > 5) {
                    if (currentLineText.trim()) {
                        lineTexts.push({
                            text: currentLineText.trim(),
                            fontSize: fontSize,
                            y: currentY
                        });
                    }
                    currentLineText = text;
                    currentY = y;
                } else {
                    currentLineText += ' ' + text;
                }
            }
            
            // Add the last line
            if (currentLineText.trim()) {
                lineTexts.push({
                    text: currentLineText.trim(),
                    fontSize: mostCommonFontSize, // Default
                    y: currentY
                });
            }
            
            // Process lines to identify sections
            for (let j = 0; j < lineTexts.length; j++) {
                const line = lineTexts[j];
                const text = line.text;
                const fontSize = line.fontSize;
                
                // Check if this could be a heading
                const isHeading = headingFontSizes.has(fontSize) && 
                                  fontSize > mostCommonFontSize * 1.1 && 
                                  text.length < 100 && // Not too long
                                  !/^(page|[0-9]+)$/i.test(text.trim()); // Not just "Page" or a number
                
                if (isHeading) {
                    // Complete previous section if any
                    if (currentSection && currentSection.content.trim()) {
                        sections.push(currentSection);
                    }
                    
                    // Start new section
                    currentSection = {
                        title: text.trim(),
                        content: '',
                        page: i
                    };
                } else if (currentSection) {
                    // Add to current section content
                    currentSection.content += text + ' ';
                } else {
                    // No section yet, create an untitled one
                    currentSection = {
                        title: `Page ${i} Content`,
                        content: text + ' ',
                        page: i
                    };
                }
            }
            
            // Add page text to full text
            fullText += `[Page ${i}]\n${pageText.trim()}\n\n`;
        }
        
        // Add final section
        if (currentSection && currentSection.content.trim()) {
            sections.push(currentSection);
        }
        
        // If no sections detected, create sections based on pages
        if (sections.length === 0) {
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                
                sections.push({
                    title: `Page ${i}`,
                    content: pageText,
                    page: i
                });
            }
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
 * Extract text from Word document
 * @param {File} file - Word document file
 * @returns {Promise<Object>} - Extracted content
 */
async function extractTextFromWord(file) {
    try {
        // Read file as array buffer
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // Use mammoth to extract content
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        // Basic section detection (by headings)
        const sections = [];
        const paragraphs = text.split(/\n\n+/);
        
        let currentSection = null;
        let currentContent = '';
        
        paragraphs.forEach(paragraph => {
            // Simple heuristic: lines with few words and ending with no punctuation
            // are likely headings
            const isHeading = paragraph.trim().length < 100 && 
                             !paragraph.trim().match(/[.,:;?!]$/) &&
                             paragraph.split(/\s+/).length < 10;
            
            if (isHeading) {
                // Save previous section if exists
                if (currentSection && currentContent.trim()) {
                    sections.push({
                        title: currentSection,
                        content: currentContent.trim(),
                        page: null
                    });
                }
                
                // Start new section
                currentSection = paragraph.trim();
                currentContent = '';
            } else {
                // Add to current section
                currentContent += paragraph + '\n\n';
            }
        });
        
        // Add final section
        if (currentSection && currentContent.trim()) {
            sections.push({
                title: currentSection,
                content: currentContent.trim(),
                page: null
            });
        }
        
        // If no sections found, create one with the file name
        if (sections.length === 0 && text.trim()) {
            sections.push({
                title: file.name,
                content: text,
                page: null
            });
        }
        
        return {
            text: text,
            sections: sections,
            metadata: { type: 'word' }
        };
        
    } catch (error) {
        console.error("Error extracting Word document content:", error);
        return {
            text: `Error extracting content: ${error.message}`,
            sections: [],
            metadata: { error: error.message }
        };
    }
}

/**
 * Organize extracted concepts into categories
 * @param {Array} concepts - Array of concept objects
 * @returns {Array} - Hierarchical tree-friendly category objects
 */
function organizeConcepts(concepts) {
    // Define categories
    const categories = [
        {
            name: "Key Terms",
            description: "Important terminology used in the document",
            children: concepts.filter(c => c.type === 'term').slice(0, 10).map(c => ({
                name: c.term,
                description: c.context,
                children: []
            }))
        },
        {
            name: "Important Phrases",
            description: "Significant multi-word expressions in the document",
            children: concepts.filter(c => c.type === 'phrase').slice(0, 8).map(c => ({
                name: c.term,
                description: c.context,
                children: []
            }))
        },
        {
            name: "Named Entities",
            description: "Named people, organizations, or dates mentioned",
            children: concepts.filter(c => c.type === 'person' || c.type === 'organization' || c.type === 'date').map(c => ({
                name: c.term,
                description: c.context,
                children: []
            }))
        }
    ];

    return categories;
}

/**
 * Generate dynamic tree from content
 * @param {Object} extractedContent - Extracted content from files
 * @param {String} customStructure - Optional custom structure
 * @param {String} model - AI model to use
 * @returns {Object} - Tree data structure
 */
function generateDynamicTree(extractedContent, customStructure, model) {
    // Start with base tree
    const baseTree = {
        name: `Document Analysis`,
        description: "Comprehensive analysis of document content and structure",
        children: []
    };
    
    // Update name based on first file
    if (extractedContent.files.length > 0) {
        const fileName = extractedContent.files[0].name;
        baseTree.name = `Analysis of ${fileName}`;
        baseTree.description = `Analysis of ${fileName} content, structure, and key concepts`;
    }
    
    // Add model name prefix for Gemini
    if (model === 'gemini') {
        baseTree.name = `Gemini ${baseTree.name}`;
    }
    
    // Add document structure as the first major branch
    const documentStructureNode = {
        name: "Document Structure",
        description: "Analysis of the document's overall organization and sections",
        children: []
    };
    
    // Process each file for document structure
    extractedContent.files.forEach((file, fileIndex) => {
        // Add file as a node under Document Structure
        const fileNode = {
            name: file.name,
            description: `Content extracted from ${file.name}`,
            children: []
        };
        
        // Process sections to create hierarchy
        if (file.sections && file.sections.length > 0) {
            // Organize sections into a logical hierarchy
            const organizedSections = organizeFileStructure(file);
            fileNode.children = organizedSections;
        } else {
            // If no sections, split text into chunks
            const textChunks = splitTextIntoChunks(file.text, 1500); // 1500 chars per chunk
            textChunks.forEach((chunk, chunkIndex) => {
                if (chunkIndex < 10) { // Limit to 10 chunks per file for rendering performance
                    fileNode.children.push({
                        name: `Part ${chunkIndex + 1}`,
                        description: chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''),
                        children: []
                    });
                }
            });
        }
        
        documentStructureNode.children.push(fileNode);
    });
    
    baseTree.children.push(documentStructureNode);
    
    // Add key concepts section
    const keyConceptsNode = {
        name: "Key Concepts",
        description: "Important ideas, terminology, and entities found in the document",
        children: []
    };
    
    // Extract key concepts using enhanced NLP techniques
    const concepts = extractKeyConceptsAdvanced(extractedContent.combinedText);
    
    // Organize concepts by categories
    const conceptCategories = organizeConcepts(concepts);
    conceptCategories.forEach(category => keyConceptsNode.children.push(category));
    
    baseTree.children.push(keyConceptsNode);
    
    // Add analysis section
    baseTree.children.push({
        name: "Analysis",
        description: "Critical evaluation and synthesis of document content",
        children: [
            {
                name: "Key Themes",
                description: "Major themes identified in the document",
                children: generateThemesFromConcepts(concepts, extractedContent.combinedText)
            },
            {
                name: "Insights",
                description: "Important discoveries and implications",
                children: generateInsightsFromContent(extractedContent)
            }
        ]
    });
    
    // Add model-specific insights
    if (model === 'gemini') {
        baseTree.children.push({
            name: "Gemini Insights",
            description: "Advanced analysis from Gemini",
            children: [
                {
                    name: "Advanced Analysis",
                    description: "Deeper insights from Gemini's capabilities",
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
                    name: "Content Improvement",
                    description: "Suggestions for improving the document",
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
 * Extract key concepts with advanced NLP techniques
 * @param {String} text - Text to analyze
 * @returns {Array} - Array of extracted concepts
 */
function extractKeyConceptsAdvanced(text) {
    if (!text) return [];
    
    // Simple NLP for concept extraction (in a real app, use a proper NLP library)
    const concepts = [];
    
    // 1. Extract frequent terms
    const wordFrequency = {};
    const cleanText = text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s'-]/g, ' ');
    
    const words = cleanText.split(/\s+/);
    
    // Remove common stop words
    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
        'for', 'with', 'by', 'is', 'are', 'was', 'were', 'of', 'from',
        'this', 'that', 'these', 'those', 'it', 'its', 'has', 'have',
        'had', 'be', 'been', 'being', 'do', 'does', 'did', 'will', 'would',
        'shall', 'should', 'can', 'could', 'may', 'might', 'must'
    ]);
    
    words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    });
    
    // Get top terms
    const topTerms = Object.keys(wordFrequency)
        .filter(word => wordFrequency[word] >= 3) // Appear at least 3 times
        .sort((a, b) => wordFrequency[b] - wordFrequency[a])
        .slice(0, 15); // Top 15
    
    // 2. Extract multi-word phrases (simple bigram analysis)
    const phrases = extractPhrases(text);
    
    // 3. Extract named entities (simplified simulation)
    const entities = extractNamedEntities(text);
    
    // Add frequent terms to concepts
    topTerms.forEach(term => {
        // Find a sentence containing the term
        const regex = new RegExp(`[^.!?]*\\b${term}\\b[^.!?]*[.!?]`, 'i');
        const match = text.match(regex);
        
        const context = match ? match[0].trim() : `Term appears ${wordFrequency[term]} times in the document`;
        
        concepts.push({
            term: term.charAt(0).toUpperCase() + term.slice(1), // Capitalize first letter
            type: 'term',
            frequency: wordFrequency[term],
            context: context
        });
    });
    
    // Add phrases and entities
    concepts.push(...phrases);
    concepts.push(...entities);
    
    return concepts;
}

/**
 * Organize file structure into a logical hierarchy
 * @param {Object} file - File object with sections
 * @returns {Array} - Organized sections for tree
 */
function organizeFileStructure(file) {
    if (!file.sections || file.sections.length === 0) {
        return [];
    }
    
    // Organize by pages first
    const pageMap = {};
    
    file.sections.forEach(section => {
        const page = section.page || 'unknown';
        if (!pageMap[page]) {
            pageMap[page] = [];
        }
        pageMap[page].push(section);
    });
    
    // Convert to hierarchy
    const result = [];
    
    // Sort pages numerically
    const sortedPages = Object.keys(pageMap).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });
    
    sortedPages.forEach(page => {
        const sections = pageMap[page];
        
        // If multiple sections on a page, group them
        if (sections.length > 1) {
            const pageNode = {
                name: page === 'unknown' ? 'Unnamed Section' : `Page ${page}`,
                description: `Content from ${page === 'unknown' ? 'this section' : `page ${page}`}`,
                children: sections.map(section => ({
                    name: section.title,
                    description: section.content.substring(0, 200) + (section.content.length > 200 ? '...' : ''),
                    children: []
                }))
            };
            result.push(pageNode);
        } else if (sections.length === 1) {
            // Single section, add directly
            result.push({
                name: sections[0].title,
                description: sections[0].content.substring(0, 200) + (sections[0].content.length > 200 ? '...' : ''),
                children: []
            });
        }
    });
    
    return result;
}

/**
 * Extract important phrases from text
 * @param {String} text - Text to analyze
 * @returns {Array} - Array of extracted phrases
 */
function extractPhrases(text) {
    if (!text) return [];
    
    const phrases = [];
    const cleanText = text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s'-]/g, ' ');
    
    // Split into words
    const words = cleanText.split(/\s+/);
    
    // Stop words to filter out
    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
        'for', 'with', 'by', 'is', 'are', 'was', 'were', 'of', 'from'
    ]);
    
    // Find bigrams (pairs of words)
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i];
        const w2 = words[i + 1];
        
        // Both words should be meaningful (not stop words and not too short)
        if (w1.length > 3 && w2.length > 3 && !stopWords.has(w1) && !stopWords.has(w2)) {
            const bigram = `${w1} ${w2}`;
            bigrams.push(bigram);
        }
    }
    
    // Count frequency
    const bigramFrequency = {};
    bigrams.forEach(bigram => {
        bigramFrequency[bigram] = (bigramFrequency[bigram] || 0) + 1;
    });
    
    // Get top bigrams
    const topBigrams = Object.keys(bigramFrequency)
        .filter(bigram => bigramFrequency[bigram] >= 2) // Appear at least twice
        .sort((a, b) => bigramFrequency[b] - bigramFrequency[a])
        .slice(0, 8); // Top 8
    
    // Find context for each bigram
    topBigrams.forEach(bigram => {
        // Find a sentence containing the bigram
        const escapedBigram = bigram.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\}');
        const regex = new RegExp(`[^.!?]*${escapedBigram}[^.!?]*[.!?]`, 'i');
        const match = text.match(regex);
        
        const context = match ? match[0].trim() : `Phrase appears ${bigramFrequency[bigram]} times in the document`;
        
        // Format the bigram with proper capitalization
        const formattedBigram = bigram.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        phrases.push({
            term: formattedBigram,
            type: 'phrase',
            frequency: bigramFrequency[bigram],
            context: context
        });
    });
    
    return phrases;
}

/**
 * Extract named entities (simplified)
 * @param {String} text - Text to analyze
 * @returns {Array} - Array of extracted entities
 */
function extractNamedEntities(text) {
    const entities = [];
    
    // Simple patterns for entity detection
    const patterns = [
        // Person names (simplified pattern)
        {
            pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
            type: 'person'
        },
        // Organizations (uppercase words)
        {
            pattern: /\b([A-Z][a-z]* ){2,}(Inc\.|Corp\.|LLC|Ltd\.)\b/g,
            type: 'organization'
        },
        // Dates (simplified)
        {
            pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|rd|th)?, \d{4}\b/g,
            type: 'date'
        }
    ];
    
    // Find entities
    patterns.forEach(({pattern, type}) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const entity = match[0];
            
            // Find context (simplified)
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(text.length, match.index + entity.length + 50);
            const context = text.substring(contextStart, contextEnd).trim();
            
            entities.push({
                term: entity,
                type: type,
                context: context
            });
        }
    });
    
    return entities;
} /**
* Processes uploaded document files and generates a tree structure.
* 
* @param {File[]} files - Array of uploaded files.
* @param {String} model - AI model to use ('openai' or 'gemini').
* @param {String} customStructure - Optional custom structure for the tree.
* @param {Function} progressCallback - Optional function to report progress.
* @returns {Promise<Object>} - Processing result including tree data.
*/
async function processDocuments(files, model = 'openai', customStructure = '', progressCallback = null) {

    if (!files || files.length === 0) {
        throw new Error("No files provided for processing");
    }
    
    // Unique ID for this tree
    const treeId = generateUniqueId();
    
    // Create result object
    const result = {
        treeId: treeId,
        files: files.map(f => f.name),
        treeData: null,
        fileContents: { files: [] }
    };
    
    try {
        // Update progress
        if (progressCallback) {
            progressCallback({ status: 'extracting', progress: 10 });
        }
        
        // Extract text and structure from all files
        const extractedContent = { 
            files: [],
            combinedText: ''
        };
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Update progress
            if (progressCallback) {
                progressCallback({ 
                    status: 'extracting', 
                    file: file.name,
                    progress: 10 + (i / files.length) * 40
                });
            }
            
            // Extract text based on file type
            let fileContent;
            
            if (file.type === 'application/pdf') {
                fileContent = await extractTextFromPDF(file);
            } else if (file.type === 'application/msword' || 
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                fileContent = await extractTextFromWord(file);
            } else {
                fileContent = await readFileAsText(file);
                // Create basic structure for text files
                fileContent = {
                    text: fileContent,
                    sections: [{ 
                        title: file.name, 
                        content: fileContent,
                        page: null
                    }],
                    metadata: {}
                };
            }
            
            // Add to extracted content
            extractedContent.files.push({
                name: file.name,
                text: fileContent.text,
                sections: fileContent.sections,
                metadata: fileContent.metadata || {}
            });
            
            // Add to combined text
            extractedContent.combinedText += fileContent.text + "\n\n";
        }
        
        // Update progress
        if (progressCallback) {
            progressCallback({ status: 'analyzing', model: model, progress: 50 });
        }
        
        // Generate tree structure from content
        result.treeData = generateDynamicTree(extractedContent, customStructure, model);
        result.fileContents = extractedContent;
        
        // Final progress update
        if (progressCallback) {
            progressCallback({ status: 'complete', progress: 100 });
        }
        
        // Store the result for later retrieval
        processedDocuments.set(treeId, result);
        
        return result;
        
    } catch (error) {
        // Update progress with error
        if (progressCallback) {
            progressCallback({ status: 'error', message: error.message, progress: 0 });
        }
        throw error;
    }
}

window.pdfProcessor = {
    processDocuments: async function(files, model, customStructure, progressCallback) {
        const processedFiles = [];
        let combinedText = '';

        for (const file of files) {
            let result;

            if (file.name.toLowerCase().endsWith('.pdf')) {
                result = await extractTextFromPDF(file);
            } else if (file.name.toLowerCase().endsWith('.docx')) {
                result = await extractTextFromWord(file);
            } else {
                result = {
                    text: await readFileAsText(file),
                    sections: [],
                    metadata: { type: 'text' }
                };
            }

            result.name = file.name;
            processedFiles.push(result);
            combinedText += result.text + '\n\n';

            if (typeof progressCallback === 'function') {
                progressCallback(processedFiles.length / files.length);
            }
        }

        const extractedContent = {
            files: processedFiles,
            combinedText: combinedText
        };

        const treeData = generateDynamicTree(extractedContent, customStructure, model);
        const treeId = `tree-${Date.now()}`;

        // Cache the tree data for future use
        processedDocuments.set(treeId, {
            treeId: treeId,
            treeData: treeData,
            files: files.map(f => f.name),
            extracted: extractedContent
        });

        return {
            treeId: treeId,
            treeData: treeData,
            files: processedFiles
        };
    },

    /**
 * Enhanced D3 Tree Visualization Implementation
 * This function should be added to the pdfProcessor object in pdf-processor.js
 * to replace the existing placeholder function
 */

// Replace the existing createD3TreeVisualization function with this one
createD3TreeVisualization: function(svgElement, treeData) {
    // Clear previous content
    d3.select(svgElement).selectAll("*").remove();
    
    // Set up dimensions
    const margin = {top: 50, right: 120, bottom: 50, left: 120};
    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;
    
    // Create the SVG container if it doesn't exist
    const svg = d3.select(svgElement)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create a tooltip
    const tooltip = d3.select("body").selectAll(".d3-tooltip").data([0])
        .enter()
        .append("div")
        .attr("class", "d3-tooltip")
        .style("visibility", "hidden");
    
    // Create a tree layout
    const treeLayout = d3.tree().size([height, width]);
    
    // Create a hierarchical structure from the data
    const root = d3.hierarchy(treeData);
    
    // Apply the tree layout to the hierarchy
    treeLayout(root);
    
    // Add links
    svg.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );
    
    // Add nodes
    const nodes = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", function(event, d) {
            // Handle node selection and show details panel
            handleNodeSelection(this, d, svgElement);
        })
        .on("mouseover", function(event, d) {
            // Show tooltip
            tooltip
                .style("visibility", "visible")
                .html(`<strong>${d.data.name}</strong><br/>${d.data.description || ""}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("visibility", "hidden");
        });
    
    // Add circles to nodes
    nodes.append("circle")
        .attr("r", 5)
        .attr("class", d => {
            if (d.depth === 0) return "root";
            if (!d.children) return "leaf";
            return "internal";
        });
    
    // Add text labels to nodes
    nodes.append("text")
        .attr("dy", ".31em")
        .attr("x", d => d.children ? -8 : 8)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .each(function(d) {
            // Truncate long text
            const textElement = d3.select(this);
            const text = textElement.text();
            if (text.length > 30) {
                textElement.text(text.substring(0, 27) + "...");
            }
        });
    
    // Center the tree
    svg.attr("transform", `translate(${margin.left},${margin.top})`);
    
    /**
     * Handle node selection and show details panel
     * @param {HTMLElement} nodeElement - The DOM element for the selected node
     * @param {Object} nodeData - The D3 node data
     * @param {HTMLElement} svgElement - The SVG element containing the tree
     */
    function handleNodeSelection(nodeElement, nodeData, svgElement) {
        // Deselect previously selected node
        d3.select(svgElement).selectAll(".node").classed("selected", false);
        
        // Select this node
        d3.select(nodeElement).classed("selected", true);
        
        // Show node details panel
        showNodeDetails(nodeData.data);
    }
    
    /**
     * Show node details in the details panel
     * @param {Object} nodeData - The data for the selected node
     */
    function showNodeDetails(nodeData) {
        // Get the details panel
        const detailsPanel = document.getElementById('node-details-panel');
        
        if (!detailsPanel) {
            // Create the panel if it doesn't exist
            createNodeDetailsPanel(nodeData);
        } else {
            // Update the existing panel
            updateNodeDetailsPanel(detailsPanel, nodeData);
        }
    }
    
    /**
     * Create node details panel if it doesn't exist
     * @param {Object} nodeData - The data for the selected node
     */
    function createNodeDetailsPanel(nodeData) {
        // Create a new panel
        const panel = document.createElement('div');
        panel.id = 'node-details-panel';
        panel.className = 'node-details-panel';
        panel.style.display = 'flex';
        
        // Add content
        panel.innerHTML = `
            <div class="node-details-header">
                <h3>${nodeData.name}</h3>
                <button class="close-details-btn">&times;</button>
            </div>
            <div class="node-details-content">
                <div class="tabs">
                    <button class="tab-btn active" data-tab="overview">Overview</button>
                    <button class="tab-btn" data-tab="details">Details</button>
                    <button class="tab-btn" data-tab="related">Related</button>
                </div>
                
                <div id="overview-tab" class="tab-panel active">
                    <p>${nodeData.description || "No description available."}</p>
                    <div id="node-source">
                        <p>Source content will appear here if available.</p>
                    </div>
                </div>
                
                <div id="details-tab" class="tab-panel">
                    <h4>Node Properties:</h4>
                    <ul>
                        <li><strong>Type:</strong> ${nodeData.children && nodeData.children.length > 0 ? "Branch" : "Leaf"}</li>
                        <li><strong>Children:</strong> ${nodeData.children ? nodeData.children.length : 0}</li>
                    </ul>
                </div>
                
                <div id="related-tab" class="tab-panel">
                    <h4>Related Concepts:</h4>
                    <ul id="related-concepts">
                        ${nodeData.children && nodeData.children.length > 0 ? 
                          nodeData.children.map(child => `<li>${child.name}</li>`).join('') : 
                          "<li>No related concepts available.</li>"}
                    </ul>
                    <div id="further-reading">
                        <h4>Further Reading:</h4>
                        <p>Suggestions will appear here if available.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(panel);
        
        // Add event listeners
        panel.querySelector('.close-details-btn').addEventListener('click', function() {
            panel.style.display = 'none';
            // Deselect node in visualization
            d3.select(svgElement).selectAll(".node").classed("selected", false);
        });
        
        // Tab functionality
        panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all tabs
                panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab panels
                panel.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                // Show selected tab panel
                const tabId = this.getAttribute('data-tab') + '-tab';
                panel.querySelector('#' + tabId).classList.add('active');
            });
        });
    }
    
    /**
     * Update existing node details panel
     * @param {HTMLElement} panel - The details panel element
     * @param {Object} nodeData - The data for the selected node
     */
    function updateNodeDetailsPanel(panel, nodeData) {
        // Show the panel
        panel.style.display = 'flex';
        
        // Update header
        panel.querySelector('.node-details-header h3').textContent = nodeData.name;
        
        // Update overview tab
        panel.querySelector('#overview-tab p').textContent = nodeData.description || "No description available.";
        
        // Update details tab
        const nodeType = nodeData.children && nodeData.children.length > 0 ? "Branch" : "Leaf";
        const childrenCount = nodeData.children ? nodeData.children.length : 0;
        
        const detailsList = panel.querySelector('#details-tab ul');
        detailsList.innerHTML = `
            <li><strong>Type:</strong> ${nodeType}</li>
            <li><strong>Children:</strong> ${childrenCount}</li>
        `;
        
        // Update related tab
        const relatedList = panel.querySelector('#related-concepts');
        
        if (nodeData.children && nodeData.children.length > 0) {
            relatedList.innerHTML = nodeData.children.map(child => 
                `<li>${child.name}</li>`
            ).join('');
        } else {
            relatedList.innerHTML = "<li>No related concepts available.</li>";
        }
    }
    
    // Function to collapseNode
    function collapseNode(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapseNode);
            d.children = null;
        }
    }
    
    // Function to expandNode
    function expandNode(d) {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
    }
    
    // Collapse all nodes beyond depth 1 initially
    root.descendants().forEach(d => {
        if (d.depth > 1) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            }
        }
    });
},

/**
 * Export tree visualization as SVG
 * @param {String} treeId - Tree identifier
 * @returns {String} - SVG content as string
 */
exportTreeAsSVG: function(treeId) {
    const treeData = this.getStoredTree(treeId);
    if (!treeData) return null;
    
    // Create a temporary SVG
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.setAttribute("width", "1200");
    tempSvg.setAttribute("height", "800");
    
    // Generate the tree visualization in the temporary SVG
    this.createD3TreeVisualization(tempSvg, treeData.treeData);
    
    // Add inline CSS to ensure styles are included
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
    .node circle {
        fill: #557ba1;
        stroke: #233749;
        stroke-width: 1.5px;
    }
    .node text {
        font: 12px sans-serif;
        fill: #333;
    }
    .node.selected circle {
        fill: #233749;
        r: 8;
    }
    .link {
        fill: none;
        stroke: #ccc;
        stroke-width: 1.5px;
    }
    `;
    tempSvg.insertBefore(style, tempSvg.firstChild);
    
    // Serialize the SVG
    const svgData = new XMLSerializer().serializeToString(tempSvg);
    
    return svgData;
},

    exportTreeAsJSON: function(treeId) {
        const treeData = processedDocuments.get(treeId);
        return treeData ? JSON.stringify(treeData.treeData, null, 2) : null;
    },

    exportTreeAsMarkdown: function(treeId) {
        const treeData = processedDocuments.get(treeId);
        if (!treeData) return null;

        function renderNode(node, depth = 0) {
            const prefix = '#'.repeat(depth + 1);
            let md = `${prefix} ${node.name}\n\n${node.description || ''}\n\n`;
            (node.children || []).forEach(child => {
                md += renderNode(child, depth + 1);
            });
            return md;
        }

        return renderNode(treeData.treeData);
    },

    getStoredTree: function(treeId) {
        return processedDocuments.get(treeId);
    }
};
