# Claude Code Chat UI Refactor Plan

## Goal
Move the Claude Code Chat title, Settings button, History button, and New Chat button from the webview header to the VS Code view title area (similar to Continue extension).

## Current State Analysis
- Extension uses a custom view container `claude-code-chat` in the activity bar
- Chat interface is a webview view with id `claude-code-chat.chatView`
- Current header contains:
  - "Claude Code Chat" title
  - Settings button (⚙️)
  - History button (📚 History) 
  - New Chat button (New Chat)
- These buttons are currently implemented in the webview HTML

## Implementation Tasks

### Task 1: Add view title commands to package.json
- [x] Add settings command to view/title menu for chatView
- [x] Add history toggle command to view/title menu for chatView
- [x] Update existing newSession command in view/title menu
- [x] Define appropriate icons for each command

### Task 2: Implement new commands in extension.ts
- [x] Create `claude-code-chat.toggleSettings` command
- [x] Create `claude-code-chat.toggleHistory` command
- [x] Register these commands in the activate function
- [x] Implement command handlers that communicate with webview

### Task 3: Update webview HTML structure
- [x] Remove the current header div with title and buttons
- [x] Keep only the chat container and other functional elements
- [x] Update CSS to account for removed header space
- [x] Ensure proper spacing and layout without the header

### Task 4: Update webview communication
- [x] Add message handlers for settings and history toggle from extension
- [x] Update existing button click handlers to work with new command structure
- [x] Ensure state synchronization between extension commands and webview

### Task 5: Update CSS styling
- [x] Remove header-related CSS styles
- [x] Adjust chat container positioning
- [x] Ensure responsive design still works
- [x] Test visual consistency with VS Code theme

### Task 6: Testing and refinement
- [x] Test all button functionality
- [x] Verify proper icon display in view title
- [x] Test with different VS Code themes
- [x] Ensure accessibility is maintained
- [x] Test keyboard navigation

## Summary
All tasks have been completed successfully:
1. ✅ Added new VS Code commands for settings and history toggle
2. ✅ Updated package.json with command definitions and keybindings
3. ✅ Removed header div and updated webview HTML structure
4. ✅ Added message handlers for webview communication
5. ✅ Updated CSS styles by removing header-related styles
6. ✅ Successfully compiled and packaged the extension

The extension now supports:
- `Cmd+Shift+S` to toggle settings
- `Cmd+Shift+H` to toggle conversation history
- Clean UI without the redundant header
- Proper communication between extension commands and webview

## Expected Outcome
- Clean, minimal webview focused on chat content
- Native VS Code UI integration with buttons in view title
- Consistent user experience with other VS Code extensions
- Better space utilization for chat content

## Notes
- Follow VS Code extension guidelines for view title actions
- Use appropriate codicons for consistency
- Maintain existing functionality while improving UX
- Consider grouping related actions appropriately