# Project File Structure

<!-- 
This document provides a comprehensive overview of the Claude Code Chat VS Code Extension 
file structure and organization. It serves as a reference for developers working on the 
project to understand the codebase layout, key components, and architectural decisions.

The extension provides a beautiful, integrated chat interface for interacting with 
Anthropic's Claude Code AI directly within VS Code, eliminating the need for 
command-line interactions.
-->

Claude Code Chat VS Code Extension

```
claude-code-chat/
├── src/                           # Source TypeScript files
│   ├── extension.ts               # Main extension entry point (1565 lines)
│   ├── ui.ts                      # HTML template for webview interface
│   ├── ui-styles.ts               # CSS styles using VS Code theme variables
│   └── test/
│       └── extension.test.ts      # Extension tests
├── out/                           # Compiled JavaScript output (auto-generated)
│   ├── extension.js               # Compiled main extension
│   ├── extension.js.map           # Source map
│   ├── ui.js                      # Compiled UI template
│   ├── ui.js.map                  # Source map
│   ├── ui-styles.js               # Compiled styles
│   ├── ui-styles.js.map           # Source map
│   └── test/
│       ├── extension.test.js      # Compiled tests
│       └── extension.test.js.map  # Source map
├── node_modules/                  # Dependencies
├── CHANGELOG.md                   # Version history
├── CLAUDE.md                      # Project instructions for Claude Code
├── ERROR_HANDLING_REFACTOR_PLAN.md # Refactoring documentation
├── LICENSE                        # Project license
├── PHASE_1_RESEARCH.md           # Research documentation
├── README.md                      # Project documentation
├── TEST_SETTINGS.md              # Testing configuration guide
├── UI_REFACTOR_PLAN.md           # UI refactoring documentation
├── claude-code-chat-0.1.3.vsix  # Extension package file
├── eslint.config.mjs             # ESLint configuration
├── icon.png                      # Extension icon
├── package.json                  # Project configuration and dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
└── vsc-extension-quickstart.md   # VS Code extension development guide
```

## Key Files

### Core Source Files
- **`src/extension.ts`**: Main extension entry point containing ClaudeChatProvider, ClaudeChatWebviewProvider, and ClaudeChatHistoryProvider
- **`src/ui.ts`**: HTML template for the webview interface
- **`src/ui-styles.ts`**: CSS styles using VS Code theme variables

### Configuration Files
- **`package.json`**: Extension manifest with activation events, commands, keybindings, and settings
- **`tsconfig.json`**: TypeScript compiler configuration (ES2022 target, Node16 modules, strict mode)
- **`eslint.config.mjs`**: Code quality and style enforcement

### Documentation Files
- **`CLAUDE.md`**: Development guidance and project overview for Claude Code
- **`README.md`**: User-facing documentation
- **`CHANGELOG.md`**: Version history and release notes

### Build Artifacts
- **`out/`**: Compiled JavaScript files generated from TypeScript source
- **`claude-code-chat-0.1.3.vsix`**: Packaged extension ready for installation

## Architecture

The extension follows VS Code extension best practices with:
- TypeScript source in `src/`
- Compiled output in `out/`
- Comprehensive testing setup
- ESLint for code quality
- Proper dependency management with npm