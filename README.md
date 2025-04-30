# SelfLearn

## Notebook Functionality

# Web Notebook

A comprehensive web-based learning and knowledge management application featuring an intuitive file manager, AI-powered content extraction, and knowledge tree visualization.

## Features

### 1. Interface & File Management
- **Two Viewing Modes**: Switch between Icon View and Tree View
- **Multiple Node Types**: Files, folders, knowledge points, AI-generated notes, and roadmap nodes
- **Learning Roadmap Integration**: Track learning progress with visual indicators
- **Drag & Drop**: Easily reorganize your knowledge hierarchy
- **Context Menu**: Right-click for quick actions

### 2. AI Copilot for Content Extraction
- **Clipboard Monitoring**: Automatically captures copied text when enabled
- **Smart Processing**: Convert captured content into summaries, Q&A format, or add to knowledge trees
- **Custom Prompts**: Customize AI instructions for tailored content processing
- **History Tracking**: Access and reuse previously processed content

### 3. Knowledge Tree Visualization
- **Dynamic Tree Editor**: Create, edit, and organize knowledge structures
- **Multiple Views**: Toggle between mind map and hierarchical list views
- **AI-Assisted Organization**: Get suggestions for categorizing and structuring content
- **Export Options**: Export as Markdown, PDF, or mind map files

## Project Structure

```
WebNotebook/
├── index.html             # Main entry point
├── styles/                # CSS files
│   ├── main.css           # Main styling
│   ├── interface.css      # File management styles
│   ├── knowledge-tree.css # Tree visualization styles
│   ├── copilot.css        # AI copilot styles
│   ├── ai-window.css      # AI window styles
│   └── themes.css         # Theme customization
├── js/                    # JavaScript files
│   ├── app.js             # Application initialization
│   ├── interface/         # File management modules
│   ├── copilot/           # AI copilot modules
│   ├── knowledge-tree/    # Knowledge tree modules
│   └── utils/             # Utility functions
└── assets/                # Static assets
    ├── icons/             # UI icons
    ├── templates/         # HTML templates
    └── examples/          # Example files
```
--------------

WebNotebook/
├── index.html             # Main entry point
├── styles/
│   ├── main.css           # Main styling
│   ├── interface.css      # File management interface styles
│   ├── knowledge-tree.css # Knowledge tree visualization styles
│   ├── copilot.css        # AI copilot styles
│   └── themes.css         # Theme customization
├── js/
│   ├── app.js             # Application initialization
│   ├── interface/
│   │   ├── fileManager.js        # File/node management
│   │   ├── viewModes.js          # Icon/Tree view switching
│   │   ├── contextMenu.js        # Right-click menu
│   │   ├── dragDrop.js           # Drag and drop functionality
│   │   └── roadmapTracker.js     # Learning roadmap progression
│   ├── copilot/
│   │   ├── clipboardMonitor.js   # Clipboard monitoring
│   │   ├── aiProcessor.js        # AI processing of content
│   │   ├── promptManager.js      # AI prompt management
│   │   └── historyTracker.js     # Content history logging
│   ├── knowledge-tree/
│   │   ├── treeEditor.js         # Tree creation and editing
│   │   ├── nodeTypes.js          # Node type definitions
│   │   ├── aiOrganizer.js        # AI suggestions for organization
│   │   ├── visualizer.js         # Tree visualization
│   │   └── exportManager.js      # Export functionality
│   └── utils/
│       ├── storage.js            # Local storage management
│       ├── search.js             # Search functionality
│       ├── pdfProcessor.js       # PDF handling
│       └── apiService.js         # API communication
└── assets/
    ├── icons/                   # UI icons
    ├── templates/               # HTML templates
    └── examples/                # Example files