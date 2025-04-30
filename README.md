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

## Setup Instructions

### Option 1: Using the Setup Script

1. Make the setup script executable:
   ```bash
   chmod +x setup.sh
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Copy the full HTML and CSS content from the provided files to the respective files in the project structure.

### Option 2: Manual Setup

1. Create the directory structure as shown above.
2. Create each file with its respective content from the provided files.

## Running the Application

You can use any local development server to run the application. Here are a few options:

### Using Python's built-in HTTP server

```bash
cd WebNotebook
python -m http.server
```

Then visit `http://localhost:8000` in your browser.

### Using Node.js with http-server

First, install http-server:
```bash
npm install -g http-server
```

Then run:
```bash
cd WebNotebook
http-server
```

Visit the URL shown in the terminal (usually `http://localhost:8080`).

## Development Guidelines

### Adding New Features

1. **Module-Based Development**: Place new functionality in the appropriate module directory.
2. **Consistent Styling**: Follow the established CSS patterns and use theme variables.
3. **JavaScript Architecture**: Use the initialization pattern established in the example files.

### Code Style Guidelines

- Use meaningful variable and function names
- Comment complex sections of code
- Follow the established modular structure
- Keep functions small and focused on a single task
- Use consistent indentation (2 or 4 spaces)

## Browser Compatibility

The application is designed to work on modern browsers with the following features:
- ES6+ JavaScript support
- CSS Grid and Flexbox
- LocalStorage API
- Clipboard API (for Copilot functionality)

## Future Enhancements

- User authentication and cloud synchronization
- Collaborative editing capabilities
- Enhanced AI suggestions for learning paths
- Mobile app integration

## License

MIT License