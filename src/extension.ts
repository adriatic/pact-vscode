import * as vscode from "vscode";
import OpenAI from "openai";
import { moderate } from "./moderator/moderator";

export function activate(context: vscode.ExtensionContext) {
  const provider = new PactViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "pact-vscode.pactView",
      provider
    )
  );

  // Auto-open PACT container
  vscode.commands.executeCommand("workbench.view.extension.pactContainer");

  context.subscriptions.push(
    vscode.commands.registerCommand("pact.setApiKey", async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your OpenAI API Key",
        password: true,
      });

      if (!apiKey) return;

      await context.secrets.store("pact.openaiApiKey", apiKey.trim());
      vscode.window.showInformationMessage("PACT API key stored.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pact.sendPrompt", async () => {
      provider.sendPrompt();
    })
  );
}

class PactViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private context: vscode.ExtensionContext;
  private client?: OpenAI;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.type === "send") {
        await this.sendPrompt(message.payload);
      }
    });
  }

  async sendPrompt(payload?: any) {
    if (!this.view) return;

    const text = payload?.text?.trim();
    if (!text) {
      vscode.window.showWarningMessage("Prompt is empty.");
      return;
    }

    const decision = moderate(text);
    if (decision.action === "block") {
      vscode.window.showWarningMessage(decision.reason);
      return;
    }

    const apiKey = await this.context.secrets.get("pact.openaiApiKey");
    if (!apiKey) {
      vscode.window.showErrorMessage("Set API key first.");
      return;
    }

    this.client = new OpenAI({ apiKey });

    const start = Date.now();
    const sentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const response = await this.client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text }],
        },
      ],
    });

    const latency = Date.now() - start;
    const receivedTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const output =
      response.output_text ||
      JSON.stringify(response.output, null, 2);

    this.view.webview.postMessage({
      type: "response",
      output,
      meta: {
        sentTime,
        receivedTime,
        latency,
      },
    });
  }

  private getHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin:0;
    background:var(--vscode-editor-background);
    color:var(--vscode-editor-foreground);
    font-family:var(--vscode-font-family);
  }

  #header {
    padding:8px;
    border-bottom:1px solid var(--vscode-editorWidget-border);
    display:flex;
    justify-content:space-between;
    align-items:center;
  }

  #tabs {
    display:flex;
    border-bottom:1px solid var(--vscode-editorWidget-border);
  }

  .tab {
    padding:8px 12px;
    cursor:pointer;
  }

  .tab.active {
    border-bottom:2px solid var(--vscode-focusBorder);
  }

  .view {
    display:none;
    padding:8px;
  }

  .view.active {
    display:block;
  }

  textarea {
    width:100%;
    height:40vh;
    background:var(--vscode-editor-background);
    color:var(--vscode-editor-foreground);
    border:none;
    outline:none;
    resize:none;
  }

  pre {
    white-space:pre-wrap;
  }

  #sendBtn {
    border-radius:50%;
    width:32px;
    height:32px;
    cursor:pointer;
  }
</style>
</head>
<body>

<div id="header">
  <span id="time">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
  <button id="sendBtn">⬆</button>
</div>

<div id="tabs">
  <div class="tab active" data-target="promptView">Prompt</div>
  <div class="tab" data-target="responseView">Response</div>
  <div class="tab" data-target="codeView">Code</div>
</div>

<div id="promptView" class="view active">
  <textarea id="promptArea"></textarea>
</div>

<div id="responseView" class="view">
  <pre id="responseArea"></pre>
</div>

<div id="codeView" class="view">
  <pre>// Code panel placeholder</pre>
</div>

<script>
const vscode = acquireVsCodeApi();

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
const sendBtn = document.getElementById("sendBtn");
const promptArea = document.getElementById("promptArea");
const responseArea = document.getElementById("responseArea");
const timeSpan = document.getElementById("time");

function switchTab(targetId) {
  tabs.forEach(t => t.classList.remove("active"));
  views.forEach(v => v.classList.remove("active"));

  document.querySelector('[data-target="'+targetId+'"]').classList.add("active");
  document.getElementById(targetId).classList.add("active");
}

tabs.forEach(tab => {
  tab.onclick = () => switchTab(tab.dataset.target);
});

sendBtn.onclick = () => {
  vscode.postMessage({
    type: "send",
    payload: { text: promptArea.value }
  });
};

window.addEventListener("message", event => {
  const message = event.data;

  if (message.type === "response") {
    responseArea.textContent = message.output;

    timeSpan.textContent =
      message.meta.sentTime + " → " +
      message.meta.receivedTime +
      " (" + message.meta.latency + " ms)";

    switchTab("responseView");
  }
});
</script>

</body>
</html>
`;
  }
}

export function deactivate() {}