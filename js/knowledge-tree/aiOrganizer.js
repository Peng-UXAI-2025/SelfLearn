/**
 * AI Organizer Module
 * Provides AI-assisted organization and structuring for knowledge trees
 */

WebNotebook.KnowledgeTree = WebNotebook.KnowledgeTree || {};
WebNotebook.KnowledgeTree.AIOrganizer = (function() {
    /**
     * Initialize the AI organizer
     */
    function initialize() {
        console.log('AI Organizer initialized');
        
        // Set up UI elements
        setupUI();
    }
    
    /**
     * Set up UI elements for the AI organizer
     */
    function setupUI() {
        // Add a button to the tree editor for AI organization
        const editorControls = document.querySelector('.editor-controls');
        if (editorControls) {
            const aiOrgBtn = document.createElement('button');
            aiOrgBtn.id = 'ai-organize-btn';
            aiOrgBtn.title = 'AI Organization';
            aiOrgBtn.textContent = '🧠';
            aiOrgBtn.addEventListener('click', showOrganizeOptions);
            
            // Insert before the close button
            const closeBtn = document.getElementById('close-tree-editor-btn');
            if (closeBtn) {
                editorControls.insertBefore(aiOrgBtn, closeBtn);
            } else {
                editorControls.appendChild(aiOrgBtn);
            }
        }
    }
    
    /**
     * Show AI organization options dialog
     */
    function showOrganizeOptions() {
        // Create dialog for organization options
        const dialog = document.createElement('div');
        dialog.className = 'ai-organize-dialog';
        dialog.innerHTML = `
            <div class="ai-dialog-header">
                <h3>AI Organization Tools</h3>
                <button class="close-dialog-btn">×</button>
            </div>
            <div class="ai-dialog-body">
                <div class="organize-option" data-action="suggest-structure">
                    <h4>Suggest Tree Structure</h4>
                    <p>Analyze content and suggest an organized knowledge tree structure</p>
                </div>
                <div class="organize-option" data-action="cluster-topics">
                    <h4>Cluster Related Topics</h4>
                    <p>Group related nodes together based on content similarity</p>
                </div>
                <div class="organize-option" data-action="extract-concepts">
                    <h4>Extract Key Concepts</h4>
                    <p>Identify and extract key concepts from your notes to build a knowledge tree</p>
                </div>
                <div class="organize-option" data-action="generate-questions">
                    <h4>Generate Questions</h4>
                    <p>Create question nodes based on your content to enhance learning</p>
                </div>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Position the dialog
        const treeEditor = document.querySelector('.knowledge-tree-editor');
        if (treeEditor) {
            const treeRect = treeEditor.getBoundingClientRect();
            dialog.style.position = 'absolute';
            dialog.style.top = (treeRect.top + 100) + 'px';
            dialog.style.left = (treeRect.left + treeRect.width / 2 - 150) + 'px';
        }
        
        // Set up event listeners
        setupDialogEvents(dialog);
    }
    
    /**
     * Set up event listeners for the organize dialog
     * @param {Element} dialog - The dialog element
     */
    function setupDialogEvents(dialog) {
        // Close button
        const closeBtn = dialog.querySelector('.close-dialog-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(dialog);
            });
        }
        
        // Option buttons
        const options = dialog.querySelectorAll('.organize-option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                executeOrganizeAction(action);
                document.body.removeChild(dialog);
            });
        });
    }
    
    /**
     * Execute an organize action
     * @param {string} action - The action to execute
     */
    function executeOrganizeAction(action) {
        // Get the current tree
        const currentTree = WebNotebook.KnowledgeTree.TreeEditor.getCurrentTree();
        if (!currentTree) {
            alert('No tree loaded. Please create or load a tree first.');
            return;
        }
        
        // Show loading indicator
        showLoadingIndicator();
        
        // Perform the requested action
        switch (action) {
            case 'suggest-structure':
                suggestTreeStructure(currentTree);
                break;
            case 'cluster-topics':
                clusterRelatedTopics(currentTree);
                break;
            case 'extract-concepts':
                extractKeyConcepts(currentTree);
                break;
            case 'generate-questions':
                generateQuestions(currentTree);
                break;
            default:
                console.error('Unknown organize action:', action);
                hideLoadingIndicator();
        }
    }
    
    /**
     * Show a loading indicator while AI is processing
     */
    function showLoadingIndicator() {
        const treeEditor = document.querySelector('.tree-editor-body');
        if (!treeEditor) return;
        
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'ai-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="ai-loading-content">
                <div class="ai-loading-spinner"></div>
                <div class="ai-loading-text">AI is analyzing and organizing your content...</div>
            </div>
        `;
        
        // Add to tree editor
        treeEditor.appendChild(loadingOverlay);
    }
    
    /**
     * Hide the loading indicator
     */
    function hideLoadingIndicator() {
        const loadingOverlay = document.querySelector('.ai-loading-overlay');
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
    }
    
    /**
     * Suggest a tree structure based on content analysis
     * @param {Object} currentTree - The current tree data
     */
    function suggestTreeStructure(currentTree) {
        // In a real implementation, this would use an AI API
        // For now, we'll simulate with a timeout and demo structure
        
        // Extract all content from the tree
        const allContent = extractAllContent(currentTree);
        
        setTimeout(() => {
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Show suggested structure dialog
            showSuggestedStructure(generateDemoStructure(currentTree.name));
        }, 2000);
    }
    
    /**
     * Cluster related topics based on content similarity
     * @param {Object} currentTree - The current tree data
     */
    function clusterRelatedTopics(currentTree) {
        // In a real implementation, this would use an AI API for NLP clustering
        // For now, we'll simulate with a timeout and demo clusters
        
        setTimeout(() => {
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Get all nodes to cluster
            const nodesToCluster = getAllLeafNodes(currentTree);
            
            // Create sample clusters based on the first letter of node names
            const clusters = {};
            
            nodesToCluster.forEach(node => {
                const firstLetter = node.name.charAt(0).toUpperCase();
                
                if (!clusters[firstLetter]) {
                    clusters[firstLetter] = [];
                }
                
                clusters[firstLetter].push(node);
            });
            
            // Show cluster results
            showClusterResults(clusters);
        }, 2000);
    }
    
    /**
     * Extract key concepts from content
     * @param {Object} currentTree - The current tree data
     */
    function extractKeyConcepts(currentTree) {
        // In a real implementation, this would use an AI API for concept extraction
        // For now, we'll simulate with a timeout and demo concepts
        
        // Extract all content from the tree
        const allContent = extractAllContent(currentTree);
        
        setTimeout(() => {
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Generate some demo concepts based on the tree name
            const concepts = generateDemoConcepts(currentTree.name);
            
            // Show concepts dialog
            showExtractedConcepts(concepts);
        }, 2000);
    }
    
    /**
     * Generate questions based on content
     * @param {Object} currentTree - The current tree data
     */
    function generateQuestions(currentTree) {
        // In a real implementation, this would use an AI API for question generation
        // For now, we'll simulate with a timeout and demo questions
        
        // Extract all content from the tree
        const allContent = extractAllContent(currentTree);
        
        setTimeout(() => {
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Generate some demo questions based on the tree name
            const questions = generateDemoQuestions(currentTree.name);
            
            // Show questions dialog
            showGeneratedQuestions(questions);
        }, 2000);
    }
    
    /**
     * Extract all content from the tree
     * @param {Object} tree - The tree object
     * @returns {string} - Combined content from all nodes
     */
    function extractAllContent(tree) {
        let content = tree.name + '\n';
        
        // Get content from all nodes recursively
        function processNode(node) {
            // Add node content if available
            const nodeData = WebNotebook.Utils.Storage.getNodeById(node.id);
            if (nodeData && nodeData.content) {
                // Strip HTML tags to get plain text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = nodeData.content;
                content += tempDiv.textContent + '\n';
            }
            
            // Process children
            if (node.children && node.children.length > 0) {
                node.children.forEach(processNode);
            }
        }
        
        processNode(tree);
        return content;
    }
    
    /**
     * Get all leaf nodes from the tree
     * @param {Object} tree - The tree object
     * @returns {Array} - Array of leaf nodes
     */
    function getAllLeafNodes(tree) {
        const leafNodes = [];
        
        function processNode(node) {
            if (!node.children || node.children.length === 0) {
                // This is a leaf node
                leafNodes.push(node);
            } else {
                // Process children
                node.children.forEach(processNode);
            }
        }
        
        processNode(tree);
        return leafNodes;
    }
    
    /**
     * Generate a demo tree structure
     * @param {string} rootName - Name of the root node
     * @returns {Object} - Demo tree structure
     */
    function generateDemoStructure(rootName) {
        // Create a sample structure based on the root name
        const treeName = rootName || 'Knowledge Tree';
        
        return {
            id: 'root',
            name: treeName,
            type: 'knowledge',
            children: [
                {
                    id: 'concepts',
                    name: 'Core Concepts',
                    type: 'knowledge',
                    children: [
                        {
                            id: 'concept1',
                            name: `${treeName} Fundamentals`,
                            type: 'knowledge',
                            children: []
                        },
                        {
                            id: 'concept2',
                            name: 'Key Principles',
                            type: 'knowledge',
                            children: []
                        }
                    ]
                },
                {
                    id: 'applications',
                    name: 'Applications',
                    type: 'knowledge',
                    children: [
                        {
                            id: 'app1',
                            name: 'Practical Examples',
                            type: 'knowledge',
                            children: []
                        },
                        {
                            id: 'app2',
                            name: 'Case Studies',
                            type: 'knowledge',
                            children: []
                        }
                    ]
                },
                {
                    id: 'resources',
                    name: 'Resources',
                    type: 'folder',
                    children: [
                        {
                            id: 'res1',
                            name: 'References',
                            type: 'file',
                            children: []
                        },
                        {
                            id: 'res2',
                            name: 'Additional Reading',
                            type: 'file',
                            children: []
                        }
                    ]
                }
            ]
        };
    }
    
    /**
     * Generate demo concepts for extraction
     * @param {string} treeName - Name of the tree
     * @returns {Array} - Array of concept objects
     */
    function generateDemoConcepts(treeName) {
        return [
            {
                name: `${treeName} Definition`,
                content: `The core definition and meaning of ${treeName}`
            },
            {
                name: `Key Components`,
                content: `The main components or elements that make up ${treeName}`
            },
            {
                name: `Historical Development`,
                content: `How ${treeName} has evolved over time`
            },
            {
                name: `Practical Applications`,
                content: `How ${treeName} is applied in real-world situations`
            },
            {
                name: `Current Research`,
                content: `Ongoing research areas related to ${treeName}`
            }
        ];
    }
    
    /**
     * Generate demo questions
     * @param {string} treeName - Name of the tree
     * @returns {Array} - Array of question objects
     */
    function generateDemoQuestions(treeName) {
        return [
            {
                question: `What is the core definition of ${treeName}?`,
                level: 'Basic'
            },
            {
                question: `How does ${treeName} relate to other similar concepts?`,
                level: 'Intermediate'
            },
            {
                question: `What are the key principles that underlie ${treeName}?`,
                level: 'Basic'
            },
            {
                question: `What is the historical development of ${treeName}?`,
                level: 'Intermediate'
            },
            {
                question: `How is ${treeName} applied in real-world scenarios?`,
                level: 'Advanced'
            }
        ];
    }
    
    /**
     * Show suggested structure dialog
     * @param {Object} structure - The suggested structure
     */
    function showSuggestedStructure(structure) {
        // Create the dialog
        const dialog = document.createElement('div');
        dialog.className = 'suggested-structure-dialog modal-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Suggested Knowledge Structure</h3>
                <button class="close-dialog-btn">×</button>
            </div>
            <div class="dialog-body">
                <p>Based on your content, here's a suggested knowledge structure:</p>
                <div class="structure-preview"></div>
            </div>
            <div class="dialog-footer">
                <button class="apply-structure-btn">Apply Structure</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Render the structure preview
        const previewContainer = dialog.querySelector('.structure-preview');
        renderStructurePreview(structure, previewContainer);
        
        // Set up event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.apply-structure-btn').addEventListener('click', function() {
            // Apply the suggested structure
            applyStructure(structure);
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * Render a structure preview
     * @param {Object} structure - The structure to preview
     * @param {Element} container - The container element
     */
    function renderStructurePreview(structure, container) {
        // Create a tree-like visualization
        const ul = document.createElement('ul');
        ul.className = 'structure-tree';
        
        function addNode(node, parentUl) {
            const li = document.createElement('li');
            
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'structure-node';
            nodeDiv.innerHTML = `
                <span class="node-icon">${getNodeTypeIcon(node.type)}</span>
                <span class="node-name">${node.name}</span>
            `;
            
            li.appendChild(nodeDiv);
            
            if (node.children && node.children.length > 0) {
                const childUl = document.createElement('ul');
                node.children.forEach(child => addNode(child, childUl));
                li.appendChild(childUl);
            }
            
            parentUl.appendChild(li);
        }
        
        addNode(structure, ul);
        container.appendChild(ul);
    }
    
    /**
     * Get icon for node type
     * @param {string} type - Node type
     * @returns {string} - Icon character
     */
    function getNodeTypeIcon(type) {
        switch (type) {
            case 'knowledge':
                return '💡';
            case 'file':
                return '📄';
            case 'folder':
                return '📁';
            case 'roadmap':
                return '🗺️';
            case 'question':
                return '❓';
            default:
                return '📄';
        }
    }
    
    /**
     * Apply a structure to the current tree
     * @param {Object} structure - The structure to apply
     */
    function applyStructure(structure) {
        // This would apply the suggested structure to the current tree
        // For demo purposes, we'll just create a new tree
        WebNotebook.KnowledgeTree.TreeEditor.createTreeFromStructure(structure);
        
        // Show success message
        alert('Structure applied successfully!');
    }
    
    /**
     * Show cluster results dialog
     * @param {Object} clusters - The cluster results
     */
    function showClusterResults(clusters) {
        // Create the dialog
        const dialog = document.createElement('div');
        dialog.className = 'cluster-results-dialog modal-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Topic Clusters</h3>
                <button class="close-dialog-btn">×</button>
            </div>
            <div class="dialog-body">
                <p>The AI has identified these topic clusters based on your content:</p>
                <div class="clusters-container"></div>
            </div>
            <div class="dialog-footer">
                <button class="apply-clusters-btn">Apply Clusters</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Render the clusters
        const clustersContainer = dialog.querySelector('.clusters-container');
        renderClusters(clusters, clustersContainer);
        
        // Set up event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.apply-clusters-btn').addEventListener('click', function() {
            // Apply the clusters
            applyClusters(clusters);
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * Render clusters
     * @param {Object} clusters - The clusters to render
     * @param {Element} container - The container element
     */
    function renderClusters(clusters, container) {
        // Create a container for each cluster
        Object.entries(clusters).forEach(([clusterName, nodes]) => {
            const clusterDiv = document.createElement('div');
            clusterDiv.className = 'cluster';
            
            // Cluster header
            const header = document.createElement('h4');
            header.textContent = `Cluster ${clusterName} (${nodes.length} items)`;
            clusterDiv.appendChild(header);
            
            // Cluster items
            const itemsList = document.createElement('ul');
            nodes.forEach(node => {
                const item = document.createElement('li');
                item.innerHTML = `<span class="node-icon">${getNodeTypeIcon(node.type)}</span> ${node.name}`;
                itemsList.appendChild(item);
            });
            
            clusterDiv.appendChild(itemsList);
            container.appendChild(clusterDiv);
        });
    }
    
    /**
     * Apply clusters to the tree
     * @param {Object} clusters - The clusters to apply
     */
    function applyClusters(clusters) {
        // This would reorganize the tree based on the clusters
        // For now, we'll just show a success message
        alert('Clusters applied successfully!');
    }
    
    /**
     * Show extracted concepts dialog
     * @param {Array} concepts - The extracted concepts
     */
    function showExtractedConcepts(concepts) {
        // Create the dialog
        const dialog = document.createElement('div');
        dialog.className = 'extracted-concepts-dialog modal-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Extracted Key Concepts</h3>
                <button class="close-dialog-btn">×</button>
            </div>
            <div class="dialog-body">
                <p>The AI has identified these key concepts in your content:</p>
                <div class="concepts-container"></div>
            </div>
            <div class="dialog-footer">
                <button class="add-concepts-btn">Add to Tree</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Render the concepts
        const conceptsContainer = dialog.querySelector('.concepts-container');
        renderConcepts(concepts, conceptsContainer);
        
        // Set up event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.add-concepts-btn').addEventListener('click', function() {
            // Add the concepts to the tree
            addConceptsToTree(concepts);
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * Render concepts
     * @param {Array} concepts - The concepts to render
     * @param {Element} container - The container element
     */
    function renderConcepts(concepts, container) {
        // Create a list of concepts
        const conceptsList = document.createElement('ul');
        conceptsList.className = 'concepts-list';
        
        concepts.forEach(concept => {
            const conceptItem = document.createElement('li');
            conceptItem.className = 'concept-item';
            
            conceptItem.innerHTML = `
                <div class="concept-header">
                    <input type="checkbox" checked>
                    <h4>${concept.name}</h4>
                </div>
                <div class="concept-content">
                    <p>${concept.content}</p>
                </div>
            `;
            
            conceptsList.appendChild(conceptItem);
        });
        
        container.appendChild(conceptsList);
    }
    
    /**
     * Add concepts to the tree
     * @param {Array} concepts - The concepts to add
     */
    function addConceptsToTree(concepts) {
        // Get the selected node (or root if none selected)
        const selectedNode = WebNotebook.KnowledgeTree.TreeEditor.getSelectedNode();
        
        // Create a new folder for the concepts if no node is selected
        let parentNode = selectedNode;
        if (!parentNode) {
            // Create a concepts folder at the root
            parentNode = WebNotebook.KnowledgeTree.TreeEditor.addNode(
                'Extracted Concepts',
                'folder'
            );
        }
        
        // Add each concept as a child node
        concepts.forEach(concept => {
            const conceptNode = WebNotebook.KnowledgeTree.TreeEditor.addNode(
                concept.name,
                'knowledge',
                parentNode.id
            );
        });
        
        // Show success message
        alert('Concepts added to the tree!');
    }
    
    /**
     * Show generated questions dialog
     * @param {Array} questions - The generated questions
     */
    function showGeneratedQuestions(questions) {
        // Create the dialog
        const dialog = document.createElement('div');
        dialog.className = 'generated-questions-dialog modal-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Generated Questions</h3>
                <button class="close-dialog-btn">×</button>
            </div>
            <div class="dialog-body">
                <p>The AI has generated these questions based on your content:</p>
                <div class="questions-container"></div>
            </div>
            <div class="dialog-footer">
                <button class="add-questions-btn">Add to Tree</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(dialog);
        
        // Render the questions
        const questionsContainer = dialog.querySelector('.questions-container');
        renderQuestions(questions, questionsContainer);
        
        // Set up event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.add-questions-btn').addEventListener('click', function() {
            // Add the questions to the tree
            addQuestionsToTree(questions);
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * Render questions
     * @param {Array} questions - The questions to render
     * @param {Element} container - The container element
     */
    function renderQuestions(questions, container) {
        // Create a list of questions
        const questionsList = document.createElement('ul');
        questionsList.className = 'questions-list';
        
        questions.forEach(question => {
            const questionItem = document.createElement('li');
            questionItem.className = 'question-item';
            
            questionItem.innerHTML = `
                <div class="question-content">
                    <input type="checkbox" checked>
                    <span class="question-text">${question.question}</span>
                    <span class="question-level">${question.level}</span>
                </div>
            `;
            
            questionsList.appendChild(questionItem);
        });
        
        container.appendChild(questionsList);
    }
    
    /**
     * Add questions to the tree
     * @param {Array} questions - The questions to add
     */
    function addQuestionsToTree(questions) {
        // Get the selected node (or root if none selected)
        const selectedNode = WebNotebook.KnowledgeTree.TreeEditor.getSelectedNode();
        
        // Create a new folder for the questions if no node is selected
        let parentNode = selectedNode;
        if (!parentNode) {
            // Create a questions folder at the root
            parentNode = WebNotebook.KnowledgeTree.TreeEditor.addNode(
                'Generated Questions',
                'folder'
            );
        }
        
        // Add each question as a child node
        questions.forEach(question => {
            const questionNode = WebNotebook.KnowledgeTree.TreeEditor.addNode(
                question.question,
                'question',
                parentNode.id
            );
        });
        
        // Show success message
        alert('Questions added to the tree!');
    }
    
    // Public API
    return {
        initialize,
        suggestTreeStructure,
        clusterRelatedTopics,
        extractKeyConcepts,
        generateQuestions
    };
})();