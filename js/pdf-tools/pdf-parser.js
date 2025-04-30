/**
 * PDF Parser Module
 * Handles extraction of text and structure from PDF files
 */

(function() {
    // Create PDF parser namespace
    window.pdfParser = {};
    
    /**
     * Read file as ArrayBuffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} - File content as ArrayBuffer
     */
    window.pdfParser.readFileAsArrayBuffer = function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };
    
    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} - File content as text
     */
    window.pdfParser.readFileAsText = function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };
    
    /**
     * Extract text from PDF document
     * @param {File} file - PDF file to process
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise<Object>} - Extracted content with text, sections and metadata
     */
    window.pdfParser.extractTextFromPDF = async function(file, progressCallback) {
        try {
            // Make sure PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                // Load PDF.js dynamically
                await loadPDFJS();
            }
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Loading PDF...',
                    progress: 10
                });
            }
            
            // Convert file to ArrayBuffer
            const arrayBuffer = await window.pdfParser.readFileAsArrayBuffer(file);
            
            // Load PDF document
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdfDocument = await loadingTask.promise;
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'PDF loaded. Extracting metadata...',
                    progress: 20
                });
            }
            
            // Extract metadata
            const metadata = await pdfDocument.getMetadata();
            
            // Extract text from each page with enhanced section detection
            const numPages = pdfDocument.numPages;
            let fullText = '';
            const sections = [];
            const fontSizes = {};
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Analyzing font information...',
                    progress: 30
                });
            }
            
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
                
                // Update progress
                if (progressCallback) {
                    progressCallback({
                        status: `Analyzing font information (${i}/${numPages})...`,
                        progress: 30 + (i / numPages) * 10
                    });
                }
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
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Extracting text and sections...',
                    progress: 50
                });
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
                        fontSize: currentLineText.fontSize || mostCommonFontSize, // Default
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
                
                // Update progress
                if (progressCallback) {
                    progressCallback({
                        status: `Extracting text (${i}/${numPages})...`,
                        progress: 50 + (i / numPages) * 40
                    });
                }
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
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'PDF processing complete',
                    progress: 100
                });
            }
            
            return {
                text: fullText,
                sections: sections,
                metadata: metadata.info || {},
                numPages: numPages
            };
        } catch (error) {
            console.error("Error extracting PDF content:", error);
            
            // Update progress with error
            if (progressCallback) {
                progressCallback({
                    status: `Error: ${error.message}`,
                    progress: 0,
                    error: true
                });
            }
            
            // Fallback to basic file reading
            try {
                const text = await window.pdfParser.readFileAsText(file);
                return {
                    text: text,
                    sections: [{
                        title: file.name,
                        content: text,
                        page: 1
                    }],
                    metadata: { error: error.message },
                    numPages: 1
                };
            } catch (readError) {
                throw new Error(`Failed to extract content from PDF: ${error.message}`);
            }
        }
    };
    
    /**
     * Extract text from Word document using Mammoth
     * @param {File} file - Word document file
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise<Object>} - Extracted content
     */
    window.pdfParser.extractTextFromWord = async function(file, progressCallback) {
        try {
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Reading Word document...',
                    progress: 20
                });
            }
            
            // Read file as array buffer
            const arrayBuffer = await window.pdfParser.readFileAsArrayBuffer(file);
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Extracting content...',
                    progress: 50
                });
            }
            
            // Use mammoth to extract content
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Analyzing document structure...',
                    progress: 80
                });
            }
            
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
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    status: 'Word document processing complete',
                    progress: 100
                });
            }
            
            return {
                text: text,
                sections: sections,
                metadata: { type: 'word' },
                numPages: sections.length
            };
            
        } catch (error) {
            console.error("Error extracting Word document content:", error);
            
            // Update progress with error
            if (progressCallback) {
                progressCallback({
                    status: `Error: ${error.message}`,
                    progress: 0,
                    error: true
                });
            }
            
            return {
                text: `Error extracting content: ${error.message}`,
                sections: [],
                metadata: { error: error.message },
                numPages: 0
            };
        }
    };
    
    /**
     * Extract key concepts from text
     * @param {string} text - Text to analyze
     * @returns {Array} - Array of extracted concepts
     */
    window.pdfParser.extractKeyConceptsFromText = function(text) {
        if (!text) return [];
        
        // Simple NLP for concept extraction (in a real app, use a proper NLP library)
        const concepts = [];
        
        // Extract frequent terms
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
        
        // Find a sentence containing each term
        topTerms.forEach(term => {
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
        
        return concepts;
    };
    
    /**
     * Load PDF.js library dynamically
     * @returns {Promise} - Promise that resolves when PDF.js is loaded
     */
    function loadPDFJS() {
        return new Promise((resolve, reject) => {
            // Check if PDF.js is already loaded
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }
            
            // Load the script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
            script.onload = function() {
                // Set worker source
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
                resolve();
            };
            script.onerror = function() {
                reject(new Error('Failed to load PDF.js library'));
            };
            document.head.appendChild(script);
        });
    }
})();