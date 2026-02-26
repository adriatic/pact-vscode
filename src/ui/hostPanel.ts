import * as vscode from "vscode";

export class HostPanel {
  public static currentPanel: HostPanel | undefined;
  private static _context: vscode.ExtensionContext;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    HostPanel._context = context;

    this._panel.onDidDispose(() => this.dispose(), null, context.subscriptions);

    this._panel.webview.html = this._getHtmlForWebview(
      this._panel.webview
    );

    this._setWebviewMessageListener();
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (HostPanel.currentPanel) {
      HostPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "pact3Host",
      "PACT3 Host",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    HostPanel.currentPanel = new HostPanel(
      panel,
      context.extensionUri,
      context
    );
  }

  private _setWebviewMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        console.log("PACT: Webview message received:", message);

        if (message.command === "sendToLLM") {
          try {
            // Delegate to extension command
            await vscode.commands.executeCommand("pact3.sendPrompt");
          } catch (err: any) {
            this._panel.webview.postMessage({
              command: "llmError",
              text: err?.message || "Unknown error",
            });
          }
        }
      },
      undefined,
      HostPanel._context.subscriptions
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
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

  public dispose() {
    HostPanel.currentPanel = undefined;
    this._panel.dispose();
  }
}