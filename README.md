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

WebNotebook/
├── index.html                # Main entry point
├── css/                      # CSS files
│   ├── main.css              # Core styling
│   ├── knowledge-tree.css    # Knowledge tree visualization styling
│   ├── pdf-processor.css     # PDF processor styling
│   ├── clipboard.css         # Clipboard monitor styling
├── js/
│   ├── app.js                # Main application initialization
│   ├── utils.js              # Utility functions
│   ├── storage.js            # Local storage management
│   ├── knowledge-tools/
│   │   ├── knowledge-api.js  # API calls for AI processing
│   │   ├── tree-generator.js # Knowledge tree generation from notes
│   │   ├── tree-visualizer.js # Tree visualization with D3.js
│   ├── pdf-tools/
│   │   ├── pdf-parser.js     # PDF extraction and parsing
│   │   ├── pdf-processor.js  # PDF to knowledge tree processing
│   ├── clipboard-tools/
│   │   ├── clipboard-monitor.js # Clipboard monitoring
│   │   ├── text-processor.js    # Processing clipboard text