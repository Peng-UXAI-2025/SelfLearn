/**
 * Main Application JavaScript
 * Initializes the WebNotebook application and sets up event handlers
 */

document.addEventListener("DOMContentLoaded", function () {
    // Global state
    const app = {
      isDragging: false,
      startY: 0,
      currentDragTarget: null,
      dragPlaceholder: null,
      dropTarget: null,
      selectedNode: null,
      uploadedFiles: [],
      notesArray: [],
      clipboardMonitorActive: false,
      selectedModel: "gpt-4o", // Default model
    };
  
    // Initialize the application
    initializeApp();
  
    /**
     * Initialize the application
     */
    function initializeApp() {
      // Initialize document and UI
      initializeDocument();
      initializeEventListeners();
  
      // Add API key management
      initializeApiKeyManagement();
  
      // Load saved data from storage if available
      try {
        loadSavedData();
      } catch (error) {
        console.error("Error loading saved data:", error);
        // Clear potentially corrupted data
        window.storage.removeItem("webNotebookDocument");
        window.knowledgeApi.showStatusMessage(
          "Error loading saved data. Starting with a new document.",
          true
        );
      }
      
      // Initialize the floating clipboard copilot
      if (window.clipboardMonitor) {
        window.clipboardMonitor.initialize();
      }
      
      // Initialize study spaces
      if (window.studySpaces) {
        window.studySpaces.initialize();
        
        // Show welcome dashboard as the default view
        window.studySpaces.showWelcomeDashboard();
      }
      
      // Initialize sidebar
      if (window.sidebar) {
        window.sidebar.initialize();
      }
  
      // Expose public API
      window.webNotebook = {
        handleDragStart,
        toggleMoreOptionsPanel,
        app: app,
        utils: window.utils,
        storage: window.storage,
        knowledgeApi: window.knowledgeApi,
        treeGenerator: window.treeGenerator,
        treeVisualizer: window.treeVisualizer,
        pdfParser: window.pdfParser,
        pdfProcessor: window.pdfProcessor,
        clipboardMonitor: window.clipboardMonitor,
        textProcessor: window.textProcessor,
        studySpaces: window.studySpaces,
        sidebar: window.sidebar
      };
  
      console.log("WebNotebook application initialized successfully");
    }
  
    /**
     * Initialize API key management
     */
    function initializeApiKeyManagement() {
      // Create a settings button in the header
      const aiToolsDropdown = document.querySelector('.ai-tools-dropdown');
      if (aiToolsDropdown) {
        const dropdown = document.getElementById('ai-dropdown');
        
        // Add settings button to dropdown
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'api-settings-btn';
        settingsBtn.textContent = 'API Settings';
        dropdown.appendChild(settingsBtn);
        
        // Add clipboard toggle button
        const clipboardToggle = document.createElement('button');
        clipboardToggle.id = 'clipboard-toggle-btn';
        clipboardToggle.textContent = 'Toggle Clipboard Copilot';
        clipboardToggle.addEventListener('click', function() {
          // Hide dropdown
          document.getElementById("ai-dropdown").style.display = "none";
          
          // Toggle clipboard visibility
          if (window.clipboardMonitor && typeof window.clipboardMonitor.showClipboardCopilot === 'function') {
            window.clipboardMonitor.showClipboardCopilot();
          }
        });
        dropdown.appendChild(clipboardToggle);
        
        // Add event listener
        settingsBtn.addEventListener('click', showApiSettingsModal);
      }
      
      // Check if API keys are set
      const openaiKey = window.storage.getItem('openai_api_key');
      const geminiKey = window.storage.getItem('gemini_api_key');
      
      // Set the keys if they exist in storage
      if (openaiKey || geminiKey) {
        window.knowledgeApi.setApiKeys({
          openai: openaiKey || '',
          gemini: geminiKey || ''
        });
      }
    }
    
    /**
     * Show API settings modal
     */
    function showApiSettingsModal() {
      // Hide dropdown
      document.getElementById('ai-dropdown').style.display = 'none';
      
      // Get current keys from storage
      const openaiKey = window.storage.getItem('openai_api_key') || '';
      const geminiKey = window.storage.getItem('gemini_api_key') || '';
      
      // Create modal for API settings
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
          <div class="modal-content">
              <div class="modal-header">
                  <h3>API Settings</h3>
                  <button class="modal-close-btn">&times;</button>
              </div>
              <div class="modal-body">
                  <p>Enter your API keys for AI services. These will be stored in your browser's local storage.</p>
                  <div class="form-group">
                      <label for="openai-key">OpenAI API Key:</label>
                      <input type="password" id="openai-key" value="${openaiKey}" placeholder="Enter your OpenAI API key">
                      <button class="toggle-visibility-btn" data-target="openai-key">Show</button>
                  </div>
                  <div class="form-group">
                      <label for="gemini-key">Google Gemini API Key:</label>
                      <input type="password" id="gemini-key" value="${geminiKey}" placeholder="Enter your Gemini API key">
                      <button class="toggle-visibility-btn" data-target="gemini-key">Show</button>
                  </div>
                  <div class="api-links">
                      <p>
                          <a href="https://platform.openai.com/api-keys" target="_blank">Get OpenAI API key</a> | 
                          <a href="https://aistudio.google.com/app/apikey" target="_blank">Get Gemini API key</a>
                      </p>
                  </div>
                  <div class="form-actions">
                      <button id="save-api-keys-btn">Save Keys</button>
                      <button id="cancel-api-settings-btn">Cancel</button>
                  </div>
              </div>
          </div>
      `;
      
      document.body.appendChild(modal);
      
      // Toggle password visibility
      modal.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const targetId = this.getAttribute('data-target');
              const inputField = document.getElementById(targetId);
              
              if (inputField.type === 'password') {
                  inputField.type = 'text';
                  this.textContent = 'Hide';
              } else {
                  inputField.type = 'password';
                  this.textContent = 'Show';
              }
          });
      });
      
      // Close button
      modal.querySelector('.modal-close-btn').addEventListener('click', function() {
          modal.remove();
      });
      
      // Cancel button
      modal.querySelector('#cancel-api-settings-btn').addEventListener('click', function() {
          modal.remove();
      });
      
      // Save button
      modal.querySelector('#save-api-keys-btn').addEventListener('click', function() {
          const newOpenaiKey = document.getElementById('openai-key').value.trim();
          const newGeminiKey = document.getElementById('gemini-key').value.trim();
          
          // Save to storage
          window.storage.setItem('openai_api_key', newOpenaiKey);
          window.storage.setItem('gemini_api_key', newGeminiKey);
          
          // Update active keys
          window.knowledgeApi.setApiKeys({
              openai: newOpenaiKey,
              gemini: newGeminiKey
          });
          
          // Show confirmation message
          window.knowledgeApi.showStatusMessage("API keys saved successfully");
          
          // Close modal
          modal.remove();
      });
      
      // Close modal when clicking outside
      modal.addEventListener('click', function(e) {
          if (e.target === modal) {
              modal.remove();
          }
      });
      
      // Add some styles for the API settings form if not already in document
      if (!document.getElementById('api-settings-styles')) {
          const style = document.createElement('style');
          style.id = 'api-settings-styles';
          style.textContent = `
              .form-group {
                  position: relative;
                  margin-bottom: 15px;
              }
              .form-group input[type="password"],
              .form-group input[type="text"] {
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  padding-right: 50px;
              }
              .toggle-visibility-btn {
                  position: absolute;
                  right: 5px;
                  top: 50%;
                  transform: translateY(-50%);
                  background: none;
                  border: none;
                  color: #233749;
                  cursor: pointer;
                  font-size: 12px;
              }
              .api-links {
                  font-size: 12px;
                  margin: 10px 0 20px;
                  text-align: center;
              }
              .api-links a {
                  color: #233749;
                  text-decoration: none;
              }
              .api-links a:hover {
                  text-decoration: underline;
              }
          `;
          document.head.appendChild(style);
      }
    }
  
    /**
     * Initialize the document
     */
    function initializeDocument() {
      // Update breadcrumb with title
      updateBreadcrumb();
  
      // Add event listener for document title changes
      document
        .getElementById("document-title")
        .addEventListener("input", updateBreadcrumb);
  
      // Set up document-level drag events
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+C to toggle clipboard copilot
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          if (window.clipboardMonitor && typeof window.clipboardMonitor.showClipboardCopilot === 'function') {
            window.clipboardMonitor.showClipboardCopilot();
          }
        }
        
        // Ctrl+B to toggle sidebar
        if (e.ctrlKey && e.key === 'b') {
          e.preventDefault();
          if (window.sidebar && typeof window.sidebar.toggleSidebar === 'function') {
            window.sidebar.toggleSidebar();
          }
        }
      });
    }
  
    /**
     * Update breadcrumb with current document title
     */
    function updateBreadcrumb() {
      const title = document.getElementById("document-title").textContent;
      document.querySelector(".file-title").textContent =
        title || "Untitled Document";
    }
  
    /**
     * Initialize all event listeners
     */
    function initializeEventListeners() {
      // AI Tools dropdown
      document
        .getElementById("ai-tools-btn")
        .addEventListener("click", toggleAIDropdown);
  
      // Tool buttons
      document
        .getElementById("pdf-tree-btn")
        .addEventListener("click", showPdfKnowledgeWindow);
      document
        .getElementById("clipboard-copilot-btn")
        .addEventListener("click", showClipboardCopilotWindow);
      document
        .getElementById("notes-tree-btn")
        .addEventListener("click", showNotesTreeWindow);
  
      // Formatting tools
      initializeFormattingTools();
  
      // Close dropdowns when clicking outside
      document.addEventListener("click", function (event) {
        if (
          !event.target.matches("#ai-tools-btn") &&
          !event.target.closest("#ai-dropdown")
        ) {
          document.getElementById("ai-dropdown").style.display = "none";
        }
  
        // Close any dropdown panels when clicking outside
        if (
          !event.target.matches(".control-item button") &&
          !event.target.closest(".dropdown-panel")
        ) {
          document.querySelectorAll(".dropdown-panel").forEach((panel) => {
            panel.style.display = "none";
          });
        }
      });
  
      // Make document body editable
      document
        .getElementById("document-body")
        .addEventListener("focus", function () {
          this.classList.add("editing");
        });
  
      document
        .getElementById("document-body")
        .addEventListener("blur", function () {
          this.classList.remove("editing");
        });
  
      // Node details panel tab functionality
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          // Remove active class from all tabs
          document
            .querySelectorAll(".tab-btn")
            .forEach((b) => b.classList.remove("active"));
          // Add active class to clicked tab
          this.classList.add("active");
  
          // Hide all tab panels
          document
            .querySelectorAll(".tab-panel")
            .forEach((p) => p.classList.remove("active"));
          // Show selected tab panel
          const tabId = this.getAttribute("data-tab") + "-tab";
          document.getElementById(tabId).classList.add("active");
        });
      });
  
      // Close node details panel
      document
        .querySelector(".close-details-btn")
        .addEventListener("click", function () {
          document.getElementById("node-details-panel").style.display = "none";
          // Deselect node in visualization if it exists
          if (app.selectedNode) {
            d3.select(app.selectedNode).classed("selected", false);
            app.selectedNode = null;
          }
        });
    }
  
    /**
     * Initialize formatting tools
     */
    function initializeFormattingTools() {
      const formatButtons = document.querySelectorAll(".tool-button");
  
      formatButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const title = this.getAttribute("title");
  
          // Apply formatting based on button clicked
          if (title === "Bold") {
            document.execCommand("bold", false, null);
            this.classList.toggle("active");
          } else if (title === "Italic") {
            document.execCommand("italic", false, null);
            this.classList.toggle("active");
          } else if (title === "Underline") {
            document.execCommand("underline", false, null);
            this.classList.toggle("active");
          } else if (title === "Heading 1") {
            window.utils.applyHeadingFormat("h1");
          } else if (title === "Heading 2") {
            window.utils.applyHeadingFormat("h2");
          } else if (title === "Heading 3") {
            window.utils.applyHeadingFormat("h3");
          } else if (title === "Bullet List") {
            document.execCommand("insertUnorderedList", false, null);
          } else if (title === "Numbered List") {
            document.execCommand("insertOrderedList", false, null);
          } else if (title === "To-do List") {
            // Custom to-do list implementation
            window.utils.insertTodoList();
          } else if (title === "Add Link") {
            const url = prompt("Enter the URL:");
            if (url) {
              document.execCommand("createLink", false, url);
            }
          } else if (title === "Add Image") {
            const imageUrl = prompt("Enter the image URL:");
            if (imageUrl) {
              document.execCommand("insertImage", false, imageUrl);
            }
          }
  
          // Return focus to the editor
          document.getElementById("document-body").focus();
        });
      });
    }
  
    /**
     * Toggle AI Tools dropdown
     */
    function toggleAIDropdown() {
      const dropdown = document.getElementById("ai-dropdown");
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    }
  
    /**
     * Show PDF Knowledge Tree Window
     */
    function showPdfKnowledgeWindow() {
      // Hide dropdown
      document.getElementById("ai-dropdown").style.display = "none";
  
      // Create window
      const pdfKnowledgeWindow = document
        .getElementById("pdf-knowledge-window")
        .cloneNode(true);
      pdfKnowledgeWindow.id = "active-pdf-knowledge";
      pdfKnowledgeWindow.style.display = "block";
  
      // Insert window into document
      window.utils.insertWindowAtCursor(pdfKnowledgeWindow);
  
      // Initialize window events
      initializePdfKnowledgeWindow(pdfKnowledgeWindow);
    }
  
    /**
     * Show Clipboard Copilot Window
     */
    function showClipboardCopilotWindow() {
      // Hide dropdown
      document.getElementById("ai-dropdown").style.display = "none";
  
      // Show the floating clipboard copilot instead of creating a new window
      if (window.clipboardMonitor && typeof window.clipboardMonitor.showClipboardCopilot === 'function') {
        window.clipboardMonitor.showClipboardCopilot();
      }
    }
  
    /**
     * Show Notes Tree Generator Window
     */
    function showNotesTreeWindow() {
      // Hide dropdown
      document.getElementById("ai-dropdown").style.display = "none";
  
      // Create window
      const notesTreeWindow = document
        .getElementById("notes-tree-window")
        .cloneNode(true);
      notesTreeWindow.id = "active-notes-tree";
      notesTreeWindow.style.display = "block";
  
      // Insert window into document
      window.utils.insertWindowAtCursor(notesTreeWindow);
  
      // Initialize window events
      initializeNotesTreeWindow(notesTreeWindow);
    }
  
    /**
     * Initialize PDF Knowledge Tree Window
     * @param {HTMLElement} windowElement - The window element
     */
    function initializePdfKnowledgeWindow(windowElement) {
      // Reset uploaded files
      app.uploadedFiles = [];
  
      // Drag handle
      const dragHandle = windowElement.querySelector(".window-drag-handle");
      if (dragHandle) {
        dragHandle.addEventListener("mousedown", function (e) {
          handleDragStart(e, windowElement);
        });
      }
  
      // File upload
      const fileUpload = windowElement.querySelector('input[type="file"]');
      const dropZone = windowElement.querySelector("#drop-zone");
  
      if (fileUpload) {
        fileUpload.addEventListener("change", function (e) {
          window.pdfProcessor.handleFiles(Array.from(this.files), windowElement);
        });
      }
  
      if (dropZone) {
        // Drag and drop events
        dropZone.addEventListener("dragover", function (e) {
          e.preventDefault();
          this.classList.add("drag-over");
        });
  
        dropZone.addEventListener("dragleave", function (e) {
          e.preventDefault();
          this.classList.remove("drag-over");
        });
  
        dropZone.addEventListener("drop", function (e) {
          e.preventDefault();
          this.classList.remove("drag-over");
          window.pdfProcessor.handleFiles(
            Array.from(e.dataTransfer.files),
            windowElement
          );
        });
      }
  
      // Close button
      const closeBtn = windowElement.querySelector(".close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          windowElement.remove();
        });
      }
  
      // Generate button
      const generateBtn = windowElement.querySelector("#generate-tree-btn");
      if (generateBtn) {
        generateBtn.addEventListener("click", function () {
          if (this.classList.contains("disabled")) return;
          window.pdfProcessor.generateKnowledgeTree(windowElement);
        });
      }
  
      // Model selection
      const modelSelectBtn = windowElement.querySelector("#model-select-btn");
      if (modelSelectBtn) {
        modelSelectBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleDropdownPanelInline(windowElement, ".model-dropdown");
        });
      }
  
      // Model options
      const modelOptions = windowElement.querySelectorAll(".model-option");
      modelOptions.forEach((option) => {
        option.addEventListener("click", function () {
          // Update app state
          app.selectedModel = this.getAttribute("data-model");
  
          // Update UI
          windowElement.querySelectorAll(".model-option").forEach((opt) => {
            opt.classList.remove("selected");
          });
          this.classList.add("selected");
  
          // Update button text
          windowElement.querySelector("#model-select-btn").textContent =
            this.textContent + " ▼";
  
          // Hide dropdown
          windowElement.querySelector(".model-dropdown").style.display = "none";
  
          console.log("Selected model:", app.selectedModel);
        });
      });
  
      // Other buttons
      const manageFilesBtn = windowElement.querySelector("#manage-files-btn");
      if (manageFilesBtn) {
        manageFilesBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleDropdownPanelInline(windowElement, ".files-dropdown");
        });
      }
  
      const customizeStructureBtn = windowElement.querySelector(
        "#customize-structure-btn"
      );
      if (customizeStructureBtn) {
        customizeStructureBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleDropdownPanelInline(windowElement, ".structure-dropdown");
        });
      }
    }
  
    /**
     * Initialize Notes Tree Window
     * @param {HTMLElement} windowElement - The window element
     */
    function initializeNotesTreeWindow(windowElement) {
      // Reset notes array
      app.notesArray = [];
  
      // Drag handle
      const dragHandle = windowElement.querySelector(".window-drag-handle");
      if (dragHandle) {
        dragHandle.addEventListener("mousedown", function (e) {
          handleDragStart(e, windowElement);
        });
      }
  
      // Close button
      const closeBtn = windowElement.querySelector(".close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          windowElement.remove();
        });
      }
  
      // Add note button
      const addNoteBtn = windowElement.querySelector("#add-note-btn");
      if (addNoteBtn) {
        addNoteBtn.addEventListener("click", function () {
          const textarea = windowElement.querySelector("#notes-textarea");
          window.treeGenerator.addNoteFromTextarea(textarea, windowElement);
        });
      }
  
      // Clear notes button
      const clearNotesBtn = windowElement.querySelector("#clear-notes-btn");
      if (clearNotesBtn) {
        clearNotesBtn.addEventListener("click", function () {
          window.treeGenerator.clearNotes(windowElement);
        });
      }
  
      // Enter key in textarea adds the note
      const notesTextarea = windowElement.querySelector("#notes-textarea");
      if (notesTextarea) {
        notesTextarea.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            window.treeGenerator.addNoteFromTextarea(this, windowElement);
          }
        });
  
        // Initialize with example notes if empty
        if (!notesTextarea.value) {
          notesTextarea.value = `Reinforcement Learning uses rewards to train agents
  Supervised learning requires labeled data
  Transformers are used in large language models
  Activation functions introduce non-linearity
  Backpropagation is used to train neural networks`;
        }
      }
  
      // Generate tree button
      const generateBtn = windowElement.querySelector("#generate-notes-tree-btn");
      if (generateBtn) {
        generateBtn.addEventListener("click", function () {
          window.treeGenerator.generateKnowledgeTree(
            windowElement,
            app.selectedModel
          );
        });
      }
    }
  
    /**
     * Toggle dropdown panel in inline window
     * @param {HTMLElement} windowElement - Window element
     * @param {string} selector - Selector for dropdown panel
     */
    function toggleDropdownPanelInline(windowElement, selector) {
      const panel = windowElement.querySelector(selector);
  
      // Close all other dropdowns in this window
      windowElement.querySelectorAll(".dropdown-panel").forEach((p) => {
        if (p !== panel) p.style.display = "none";
      });
  
      // Toggle this dropdown
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    }
  
    /**
     * Toggle more options panel
     * @param {HTMLElement} container - Container element
     */
    function toggleMoreOptionsPanel(container) {
      const optionsPanel = container.querySelector(".more-options-panel");
      if (optionsPanel) {
        optionsPanel.style.display =
          optionsPanel.style.display === "none" ? "block" : "none";
      }
    }
  
    /**
     * Handle drag start for draggable windows
     * @param {Event} e - Mouse event
     * @param {HTMLElement} element - Element to drag
     */
    function handleDragStart(e, element) {
      // Only handle left mouse button
      if (e.button !== 0) return;
  
      e.preventDefault();
      e.stopPropagation();
  
      // Get starting position
      app.startY = e.clientY;
  
      // Set dragging state
      app.isDragging = true;
      app.currentDragTarget = element;
      element.classList.add("dragging");
  
      // Create a placeholder for drop targets
      createDragPlaceholder(element);
  
      // Calculate possible drop locations
      updateDropTargets(e.clientY);
    }
  
    /**
     * Create drag placeholder
     * @param {HTMLElement} element - Element being dragged
     */
    function createDragPlaceholder(element) {
      // Remove existing placeholder if any
      if (app.dragPlaceholder) {
        app.dragPlaceholder.remove();
      }
  
      // Clone element dimensions but make it a placeholder
      app.dragPlaceholder = document.createElement("div");
      app.dragPlaceholder.className = "drag-placeholder";
      app.dragPlaceholder.style.height = element.offsetHeight + "px";
      app.dragPlaceholder.style.opacity = "0.2";
  
      // Insert after the element
      if (element.nextSibling) {
        element.parentNode.insertBefore(app.dragPlaceholder, element.nextSibling);
      } else {
        element.parentNode.appendChild(app.dragPlaceholder);
      }
  
      // Hide it initially
      app.dragPlaceholder.style.display = "none";
    }
  
    /**
     * Update drop targets based on cursor position
     * @param {number} clientY - Cursor Y position
     */
    function updateDropTargets(clientY) {
      const docBody = document.getElementById("document-body");
      const bodyRect = docBody.getBoundingClientRect();
  
      // Convert client coordinates to document body coordinates
      const relativeY = clientY - bodyRect.top;
  
      // Get all direct children of the document body
      const children = Array.from(docBody.children);
  
      // Skip the current drag target in our calculations
      const filteredChildren = children.filter(
        (child) =>
          child !== app.currentDragTarget && child !== app.dragPlaceholder
      );
  
      // No children or only the current drag target
      if (filteredChildren.length === 0) {
        // Just place at the beginning or end
        if (relativeY < bodyRect.height / 2) {
          app.dropTarget = { element: null, position: "start" };
        } else {
          app.dropTarget = { element: null, position: "end" };
        }
        return;
      }
  
      // Find the closest element to the cursor
      for (let i = 0; i < filteredChildren.length; i++) {
        const child = filteredChildren[i];
        const childRect = child.getBoundingClientRect();
        const childMiddle = childRect.top + childRect.height / 2 - bodyRect.top;
  
        if (relativeY < childMiddle) {
          // Place before this child
          app.dropTarget = { element: child, position: "before" };
          return;
        }
      }
  
      // If we get here, place after the last child
      app.dropTarget = {
        element: filteredChildren[filteredChildren.length - 1],
        position: "after",
      };
    }
  
    /**
     * Handle drag move
     * @param {Event} e - Mouse event
     */
    function handleDragMove(e) {
      if (!app.isDragging || !app.currentDragTarget) return;
  
      // If dragging, update drop targets
      updateDropTargets(e.clientY);
  
      // Update drag placeholder position
      updateDragPlaceholder();
    }
  
    /**
     * Update drag placeholder position
     */
    function updateDragPlaceholder() {
      if (!app.dragPlaceholder || !app.dropTarget) return;
  
      // Show the placeholder
      app.dragPlaceholder.style.display = "block";
  
      const docBody = document.getElementById("document-body");
  
      // Position the placeholder based on drop target
      if (app.dropTarget.position === "start") {
        // At the start of document
        docBody.insertBefore(app.dragPlaceholder, docBody.firstChild);
      } else if (app.dropTarget.position === "end") {
        // At the end of document
        docBody.appendChild(app.dragPlaceholder);
      } else if (app.dropTarget.position === "before") {
        // Before the target element
        docBody.insertBefore(app.dragPlaceholder, app.dropTarget.element);
      } else if (app.dropTarget.position === "after") {
        // After the target element
        if (app.dropTarget.element.nextSibling) {
          docBody.insertBefore(
            app.dragPlaceholder,
            app.dropTarget.element.nextSibling
          );
        } else {
          docBody.appendChild(app.dragPlaceholder);
        }
      }
    }
  
    /**
     * Handle drag end
     * @param {Event} e - Mouse event
     */
    function handleDragEnd(e) {
      if (!app.isDragging) return;
  
      app.isDragging = false;
  
      if (app.currentDragTarget) {
        app.currentDragTarget.classList.remove("dragging");
  
        // Move the element to the drop location
        moveElementToDropLocation();
  
        // Reset
        app.currentDragTarget = null;
      }
  
      // Remove placeholder
      if (app.dragPlaceholder) {
        app.dragPlaceholder.remove();
        app.dragPlaceholder = null;
      }
  
      app.dropTarget = null;
    }
  
    /**
     * Move element to drop location
     */
    function moveElementToDropLocation() {
      if (!app.currentDragTarget || !app.dropTarget) return;
  
      const docBody = document.getElementById("document-body");
  
      // Temporarily remove the element
      app.currentDragTarget.remove();
  
      // Place it in the new location
      if (app.dropTarget.position === "start") {
        docBody.insertBefore(app.currentDragTarget, docBody.firstChild);
      } else if (app.dropTarget.position === "end") {
        docBody.appendChild(app.currentDragTarget);
      } else if (app.dropTarget.position === "before") {
        docBody.insertBefore(app.currentDragTarget, app.dropTarget.element);
      } else if (app.dropTarget.position === "after") {
        if (app.dropTarget.element.nextSibling) {
          docBody.insertBefore(
            app.currentDragTarget,
            app.dropTarget.element.nextSibling
          );
        } else {
          docBody.appendChild(app.currentDragTarget);
        }
      }
    }
  
    /**
     * Load saved data from storage
     */
    function loadSavedData() {
      // Load saved document if exists
      try {
        const savedDocument = window.storage.getItem("webNotebookDocument");
        if (savedDocument) {
          // Verify it's a valid document object before using it
          if (
            typeof savedDocument === "object" &&
            savedDocument !== null &&
            savedDocument.title &&
            savedDocument.content
          ) {
            document.getElementById("document-title").textContent =
              savedDocument.title;
            document.getElementById("document-body").innerHTML =
              savedDocument.content;
            updateBreadcrumb();
          } else {
            // If data doesn't look right, remove it
            console.warn("Invalid document data found, removing it");
            window.storage.removeItem("webNotebookDocument");
          }
        }
      } catch (e) {
        console.error("Error loading saved document:", e);
        // Remove potentially corrupted data
        window.storage.removeItem("webNotebookDocument");
      }
  
      // Load saved road map if exists
      try {
        const savedRoadMap = window.storage.getItem("webNotebookRoadMap");
        if (savedRoadMap && Array.isArray(savedRoadMap)) {
          // Initialize road map with data
          window.textProcessor.initializeRoadMap(savedRoadMap);
        }
      } catch (e) {
        console.error("Error loading saved road map:", e);
        // Remove potentially corrupted data
        window.storage.removeItem("webNotebookRoadMap");
      }
      
      // Load user preferences
      try {
        const preferences = window.storage.getPreferences();
        
        // Apply sidebar visibility
        if (preferences.sidebarVisible && window.sidebar) {
          window.sidebar.showSidebar();
        }
        
        // Apply clipboard copilot visibility
        if (preferences.clipboardEnabled && window.clipboardMonitor) {
          window.clipboardMonitor.showClipboardCopilot();
        }
      } catch (e) {
        console.error("Error loading user preferences:", e);
      }
    }
  });