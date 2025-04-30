/**
 * Visualizer Module
 * Provides visualization options for knowledge trees
 */

WebNotebook.KnowledgeTree = WebNotebook.KnowledgeTree || {};
WebNotebook.KnowledgeTree.Visualizer = (function() {
    // Private variables
    let svgContainer = null;
    let currentTree = null;
    let currentLayout = 'tree'; // 'tree', 'radial', 'force'
    let zoom = null;
    let svg = null;
    let rootG = null;
    
    /**
     * Initialize the visualizer
     */
    function initialize() {
        console.log('Visualizer initialized');
        
        // Setup UI components
        setupUI();
    }
    
    /**
     * Set up UI elements for visualization controls
     */
    function setupUI() {
        // Add visualization controls to the tree editor
        const editorControls = document.querySelector('.editor-controls');
        if (editorControls) {
            // Add visualization type selector
            const vizSelector = document.createElement('div');
            vizSelector.className = 'viz-selector';
            vizSelector.innerHTML = `
                <button id="tree-layout-btn" class="viz-btn active" title="Tree Layout">🌲</button>
                <button id="radial-layout-btn" class="viz-btn" title="Radial Layout">⭕</button>
                <button id="force-layout-btn" class="viz-btn" title="Force Layout">🔀</button>
            `;
            
            // Add separator after view mode buttons
            const separator = document.createElement('span');
            separator.className = 'control-separator';
            separator.textContent = '|';
            
            // Find where to insert (after view mode buttons)
            const viewModeButtons = editorControls.querySelectorAll('button')[1]; // Second button
            if (viewModeButtons) {
                editorControls.insertBefore(separator, viewModeButtons.nextSibling);
                editorControls.insertBefore(vizSelector, separator.nextSibling);
            } else {
                editorControls.appendChild(vizSelector);
            }
            
            // Set up layout button event listeners
            document.getElementById('tree-layout-btn').addEventListener('click', () => switchLayout('tree'));
            document.getElementById('radial-layout-btn').addEventListener('click', () => switchLayout('radial'));
            document.getElementById('force-layout-btn').addEventListener('click', () => switchLayout('force'));
        }
        
        // Set up the SVG container when tree editor is shown
        document.addEventListener('treeEditorShown', setupSvgContainer);
    }
    
    /**
     * Set up the SVG container for visualizations
     */
    function setupSvgContainer() {
        // Find or create SVG container
        svgContainer = document.getElementById('mind-map-svg');
        
        if (!svgContainer) return;
        
        // Initialize D3.js SVG
        svg = d3.select(svgContainer);
        
        // Clear any existing content
        svg.selectAll('*').remove();
        
        // Create root group for transformations
        rootG = svg.append('g')
            .attr('class', 'viz-root');
        
        // Set up zoom behavior
        zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', (event) => {
                rootG.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Add event to reset zoom
        svg.on('dblclick.zoom', resetZoom);
        
        // Center the visualization
        resetZoom();
    }
    
    /**
     * Reset zoom to center the visualization
     */
    function resetZoom() {
        if (!svg || !zoom) return;
        
        const width = parseInt(svg.style('width') || svg.attr('width') || 1000);
        const height = parseInt(svg.style('height') || svg.attr('height') || 800);
        
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(0.8));
    }
    
    /**
     * Switch between different visualization layouts
     * @param {string} layout - Layout type ('tree', 'radial', 'force')
     */
    function switchLayout(layout) {
        if (layout === currentLayout) return;
        
        // Update active button
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${layout}-layout-btn`).classList.add('active');
        
        // Update current layout
        currentLayout = layout;
        
        // Redraw with new layout if we have a tree
        if (currentTree) {
            visualizeTree(currentTree);
        }
    }
    
    /**
     * Visualize a tree with the current layout
     * @param {Object} tree - The tree data to visualize
     */
    function visualizeTree(tree) {
        if (!tree || !rootG) return;
        
        // Store the current tree
        currentTree = tree;
        
        // Clear existing visualization
        rootG.selectAll('*').remove();
        
        // Create a deep copy of the tree to avoid modifying the original
        const treeCopy = JSON.parse(JSON.stringify(tree));
        
        // Choose the appropriate layout method
        switch (currentLayout) {
            case 'tree':
                drawTreeLayout(treeCopy);
                break;
            case 'radial':
                drawRadialLayout(treeCopy);
                break;
            case 'force':
                drawForceLayout(treeCopy);
                break;
            default:
                drawTreeLayout(treeCopy);
        }
    }
    
    /**
     * Draw tree with hierarchical tree layout
     * @param {Object} tree - The tree data
     */
    function drawTreeLayout(tree) {
        // Convert to d3 hierarchy
        const root = d3.hierarchy(tree);
        
        // Set up tree layout
        const treeLayout = d3.tree()
            .nodeSize([70, 200])
            .separation((a, b) => a.parent === b.parent ? 1.2 : 2);
        
        // Apply layout
        treeLayout(root);
        
        // Draw links
        const linkGenerator = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);
        
        rootG.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1.5);
        
        // Draw nodes
        const nodes = rootG.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node ${d.data.id}`)
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', (event, d) => selectNode(d));
        
        // Add node circles
        nodes.append('circle')
            .attr('r', 10)
            .attr('fill', d => getNodeColor(d.data.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 1.5);
        
        // Add node labels
        nodes.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => d.children ? -12 : 12)
            .attr('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name)
            .attr('font-size', '12px')
            .attr('fill', '#333');
        
        // Add node type icons
        nodes.append('text')
            .attr('dy', '0.31em')
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .text(d => getNodeTypeIcon(d.data.type))
            .attr('font-size', '16px');
    }
    
    /**
     * Draw tree with radial layout
     * @param {Object} tree - The tree data
     */
    function drawRadialLayout(tree) {
        // Convert to d3 hierarchy
        const root = d3.hierarchy(tree);
        
        // Set up radial layout
        const radius = 300;
        const treeLayout = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
        
        // Apply layout
        treeLayout(root);
        
        // Draw links
        const linkGenerator = d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y);
        
        rootG.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1.5);
        
        // Draw nodes
        const nodes = rootG.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node ${d.data.id}`)
            .attr('transform', d => `translate(${project(d.x, d.y)})`)
            .on('click', (event, d) => selectNode(d));
        
        // Add node circles
        nodes.append('circle')
            .attr('r', 10)
            .attr('fill', d => getNodeColor(d.data.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 1.5);
        
        // Add node labels
        nodes.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => d.x < Math.PI ? 15 : -15)
            .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
            .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
            .text(d => d.data.name)
            .attr('font-size', '12px')
            .attr('fill', '#333');
        
        // Helper function to project polar coordinates to Cartesian
        function project(x, y) {
            return [y * Math.cos(x), y * Math.sin(x)];
        }
    }
    
    /**
     * Draw tree with force-directed layout
     * @param {Object} tree - The tree data
     */
    function drawForceLayout(tree) {
        // Convert tree to nodes and links
        const nodes = [];
        const links = [];
        
        function processNode(node, parent = null) {
            // Add to nodes list
            nodes.push(node);
            
            // Add link to parent if not root
            if (parent) {
                links.push({
                    source: parent.id,
                    target: node.id
                });
            }
            
            // Process children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child, node));
            }
        }
        
        // Start with the root
        processNode(tree);
        
        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(0, 0))
            .force('collision', d3.forceCollide().radius(50));
        
        // Draw links
        const link = rootG.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1.5);
        
        // Draw nodes
        const node = rootG.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => `node ${d.id}`)
            .on('click', (event, d) => selectNode(d))
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragging)
                .on('end', dragEnded));
        
        // Add node circles
        node.append('circle')
            .attr('r', 10)
            .attr('fill', d => getNodeColor(d.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 1.5);
        
        // Add node labels
        node.append('text')
            .attr('dy', '0.31em')
            .attr('x', 15)
            .attr('text-anchor', 'start')
            .text(d => d.name)
            .attr('font-size', '12px')
            .attr('fill', '#333');
        
        // Add node type icons
        node.append('text')
            .attr('dy', '0.31em')
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .text(d => getNodeTypeIcon(d.type))
            .attr('font-size', '16px');
        
        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });
        
        // Drag functions
        function dragStarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragging(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragEnded(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }
    
    /**
     * Select a node in the visualization
     * @param {Object} d - The node data
     */
    function selectNode(d) {
        // Clear previous selection
        rootG.selectAll('.node circle').attr('stroke', '#333').attr('stroke-width', 1.5);
        
        // Highlight the selected node
        rootG.select(`.node.${d.data ? d.data.id : d.id} circle`)
            .attr('stroke', '#0066cc')
            .attr('stroke-width', 3);
        
        // Trigger node selection in tree editor
        if (d.data) {
            WebNotebook.KnowledgeTree.TreeEditor.selectNode(d.data);
        } else {
            WebNotebook.KnowledgeTree.TreeEditor.selectNode(d);
        }
    }
    
    /**
     * Get color for a node type
     * @param {string} type - Node type
     * @returns {string} - Color for the node type
     */
    function getNodeColor(type) {
        switch (type) {
            case 'knowledge':
                return '#66bb6a';
            case 'file':
                return '#42a5f5';
            case 'folder':
                return '#ffa726';
            case 'roadmap':
                return '#ef5350';
            case 'ai-note':
                return '#ab47bc';
            case 'question':
                return '#8d6e63';
            default:
                return '#888888';
        }
    }
    
    /**
     * Get icon for a node type
     * @param {string} type - Node type
     * @returns {string} - Icon character for the node type
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
            case 'ai-note':
                return '🤖';
            case 'question':
                return '❓';
            default:
                return '📄';
        }
    }
    
    /**
     * Export the current visualization as SVG
     * @returns {string} - SVG content as string
     */
    function exportSVG() {
        if (!svg) return null;
        
        // Clone the SVG
        const svgClone = svg.node().cloneNode(true);
        
        // Add styles inline
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .link { stroke: #ccc; stroke-width: 1.5px; fill: none; }
            .node circle { stroke: #333; stroke-width: 1.5px; }
            .node text { font-family: sans-serif; font-size: 12px; }
        `;
        svgClone.appendChild(styleElement);
        
        // Get SVG as string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        
        // Add XML declaration
        svgString = '<?xml version="1.0" standalone="no"?>\n' + svgString;
        
        return svgString;
    }
    
    /**
     * Export the current visualization as PNG
     * @returns {Promise<Blob>} - Promise resolving to PNG blob
     */
    function exportPNG() {
        return new Promise((resolve, reject) => {
            if (!svg) {
                reject(new Error('No SVG visualization available'));
                return;
            }
            
            try {
                // Get SVG as string
                const svgString = exportSVG();
                
                // Create a canvas element
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Set canvas size to match SVG
                const svgWidth = parseInt(svg.style('width') || svg.attr('width') || 1000);
                const svgHeight = parseInt(svg.style('height') || svg.attr('height') || 800);
                
                canvas.width = svgWidth * 2; // Higher resolution
                canvas.height = svgHeight * 2;
                context.scale(2, 2);
                
                // Create image from SVG
                const image = new Image();
                image.onload = function() {
                    // Draw image to canvas
                    context.drawImage(image, 0, 0);
                    
                    // Convert canvas to PNG blob
                    canvas.toBlob(function(blob) {
                        resolve(blob);
                    }, 'image/png');
                };
                
                // Handle errors
                image.onerror = function(error) {
                    reject(error);
                };
                
                // Set source to SVG data URL
                image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Public API
    return {
        initialize,
        visualizeTree,
        switchLayout,
        resetZoom,
        exportSVG,
        exportPNG
    };
})();