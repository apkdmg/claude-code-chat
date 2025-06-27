import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import html from './ui';

const exec = util.promisify(cp.exec);

export function activate(context: vscode.ExtensionContext) {
	console.log('Claude Code Chat extension is being activated!');
	
	// Create core chat provider (no longer manages webview directly)
	const chatProvider = new ClaudeChatProvider(context.extensionUri, context);

	// Register webview view provider for sidebar chat
	const chatViewProvider = new ClaudeChatWebviewProvider(context.extensionUri, context, chatProvider);
	vscode.window.registerWebviewViewProvider('claude-code-chat.chatView', chatViewProvider);

	// Register tree data provider for conversation history
	const historyProvider = new ClaudeChatHistoryProvider(context.extensionUri, context, chatProvider);
	vscode.window.registerTreeDataProvider('claude-code-chat.history', historyProvider);

	// Make history provider accessible to chat provider for refreshing
	chatProvider.setHistoryProvider(historyProvider);

	// Register commands
	const openChatDisposable = vscode.commands.registerCommand('claude-code-chat.openChat', () => {
		console.log('Claude Code Chat command executed!');
		// Focus on the chat view in sidebar
		vscode.commands.executeCommand('claude-code-chat.chatView.focus');
	});

	const loadConversationDisposable = vscode.commands.registerCommand('claude-code-chat.loadConversation', (filename: string) => {
		chatProvider.loadConversation(filename);
	});

	const newSessionDisposable = vscode.commands.registerCommand('claude-code-chat.newSession', () => {
		chatProvider._newSession();
	});

	const refreshHistoryDisposable = vscode.commands.registerCommand('claude-code-chat.refreshHistory', () => {
		historyProvider.refresh();
	});

	const toggleSettingsDisposable = vscode.commands.registerCommand('claude-code-chat.toggleSettings', () => {
		chatViewProvider.toggleSettings();
	});

	const toggleHistoryDisposable = vscode.commands.registerCommand('claude-code-chat.toggleHistory', () => {
		chatViewProvider.toggleHistory();
	});

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('claudeCodeChat.wsl')) {
			console.log('WSL configuration changed, starting new session');
			chatProvider.newSessionOnConfigChange();
		}
	});

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = "Claude";
	statusBarItem.tooltip = "Open Claude Code Chat (Ctrl+Shift+C)";
	statusBarItem.command = 'claude-code-chat.openChat';
	statusBarItem.show();

	context.subscriptions.push(
		openChatDisposable, 
		loadConversationDisposable, 
		newSessionDisposable, 
		refreshHistoryDisposable, 
		toggleSettingsDisposable,
		toggleHistoryDisposable,
		configChangeDisposable, 
		statusBarItem
	);
	console.log('Claude Code Chat extension activation completed successfully!');
}

export function deactivate() { }

