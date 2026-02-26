"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostPanel = void 0;
const vscode = __importStar(require("vscode"));
class HostPanel {
    constructor(panel, extensionUri, context) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        HostPanel._context = context;
        this._panel.onDidDispose(() => this.dispose(), null, context.subscriptions);
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        this._setWebviewMessageListener();
    }
    static createOrShow(context) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (HostPanel.currentPanel) {
            HostPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel("pact3Host", "PACT3 Host", column || vscode.ViewColumn.One, {
            enableScripts: true,
        });
        HostPanel.currentPanel = new HostPanel(panel, context.extensionUri, context);
    }
    _setWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            console.log("PACT: Webview message received:", message);
            if (message.command === "sendToLLM") {
                try {
                    // Delegate to extension command
                    await vscode.commands.executeCommand("pact3.sendPrompt");
                }
                catch (err) {
                    this._panel.webview.postMessage({
                        command: "llmError",
                        text: err?.message || "Unknown error",
                    });
                }
            }
        }, undefined, HostPanel._context.subscriptions);
    }
    _getHtmlForWebview(webview) {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src 'unsafe-inline';
                   script-src 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PACT3 Host</title>
      </head>
      <body>
        <h2>PACT3 Host</h2>

        <textarea id="promptInput"
          rows="8"
          style="width:100%;"
          placeholder="Type your prompt here..."></textarea>

        <br/><br/>

        <button onclick="sendToLLM()">Send to LLM</button>

        <script>
          const vscode = acquireVsCodeApi();
          console.log("PACT: Script loaded");

          function sendToLLM() {
            const text = document.getElementById("promptInput").value;

            vscode.postMessage({
              command: "sendToLLM",
              text
            });
          }

          document.addEventListener("keydown", function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              sendToLLM();
            }
          });
        </script>
      </body>
      </html>
    `;
    }
    dispose() {
        HostPanel.currentPanel = undefined;
        this._panel.dispose();
    }
}
exports.HostPanel = HostPanel;
//# sourceMappingURL=hostPanel.js.map