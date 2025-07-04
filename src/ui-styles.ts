const styles = `
<style>
    body {
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    .btn.outlined {
        background-color: transparent;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
    }

    .btn.outlined:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .btn.stop {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 400;
        opacity: 0.7;
    }

    .btn.stop:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.3);
        opacity: 1;
    }

    /* WSL Alert */
    .wsl-alert {
        margin: 8px 12px;
        background-color: rgba(135, 206, 235, 0.1);
        border: 2px solid rgba(135, 206, 235, 0.3);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes errorSlideIn {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.08);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 4px 16px rgba(231, 76, 60, 0.12);
        }
    }

    .wsl-alert-content {
        display: flex;
        align-items: center;
        padding: 14px 18px;
        gap: 14px;
    }

    .wsl-alert-icon {
        font-size: 22px;
        flex-shrink: 0;
    }

    .wsl-alert-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground);
    }

    .wsl-alert-text strong {
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .wsl-alert-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }

    .wsl-alert-actions .btn {
        padding: 6px 14px;
        font-size: 12px;
        border-radius: 6px;
    }

    .wsl-alert-actions .btn:first-child {
        background-color: rgba(135, 206, 235, 0.2);
        border-color: rgba(135, 206, 235, 0.4);
    }

    .wsl-alert-actions .btn:first-child:hover {
        background-color: rgba(135, 206, 235, 0.3);
        border-color: rgba(135, 206, 235, 0.6);
    }

    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .messages {
        flex: 1;
        padding: 8px 12px;
        overflow-y: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.5;
        scroll-behavior: smooth;
    }

    .message {
        margin-bottom: 8px;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        position: relative;
        backdrop-filter: blur(0.5px);
    }



    .message.user:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.12);
    }

    .message.user {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        margin-bottom: 12px;
        box-shadow: none;
        position: relative;
        padding: 8px 12px;
        margin-left: 50px;
    }

    .message.user::before {
        display: none;
    }

    .message.claude {
        background: transparent;
        border: none;
        color: var(--vscode-editor-foreground);
        padding: 4px 0;
        margin-bottom: 12px;
    }

    .message.claude::before {
        display: none;
    }

    .message.error {
        border: 1px solid rgba(231, 76, 60, 0.2);
        border-radius: 12px;
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.08) 0%, rgba(192, 57, 43, 0.05) 100%);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 16px rgba(231, 76, 60, 0.12);
        animation: errorSlideIn 0.4s ease-out;
    }

    .message.error::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
        border-radius: 12px 0 0 12px;
    }

    .message.error::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.02) 100%);
        pointer-events: none;
        border-radius: 12px;
    }

    .message.error.usage-limit {
        border: 1px solid rgba(255, 152, 0, 0.3);
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 193, 7, 0.05) 100%);
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.15);
    }

    .message.error.usage-limit::before {
        background: linear-gradient(180deg, #ff9800 0%, #ff5722 100%);
    }

    .message.error.usage-limit .message-icon.error {
        background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.4);
    }

    .message.error.usage-limit .message-icon.error svg {
        color: white;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .message.error.usage-limit .message-label {
        color: #ff9800;
        font-weight: 700;
    }

    .message.error .message-content {
        padding-left: 8px;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        line-height: 1.5;
    }

    .message.error .message-content pre {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 14px 16px;
        margin: 8px 0;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        line-height: 1.5;
        color: var(--vscode-foreground);
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .message.error.usage-limit .message-content pre {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.2);
        color: var(--vscode-foreground);
    }

    /* Compact Error Styling */
    .message.error.compact {
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.06) 0%, rgba(192, 57, 43, 0.03) 100%);
        border: 1px solid rgba(231, 76, 60, 0.15);
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.08);
    }

    .message.error.compact .message-header {
        margin-bottom: 4px;
        padding-bottom: 0;
        border-bottom: none;
    }

    .message.error.compact .message-content {
        padding-left: 0;
    }

    .error-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 0;
        transition: all 0.2s ease;
    }

    .error-summary:hover {
        opacity: 0.8;
    }

    .error-summary-text {
        font-family: var(--vscode-font-family);
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        flex: 1;
    }

    .error-toggle {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        transition: all 0.2s ease;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .error-toggle:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }

    .error-details {
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
        color: var(--vscode-descriptionForeground);
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 200px;
        overflow-y: auto;
        display: none;
    }

    .error-details.expanded {
        display: block;
        animation: errorDetailsSlide 0.3s ease-out;
    }

    @keyframes errorDetailsSlide {
        from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
        }
        to {
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
        }
    }

    .error-type-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-right: 8px;
    }

    .error-type-badge.regex {
        background: rgba(156, 39, 176, 0.15);
        color: #9c27b0;
        border: 1px solid rgba(156, 39, 176, 0.3);
    }

    .error-type-badge.parse {
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
        border: 1px solid rgba(255, 152, 0, 0.3);
    }

    .error-type-badge.syntax {
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
        border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .message.system {
        background-color: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        font-style: normal;
        font-size: 8px;
        opacity: 0.25;
        padding: 0;
        margin: 0;
        text-align: right;
        font-weight: 300;
        animation: fadeInSubtle 0.3s ease-in;
        transition: opacity 0.2s ease;
        font-family: var(--vscode-editor-font-family);
        letter-spacing: 0.1px;
        line-height: 1;
        min-height: 10px;
        max-height: 10px;
        overflow: hidden;
    }

    .message.system:hover {
        opacity: 0.6;
    }

    .message.loading-message {
        font-size: 10px;
        opacity: 0.4;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        margin: 2px 0;
        padding: 2px;
        font-style: italic;
    }

    @keyframes fadeInSubtle {
        from {
            opacity: 0;
            transform: translateY(2px);
        }
        to {
            opacity: 0.25;
            transform: translateY(0);
        }
    }

    .message.tool {
        background: rgba(120, 139, 237, 0.04);
        border: 1px solid rgba(120, 139, 237, 0.1);
        border-radius: 6px;
        color: var(--vscode-editor-foreground);
        margin-bottom: 8px;
        padding: 8px 12px;
    }

    .message.tool-read-compact {
        padding: 3px 20px 3px 0px;
        margin: 0px 0;
        border-radius: 6px;
        background: transparent;
        border: none;
    }

    .message.tool-edit-flat {
        padding: 0;
        margin: 8px 0;
        background: transparent;
        border: none;
    }

    .message.tool::before {
        display: none;
    }

    .message.tool-result {
        background: rgba(28, 192, 140, 0.04);
        border: 1px solid rgba(28, 192, 140, 0.1);
        border-radius: 6px;
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        white-space: pre-wrap;
        margin-bottom: 8px;
        padding: 8px 12px;
    }

    .message.tool-result::before {
        display: none;
    }

    .message.thinking {
        border: 1px solid rgba(186, 85, 211, 0.2);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        font-style: italic;
        opacity: 0.9;
        position: relative;
        overflow: hidden;
    }

    .message.thinking::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #ba55d3 0%, #9932cc 100%);
    }

    /* Collapsed thinking styles */
    .message.thinking.thinking-collapsed {
        border: none;
        background: transparent;
        opacity: 1;
        font-style: normal;
        cursor: pointer;

    }

    .message.thinking.thinking-collapsed::before {
        display: none;
    }

    .thinking-header {
        display: flex;
        align-items: left;
        gap: 20px;
        padding: 8px 0;
        user-select: none;
        transition: all 0.2s ease;
        border-radius: 6px;
    }

    .thinking-header:hover {
        background: rgba(128, 128, 128, 0.05);
    }

    .thinking-chevron {
        font-size: 10px;
        color: rgba(128, 128, 128, 0.6);
        transition: transform 0.2s ease;
        width: 12px;
        text-align: center;
        margin-right: 10px;
    }

    .thinking-label {
        font-size: 12px;
        font-weight: 400;
        color: rgba(128, 128, 128, 0.7);
        letter-spacing: 0.02em;
    }

    .thinking-expandable-content {
        padding: 12px 0 12px 0;
        transition: all 0.2s ease;
        font-size: 12px;
    }

    .thinking-collapsed-header{
        cursor: pointer;
    }

    .message.thinking.thinking-collapsed .thinking-expandable-content {
        display: none;
    }

    .tool-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .tool-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: linear-gradient(135deg, #7c8bed 0%, #5d6fe1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 6px;
    }

    .tool-info {
        font-weight: 500;
        font-size: 12px;
        color: var(--vscode-editor-foreground);
        opacity: 0.85;
    }

    .tool-compact-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        // background-color: var(--vscode-badge-background, #4a4a4a);
        border: 1px solid rgba(var(--vscode-badge-foreground-rgb, 204, 204, 204), 0.3);
        border-radius: 6px;
        font-size: 11px;
        line-height: 1;
        width: 100%;
        opacity: 0.7;
    }

    .tool-icon-pill {
        font-size: 10px;
        line-height: 1;
        flex-shrink: 0;
    }

    .tool-label-pill {
        font-weight: 500;
        color: var(--vscode-badge-foreground, #cccccc);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .tool-file-pill {
        font-weight: 400;
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        text-decoration: none;
        border-radius: 6px;
        padding: 1px 3px;
        transition: all 0.2s ease;
        white-space: nowrap;
        background-color: rgba(255, 255, 255, 0.00);
    }

    .tool-file-pill:hover {
        background-color: var(--vscode-list-hoverBackground);
        color: var(--vscode-textLink-activeForeground);
        text-decoration: none;
    }

    /* Modern Result element with top-left label and content-focused design */
    .message.tool-result-compact {
        padding: 0;
        margin: 12px 0;
        background: transparent;
        border: none;
    }

    .result-container {
        position: relative;
        padding-top: 16px; /* Space for the top label */
    }

    .result-top-label {
        position: absolute;
        top: -2px;
        left: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        z-index: 2;
        background: var(--vscode-editor-background);
        padding: 0 4px;
    }

    .result-top-icon {
        font-size: 8px;
        line-height: 1;
    }

    .result-content-box {
        position: relative;
        background: rgba(28, 192, 140, 0.04);
        border: 1px solid rgba(28, 192, 140, 0.15);
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s ease;
        font-family: var(--vscode-editor-font-family);
    }

    .result-content-box:hover {
        background: rgba(28, 192, 140, 0.06);
        border-color: rgba(28, 192, 140, 0.25);
        box-shadow: 0 2px 8px rgba(28, 192, 140, 0.1);
    }

    .result-content-text {
        color: var(--vscode-editor-foreground);
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
        // padding-bottom: 8px;
    }

    .result-show-more-btn {
        position: absolute;
        bottom: 8px;
        right: 12px;
        background: rgba(28, 192, 140, 0.1);
        border: 1px solid rgba(28, 192, 140, 0.25);
        color: #1cc08c;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.8;
    }

    .result-show-more-btn:hover {
        background: rgba(28, 192, 140, 0.15);
        border-color: rgba(28, 192, 140, 0.4);
        opacity: 1;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(28, 192, 140, 0.2);
    }

    .result-show-more-btn:active {
        transform: translateY(0);
    }

    .expand-icon {
        font-size: 8px;
        transition: transform 0.2s ease;
        display: inline-block;
    }

    .result-show-more-btn.expanded .expand-icon {
        transform: rotate(180deg);
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        position: relative;
    }

    .message.user .message-header {
        position: absolute;
        top: 8px;
        left: -40px;
        border-bottom: none;
        padding: 0;
        margin: 0;
        background: transparent;
        z-index: 1;
        width: 30px;
    }

    .copy-btn {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        opacity: 0;
        transition: all 0.2s ease;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }

    .message.user:hover .copy-btn,
    .message.claude:hover .copy-btn {
        opacity: 0.6;
    }

    .message.user .copy-btn {
        position: absolute;
        top: -2px;
        right: 0px;
        background: var(--vscode-editor-background);
        border-radius: 3px;
        padding: 2px 4px;
    }

    .copy-btn:hover {
        opacity: 1;
        background-color: var(--vscode-list-hoverBackground);
        transform: scale(1.05);
    }

    .message-icon {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 0;
    }

    .message.user .message-icon {
        display: none;
    }

    .message-icon.user {
        background: linear-gradient(135deg, #40a5ff 0%, #0078d4 100%);
    }

    .message-icon.claude {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    }

    .message-icon.system {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    }

    .message-icon.error {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message-icon.error svg {
        color: white;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .message-label {
        font-weight: 600;
        font-size: 11px;
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .message.user .message-label {
        font-size: 10px;
        font-weight: 600;
        opacity: 0.9;
        text-transform: none;
        letter-spacing: 0;
        color: var(--vscode-descriptionForeground);
        padding: 4px 6px;
        background: transparent;
        border: 1px solid var(--vscode-descriptionForeground);
        border-radius: 50%;
        text-align: center;
        white-space: nowrap;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .message-content {
        padding-left: 6px;
    }

    .message.user .message-content {
        padding: 0;
        padding-top: 8px;
        padding-bottom: 8px;
        margin: 0;
        margin-left: 0;
    }

    .priority-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 6px;
    }

    .priority-badge.high {
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .priority-badge.medium {
        background: rgba(243, 156, 18, 0.15);
        color: #f39c12;
        border: 1px solid rgba(243, 156, 18, 0.3);
    }

    .priority-badge.low {
        background: rgba(149, 165, 166, 0.15);
        color: #95a5a6;
        border: 1px solid rgba(149, 165, 166, 0.3);
    }

    .tool-input {
        padding: 6px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-line;
        position: relative;
    }

    .tool-input-label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tool-input-content {
        color: var(--vscode-editor-foreground);
        opacity: 0.95;
        position: relative;
    }

    /* Add bottom padding only when expand button is present */
    .tool-input.has-expand-btn,
    .tool-input-content.has-expand-btn {
        padding-bottom: 40px;
    }

    /* Diff display styles for Edit tool */
    .diff-container {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        overflow: hidden;
    }

    .diff-header {
        background-color: var(--vscode-panel-background);
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-foreground);
        border-bottom: 1px solid var(--vscode-panel-border);
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .diff-header:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .diff-removed,
    .diff-added {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
    }

    .diff-line {
        padding: 2px 12px;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .diff-line.removed {
        background-color: rgba(244, 67, 54, 0.1);
        border-left: 3px solid rgba(244, 67, 54, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.added {
        background-color: rgba(76, 175, 80, 0.1);
        border-left: 3px solid rgba(76, 175, 80, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.removed::before {
        content: '';
        color: rgba(244, 67, 54, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-line.added::before {
        content: '';
        color: rgba(76, 175, 80, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-expand-container {
        padding: 8px 12px;
        text-align: center;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
    }

    .diff-expand-btn {
        background: rgba(120, 139, 237, 0.1);
        border: 1px solid rgba(120, 139, 237, 0.25);
        color: #788bed;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .diff-expand-btn:hover {
        background: rgba(120, 139, 237, 0.15);
        border-color: rgba(120, 139, 237, 0.4);
        box-shadow: 0 2px 6px rgba(120, 139, 237, 0.2);
    }

    .diff-expand-btn:active {
        transform: translateY(1px);
    }

    /* MultiEdit specific styles */
    .single-edit {
        margin-bottom: 12px;
    }

    .edit-number {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--vscode-descriptionForeground);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 6px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .diff-edit-separator {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        margin: 12px 0;
    }

    /* File path display styles */
    .diff-file-path {
        padding: 8px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .diff-file-path:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .diff-file-path:active {
        transform: translateY(1px);
    }

    .file-path-short,
    .file-path-truncated {
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .file-path-truncated {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .file-path-truncated .file-icon {
        font-size: 14px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .file-path-truncated:hover {
        color: var(--vscode-textLink-foreground);
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-path-truncated:hover .file-icon {
        opacity: 1;
    }

    .file-path-truncated:active {
        transform: translateY(1px);
    }

    .expand-btn {
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 500;
        position: absolute;
        bottom: 8px;
        right: 12px;
        transition: all 0.2s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.8;
        border: 1px solid;
    }

    .expand-btn:hover {
        opacity: 1;
        transform: translateY(-1px);
    }

    /* Blue theme for Tool containers */
    .expand-btn-tool {
        background: rgba(120, 139, 237, 0.1);
        border-color: rgba(120, 139, 237, 0.25);
        color: #788bed;
    }

    .expand-btn-tool:hover {
        background: rgba(120, 139, 237, 0.15);
        border-color: rgba(120, 139, 237, 0.4);
        box-shadow: 0 2px 6px rgba(120, 139, 237, 0.2);
    }

    /* Green theme for Result containers */
    .expand-btn-result {
        background: rgba(28, 192, 140, 0.1);
        border-color: rgba(28, 192, 140, 0.25);
        color: #1cc08c;
    }

    .expand-btn-result:hover {
        background: rgba(28, 192, 140, 0.15);
        border-color: rgba(28, 192, 140, 0.4);
        box-shadow: 0 2px 6px rgba(28, 192, 140, 0.2);
    }

    .expanded-content {
        margin-top: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        position: relative;
    }

    .expanded-content::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #40a5ff 0%, #0078d4 100%);
        border-radius: 0 0 0 6px;
    }

    .expanded-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .input-container {
        padding: 8px 12px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-panel-background);
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .input-modes {
        display: flex;
        gap: 12px;
        align-items: center;
        padding-bottom: 6px;
        font-size: 10px;
    }

    .mode-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--vscode-foreground);
        opacity: 0.8;
        transition: opacity 0.2s ease;
    }

    .mode-toggle span {
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .mode-toggle span:hover {
        opacity: 1;
    }

    .mode-toggle:hover {
        opacity: 1;
    }

    .mode-switch {
        position: relative;
        width: 26px;
        height: 14px;
        background-color: var(--vscode-panel-border);
        border-radius: 7px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .mode-switch.active {
        background-color: var(--vscode-button-background);
    }

    .mode-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        background-color: var(--vscode-foreground);
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .mode-switch.active::after {
        transform: translateX(10px);
        background-color: var(--vscode-button-foreground);
    }

    .textarea-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
    }

    .textarea-wrapper {
        flex: 1;
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        overflow: hidden;
    }

    .textarea-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
    }

    .input-field {
        width: 100%;
        background-color: transparent;
        color: var(--vscode-input-foreground);
        border: none;
        padding: 10px 12px;
        outline: none;
        font-family: var(--vscode-editor-font-family);
        min-height: 18px;
        line-height: 1.4;
        overflow-y: hidden;
        resize: none;
        font-size: 13px;
    }

    .input-field:focus {
        border: none;
        outline: none;
    }

    .input-field::placeholder {
        color: var(--vscode-input-placeholderForeground);
        border: none;
        outline: none;
    }

    /* Image Attachments */
    .image-attachments {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 12px;
        background-color: var(--vscode-input-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        max-height: 120px;
        overflow-y: auto;
    }

    .image-thumbnail {
        position: relative;
        width: 60px;
        height: 60px;
        border-radius: 6px;
        overflow: hidden;
        border: 2px solid var(--vscode-panel-border);
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .image-thumbnail:hover {
        border-color: var(--vscode-focusBorder);
        transform: scale(1.05);
    }

    .image-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .image-thumbnail-delete {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background-color: var(--vscode-errorForeground);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1;
    }

    .image-thumbnail:hover .image-thumbnail-delete {
        opacity: 1;
    }

    .image-thumbnail-delete:hover {
        background-color: var(--vscode-errorForeground);
        transform: scale(1.1);
    }

    /* Drag and Drop */
    .textarea-container.drag-over {
        background-color: rgba(14, 99, 156, 0.1);
        border: 2px dashed var(--vscode-focusBorder);
        border-radius: 6px;
    }

    .drag-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(14, 99, 156, 0.15);
        border: 3px dashed var(--vscode-focusBorder);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vscode-focusBorder);
        font-weight: 600;
        font-size: 16px;
        z-index: 1000;
        pointer-events: none;
        backdrop-filter: blur(2px);
        animation: dragPulse 1s ease-in-out infinite alternate;
    }

    @keyframes dragPulse {
        from {
            border-color: var(--vscode-focusBorder);
            background-color: rgba(14, 99, 156, 0.1);
        }
        to {
            border-color: var(--vscode-button-background);
            background-color: rgba(14, 99, 156, 0.2);
        }
    }

    .input-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 2px 4px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-input-background);
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .model-selector {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .model-selector:hover {
        background-color: rgba(128, 128, 128, 0.25);
        opacity: 1;
    }

    .tools-btn {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tools-btn:hover {
        background-color: rgba(128, 128, 128, 0.25);
        opacity: 1;
    }

    .at-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .at-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .image-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: all 0.2s ease;
        padding-top: 6px;
    }

    .image-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .send-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .send-btn div {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
    }

    .send-btn span {
        line-height: 1;
    }

    .send-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .secondary-button {
        background-color: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .secondary-button:hover {
        background-color: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.3));
        border-color: var(--vscode-focusBorder);
    }

    .right-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .beta-warning {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        font-style: normal;
        background-color: var(--vscode-panel-background);
        padding: 3px 8px;
        opacity: 0.7;
        font-weight: 400;
    }

    .file-picker-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-picker-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        width: 400px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .file-picker-header {
        padding: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .file-picker-header span {
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .file-search-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        padding: 6px 8px;
        border-radius: 3px;
        outline: none;
        font-size: 13px;
    }

    .file-search-input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .file-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 4px;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 3px;
        font-size: 13px;
        gap: 8px;
    }

    .file-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-item.selected {
        background-color: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .file-icon {
        font-size: 16px;
        flex-shrink: 0;
    }

    .file-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .file-name {
        font-weight: 500;
    }

    .file-path {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .file-thumbnail {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        overflow: hidden;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .thumbnail-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
    }

    .tools-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tools-modal-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        width: 500px;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .tools-modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tools-modal-header span {
        font-weight: 600;
        font-size: 14px;
        color: var(--vscode-foreground);
    }

    .tools-close-btn {
        background: none;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
    }

    .tools-beta-warning {
        padding: 12px 16px;
        background-color: var(--vscode-notifications-warningBackground);
        color: var(--vscode-notifications-warningForeground);
        font-size: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tools-list {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
    }

    .tool-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 0;
        cursor: pointer;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }

    .tool-item:last-child {
        border-bottom: none;
    }

    .tool-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        padding: 16px 12px;
        margin: 0 -12px;
    }

    .tool-item input[type="checkbox"], 
    .tool-item input[type="radio"] {
        margin: 0;
        margin-top: 2px;
        flex-shrink: 0;
    }

    .tool-item label {
        color: var(--vscode-foreground);
        font-size: 13px;
        cursor: pointer;
        flex: 1;
        line-height: 1.4;
    }

    .tool-item input[type="checkbox"]:disabled + label {
        opacity: 0.7;
    }

    /* Model selection specific styles */
    .model-explanatory-text {
        padding: 20px;
        padding-bottom: 0px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .model-title {
        font-weight: 600;
        margin-bottom: 4px;
    }

    .model-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.3;
    }

    .model-option-content {
        flex: 1;
    }

    .default-model-layout {
        cursor: pointer;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        width: 100%;
    }

    .configure-button {
        margin-left: 12px;
        flex-shrink: 0;
        align-self: flex-start;
    }

    /* Thinking intensity slider */
    .thinking-slider-container {
        position: relative;
        padding: 0px 16px;
        margin: 12px 0;
    }

    .thinking-slider {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--vscode-panel-border);
        outline: none !important;
        border: none;
        cursor: pointer;
        border-radius: 2px;
    }

    .thinking-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .thinking-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        border: none;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding: 0 8px;
    }

    .slider-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        transition: all 0.2s ease;
        text-align: center;
        width: 100px;
        cursor: pointer;
    }

    .slider-label:hover {
        opacity: 1;
        color: var(--vscode-foreground);
    }

    .slider-label.active {
        opacity: 1;
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .slider-label:first-child {
        margin-left: -50px;
    }

    .slider-label:last-child {
        margin-right: -50px;
    }

    .settings-group {
        padding-bottom: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .settings-group h3 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }


    /* Thinking intensity modal */
    .thinking-modal-description {
        padding: 0px 20px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
        text-align: center;
        margin: 20px;
        margin-bottom: 0px;
    }

    .thinking-modal-actions {
        padding-top: 20px;
        text-align: right;
        border-top: 1px solid var(--vscode-widget-border);
    }

    .confirm-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .confirm-btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    /* Slash commands modal */
    .slash-commands-info {
        padding: 12px 16px;
        background-color: rgba(255, 149, 0, 0.1);
        border: 1px solid rgba(255, 149, 0, 0.2);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    .slash-commands-info p {
        margin: 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        opacity: 0.9;
    }

    .slash-commands-list {
        display: grid;
        gap: 8px;
        max-height: 400px;
        overflow-y: auto;
    }

    .slash-command-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
    }

    .slash-command-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .slash-command-icon {
        font-size: 18px;
        min-width: 24px;
        text-align: center;
    }

    .slash-command-content {
        flex: 1;
    }

    .slash-command-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .slash-command-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    /* Custom command input */
    .custom-command-item {
        cursor: default;
    }

    .custom-command-input-container {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-top: 4px;
    }

    .command-prefix {
        font-size: 12px;
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .custom-command-input {
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        color: var(--vscode-input-foreground);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        outline: none;
        min-width: 120px;
        font-family: var(--vscode-editor-font-family);
    }

    .custom-command-input:focus {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .custom-command-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 0.7;
    }

    .status {
        padding: 8px 12px;
        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
        color: #e1e1e1;
        font-size: 12px;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .status.ready .status-indicator {
        background-color: #00d26a;
        box-shadow: 0 0 6px rgba(0, 210, 106, 0.5);
    }

    .status.processing .status-indicator {
        background-color: #ff9500;
        box-shadow: 0 0 6px rgba(255, 149, 0, 0.5);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .status.error .status-indicator {
        background-color: #ff453a;
        box-shadow: 0 0 6px rgba(255, 69, 58, 0.5);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
    }

    .status-text {
        flex: 1;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
    }

    .session-badge {
        margin-left: 16px;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s, transform 0.1s;
    }

    .session-badge:hover {
        background-color: var(--vscode-button-hoverBackground);
        transform: scale(1.02);
    }

    .session-icon {
        font-size: 10px;
    }

    .session-label {
        opacity: 0.8;
        font-size: 10px;
    }

    .session-status {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        padding: 2px 6px;
        border-radius: 4px;
        background-color: var(--vscode-badge-background);
        border: 1px solid var(--vscode-panel-border);
    }

    .session-status.active {
        color: var(--vscode-terminal-ansiGreen);
        background-color: rgba(0, 210, 106, 0.1);
        border-color: var(--vscode-terminal-ansiGreen);
    }

    /* Markdown content styles */
    
    /* Code block styles - using monospace font and distinct background */
    .message-content pre {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 10px 12px;
        margin: 6px 0;
        font-family: var(--vscode-editor-font-family);
        font-size: calc(var(--vscode-editor-font-size) - 1px);
        line-height: 1.4;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    
    .message-content pre code {
        background: none;
        border: none;
        padding: 0;
        font-family: inherit;
        font-size: inherit;
        color: var(--vscode-editor-foreground);
    }
    
    /* Inline code styles - using monospace font with subtle background */
    .message-content code {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        padding: 1px 4px;
        font-family: var(--vscode-editor-font-family);
        font-size: calc(var(--vscode-editor-font-size) * 0.88);
        color: var(--vscode-textPreformat-foreground);
        white-space: pre-wrap;
    }
    
    /* Regular text content uses system font for better readability */
    .message-content {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        line-height: 1.6;
        color: var(--vscode-foreground);
    }
    
    /* Paragraphs and general text content */
    .message-content p {
        margin: 8px 0;
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        line-height: 1.6;
    }
    
    /* Headers should use system font but with appropriate sizing */
    .message-content h1, 
    .message-content h2, 
    .message-content h3, 
    .message-content h4, 
    .message-content h5, 
    .message-content h6 {
        font-family: var(--vscode-font-family);
        font-weight: 600;
        margin: 16px 0 8px 0;
        color: var(--vscode-foreground);
    }
    
    .message-content h1 { font-size: 1.5em; }
    .message-content h2 { font-size: 1.3em; }
    .message-content h3 { font-size: 1.1em; }
    .message-content h4 { font-size: 1em; }
    
    /* Lists should use system font */
    .message-content ul, 
    .message-content ol {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        line-height: 1.6;
        margin: 8px 0;
        padding-left: 20px;
    }
    
    .message-content li {
        margin: 4px 0;
    }
    
    /* Bold and italic should maintain font family but adjust weight/style */
    .message-content strong {
        font-weight: 600;
    }
    
    .message-content em {
        font-style: italic;
    }
    .message h1, .message h2, .message h3, .message h4 {
        margin: 0.8em 0 0.4em 0;
        font-weight: 600;
        line-height: 1.3;
    }

    .message h1 {
        font-size: 1.5em;
        border-bottom: 2px solid var(--vscode-panel-border);
        padding-bottom: 0.3em;
    }

    .message h2 {
        font-size: 1.3em;
        border-bottom: 1px solid var(--vscode-panel-border);
        padding-bottom: 0.2em;
    }

    .message h3 {
        font-size: 1.1em;
    }

    .message h4 {
        font-size: 1.05em;
    }

    .message strong {
        font-weight: 600;
        color: var(--vscode-terminal-ansiBrightWhite);
    }

    .message em {
        font-style: italic;
    }

    .message ul, .message ol {
        margin: 0.6em 0;
        padding-left: 1.5em;
    }

    .message li {
        margin: 0.3em 0;
        line-height: 1.4;
    }

    .message ul li {
        list-style-type: disc;
    }

    .message ol li {
        list-style-type: decimal;
    }

    .message p {
        margin: 0.5em 0;
        line-height: 1.6;
    }

    .message p:first-child {
        margin-top: 0;
    }

    .message p:last-child {
        margin-bottom: 0;
    }

    .message br {
        line-height: 1.2;
    }

    .restore-container {
        display: none;
    }

    .revert-btn {
        position: absolute;
        bottom: 6px;
        right: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 3px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 500;
        opacity: 0;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .message.user:hover .revert-btn {
        opacity: 1;
    }

    .revert-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--vscode-foreground);
    }

    .conversation-history {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 60px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border);
        z-index: 1000;
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-widget-border);
    }

    .conversation-header h3 {
        margin: 0;
        font-size: 16px;
    }

    .conversation-list {
        padding: 8px;
        overflow-y: auto;
        height: calc(100% - 60px);
    }

    .conversation-item {
        padding: 12px;
        margin: 4px 0;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 6px;
        cursor: pointer;
        background-color: var(--vscode-list-inactiveSelectionBackground);
    }

    .conversation-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .conversation-title {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .conversation-meta {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .conversation-preview {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    /* Tool loading animation */
    .tool-loading {
        padding: 16px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        background-color: var(--vscode-panel-background);
        border-top: 1px solid var(--vscode-panel-border);
    }

    .loading-spinner {
        display: flex;
        gap: 4px;
    }

    .loading-ball {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--vscode-button-background);
        animation: bounce 1.4s ease-in-out infinite both;
    }

    .loading-ball:nth-child(1) { animation-delay: -0.32s; }
    .loading-ball:nth-child(2) { animation-delay: -0.16s; }
    .loading-ball:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
        0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .loading-text {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    /* Tool completion indicator */
    .tool-completion {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: rgba(76, 175, 80, 0.1);
        border-top: 1px solid rgba(76, 175, 80, 0.2);
        font-size: 12px;
    }

    .completion-icon {
        color: #4caf50;
        font-weight: bold;
    }

    .completion-text {
        color: var(--vscode-foreground);
        opacity: 0.8;
    }

</style>`;

export default styles;