// New WebviewViewProvider for sidebar chat interface
class ClaudeChatWebviewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
		private readonly _chatProvider: ClaudeChatProvider
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Set up message handling
		webviewView.webview.onDidReceiveMessage(
			message => this._chatProvider.handleWebviewMessage(message, webviewView.webview),
			undefined,
			this._context.subscriptions
		);

		// Handle webview visibility changes to restore state
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				console.log('Webview became visible, restoring chat state');
				// Initialize chat provider with webview
				this._chatProvider.setWebview(webviewView.webview);
				// Restore the current conversation state
				this._chatProvider.restoreCurrentConversation();
			}
		}, null, this._context.subscriptions);

		// Initialize chat provider with webview
		this._chatProvider.setWebview(webviewView.webview);

		// Load latest conversation if available
		const latestConversation = this._chatProvider.getLatestConversation();
		if (latestConversation) {
			this._chatProvider.loadConversationHistory(latestConversation.filename);
		}
	}

	public toggleSettings(): void {
		if (this._view) {
			this._view.webview.postMessage({ type: 'toggleSettings' });
		}
	}

	public toggleHistory(): void {
		if (this._view) {
			this._view.webview.postMessage({ type: 'toggleHistory' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		return html;
	}

	public getView(): vscode.WebviewView | undefined {
		return this._view;
	}
}

// Renamed and updated history provider
class ClaudeChatHistoryProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(
		private extensionUri: vscode.Uri,
		private context: vscode.ExtensionContext,
		private chatProvider: ClaudeChatProvider
	) { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(): vscode.TreeItem[] {
		const items: vscode.TreeItem[] = [];

		// Get conversation history from chat provider
		const conversationIndex = this.context.workspaceState.get('claude.conversationIndex', []) as any[];

		if (conversationIndex.length === 0) {
			// Show empty state
			const emptyItem = new vscode.TreeItem('No conversations yet', vscode.TreeItemCollapsibleState.None);
			emptyItem.description = 'Start chatting to see history';
			emptyItem.iconPath = new vscode.ThemeIcon('comment');
			items.push(emptyItem);
		} else {
			// Add conversation items (show last 20 for better performance)
			conversationIndex.slice(0, 20).forEach((conv, index) => {
				const item = new vscode.TreeItem(
					conv.firstUserMessage.substring(0, 50) + (conv.firstUserMessage.length > 50 ? '...' : ''),
					vscode.TreeItemCollapsibleState.None
				);
				item.description = new Date(conv.startTime).toLocaleDateString();
				item.tooltip = `First: ${conv.firstUserMessage}\nLast: ${conv.lastUserMessage}\nMessages: ${conv.messageCount}, Cost: $${conv.totalCost.toFixed(3)}`;
				item.command = {
					command: 'claude-code-chat.loadConversation',
					title: 'Load Conversation',
					arguments: [conv.filename]
				};
				item.iconPath = new vscode.ThemeIcon('comment-discussion');
				item.contextValue = 'conversation'; // For context menu
				items.push(item);
			});
		}

		return items;
	}
}

class ClaudeChatProvider {
	private _webview: vscode.Webview | undefined;
	private _disposables: vscode.Disposable[] = [];
	private _totalCost: number = 0;
	private _totalTokensInput: number = 0;
	private _totalTokensOutput: number = 0;
	private _requestCount: number = 0;
	private _currentSessionId: string | undefined;
	private _backupRepoPath: string | undefined;
	private _commits: Array<{ id: string, sha: string, message: string, timestamp: string }> = [];
	private _conversationsPath: string | undefined;
	private _currentConversation: Array<{ timestamp: string, messageType: string, data: any }> = [];
	private _conversationStartTime: string | undefined;
	private _conversationIndex: Array<{
		filename: string,
		sessionId: string,
		startTime: string,
		endTime: string,
		messageCount: number,
		totalCost: number,
		firstUserMessage: string,
		lastUserMessage: string
	}> = [];
	private _historyProvider: ClaudeChatHistoryProvider | undefined;
	private _currentClaudeProcess: cp.ChildProcess | undefined;
	private _selectedModel: string = 'default'; // Default model
	private _claudeUsageLimitProcessed: boolean = false; // Track if Claude usage limit error was already processed

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {

		// Initialize backup repository and conversations
		this._initializeBackupRepo();
		this._initializeConversations();

		// Load conversation index from workspace state
		this._conversationIndex = this._context.workspaceState.get('claude.conversationIndex', []);

		// Load saved model preference
		this._selectedModel = this._context.workspaceState.get('claude.selectedModel', 'default');

		// Resume session from latest conversation
		const latestConversation = this._getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;
	}

	// Set webview instance from WebviewViewProvider
	public setWebview(webview: vscode.Webview): void {
		this._webview = webview;
	}

	// Set history provider for refreshing
	public setHistoryProvider(provider: ClaudeChatHistoryProvider): void {
		this._historyProvider = provider;
	}

	// Get latest conversation for initialization
	public getLatestConversation(): any {
		return this._getLatestConversation();
	}

	// Load conversation history (public method)
	public loadConversationHistory(filename: string): void {
		this._loadConversationHistory(filename);
	}

	// Restore current conversation state (for webview visibility changes)
	public restoreCurrentConversation(): void {
		if (!this._webview) return;

		console.log('Restoring current conversation state');
		
		// Clear existing messages first
		this._webview.postMessage({
			type: 'sessionCleared'
		});

		// Small delay to ensure messages are cleared before loading
		setTimeout(() => {
			// Restore all messages from current conversation
			for (const message of this._currentConversation) {
				this._webview?.postMessage({
					type: message.messageType,
					data: message.data
				});
			}

			// Send current session info if available
			if (this._currentSessionId) {
				this._webview?.postMessage({
					type: 'sessionResumed',
					data: {
						sessionId: this._currentSessionId
					}
				});
			}

			// Send ready message
			this._webview?.postMessage({
				type: 'ready',
				data: 'Ready to chat with Claude Code! Type your message below.'
			});

			// Send current model to webview
			this._webview?.postMessage({
				type: 'modelSelected',
				model: this._selectedModel
			});

			// Send updated totals
			this._webview?.postMessage({
				type: 'updateTotals',
				data: {
					totalCost: this._totalCost,
					totalTokensInput: this._totalTokensInput,
					totalTokensOutput: this._totalTokensOutput,
					requestCount: this._requestCount
				}
			});

			// Send platform information
			this._sendPlatformInfo();
		}, 50);
	}

	// Handle webview messages (called from WebviewViewProvider)
	public handleWebviewMessage(message: any, webview: vscode.Webview): void {
		this._webview = webview; // Ensure we have the current webview reference

		switch (message.type) {
			case 'sendMessage':
				this._sendMessageToClaude(message.text, message.planMode, message.thinkingMode);
				return;
			case 'sendMessageWithImages':
				this._sendMessageWithImagesToClaude(message.text, message.images, message.planMode, message.thinkingMode);
				return;
			case 'newSession':
				this._newSession();
				return;
			case 'restoreCommit':
				this._restoreToCommit(message.commitSha);
				return;
			case 'getConversationList':
				this._sendConversationList();
				return;
			case 'getWorkspaceFiles':
				this._sendWorkspaceFiles(message.searchTerm);
				return;
			case 'selectImageFile':
				this._selectImageFile();
				return;
			case 'loadConversation':
				this.loadConversation(message.filename);
				return;
			case 'stopRequest':
				this._stopClaudeProcess();
				return;
			case 'getSettings':
				this._sendCurrentSettings();
				return;
			case 'updateSettings':
				this._updateSettings(message.settings);
				return;
			case 'getClipboardText':
				this._getClipboardText();
				return;
			case 'selectModel':
				this._setSelectedModel(message.model);
				return;
			case 'openModelTerminal':
				this._openModelTerminal();
				return;
			case 'executeSlashCommand':
				this._executeSlashCommand(message.command);
				return;
			case 'dismissWSLAlert':
				this._dismissWSLAlert();
				return;
			case 'openFile':
				this._openFileInEditor(message.filePath);
				return;
		}
	}

	// Initialize webview with latest conversation and settings
	public initializeWebview(): void {
		if (!this._webview) return;

		// Resume session from latest conversation
		const latestConversation = this._getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;

		// Load latest conversation history if available
		if (latestConversation) {
			this._loadConversationHistory(latestConversation.filename);
		}

		// Send ready message immediately
		setTimeout(() => {
			// Send current session info if available
			if (this._currentSessionId) {
				this._webview?.postMessage({
					type: 'sessionResumed',
					data: {
						sessionId: this._currentSessionId
					}
				});
			}

			this._webview?.postMessage({
				type: 'ready',
				data: 'Ready to chat with Claude Code! Type your message below.'
			});

			// Send current model to webview
			this._webview?.postMessage({
				type: 'modelSelected',
				model: this._selectedModel
			});

			// Send platform information to webview
			this._sendPlatformInfo();
		}, 100);
	}

	private async _sendMessageToClaude(message: string, planMode?: boolean, thinkingMode?: boolean) {
		// Reset Claude usage limit processing flag for new request
		this._claudeUsageLimitProcessed = false;
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

		// Get thinking intensity setting
		const configThink = vscode.workspace.getConfiguration('claudeCodeChat');
		const thinkingIntensity = configThink.get<string>('thinking.intensity', 'think');

		// Prepend mode instructions if enabled
		let actualMessage = message;
		if (planMode) {
			actualMessage = 'PLAN FIRST BEFORE MAKING ANY CHANGES, SHOW ME IN DETAIL WHAT YOU WILL CHANGE. DONT PROCEED BEFORE I ACCEPT IN A DIFFERENT MESSAGE: \n' + message;
		}
		if (thinkingMode) {
			let thinkingPrompt = '';
			const thinkingMesssage = ' THROUGH THIS STEP BY STEP: \n'
			switch (thinkingIntensity) {
				case 'think':
					thinkingPrompt = 'THINK';
					break;
				case 'think-hard':
					thinkingPrompt = 'THINK HARD';
					break;
				case 'think-harder':
					thinkingPrompt = 'THINK HARDER';
					break;
				case 'ultrathink':
					thinkingPrompt = 'ULTRATHINK';
					break;
				default:
					thinkingPrompt = 'THINK';
			}
			actualMessage = thinkingPrompt + thinkingMesssage + actualMessage;
		}

		// Show original user input in chat and save to conversation (without mode prefixes)
		this._sendAndSaveMessage({
			type: 'userInput',
			data: message
		});

		// Set processing state
		this._webview?.postMessage({
			type: 'setProcessing',
			data: true
		});

		// Create backup commit before Claude makes changes
		try {
			await this._createBackupCommit(message);
		}
		catch (e) {
			console.log("error", e);
		}

		// Show loading indicator
		this._webview?.postMessage({
			type: 'loading',
			data: 'Claude is working...'
		});

		// Call claude with the message via stdin using stream-json format
		console.log('Calling Claude with message via stdin:', message);

		// Build command arguments with session management
		const args = [
			'-p',
			'--output-format', 'stream-json', '--verbose',
			'--dangerously-skip-permissions'
		];

		// Add model selection if not using default
		if (this._selectedModel && this._selectedModel !== 'default') {
			args.push('--model', this._selectedModel);
			console.log('Using model:', this._selectedModel);
		}

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
			console.log('Resuming session:', this._currentSessionId);
		} else {
			console.log('Starting new session');
		}

		console.log('Claude command args:', args);

		// Get configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		let claudeProcess: cp.ChildProcess;

		if (wslEnabled) {
			// Use WSL
			console.log('Using WSL configuration:', { wslDistro, nodePath, claudePath });
			claudeProcess = cp.spawn('wsl', ['-d', wslDistro, nodePath, '--no-warnings', '--enable-source-maps', claudePath, ...args], {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		} else {
			// Use native claude command
			console.log('Using native Claude command');
			claudeProcess = cp.spawn('claude', args, {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		}

		// Store process reference for potential termination
		this._currentClaudeProcess = claudeProcess;

		// Send the message to Claude's stdin (with mode prefixes if enabled)
		if (claudeProcess.stdin) {
			claudeProcess.stdin.write(actualMessage + '\n');
			claudeProcess.stdin.end();
		}

		let rawOutput = '';
		let errorOutput = '';

		if (claudeProcess.stdout) {
			claudeProcess.stdout.on('data', (data) => {
				rawOutput += data.toString();

				// Process JSON stream line by line
				const lines = rawOutput.split('\n');
				rawOutput = lines.pop() || ''; // Keep incomplete line for next chunk

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData = JSON.parse(line.trim());
							this._processJsonStreamData(jsonData);
						} catch (error) {
							console.log('Failed to parse JSON line:', line, error);
						}
					}
				}
			});
		}

		if (claudeProcess.stderr) {
			claudeProcess.stderr.on('data', (data) => {
				errorOutput += data.toString();
			});
		}

		claudeProcess.on('close', (code) => {
			console.log('Claude process closed with code:', code);
			
			// Process error output for epoch timestamps before logging
			if (errorOutput.trim()) {
				const processedError = this._processErrorMessage(errorOutput.trim());
				console.log('Claude stderr output (processed):', processedError);
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;

			// Clear loading indicator
			this._webview?.postMessage({
				type: 'clearLoading'
			});

			if (code !== 0 && errorOutput.trim()) {
				// Check if this is a Claude usage limit message and if it was already processed
				if (errorOutput.trim().includes('Claude AI usage limit reached|') && this._claudeUsageLimitProcessed) {
					// Skip processing if already handled
					return;
				}
				
				// Error with output - process for epoch timestamps
				const processedError = this._processErrorMessage(errorOutput.trim());
				this._sendAndSaveMessage({
					type: 'error',
					data: processedError
				});
				
				// Mark as processed if it's a Claude usage limit message
				if (errorOutput.trim().includes('Claude AI usage limit reached|')) {
					this._claudeUsageLimitProcessed = true;
				}
			}
		});

		claudeProcess.on('error', (error) => {
			console.log('Claude process error:', error.message);
			
			// Clear process reference
			this._currentClaudeProcess = undefined;
			
			this._webview?.postMessage({
				type: 'clearLoading'
			});
			
			// Check if claude command is not installed
			if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
				this._sendAndSaveMessage({
					type: 'error',
					data: 'Install claude code first: https://www.anthropic.com/claude-code'
				});
			} else {
				const processedError = this._processErrorMessage(`Error running Claude: ${error.message}`);
				this._sendAndSaveMessage({
					type: 'error',
					data: processedError
				});
			}
		});
	}

	private async _sendMessageWithImagesToClaude(message: string, images: any[], planMode?: boolean, thinkingMode?: boolean) {
		// Reset Claude usage limit processing flag for new request
		this._claudeUsageLimitProcessed = false;
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			this._sendAndSaveMessage({
				type: 'error',
				data: 'No workspace folder found'
			});
			return;
		}

		try {
			// Process images and prepare paths
			const imagePaths: string[] = [];
			const fs = require('fs');
			const path = require('path');
			const os = require('os');

			for (const img of images) {
				if (img.isSelected && img.path) {
					// Selected files already have full paths
					imagePaths.push(img.path);
				} else if (img.isDropped && img.dataUrl) {
					// Dropped files need to be saved to temporary location
					try {
						// Create temp directory if it doesn't exist
						const tempDir = path.join(os.tmpdir(), 'claude-code-chat-images');
						if (!fs.existsSync(tempDir)) {
							fs.mkdirSync(tempDir, { recursive: true });
						}

						// Extract base64 data from data URL
						const matches = img.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
						if (matches) {
							const mimeType = matches[1];
							const base64Data = matches[2];
							
							// Determine file extension from MIME type
							let extension = 'png';
							if (mimeType.includes('jpeg')) extension = 'jpg';
							else if (mimeType.includes('gif')) extension = 'gif';
							else if (mimeType.includes('svg')) extension = 'svg';
							else if (mimeType.includes('webp')) extension = 'webp';
							else if (mimeType.includes('bmp')) extension = 'bmp';

							// Create unique filename
							const timestamp = Date.now();
							const filename = `dropped-image-${timestamp}.${extension}`;
							const tempPath = path.join(tempDir, filename);

							// Write file to temp location
							fs.writeFileSync(tempPath, base64Data, 'base64');
							imagePaths.push(tempPath);

							console.log(`Saved dropped image to: ${tempPath}`);
						}
					} catch (error) {
						console.error('Failed to save dropped image:', error);
						this._sendAndSaveMessage({
							type: 'error',
							data: `Failed to process dropped image: ${img.name}`
						});
					}
				}
			}

			// Build the complete message with image references
			let completeMessage = message;
			if (imagePaths.length > 0) {
				const imageReferences = imagePaths.map(path => `@${path}`).join(' ');
				completeMessage = message + (message ? ' ' : '') + imageReferences;
			}

			// Send the message to Claude without showing user input (already handled in frontend)
			this._sendMessageToClaudeWithoutUserDisplay(completeMessage, planMode, thinkingMode);

		} catch (error) {
			console.error('Error processing images:', error);
			this._sendAndSaveMessage({
				type: 'error',
				data: `Error processing images: ${error}`
			});
		}
	}

	private async _sendMessageToClaudeWithoutUserDisplay(message: string, planMode?: boolean, thinkingMode?: boolean) {
		// Reset Claude usage limit processing flag for new request
		this._claudeUsageLimitProcessed = false;
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

		// Get thinking intensity setting
		const configThink = vscode.workspace.getConfiguration('claudeCodeChat');
		const thinkingIntensity = configThink.get<string>('thinking.intensity', 'think');

		// Prepend mode instructions if enabled
		let actualMessage = message;
		if (planMode) {
			actualMessage = 'PLAN FIRST BEFORE MAKING ANY CHANGES, SHOW ME IN DETAIL WHAT YOU WILL CHANGE. DONT PROCEED BEFORE I ACCEPT IN A DIFFERENT MESSAGE: \n' + message;
		}
		if (thinkingMode) {
			let thinkingPrompt = '';
			const thinkingMesssage = ' THROUGH THIS STEP BY STEP: \n'
			switch (thinkingIntensity) {
				case 'think':
					thinkingPrompt = 'THINK';
					break;
				case 'think-hard':
					thinkingPrompt = 'THINK HARD';
					break;
				case 'think-harder':
					thinkingPrompt = 'THINK HARDER';
					break;
				case 'ultrathink':
					thinkingPrompt = 'ULTRATHINK';
					break;
				default:
					thinkingPrompt = 'THINK';
			}
			actualMessage = thinkingPrompt + thinkingMesssage + actualMessage;
		}

		// Skip showing user input - it's already handled in frontend

		// Set processing state
		this._webview?.postMessage({
			type: 'setProcessing',
			data: true
		});

		// Create backup commit before Claude makes changes
		try {
			await this._createBackupCommit(message);
		}
		catch (e) {
			console.log("error", e);
		}

		// Show loading indicator
		this._webview?.postMessage({
			type: 'loading',
			data: 'Claude is working...'
		});

		// Call claude with the message via stdin using stream-json format
		console.log('Calling Claude with message via stdin:', message);

		// Build command arguments with session management
		const args = [
			'-p',
			'--output-format', 'stream-json', '--verbose',
			'--dangerously-skip-permissions'
		];

		// Add model selection if not using default
		if (this._selectedModel && this._selectedModel !== 'default') {
			args.push('--model', this._selectedModel);
			console.log('Using model:', this._selectedModel);
		}

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
			console.log('Resuming session:', this._currentSessionId);
		} else {
			console.log('Starting new session');
		}

		console.log('Claude command args:', args);

		// Get configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		let claudeProcess: cp.ChildProcess;

		if (wslEnabled) {
			// Use WSL
			console.log('Using WSL configuration:', { wslDistro, nodePath, claudePath });
			claudeProcess = cp.spawn('wsl', ['-d', wslDistro, nodePath, '--no-warnings', '--enable-source-maps', claudePath, ...args], {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		} else {
			// Use native claude command
			console.log('Using native Claude command');
			claudeProcess = cp.spawn('claude', args, {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		}

		// Store process reference for potential termination
		this._currentClaudeProcess = claudeProcess;

		// Send the message to Claude's stdin (with mode prefixes if enabled)
		if (claudeProcess.stdin) {
			claudeProcess.stdin.write(actualMessage + '\n');
			claudeProcess.stdin.end();
		}

		let rawOutput = '';
		let errorOutput = '';

		if (claudeProcess.stdout) {
			claudeProcess.stdout.on('data', (data) => {
				rawOutput += data.toString();

				// Process JSON stream line by line
				const lines = rawOutput.split('\n');
				rawOutput = lines.pop() || ''; // Keep incomplete line for next chunk

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData = JSON.parse(line.trim());
							this._processJsonStreamData(jsonData);
						} catch (error) {
							console.log('Failed to parse JSON line:', line, error);
						}
					}
				}
			});
		}

		if (claudeProcess.stderr) {
			claudeProcess.stderr.on('data', (data) => {
				errorOutput += data.toString();
			});
		}

		claudeProcess.on('close', (code) => {
			console.log('Claude process closed with code:', code);
			
			// Process error output for epoch timestamps before logging
			if (errorOutput.trim()) {
				const processedError = this._processErrorMessage(errorOutput.trim());
				console.log('Claude stderr output (processed):', processedError);
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;

			// Clear loading indicator
			this._webview?.postMessage({
				type: 'clearLoading'
			});

			if (code !== 0 && errorOutput.trim()) {
				// Check if this is a Claude usage limit message and if it was already processed
				if (errorOutput.trim().includes('Claude AI usage limit reached|') && this._claudeUsageLimitProcessed) {
					// Skip processing if already handled
					return;
				}
				
				// Error with output - process for epoch timestamps
				const processedError = this._processErrorMessage(errorOutput.trim());
				this._sendAndSaveMessage({
					type: 'error',
					data: processedError
				});
				
				// Mark as processed if it's a Claude usage limit message
				if (errorOutput.trim().includes('Claude AI usage limit reached|')) {
					this._claudeUsageLimitProcessed = true;
				}
			}
		});

		claudeProcess.on('error', (error) => {
			console.log('Claude process error:', error.message);
			
			// Clear process reference
			this._currentClaudeProcess = undefined;
			
			this._webview?.postMessage({
				type: 'clearLoading'
			});
			
			// Check if claude command is not installed
			if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
				this._sendAndSaveMessage({
					type: 'error',
					data: 'Install claude code first: https://www.anthropic.com/claude-code'
				});
			} else {
				const processedError = this._processErrorMessage(`Error running Claude: ${error.message}`);
				this._sendAndSaveMessage({
					type: 'error',
					data: processedError
				});
			}
		});
	}

	private _processJsonStreamData(jsonData: any) {
		console.log('Received JSON data:', jsonData);

		switch (jsonData.type) {
			case 'system':
				if (jsonData.subtype === 'init') {
					// System initialization message - session ID will be captured from final result
					console.log('System initialized');
				}
				break;

			case 'assistant':
				if (jsonData.message && jsonData.message.content) {
					// Track token usage in real-time if available
					if (jsonData.message.usage) {
						this._totalTokensInput += jsonData.message.usage.input_tokens || 0;
						this._totalTokensOutput += jsonData.message.usage.output_tokens || 0;

						// Send real-time token update to webview
						this._sendAndSaveMessage({
							type: 'updateTokens',
							data: {
								totalTokensInput: this._totalTokensInput,
								totalTokensOutput: this._totalTokensOutput,
								currentInputTokens: jsonData.message.usage.input_tokens || 0,
								currentOutputTokens: jsonData.message.usage.output_tokens || 0,
								cacheCreationTokens: jsonData.message.usage.cache_creation_input_tokens || 0,
								cacheReadTokens: jsonData.message.usage.cache_read_input_tokens || 0
							}
						});
					}

					// Process each content item in the assistant message
					for (const content of jsonData.message.content) {
						if (content.type === 'text' && content.text.trim()) {
						// Check if this is a Claude usage limit message that should be processed as error
						const textContent = content.text.trim();
						if (textContent.includes('Claude AI usage limit reached|')) {
							// Check if already processed to prevent duplicates
							if (this._claudeUsageLimitProcessed) {
								continue; // Skip if already processed
							}
							// Process as error message instead of output
							const processedError = this._processErrorMessage(textContent);
							this._sendAndSaveMessage({
								type: 'error',
								data: processedError
							});
							this._claudeUsageLimitProcessed = true;
						} else {
							// Show normal text content and save to conversation
							this._sendAndSaveMessage({
								type: 'output',
								data: textContent
							});
						}
						} else if (content.type === 'thinking' && content.thinking.trim()) {
							// Show thinking content and save to conversation
							this._sendAndSaveMessage({
								type: 'thinking',
								data: content.thinking.trim()
							});
						} else if (content.type === 'tool_use') {
							// Show tool execution with better formatting
							const toolInfo = `🔧 Executing: ${content.name}`;
							let toolInput = '';

							if (content.input) {
								// Special formatting for TodoWrite to make it more readable
								if (content.name === 'TodoWrite' && content.input.todos) {
									toolInput = '\nTodo List Update:';
									for (const todo of content.input.todos) {
										const status = todo.status === 'completed' ? '✅' :
											todo.status === 'in_progress' ? '🔄' : '⏳';
										toolInput += `\n${status} ${todo.content} (priority: ${todo.priority})`;
									}
								} else {
									// Send raw input to UI for formatting
									toolInput = '';
								}
							}

							// Show tool use and save to conversation
							this._sendAndSaveMessage({
								type: 'toolUse',
								data: {
									toolInfo: toolInfo,
									toolInput: toolInput,
									rawInput: content.input,
									toolName: content.name
								}
							});
						}
					}
				}
				break;

			case 'user':
				if (jsonData.message && jsonData.message.content) {
					// Process tool results from user messages
					for (const content of jsonData.message.content) {
						if (content.type === 'tool_result') {
							let resultContent = content.content || 'Tool executed successfully';
							const isError = content.is_error || false;

							// Find the last tool use to get the tool name
							const lastToolUse = this._currentConversation[this._currentConversation.length-1]

							const toolName = lastToolUse?.data?.toolName;

							// Don't send tool result for Read and Edit tools unless there's an error
							if ((toolName === 'Read' || toolName === 'Edit' || toolName === 'TodoWrite' || toolName === 'MultiEdit') && !isError) {
								// Still send to UI to hide loading state, but mark it as hidden
								this._sendAndSaveMessage({
									type: 'toolResult',
									data: {
										content: resultContent,
										isError: isError,
										toolUseId: content.tool_use_id,
										toolName: toolName,
										hidden: true
									}
								});
							} else {
								// Show tool result and save to conversation
								this._sendAndSaveMessage({
									type: 'toolResult',
									data: {
										content: resultContent,
										isError: isError,
										toolUseId: content.tool_use_id,
										toolName: toolName
									}
								});
							}
						}
					}
				}
				break;

			case 'result':
				if (jsonData.subtype === 'success') {
					// Check for login errors
					if (jsonData.is_error && jsonData.result && jsonData.result.includes('Invalid API key')) {
						this._handleLoginRequired();
						return;
					}

					// Handle other errors with epoch conversion (skip if Claude usage limit already processed)
				if (jsonData.is_error && jsonData.result && !this._claudeUsageLimitProcessed) {
					const processedError = this._processErrorMessage(jsonData.result);
					this._sendAndSaveMessage({
						type: 'error',
						data: processedError
					});
					return;
				}

					// Capture session ID from final result
					if (jsonData.session_id) {
						const isNewSession = !this._currentSessionId;
						const sessionChanged = this._currentSessionId && this._currentSessionId !== jsonData.session_id;

						console.log('Session ID found in result:', {
							sessionId: jsonData.session_id,
							isNewSession,
							sessionChanged,
							currentSessionId: this._currentSessionId
						});

						this._currentSessionId = jsonData.session_id;

						// Show session info in UI
						this._sendAndSaveMessage({
							type: 'sessionInfo',
							data: {
								sessionId: jsonData.session_id,
								tools: jsonData.tools || [],
								mcpServers: jsonData.mcp_servers || []
							}
						});
					}

					// Clear processing state
					this._webview?.postMessage({
						type: 'setProcessing',
						data: false
					});

					// Update cumulative tracking
					this._requestCount++;
					if (jsonData.total_cost_usd) {
						this._totalCost += jsonData.total_cost_usd;
					}

					console.log('Result received:', {
						cost: jsonData.total_cost_usd,
						duration: jsonData.duration_ms,
						turns: jsonData.num_turns
					});

					// Send updated totals to webview
					this._webview?.postMessage({
						type: 'updateTotals',
						data: {
							totalCost: this._totalCost,
							totalTokensInput: this._totalTokensInput,
							totalTokensOutput: this._totalTokensOutput,
							requestCount: this._requestCount,
							currentCost: jsonData.total_cost_usd,
							currentDuration: jsonData.duration_ms,
							currentTurns: jsonData.num_turns
						}
					});
				}
				break;
		}
	}


	public _newSession() {
		// Clear current session
		this._currentSessionId = undefined;

		// Clear commits and conversation
		this._commits = [];
		this._currentConversation = [];
		this._conversationStartTime = undefined;
		
		// Reset Claude usage limit processing flag
		this._claudeUsageLimitProcessed = false;

		// Reset counters
		this._totalCost = 0;
		this._totalTokensInput = 0;
		this._totalTokensOutput = 0;
		this._requestCount = 0;

		// Notify webview to clear all messages and reset session
		this._webview?.postMessage({
			type: 'sessionCleared'
		});
	}

	public newSessionOnConfigChange() {
		// Start a new session due to configuration change
		this._newSession();
		
		// Show notification to user
		vscode.window.showInformationMessage(
			'WSL configuration changed. Started a new Claude session.',
			'OK'
		);

		// Send message to webview about the config change
		this._sendAndSaveMessage({
			type: 'configChanged',
			data: '⚙️ WSL configuration changed. Started a new session.'
		});
	}

	private _handleLoginRequired() {
		// Clear processing state
		this._webview?.postMessage({
			type: 'setProcessing',
			data: false
		});

		// Show login required message
		this._webview?.postMessage({
			type: 'loginRequired'
		});

		// Get configuration to check if WSL is enabled
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Open terminal and run claude login
		const terminal = vscode.window.createTerminal('Claude Login');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath}`);
		} else {
			terminal.sendText('claude');
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Please login to Claude in the terminal, then come back to this chat to continue.',
			'OK'
		);

				// Send message to UI about terminal
		this._webview?.postMessage({
			type: 'terminalOpened',
			data: `Please login to Claude in the terminal, then come back to this chat to continue.`,
		});
	}

	private async _initializeBackupRepo(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {return;}

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {
				console.error('No workspace storage available');
				return;
			}
			console.log('Workspace storage path:', storagePath);
			this._backupRepoPath = path.join(storagePath, 'backups', '.git');

			// Create backup git directory if it doesn't exist
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._backupRepoPath));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._backupRepoPath));

				const workspacePath = workspaceFolder.uri.fsPath;

				// Initialize git repo with workspace as work-tree
				await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" init`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.name "Claude Code Chat"`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.email "claude@anthropic.com"`);

				console.log(`Initialized backup repository at: ${this._backupRepoPath}`);
			}
		} catch (error: any) {
			console.error('Failed to initialize backup repository:', error.message);
		}
	}

	private async _createBackupCommit(userMessage: string): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) {return;}

			const workspacePath = workspaceFolder.uri.fsPath;
			const now = new Date();
			const timestamp = now.toISOString().replace(/[:.]/g, '-');
			const displayTimestamp = now.toISOString();
			const commitMessage = `Before: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;

			// Add all files using git-dir and work-tree (excludes .git automatically)
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" add -A`);

			// Check if this is the first commit (no HEAD exists yet)
			let isFirstCommit = false;
			try {
				await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);
			} catch {
				isFirstCommit = true;
			}

			// Check if there are changes to commit
			const { stdout: status } = await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" status --porcelain`);

			// Always create a checkpoint, even if no files changed
			let actualMessage;
			if (isFirstCommit) {
				actualMessage = `Initial backup: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			} else if (status.trim()) {
				actualMessage = commitMessage;
			} else {
				actualMessage = `Checkpoint (no changes): ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			}

			// Create commit with --allow-empty to ensure checkpoint is always created
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" commit --allow-empty -m "${actualMessage}"`);
			const { stdout: sha } = await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);

			// Store commit info
			const commitInfo = {
				id: `commit-${timestamp}`,
				sha: sha.trim(),
				message: actualMessage,
				timestamp: displayTimestamp
			};

			this._commits.push(commitInfo);

			// Show restore option in UI and save to conversation
			this._sendAndSaveMessage({
				type: 'showRestoreOption',
				data: commitInfo
			});

			console.log(`Created backup commit: ${commitInfo.sha.substring(0, 8)} - ${actualMessage}`);
		} catch (error: any) {
			console.error('Failed to create backup commit:', error.message);
		}
	}


	private async _restoreToCommit(commitSha: string): Promise<void> {
		try {
			const commit = this._commits.find(c => c.sha === commitSha);
			if (!commit) {
				this._webview?.postMessage({
					type: 'restoreError',
					data: 'Commit not found'
				});
				return;
			}

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) {
				vscode.window.showErrorMessage('No workspace folder or backup repository available.');
				return;
			}

			const workspacePath = workspaceFolder.uri.fsPath;

			this._webview?.postMessage({
				type: 'restoreProgress',
				data: 'Restoring files from backup...'
			});

			// Restore files directly to workspace using git checkout
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" checkout ${commitSha} -- .`);

			vscode.window.showInformationMessage(`Restored to commit: ${commit.message}`);

			this._sendAndSaveMessage({
				type: 'restoreSuccess',
				data: {
					message: `Successfully restored to: ${commit.message}`,
					commitSha: commitSha
				}
			});

		} catch (error: any) {
			console.error('Failed to restore commit:', error.message);
			vscode.window.showErrorMessage(`Failed to restore commit: ${error.message}`);
			this._webview?.postMessage({
				type: 'restoreError',
				data: `Failed to restore: ${error.message}`
			});
		}
	}

	private async _initializeConversations(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {return;}

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {return;}

			this._conversationsPath = path.join(storagePath, 'conversations');

			// Create conversations directory if it doesn't exist
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._conversationsPath));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._conversationsPath));
				console.log(`Created conversations directory at: ${this._conversationsPath}`);
			}
		} catch (error: any) {
			console.error('Failed to initialize conversations directory:', error.message);
		}
	}

	private _sendAndSaveMessage(message: { type: string, data: any }): void {
		// Initialize conversation if this is the first message
		if (this._currentConversation.length === 0) {
			this._conversationStartTime = new Date().toISOString();
		}

		if (message.type === 'sessionInfo') {
			message.data.sessionId;
		}

		// Send to UI
		this._webview?.postMessage(message);

		// Save to conversation
		this._currentConversation.push({
			timestamp: new Date().toISOString(),
			messageType: message.type,
			data: message.data
		});

		// Persist conversation
		void this._saveCurrentConversation();
	}

	private async _saveCurrentConversation(): Promise<void> {
		if (!this._conversationsPath || this._currentConversation.length === 0) {return;}
		if(!this._currentSessionId) {return;}

		try {
			// Create filename from first user message and timestamp
			const firstUserMessage = this._currentConversation.find(m => m.messageType === 'userInput');
			const firstMessage = firstUserMessage ? firstUserMessage.data : 'conversation';
			const startTime = this._conversationStartTime || new Date().toISOString();
			const sessionId = this._currentSessionId || 'unknown';

			// Clean and truncate first message for filename
			const cleanMessage = firstMessage
				.replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
				.replace(/\s+/g, '-') // Replace spaces with dashes
				.substring(0, 50) // Limit length
				.toLowerCase();

			const datePrefix = startTime.substring(0, 16).replace('T', '_').replace(/:/g, '-');
			const filename = `${datePrefix}_${cleanMessage}.json`;

			const conversationData = {
				sessionId: sessionId,
				startTime: this._conversationStartTime,
				endTime: new Date().toISOString(),
				messageCount: this._currentConversation.length,
				totalCost: this._totalCost,
				totalTokens: {
					input: this._totalTokensInput,
					output: this._totalTokensOutput
				},
				messages: this._currentConversation,
				filename
			};

			const filePath = path.join(this._conversationsPath, filename);
			const content = new TextEncoder().encode(JSON.stringify(conversationData, null, 2));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), content);

			// Update conversation index
			this._updateConversationIndex(filename, conversationData);

			console.log(`Saved conversation: ${filename}`, this._conversationsPath);
		} catch (error: any) {
			console.error('Failed to save conversation:', error.message);
		}
	}

	public async loadConversation(filename: string): Promise<void> {
		// Load the conversation history
		await this._loadConversationHistory(filename);
	}

	private _sendConversationList(): void {
		this._webview?.postMessage({
			type: 'conversationList',
			data: this._conversationIndex
		});
	}

	private async _sendWorkspaceFiles(searchTerm?: string): Promise<void> {
		try {
			// Always get all files and filter on the backend for better search results
			const files = await vscode.workspace.findFiles(
				'**/*',
				'{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.next/**,**/.nuxt/**,**/target/**,**/bin/**,**/obj/**}',
				500 // Reasonable limit for filtering
			);

			let fileList = files.map(file => {
				const relativePath = vscode.workspace.asRelativePath(file);
				return {
					name: file.path.split('/').pop() || '',
					path: relativePath,
					fsPath: file.fsPath
				};
			});

			// Filter results based on search term
			if (searchTerm && searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				fileList = fileList.filter(file => {
					const fileName = file.name.toLowerCase();
					const filePath = file.path.toLowerCase();
					
					// Check if term matches filename or any part of the path
					return fileName.includes(term) || 
						   filePath.includes(term) ||
						   filePath.split('/').some(segment => segment.includes(term));
				});
			}

			// Sort and limit results
			fileList = fileList
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 50);

			this._webview?.postMessage({
				type: 'workspaceFiles',
				data: fileList
			});
		} catch (error) {
			console.error('Error getting workspace files:', error);
			this._webview?.postMessage({
				type: 'workspaceFiles',
				data: []
			});
		}
	}

	private async _selectImageFile(): Promise<void> {
		try {
			// Show VS Code's native file picker for images
			const result = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: true,
				title: 'Select image files',
				filters: {
					'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
				}
			});
			
			if (result && result.length > 0) {
				// Process each selected file
				for (const uri of result) {
					try {
						// Read the file content
						const fileData = await vscode.workspace.fs.readFile(uri);
						
						// Get file extension to determine MIME type
						const fileName = uri.path.split('/').pop() || 'image';
						const extension = fileName.split('.').pop()?.toLowerCase() || '';
						
						// Determine MIME type
						let mimeType = 'image/png'; // default
						switch (extension) {
							case 'jpg':
							case 'jpeg':
								mimeType = 'image/jpeg';
								break;
							case 'png':
								mimeType = 'image/png';
								break;
							case 'gif':
								mimeType = 'image/gif';
								break;
							case 'svg':
								mimeType = 'image/svg+xml';
								break;
							case 'webp':
								mimeType = 'image/webp';
								break;
							case 'bmp':
								mimeType = 'image/bmp';
								break;
						}
						
						// Convert to base64 data URL
						const base64Data = Buffer.from(fileData).toString('base64');
						const dataUrl = `data:${mimeType};base64,${base64Data}`;
						
						// Send image data back to webview
						this._webview?.postMessage({
							type: 'imageData',
							path: uri.fsPath,
							name: fileName,
							dataUrl: dataUrl,
							isSelected: true
						});
						
					} catch (fileError) {
						console.error('Error reading image file:', uri.fsPath, fileError);
						// Send error notification
						this._webview?.postMessage({
							type: 'imageError',
							message: `Failed to load image: ${uri.path.split('/').pop()}`
						});
					}
				}
			}
			
		} catch (error) {
			console.error('Error selecting image files:', error);
		}
	}

	private _stopClaudeProcess(): void {
		console.log('Stop request received');
		
		if (this._currentClaudeProcess) {
			console.log('Terminating Claude process...');
			
			// Try graceful termination first
			this._currentClaudeProcess.kill('SIGTERM');
			
			// Force kill after 2 seconds if still running
			setTimeout(() => {
				if (this._currentClaudeProcess && !this._currentClaudeProcess.killed) {
					console.log('Force killing Claude process...');
					this._currentClaudeProcess.kill('SIGKILL');
				}
			}, 2000);
			
			// Clear process reference
			this._currentClaudeProcess = undefined;
			
			// Update UI state
			this._webview?.postMessage({
				type: 'setProcessing',
				data: false
			});
			
			this._webview?.postMessage({
				type: 'clearLoading'
			});
			
			// Send stop confirmation message directly to UI and save
			this._sendAndSaveMessage({
				type: 'error',
				data: '⏹️ Claude code was stopped.'
			});
			
			console.log('Claude process termination initiated');
		} else {
			console.log('No Claude process running to stop');
		}
	}

	private _updateConversationIndex(filename: string, conversationData: any): void {
		// Extract first and last user messages
		const userMessages = conversationData.messages.filter((m: any) => m.messageType === 'userInput');
		const firstUserMessage = userMessages.length > 0 ? userMessages[0].data : 'No user message';
		const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].data : firstUserMessage;

		// Create or update index entry
		const indexEntry = {
			filename: filename,
			sessionId: conversationData.sessionId,
			startTime: conversationData.startTime,
			endTime: conversationData.endTime,
			messageCount: conversationData.messageCount,
			totalCost: conversationData.totalCost,
			firstUserMessage: firstUserMessage.substring(0, 100), // Truncate for storage
			lastUserMessage: lastUserMessage.substring(0, 100)
		};

		// Remove any existing entry for this session (in case of updates)
		this._conversationIndex = this._conversationIndex.filter(entry => entry.filename !== conversationData.filename);

		// Add new entry at the beginning (most recent first)
		this._conversationIndex.unshift(indexEntry);

		// Keep only last 50 conversations to avoid workspace state bloat
		if (this._conversationIndex.length > 50) {
			this._conversationIndex = this._conversationIndex.slice(0, 50);
		}

		// Save to workspace state
		this._context.workspaceState.update('claude.conversationIndex', this._conversationIndex);


	}

	private _getLatestConversation(): any | undefined {
		return this._conversationIndex.length > 0 ? this._conversationIndex[0] : undefined;
	}

	private async _loadConversationHistory(filename: string): Promise<void> {
		console.log("_loadConversationHistory");
		if (!this._conversationsPath) {return;}

		try {
			const filePath = path.join(this._conversationsPath, filename);
			console.log("filePath", filePath);
			
			let conversationData;
			try {
				const fileUri = vscode.Uri.file(filePath);
				const content = await vscode.workspace.fs.readFile(fileUri);
				conversationData = JSON.parse(new TextDecoder().decode(content));
			} catch {
				return;
			}
			
			console.log("conversationData", conversationData);
			// Load conversation into current state
			this._currentConversation = conversationData.messages || [];
			this._conversationStartTime = conversationData.startTime;
			this._totalCost = conversationData.totalCost || 0;
			this._totalTokensInput = conversationData.totalTokens?.input || 0;
			this._totalTokensOutput = conversationData.totalTokens?.output || 0;

			// Clear UI messages first, then send all messages to recreate the conversation
			setTimeout(() => {
				// Clear existing messages
				this._webview?.postMessage({
					type: 'sessionCleared'
				});

				// Small delay to ensure messages are cleared before loading new ones
				setTimeout(() => {
					for (const message of this._currentConversation) {
						this._webview?.postMessage({
							type: message.messageType,
							data: message.data
						});
					}

					// Send updated totals
					this._webview?.postMessage({
						type: 'updateTotals',
						data: {
							totalCost: this._totalCost,
							totalTokensInput: this._totalTokensInput,
							totalTokensOutput: this._totalTokensOutput,
							requestCount: this._requestCount
						}
					});
				}, 50);
			}, 100); // Small delay to ensure webview is ready

			console.log(`Loaded conversation history: ${filename}`);
		} catch (error: any) {
			console.error('Failed to load conversation history:', error.message);
		}
	}

	private _getHtmlForWebview(): string {
		return html;
	}

	private _sendCurrentSettings(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const settings = {
			'thinking.intensity': config.get<string>('thinking.intensity', 'think'),
			'wsl.enabled': config.get<boolean>('wsl.enabled', false),
			'wsl.distro': config.get<string>('wsl.distro', 'Ubuntu'),
			'wsl.nodePath': config.get<string>('wsl.nodePath', '/usr/bin/node'),
			'wsl.claudePath': config.get<string>('wsl.claudePath', '/usr/local/bin/claude')
		};

		this._webview?.postMessage({
			type: 'settingsData',
			data: settings
		});
	}

	private async _updateSettings(settings: { [key: string]: any }): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		
		try {
			for (const [key, value] of Object.entries(settings)) {
				await config.update(key, value, vscode.ConfigurationTarget.Global);
			}
			
			vscode.window.showInformationMessage('Settings updated successfully');
		} catch (error) {
			console.error('Failed to update settings:', error);
			vscode.window.showErrorMessage('Failed to update settings');
		}
	}

	private _processErrorMessage(errorMessage: string): string {
		// Look for Claude usage limit messages with epoch timestamps
		const usageLimitRegex = /Claude AI usage limit reached\|(\d{10})/;
		const match = errorMessage.match(usageLimitRegex);
		
		if (match) {
			try {
				const epochTime = parseInt(match[1], 10);
				// Convert epoch (seconds) to milliseconds for JavaScript Date
				const date = new Date(epochTime * 1000);
				
				// Format time for Asia/Kuala_Lumpur timezone
				const options: Intl.DateTimeFormatOptions = {
					hour: 'numeric',
					minute: '2-digit',
					timeZone: 'Asia/Kuala_Lumpur'
				};
				
				const timeString = date.toLocaleString('en-US', options);
				return `Claude usage limit reached. Your limit will reset at ${timeString} (Asia/Kuala_Lumpur).`;
			} catch (error) {
				// If conversion fails, return original
				return errorMessage;
			}
		}
		
		// For other error messages, look for general epoch timestamps
		const epochRegex = /\b(\d{10})\b/g;
		return errorMessage.replace(epochRegex, (match, epochStr) => {
			try {
				const epochTime = parseInt(epochStr, 10);
				// Convert epoch (seconds) to milliseconds for JavaScript Date
				const date = new Date(epochTime * 1000);
				
				// Format as human-readable time with timezone
				const options: Intl.DateTimeFormatOptions = {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					timeZoneName: 'short'
				};
				
				const humanReadable = date.toLocaleString(undefined, options);
				return `${humanReadable} (${epochStr})`;
			} catch (error) {
				// If conversion fails, return original
				return match;
			}
		});
	}

	private async _getClipboardText(): Promise<void> {
		try {
			const text = await vscode.env.clipboard.readText();
			this._webview?.postMessage({
				type: 'clipboardText',
				data: text
			});
		} catch (error) {
			console.error('Failed to read clipboard:', error);
		}
	}

	private _setSelectedModel(model: string): void {
		// Validate model name to prevent issues mentioned in the GitHub issue
		const validModels = ['opus', 'sonnet', 'default'];
		if (validModels.includes(model)) {
			this._selectedModel = model;
			console.log('Model selected:', model);
			
			// Store the model preference in workspace state
			this._context.workspaceState.update('claude.selectedModel', model);
			
			// Show confirmation
			vscode.window.showInformationMessage(`Claude model switched to: ${model.charAt(0).toUpperCase() + model.slice(1)}`);
		} else {
			console.error('Invalid model selected:', model);
			vscode.window.showErrorMessage(`Invalid model: ${model}. Please select Opus, Sonnet, or Default.`);
		}
	}

	private _openModelTerminal(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = ['/model'];
		
		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude /model command
		const terminal = vscode.window.createTerminal('Claude Model Selection');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Check the terminal to update your default model configuration. Come back to this chat here after making changes.',
			'OK'
		);

		// Send message to UI about terminal
		this._webview?.postMessage({
			type: 'terminalOpened',
			data: 'Check the terminal to update your default model configuration. Come back to this chat here after making changes.'
		});
	}

	private _executeSlashCommand(command: string): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = [`/${command}`];
		
		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude command
		const terminal = vscode.window.createTerminal(`Claude /${command}`);
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			`Executing /${command} command in terminal. Check the terminal output and return when ready.`,
			'OK'
		);

		// Send message to UI about terminal
		this._webview?.postMessage({
			type: 'terminalOpened',
			data: `Executing /${command} command in terminal. Check the terminal output and return when ready.`,
		});
	}

	private _sendPlatformInfo() {
		const platform = process.platform;
		const dismissed = this._context.globalState.get<boolean>('wslAlertDismissed', false);
		
		// Get WSL configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		this._webview?.postMessage({
			type: 'platformInfo',
			data: {
				platform: platform,
				isWindows: platform === 'win32',
				wslAlertDismissed: dismissed,
				wslEnabled: wslEnabled
			}
		});
	}

	private _dismissWSLAlert() {
		this._context.globalState.update('wslAlertDismissed', true);
	}

	private async _openFileInEditor(filePath: string) {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
			console.error('Error opening file:', error);
		}
	}

	public dispose() {
		// Clear webview reference
		this._webview = undefined;

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}