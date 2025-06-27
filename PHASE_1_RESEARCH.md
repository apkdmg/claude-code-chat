# Phase 1: Architecture Planning & Research

## Task 1.1: VS Code Sidebar Panel API Research

### Current Implementation Analysis
The Claude Code Chat extension currently uses:
- **Activity Bar Container**: `claude-code-chat` with custom icon
- **Tree View**: `ClaudeChatViewProvider` implementing `vscode.TreeDataProvider<vscode.TreeItem>`
- **Webview Panel**: `ClaudeChatProvider` using `vscode.window.createWebviewPanel()`
- **View Location**: Separate floating/docked webview panel

### Target Implementation: Sidebar Panel
To move to sidebar panel, we need to implement:
- **WebviewViewProvider**: Replace `TreeDataProvider` with `vscode.WebviewViewProvider`
- **Sidebar Integration**: Use existing activity bar container but change view type
- **View Registration**: Use `vscode.window.registerWebviewViewProvider()` instead of `createWebviewPanel()`

### Required API Changes

#### 1. Package.json Contributions
**Current Configuration:**
```json
"views": {
  "claude-code-chat": [
    {
      "id": "claude-code-chat.chat",
      "name": "Claude Code Chat",
      "when": "true",
      "icon": "icon.png",
      "contextualTitle": "Claude Code Chat"
    }
  ]
},
"viewsContainers": {
  "activitybar": [
    {
      "id": "claude-code-chat",
      "title": "Claude Code Chat",
      "icon": "icon.png"
    }
  ]
}
```

**Required Changes:**
```json
"views": {
  "claude-code-chat": [
    {
      "type": "webview",
      "id": "claude-code-chat.chatView",
      "name": "Chat",
      "when": "true",
      "icon": "icon.png",
      "contextualTitle": "Claude Code Chat"
    },
    {
      "id": "claude-code-chat.history",
      "name": "Conversation History",
      "when": "true",
      "icon": "$(history)"
    }
  ]
}
```

#### 2. Extension Activation Changes
**Current Registration:**
```typescript
// Register tree data provider
const provider = new ClaudeChatViewProvider(context.extensionUri, context);
vscode.window.registerTreeDataProvider('claude-code-chat.chat', provider);

// Register webview panel provider
const claudeChatProvider = new ClaudeChatProvider(context.extensionUri, context);
```

**Required Registration:**
```typescript
// Register webview view provider for sidebar
const chatViewProvider = new ClaudeChatWebviewProvider(context.extensionUri, context);
vscode.window.registerWebviewViewProvider('claude-code-chat.chatView', chatViewProvider);

// Keep tree data provider for conversation history
const historyProvider = new ClaudeChatHistoryProvider(context.extensionUri, context);
vscode.window.registerTreeDataProvider('claude-code-chat.history', historyProvider);
```

## Task 1.2: Current Webview Implementation Analysis

### ClaudeChatProvider Class Structure
**Key Properties:**
- `_panel: vscode.WebviewPanel | undefined` - Main webview panel
- `_disposables: vscode.Disposable[]` - Cleanup management
- Session management (cost tracking, conversation history)
- Claude process management
- Backup repository integration

**Key Methods:**
- `show()` - Creates/reveals webview panel
- `_getHtmlForWebview()` - Generates webview HTML content
- Message handling for webview communication
- Conversation management and persistence

### Migration Requirements
**WebviewViewProvider Interface:**
```typescript
interface WebviewViewProvider {
  resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    token: CancellationToken
  ): void | Thenable<void>;
}
```

**Key Differences:**
1. **Lifecycle**: `resolveWebviewView()` instead of `show()`
2. **Context**: `WebviewView` instead of `WebviewPanel`
3. **Visibility**: Managed by VS Code sidebar, not extension
4. **Disposal**: Different cleanup patterns

### UI Components Dependencies
**Current HTML Structure (from ui.ts):**
- Header with session status
- Settings panel
- Conversation history
- Main chat container
- WSL alert for Windows users

**Sidebar Adaptations Needed:**
- Responsive design for narrower width
- Optimized vertical space usage
- Collapsible sections for better space management

## Task 1.3: New Sidebar Panel Architecture Design

### Proposed Architecture

#### 1. Split Responsibilities
```
Activity Bar: Claude Code Chat
├── Chat View (WebviewViewProvider)
│   ├── Active conversation
│   ├── Message input
│   └── Session controls
└── History View (TreeDataProvider)
    ├── Recent conversations
    ├── Session management
    └── Backup/restore options
```

#### 2. Class Structure
```typescript
// Main webview for chat interface
class ClaudeChatWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _claudeProvider: ClaudeChatProvider;
  
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    // Initialize webview in sidebar context
  }
}

// Separate tree view for conversation history
class ClaudeChatHistoryProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  // Existing tree view logic
}

// Core chat logic (refactored from current ClaudeChatProvider)
class ClaudeChatProvider {
  // Session management, Claude process, conversation handling
  // No longer manages webview panel directly
}
```

#### 3. Integration Strategy
**Webview Communication:**
- Maintain existing message protocol
- Adapt for sidebar context
- Preserve all current functionality

**State Management:**
- Keep existing conversation persistence
- Maintain backup repository integration
- Preserve cost tracking and session management

**Backward Compatibility:**
- Migrate existing conversations seamlessly
- Maintain all user settings
- Preserve keyboard shortcuts and commands

### Benefits of New Architecture
1. **Space Efficiency**: Chat no longer competes with bottom panel
2. **Better Organization**: Separate chat and history views
3. **Consistent UX**: Aligns with other AI extensions (Copilot, Cline)
4. **Improved Workflow**: Always accessible in sidebar

### Potential Challenges
1. **Width Constraints**: Sidebar is narrower than panels (~300px vs ~800px)
2. **UI Responsiveness**: Need to adapt existing CSS for sidebar
3. **State Synchronization**: Ensure chat and history views stay in sync
4. **Migration Complexity**: Seamless transition for existing users

## Research References

Based on web search results:

1. **VS Code WebviewViewProvider Examples**: <mcreference link="https://github.com/denyocrworld/vscode-extension-with-sidebar-webview" index="1">1</mcreference>
   - Shows complete implementation of sidebar webview
   - Demonstrates package.json configuration
   - Provides WebviewViewProvider implementation pattern

2. **VS Code Webview API Documentation**: <mcreference link="https://code.visualstudio.com/api/extension-guides/webview" index="2">2</mcreference>
   - Official guidance on webview implementation
   - Explains difference between panels and views
   - Provides best practices for webview development

3. **GitHub Copilot Integration Patterns**: <mcreference link="https://code.visualstudio.com/docs/copilot/overview" index="1">1</mcreference> <mcreference link="https://code.visualstudio.com/docs/copilot/getting-started" index="2">2</mcreference>
   - Shows how AI assistants integrate with VS Code
   - Demonstrates sidebar panel usage patterns
   - Provides UX guidelines for AI extensions

## Next Steps

Phase 1 research is complete. Key findings:

1. **Feasible Migration**: WebviewViewProvider provides all needed functionality
2. **Clear Implementation Path**: Well-documented API with examples
3. **Minimal Breaking Changes**: Can preserve all existing functionality
4. **Improved User Experience**: Addresses the core issue of panel height conflicts

Ready to proceed to Phase 2: Package.json Configuration Updates.