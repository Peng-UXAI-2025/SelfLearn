/**
 * Tree Visualizer Module
 * Creates and manages D3.js visualizations of knowledge trees
 */

(function() {
    // Create tree visualizer namespace
    window.treeVisualizer = {};
    
    // Store active tree references
    const activeTreeElements = new Map();
    
    /**
     * Create D3 tree visualization
     * @param {HTMLElement} svgElement - SVG element to contain visualization
     * @param {Object} treeData - Tree data structure
     */
    window.treeVisualizer.createVisualization = function(svgElement, treeData) {
        // Clear previous content
        d3.select(svgElement).selectAll("*").remove();
        
        // Set up dimensions
        const margin = {top: 50, right: 120, bottom: 50, left: 120};
        const width = svgElement.clientWidth - margin.left - margin.right;
        const height = svgElement.clientHeight - margin.top - margin.bottom;
        
        // Create the SVG container
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
            .attr("class", d => {
                let classes = "node";
                if (d.depth === 0) classes += " root-node";
                else if (!d.children) classes += " leaf-node";
                else classes += " internal-node";
                return classes;
            })
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", function(event, d) {
                handleNodeSelection(this, d, svgElement);
            })
            .on("mouseover", function(event, d) {
                // Show tooltip
                tooltip
                    .style("visibility", "visible")
                    .html(`<strong>${d.data.title}</strong><br/>${d.data.summary || ""}`)
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
            .text(d => d.data.title)
            .each(function(d) {
                // Truncate long text
                const textElement = d3.select(this);
                const text = textElement.text();
                if (text.length > 30) {
                    textElement.text(text.substring(0, 27) + "...");
                }
            });
        
        // Store the visualization reference
        activeTreeElements.set(svgElement, {
            treeData: treeData,
            rootNode: root
        });
        
        // Enable zoom and pan
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                svg.attr("transform", `translate(${event.transform.x + margin.left},${event.transform.y + margin.top}) scale(${event.transform.k})`);
            });
        
        d3.select(svgElement).call(zoom);
        
        // Add legend
        addTreeLegend(svg, width);
    };
    
    /**
     * Add legend to tree visualization
     * @param {Object} svg - D3 SVG element
     * @param {number} width - Visualization width
     */
    function addTreeLegend(svg, width) {
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 120}, 10)`);
        
        // Add background rectangle
        legend.append("rect")
            .attr("width", 110)
            .attr("height", 80)
            .attr("fill", "#f9f9f9")
            .attr("stroke", "#ddd")
            .attr("rx", 5);
        
        // Add title
        legend.append("text")
            .attr("x", 55)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Legend");
        
        // Add legend items
        const items = [
            {label: "Main Topic", class: "root", y: 40},
            {label: "Category", class: "internal", y: 60},
            {label: "Leaf Node", class: "leaf", y: 80}
        ];
        
        items.forEach(item => {
            // Add circle
            legend.append("circle")
                .attr("cx", 15)
                .attr("cy", item.y)
                .attr("r", 5)
                .attr("class", item.class);
            
            // Add label
            legend.append("text")
                .attr("x", 25)
                .attr("y", item.y + 4)
                .text(item.label);
        });
    }
    
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
        
        // Store reference to selected node
        window.webNotebook.app.selectedNode = nodeElement;
        
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
        
        // Update panel title
        detailsPanel.querySelector('#node-title').textContent = nodeData.title;
        
        // Update summary tab
        detailsPanel.querySelector('#node-summary').textContent = nodeData.summary || "No summary available.";
        
        // Update source tab
        const sourceContent = nodeData.content || "No source content available.";
        detailsPanel.querySelector('#node-source').textContent = sourceContent;
        
        // Update explore tab - related concepts
        const relatedConceptsList = detailsPanel.querySelector('#related-concepts');
        relatedConceptsList.innerHTML = '';
        
        if (nodeData.children && nodeData.children.length > 0) {
            nodeData.children.forEach(child => {
                const listItem = document.createElement('li');
                listItem.textContent = child.title;
                relatedConceptsList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = "No related concepts available.";
            relatedConceptsList.appendChild(listItem);
        }
        
        // Add View Notes button to the details panel
        const actionsContainer = detailsPanel.querySelector('.node-actions');
        
        // Create container if it doesn't exist
        if (!actionsContainer) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'node-actions';
            
            // Add after the tabs
            const tabContent = detailsPanel.querySelector('.tab-content');
            if (tabContent) {
                tabContent.parentNode.insertBefore(actionsDiv, tabContent.nextSibling);
            } else {
                detailsPanel.appendChild(actionsDiv);
            }
        }
        
        // Get or create the actions container
        const actions = detailsPanel.querySelector('.node-actions') || detailsPanel;
        
        // Remove any existing View Notes button
        const existingBtn = actions.querySelector('.view-notes-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create View Notes button
        const viewNotesBtn = document.createElement('button');
        viewNotesBtn.className = 'view-notes-btn';
        viewNotesBtn.textContent = 'View Notes';
        viewNotesBtn.addEventListener('click', function() {
            // Check if the node notes module is available
            if (window.nodeNotes && typeof window.nodeNotes.showNotesModal === 'function') {
                window.nodeNotes.showNotesModal(nodeData);
            } else {
                // Fallback if module not loaded
                alert('Node notes functionality not available. Please include node-notes.js');
                
                // Try to load the module
                const script = document.createElement('script');
                script.src = 'js/knowledge-tools/node-notes.js';
                script.onload = function() {
                    // Initialize if needed
                    if (window.nodeNotes && typeof window.nodeNotes.initialize === 'function') {
                        window.nodeNotes.initialize();
                    }
                    
                    // Show notes modal
                    if (window.nodeNotes && typeof window.nodeNotes.showNotesModal === 'function') {
                        window.nodeNotes.showNotesModal(nodeData);
                    }
                };
                document.head.appendChild(script);
            }
        });
        
        // Add the button to the panel
        actions.appendChild(viewNotesBtn);
        
        // Show the panel
        detailsPanel.style.display = 'flex';
    }
    
    /**
     * Export SVG as string
     * @param {HTMLElement} svgElement - SVG element
     * @returns {string} - SVG content as string
     */
    window.treeVisualizer.exportSvg = function(svgElement) {
        // Clone SVG element to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);
        
        // Add inline styles
        const style = document.createElement('style');
        style.textContent = `
            .node circle {
                fill: #557ba1;
                stroke: #233749;
                stroke-width: 1.5px;
            }
            .node.root-node circle {
                fill: #233749;
                r: 7;
            }
            .node.leaf-node circle {
                fill: #7ba1c7;
            }
            .node text {
                font: 12px sans-serif;
                fill: #333;
            }
            .node.selected circle {
                fill: #233749;
                stroke-width: 2px;
            }
            .link {
                fill: none;
                stroke: #ccc;
                stroke-width: 1.5px;
            }
            .legend rect {
                fill: #f9f9f9;
                stroke: #ddd;
            }
            .legend text {
                font: 10px sans-serif;
                fill: #333;
            }
            .legend circle.root {
                fill: #233749;
            }
            .legend circle.internal {
                fill: #557ba1;
            }
            .legend circle.leaf {
                fill: #7ba1c7;
            }
        `;
        clonedSvg.insertBefore(style, clonedSvg.firstChild);
        
        // Adjust viewBox to ensure all content is visible
        const contentBBox = svgElement.querySelector('g').getBBox();
        clonedSvg.setAttribute('viewBox', `${contentBBox.x - 20} ${contentBBox.y - 20} ${contentBBox.width + 40} ${contentBBox.height + 40}`);
        clonedSvg.setAttribute('width', '100%');
        clonedSvg.setAttribute('height', '100%');
        
        // Convert to string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(clonedSvg);
    };
    
    /**
     * Find node by title in tree
     * @param {Object} root - Root node
     * @param {string} title - Node title to find
     * @returns {Object|null} - Found node or null
     */
    window.treeVisualizer.findNodeByTitle = function(root, title) {
        if (!root) return null;
        
        if (root.data.title === title) {
            return root;
        }
        
        if (root.children) {
            for (const child of root.children) {
                const found = window.treeVisualizer.findNodeByTitle(child, title);
                if (found) return found;
            }
        }
        
        return null;
    };
    
    /**
     * Collapse all nodes beyond specified depth
     * @param {Object} root - Root node
     * @param {number} maxDepth - Maximum depth to show
     */
    window.treeVisualizer.collapseToDepth = function(root, maxDepth) {
        if (!root) return;
        
        root.descendants().forEach(d => {
            if (d.depth > maxDepth) {
                if (d.parent && d.parent.children) {
                    // If this is the first child beyond the max depth,
                    // store children in _children and set children to null
                    if (d.depth === maxDepth + 1) {
                        d.parent._children = d.parent.children;
                        d.parent.children = null;
                    }
                }
            }
        });
    };
    
    /**
     * Expand all nodes
     * @param {Object} root - Root node
     */
    window.treeVisualizer.expandAll = function(root) {
        if (!root) return;
        
        root.descendants().forEach(d => {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
        });
    };
    
    /**
     * Toggle node expansion
     * @param {Object} d - Node data
     * @param {HTMLElement} svgElement - SVG element
     */
    window.treeVisualizer.toggleNode = function(d, svgElement) {
        if (d.children) {
            // Collapse node
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            // Expand node
            d.children = d._children;
            d._children = null;
        }
        
        // Update visualization
        const treeRef = activeTreeElements.get(svgElement);
        if (treeRef) {
            window.treeVisualizer.createVisualization(svgElement, treeRef.treeData);
        }
    };
    
    /**
     * Search for node by text
     * @param {string} text - Search text
     * @param {HTMLElement} svgElement - SVG element
     * @returns {Object|null} - Found node or null
     */
    window.treeVisualizer.searchNode = function(text, svgElement) {
        const treeRef = activeTreeElements.get(svgElement);
        if (!treeRef) return null;
        
        const searchText = text.toLowerCase();
        let foundNode = null;
        
        // Helper function to search nodes recursively
        function searchInNode(node) {
            // Check if this node matches
            if (node.data.title.toLowerCase().includes(searchText) ||
                (node.data.summary && node.data.summary.toLowerCase().includes(searchText)) ||
                (node.data.content && node.data.content.toLowerCase().includes(searchText))) {
                return node;
            }
            
            // Check children
            if (node.children) {
                for (const child of node.children) {
                    const found = searchInNode(child);
                    if (found) return found;
                }
            }
            
            // Check collapsed children
            if (node._children) {
                for (const child of node._children) {
                    const found = searchInNode(child);
                    if (found) return found;
                }
            }
            
            return null;
        }
        
        // Start search from root
        foundNode = searchInNode(treeRef.rootNode);
        
        return foundNode;
    };
    
    /**
     * Update visualization after data changes
     * @param {Object} treeData - New tree data
     * @param {HTMLElement} svgElement - SVG element
     */
    window.treeVisualizer.updateVisualization = function(treeData, svgElement) {
        // Update stored data
        const treeRef = activeTreeElements.get(svgElement);
        if (treeRef) {
            treeRef.treeData = treeData;
        }
        
        // Re-create visualization
        window.treeVisualizer.createVisualization(svgElement, treeData);
    };
})();