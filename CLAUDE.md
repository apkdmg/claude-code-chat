# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code Chat is a VS Code extension that provides a beautiful, integrated chat interface for interacting with Anthropic's Claude Code AI directly within VS Code. The extension eliminates the need for command-line interactions by offering a rich graphical user interface with features like session management, checkpoint/restore system, and WSL support.

## Development Commands

### Build & Compilation
```bash
npm run compile          # Compile TypeScript to JavaScript
npm run watch           # Compile in watch mode (auto-recompile on changes)
npm run vscode:prepublish # Pre-publish build
```

### Testing
```bash
npm test               # Run extension tests
npm run pretest        # Run compile + lint before tests
```

### Code Quality
```bash
npm run lint           # Run ESLint on TypeScript source files
```

### Development Mode
- Press `F5` in VS Code to launch Extension Development Host
- Use `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) to open Claude Code Chat
- Access via Command Palette: "Claude Code: Open Chat"

### Extension Packaging
```bash
npx vsce package       # Create .vsix package file
```

## Architecture Overview

### Core Components
- **`src/extension.ts`** (1565 lines): Main extension entry point containing:
  - `ClaudeChatProvider`: Core chat functionality and Claude process management
  - `ClaudeChatWebviewProvider`: Sidebar webview integration  
  - `ClaudeChatHistoryProvider`: Conversation history tree view
- **`src/ui.ts`**: HTML template for webview interface
- **`src/ui-styles.ts`**: CSS styles using VS Code theme variables

### Key Features Implementation
- **Webview-based UI**: Rich HTML/CSS interface instead of native VS Code components
- **JSON Stream Processing**: Real-time Claude Code output parsing and display
- **Git-based Checkpoints**: Automatic backup system using Git for safe experimentation
- **Session Persistence**: Conversation history saved to workspace storage
- **Process Management**: Child process handling for Claude Code CLI integration
- **WSL Integration**: Cross-platform compatibility with Windows development

### VS Code Integration Points
- **Activity Bar**: Custom container with Claude icon
- **Sidebar Views**: Chat webview and history tree view
- **Commands**: Multiple commands for opening chat, managing sessions, toggling settings
- **Keybindings**: `Ctrl+Shift+C` primary shortcut
- **Context Menus**: Available in editor, explorer, and other VS Code contexts

## Configuration

### Extension Settings
- **WSL Integration**: Full Windows Subsystem for Linux support
  - `claudeCodeChat.wsl.enabled`: Enable/disable WSL mode
  - `claudeCodeChat.wsl.distro`: WSL distribution name (e.g., "Ubuntu")
  - `claudeCodeChat.wsl.nodePath`: Node.js path in WSL (default: "/usr/bin/node")
  - `claudeCodeChat.wsl.claudePath`: Claude executable path in WSL (default: "/usr/local/bin/claude")
- **Thinking Mode**: Configurable AI reasoning intensity
  - `claudeCodeChat.thinking.intensity`: "think", "think-hard", "think-harder", "ultrathink"

### Technical Stack
- **TypeScript**: ES2022 target, Node16 module system, strict mode enabled
- **VS Code Extension API**: Native VS Code integration
- **No Runtime Dependencies**: Self-contained extension
- **Development Tools**: ESLint, TypeScript compiler, VS Code test framework

## Development Notes

### File Structure
- **Source**: `src/` directory with TypeScript files
- **Compiled Output**: `out/` directory (auto-generated)
- **Entry Point**: `./out/extension.js` (compiled from `src/extension.ts`)
- **Tests**: `src/test/extension.test.ts`

### Code Conventions
- Use existing VS Code theme variables in CSS
- Follow TypeScript strict mode requirements
- Maintain separation between chat provider, webview provider, and history provider
- Handle process lifecycle carefully for Claude CLI integration

### Prerequisites for Development
- VS Code 1.94.0+
- Node.js 20.x
- Claude Code CLI installed and configured
- Active Claude API subscription or Pro/Max plan

### WSL Development (Windows)
Extension supports WSL development with configurable paths for Node.js and Claude executable within WSL distributions. Configure via VS Code settings for proper WSL integration.