/**
 * Export Manager Module
 * Handles exporting knowledge trees in various formats
 */

WebNotebook.KnowledgeTree = WebNotebook.KnowledgeTree || {};
WebNotebook.KnowledgeTree.ExportManager = (function() {
    /**
     * Initialize the export manager
     */
    function initialize() {
        console.log('Export Manager initialized');
        
        // Set up event listener for export button
        setupExportButton();
    }
    
    /**
     * Set up the export button event listener
     */
    function setupExportButton() {
        const exportBtn = document.getElementById('export-tree-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', showExportOptions);
        }
    }
    
    /**
     * Show export options dialog
     */
    function showExportOptions() {
        // Create the export options dialog
        const dialog = document.createElement('div');
        dialog.className = 'export-menu';
        dialog.innerHTML = `
            <div class="export-header">
                <h4>Export Knowledge Tree</h4>
                <button class="close-export-btn">×</button>
            </div>
            <div class="export-options">
                <button data-format="markdown">Export as Markdown</button>
                <button data-format="json">Export as JSON</button>
                <button data-format="svg">Export as SVG</button>
                <button data-format="png">Export as PNG</button>
                <button data-format="mm">Export as FreeMind (.mm)</button>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Set up event listeners
        setupExportDialogEvents(dialog);
    }
    
    /**
     * Set up event listeners for the export dialog
     * @param {Element} dialog - The export dialog element
     */
    function setupExportDialogEvents(dialog) {
        // Close button
        const closeBtn = dialog.querySelector('.close-export-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(dialog);
            });
        }
        
        // Format buttons
        const formatBtns = dialog.querySelectorAll('.export-options button');
        formatBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const format = this.getAttribute('data-format');
                exportTree(format);
                document.body.removeChild(dialog);
            });
        });
    }
    
    /**
     * Export the current tree in the specified format
     * @param {string} format - Export format ('markdown', 'json', 'svg', 'png', 'mm')
     */
    function exportTree(format) {
        // Get the current tree from the editor
        const currentTree = WebNotebook.KnowledgeTree.TreeEditor.getCurrentTree();
        if (!currentTree) {
            alert('No tree loaded. Please create or load a tree first.');
            return;
        }
        
        // Export in the requested format
        switch (format) {
            case 'markdown':
                exportMarkdown(currentTree);
                break;
            case 'json':
                exportJSON(currentTree);
                break;
            case 'svg':
                exportSVG();
                break;
            case 'png':
                exportPNG();
                break;
            case 'mm':
                exportFreeMind(currentTree);
                break;
            default:
                console.error('Unknown export format:', format);
                alert('Export format not supported.');
        }
    }
    
    /**
     * Export tree as Markdown
     * @param {Object} tree - The tree to export
     */
    function exportMarkdown(tree) {
        let markdown = `# ${tree.name}\n\n`;
        
        /**
         * Process a node and its children recursively
         * @param {Object} node - The node to process
         * @param {number} depth - Current depth in the tree
         */
        function processNode(node, depth) {
            // Add heading for this node
            const heading = '#'.repeat(Math.min(depth + 1, 6));
            markdown += `${heading} ${node.name}\n\n`;
            
            // Add content if available
            const nodeData = WebNotebook.Utils.Storage.getNodeById(node.id);
            if (nodeData && nodeData.content) {
                // Strip HTML tags for plain text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = nodeData.content;
                let content = tempDiv.textContent;
                
                // Add content with proper indentation
                markdown += `${content}\n\n`;
            }
            
            // Process children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    processNode(child, depth + 1);
                });
            }
        }
        
        // Start with the root node
        processNode(tree, 0);
        
        // Create download link
        downloadFile(
            markdown,
            `${tree.name.replace(/\s+/g, '_')}.md`,
            'text/markdown'
        );
    }
    
    /**
     * Export tree as JSON
     * @param {Object} tree - The tree to export
     */
    function exportJSON(tree) {
        // Create a deep copy of the tree
        const treeCopy = JSON.parse(JSON.stringify(tree));
        
        // Add node content from storage
        addContentToTree(treeCopy);
        
        // Pretty print JSON with 2-space indentation
        const jsonString = JSON.stringify(treeCopy, null, 2);
        
        // Create download link
        downloadFile(
            jsonString,
            `${tree.name.replace(/\s+/g, '_')}.json`,
            'application/json'
        );
    }
    
    /**
     * Add content to all nodes in the tree from storage
     * @param {Object} node - The root node
     */
    function addContentToTree(node) {
        // Add content from storage if available
        const nodeData = WebNotebook.Utils.Storage.getNodeById(node.id);
        if (nodeData && nodeData.content) {
            node.content = nodeData.content;
        }
        
        // Process children recursively
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                addContentToTree(child);
            });
        }
    }
    
    /**
     * Export tree visualization as SVG
     */
    function exportSVG() {
        // Use the visualizer module to export SVG
        const svgString = WebNotebook.KnowledgeTree.Visualizer.exportSVG();
        
        if (!svgString) {
            alert('SVG export failed. Please make sure the tree is visualized.');
            return;
        }
        
        // Get tree name for filename
        const currentTree = WebNotebook.KnowledgeTree.TreeEditor.getCurrentTree();
        const treeName = currentTree ? currentTree.name : 'knowledge_tree';
        
        // Create download link
        downloadFile(
            svgString,
            `${treeName.replace(/\s+/g, '_')}.svg`,
            'image/svg+xml'
        );
    }
    
    /**
     * Export tree visualization as PNG
     */
    async function exportPNG() {
        try {
            // Use the visualizer module to export PNG
            const pngBlob = await WebNotebook.KnowledgeTree.Visualizer.exportPNG();
            
            // Get tree name for filename
            const currentTree = WebNotebook.KnowledgeTree.TreeEditor.getCurrentTree();
            const treeName = currentTree ? currentTree.name : 'knowledge_tree';
            
            // Create download link for blob
            const url = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${treeName.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PNG export failed:', error);
            alert('PNG export failed. Please make sure the tree is visualized.');
        }
    }
    
    /**
     * Export tree as FreeMind (.mm) format
     * @param {Object} tree - The tree to export
     */
    function exportFreeMind(tree) {
        // Create XML document
        const doc = document.implementation.createDocument(null, 'map', null);
        doc.documentElement.setAttribute('version', '1.0.1');
        
        // Add root node
        const rootNode = doc.createElement('node');
        rootNode.setAttribute('TEXT', tree.name);
        rootNode.setAttribute('ID', tree.id);
        doc.documentElement.appendChild(rootNode);
        
        /**
         * Process a node and its children recursively
         * @param {Object} node - The node to process
         * @param {Element} parentElement - The parent XML element
         */
        function processNode(node, parentElement) {
            // Skip the root node (already added)
            if (node === tree) return;
            
            // Create node element
            const nodeElement = doc.createElement('node');
            nodeElement.setAttribute('TEXT', node.name);
            nodeElement.setAttribute('ID', node.id);
            
            // Set node type
            nodeElement.setAttribute('TYPE', node.type || 'node');
            
            // Add content if available
            const nodeData = WebNotebook.Utils.Storage.getNodeById(node.id);
            if (nodeData && nodeData.content) {
                // Strip HTML tags for plain text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = nodeData.content;
                let content = tempDiv.textContent;
                
                // Add note element with content
                const noteElement = doc.createElement('richcontent');
                noteElement.setAttribute('TYPE', 'NOTE');
                const noteHtml = doc.createElement('html');
                const noteBody = doc.createElement('body');
                const notePara = doc.createElement('p');
                notePara.textContent = content;
                noteBody.appendChild(notePara);
                noteHtml.appendChild(noteBody);
                noteElement.appendChild(noteHtml);
                nodeElement.appendChild(noteElement);
            }
            
            // Add to parent
            parentElement.appendChild(nodeElement);
            
            // Process children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    processNode(child, nodeElement);
                });
            }
        }
        
        // Process the tree
        if (tree.children && tree.children.length > 0) {
            tree.children.forEach(child => {
                processNode(child, rootNode);
            });
        }
        
        // Serialize to XML string
        const serializer = new XMLSerializer();
        let xmlString = serializer.serializeToString(doc);
        
        // Add XML declaration
        xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
        
        // Create download link
        downloadFile(
            xmlString,
            `${tree.name.replace(/\s+/g, '_')}.mm`,
            'application/xml'
        );
    }
    
    /**
     * Download content as a file
     * @param {string|Blob} content - The content to download
     * @param {string} filename - The filename
     * @param {string} [mimeType='text/plain'] - The MIME type
     */
    function downloadFile(content, filename, mimeType = 'text/plain') {
        // Create a blob from the content
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Add to document and click
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import a tree from a file
     * @param {File} file - The file to import
     * @returns {Promise<Object>} - Promise resolving to the imported tree
     */
    function importTree(file) {
        return new Promise((resolve, reject) => {
            // Determine file type based on extension
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.json')) {
                importJSON(file).then(resolve).catch(reject);
            } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
                importMarkdown(file).then(resolve).catch(reject);
            } else if (fileName.endsWith('.mm')) {
                importFreeMind(file).then(resolve).catch(reject);
            } else {
                reject(new Error('Unsupported file format. Please use JSON, Markdown, or FreeMind (.mm) files.'));
            }
        });
    }
    
    /**
     * Import a tree from a JSON file
     * @param {File} file - The JSON file
     * @returns {Promise<Object>} - Promise resolving to the imported tree
     */
    function importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const tree = JSON.parse(e.target.result);
                    
                    // Basic validation
                    if (!tree.name || !tree.id) {
                        throw new Error('Invalid tree format: missing name or id');
                    }
                    
                    resolve(tree);
                } catch (error) {
                    reject(new Error('Failed to parse JSON file: ' + error.message));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Import a tree from a Markdown file
     * @param {File} file - The Markdown file
     * @returns {Promise<Object>} - Promise resolving to the imported tree
     */
    function importMarkdown(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const tree = parseMarkdownToTree(content);
                    resolve(tree);
                } catch (error) {
                    reject(new Error('Failed to parse Markdown file: ' + error.message));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Parse Markdown content to a tree structure
     * @param {string} markdown - The Markdown content
     * @returns {Object} - The tree structure
     */
    function parseMarkdownToTree(markdown) {
        // Split content into lines
        const lines = markdown.split('\n');
        
        // Root node
        const root = {
            id: 'tree_' + Date.now(),
            name: 'Imported Tree',
            type: 'knowledge',
            children: []
        };
        
        let currentNode = root;
        let currentLevel = 0;
        let nodeStack = [{ node: root, level: 0 }];
        
        // Parse each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse headings
            if (line.startsWith('#')) {
                // Count heading level
                let level = 0;
                for (let j = 0; j < line.length; j++) {
                    if (line[j] === '#') {
                        level++;
                    } else {
                        break;
                    }
                }
                
                // Extract heading text
                const name = line.substring(level).trim();
                
                // Create node
                const node = {
                    id: 'node_' + Date.now() + '_' + i,
                    name: name,
                    type: 'knowledge',
                    children: []
                };
                
                // Find parent for this node based on level
                while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) {
                    nodeStack.pop();
                }
                
                // Add to parent
                const parent = nodeStack[nodeStack.length - 1].node;
                parent.children.push(node);
                
                // Add to stack
                nodeStack.push({ node: node, level: level });
                currentNode = node;
                currentLevel = level;
            } 
            // Handle content
            else if (line.length > 0 && currentNode !== root) {
                // Add content to current node
                if (!currentNode.content) {
                    currentNode.content = '';
                }
                
                currentNode.content += line + '\n';
            }
        }
        
        // If the root has a name (first heading), use it
        if (root.children.length > 0 && root.children[0].level === 1) {
            root.name = root.children[0].name;
            root.children = root.children[0].children;
        }
        
        return root;
    }
    
    /**
     * Import a tree from a FreeMind (.mm) file
     * @param {File} file - The FreeMind file
     * @returns {Promise<Object>} - Promise resolving to the imported tree
     */
    function importFreeMind(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
                    
                    // Parse FreeMind XML to tree
                    const tree = parseFreeMindToTree(xmlDoc);
                    resolve(tree);
                } catch (error) {
                    reject(new Error('Failed to parse FreeMind file: ' + error.message));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Parse FreeMind XML to a tree structure
     * @param {Document} xmlDoc - The XML document
     * @returns {Object} - The tree structure
     */
    function parseFreeMindToTree(xmlDoc) {
        // Get the root map element
        const mapElement = xmlDoc.documentElement;
        
        // Get the root node
        const rootElement = mapElement.querySelector('node');
        if (!rootElement) {
            throw new Error('Invalid FreeMind file: no root node found');
        }
        
        /**
         * Process a node element recursively
         * @param {Element} element - The node element
         * @returns {Object} - The node object
         */
        function processNode(element) {
            // Get node text
            const text = element.getAttribute('TEXT') || 'Unnamed Node';
            
            // Get or generate ID
            const id = element.getAttribute('ID') || 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            
            // Get node type
            const type = element.getAttribute('TYPE') || 'knowledge';
            
            // Create node object
            const node = {
                id: id,
                name: text,
                type: type,
                children: []
            };
            
            // Extract note content if any
            const noteElement = element.querySelector('richcontent[TYPE="NOTE"]');
            if (noteElement) {
                const noteHtml = noteElement.innerHTML;
                node.content = noteHtml;
            }
            
            // Process child nodes
            const childElements = element.querySelectorAll(':scope > node');
            childElements.forEach(childElement => {
                const childNode = processNode(childElement);
                node.children.push(childNode);
            });
            
            return node;
        }
        
        // Process the root node
        return processNode(rootElement);
    }
    
    /**
     * Show import dialog
     */
    function showImportDialog() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.md,.markdown,.mm';
        fileInput.style.display = 'none';
        
        // Add to document
        document.body.appendChild(fileInput);
        
        // Set up file change event
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                importTree(this.files[0])
                    .then(tree => {
                        // Load the imported tree
                        WebNotebook.KnowledgeTree.TreeEditor.loadTree(tree);
                        
                        // Show success message
                        alert('Tree imported successfully!');
                    })
                    .catch(error => {
                        console.error('Import failed:', error);
                        alert('Import failed: ' + error.message);
                    });
            }
            
            // Clean up
            document.body.removeChild(fileInput);
        });
        
        // Trigger file selection
        fileInput.click();
    }
    
    // Public API
    return {
        initialize,
        exportTree,
        importTree,
        showExportOptions,
        showImportDialog
    };
})();