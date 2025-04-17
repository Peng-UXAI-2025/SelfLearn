/**
 * Improved extractTextFromPDF function
 * Enhanced to better detect document structure and sections
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
 * Improved document processing for generating a more comprehensive tree
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
 * Organize file structure into a logical hierarchy
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
 * Extract key concepts with advanced NLP techniques
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
 * Extract important phrases from text
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
        const escapedBigram = bigram.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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
}

/**
 * Organize concepts into categories
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
            description: "People, organizations, dates, and other entities mentioned",
            children: concepts.filter(c => c.type === 'person' || c.type === 'organization' || c.type === 'date')
                .slice(0, 8).map(c => ({
                    name: c.term,
                    description: c.context,
                    children: []
                }))
        }
    ];
    
    // Filter out empty categories
    return categories.filter(category => category.children.length > 0);
}

/**
 * Generate themes from concepts
 */
function generateThemesFromConcepts(concepts, text) {
    // Create groups of related concepts by co-occurrence in the text
    const conceptGroups = findRelatedConcepts(concepts, text);
    
    // Convert to tree nodes
    return conceptGroups.map((group, index) => {
        const themeNode = {
            name: `Theme ${index + 1}: ${group.mainConcept.term}`,
            description: group.mainConcept.context,
            children: []
        };
        
        // Add main concept
        themeNode.children.push({
            name: group.mainConcept.term,
            description: group.mainConcept.context,
            children: []
        });
        
        // Add related concepts
        group.relatedConcepts.forEach(concept => {
            themeNode.children.push({
                name: concept.term,
                description: concept.context,
                children: []
            });
        });
        
        return themeNode;
    });
}

/**
 * Find related concepts based on co-occurrence
 */
function findRelatedConcepts(concepts, text) {
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    // Create co-occurrence matrix
    const coOccurrence = {};
    concepts.forEach(concept1 => {
        const term1 = concept1.term.toLowerCase();
        coOccurrence[term1] = {};
        
        concepts.forEach(concept2 => {
            if (concept1 !== concept2) {
                const term2 = concept2.term.toLowerCase();
                coOccurrence[term1][term2] = 0;
            }
        });
    });
    
    // Count co-occurrences in paragraphs
    paragraphs.forEach(paragraph => {
        const lowerPara = paragraph.toLowerCase();
        
        // Find which concepts appear in this paragraph
        const appearingConcepts = concepts.filter(concept => 
            lowerPara.includes(concept.term.toLowerCase())
        );
        
        // Update co-occurrence for all pairs
        for (let i = 0; i < appearingConcepts.length; i++) {
            for (let j = i + 1; j < appearingConcepts.length; j++) {
                const term1 = appearingConcepts[i].term.toLowerCase();
                const term2 = appearingConcepts[j].term.toLowerCase();
                
                coOccurrence[term1][term2] = (coOccurrence[term1][term2] || 0) + 1;
                coOccurrence[term2][term1] = (coOccurrence[term2][term1] || 0) + 1;
            }
        }
    });
    
    // Create groups of related concepts
    const groups = [];
    const assignedConcepts = new Set();
    
    // Sort concepts by frequency
    const sortedConcepts = [...concepts].sort((a, b) => 
        (b.frequency || 0) - (a.frequency || 0)
    );
    
    // Create at most 5 groups
    for (let i = 0; i < sortedConcepts.length && groups.length < 5; i++) {
        const concept = sortedConcepts[i];
        const term = concept.term.toLowerCase();
        
        // Skip if already assigned
        if (assignedConcepts.has(term)) continue;
        
        // Find related concepts
        const related = [];
        
        if (coOccurrence[term]) {
            const relatedTerms = Object.keys(coOccurrence[term])
                .filter(otherTerm => !assignedConcepts.has(otherTerm) && coOccurrence[term][otherTerm] > 0)
                .sort((a, b) => coOccurrence[term][b] - coOccurrence[term][a])
                .slice(0, 3); // Take top 3 related terms
            
            relatedTerms.forEach(relatedTerm => {
                const relatedConcept = concepts.find(c => c.term.toLowerCase() === relatedTerm);
                if (relatedConcept) {
                    related.push(relatedConcept);
                }
            });
        }
        
        // Create group if we found related concepts
        if (related.length > 0) {
            groups.push({
                mainConcept: concept,
                relatedConcepts: related
            });
            
            // Mark all as assigned
            assignedConcepts.add(term);
            related.forEach(r => assignedConcepts.add(r.term.toLowerCase()));
        }
    }
    
    return groups;
}

/**
 * Generate insights from content
 */
function generateInsightsFromContent(extractedContent) {
    // Basic insights based on content structure
    const insights = [];
    
    // Document length analysis
    const totalChars = extractedContent.combinedText.length;
    const wordCount = extractedContent.combinedText.split(/\s+/).filter(w => w.trim().length > 0).length;
    
    insights.push({
        name: "Document Structure",
        description: `The document contains approximately ${wordCount} words across ${extractedContent.files.length} file(s).`,
        children: []
    });
    
    // Section analysis
    const totalSections = extractedContent.files.reduce((count, file) => 
        count + (file.sections ? file.sections.length : 0), 0);
    
    if (totalSections > 0) {
        insights.push({
            name: "Content Organization",
            description: `The document is organized into ${totalSections} distinct sections.`,
            children: []
        });
    }
    
    // Add generic insights
    insights.push({
        name: "Key Questions Addressed",
        description: "Based on the content, this document addresses several important areas:",
        children: [
            {
                name: "What is the main focus?",
                description: "The document primarily focuses on the implementation of document analysis and visualization.",
                children: []
            },
            {
                name: "How is information organized?",
                description: "Information is structured through hierarchical trees with interactive navigation.",
                children: []
            }
        ]
    });
    
    return insights;
}