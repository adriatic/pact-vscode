import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { HostPanel } from "./ui/hostPanel";
import { parsePrompt } from "./promptParser";
import { sendStructuredToOpenAI } from "./llm";

export async function activate(context: vscode.ExtensionContext) {
  console.log("PACT3 Host activated");

  // -------------------------
  // NEW CHAT
  // -------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand("pact3.setApiKey", async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your OpenAI API key",
        password: true,
        ignoreFocusOut: true,
      });

      if (!key) {
        vscode.window.showWarningMessage("No API key entered.");
        return;
      }

      await context.secrets.store("pact.openaiApiKey", key);
      vscode.window.showInformationMessage("PACT API key stored securely.");
    }),
  );

  // -------------------------
  // OPEN HOST PANEL
  // -------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand("pact3.openHost", () => {
      HostPanel.createOrShow(context);
    }),
  );

  // -------------------------
  // SEND PROMPT TO LLM
  // -------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand("pact3.sendPrompt", async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active prompt file.");
        return;
      }

      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Open a workspace folder first.");
        return;
      }

      try {
        const fileContent = editor.document.getText();
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

        const parsed = parsePrompt(fileContent, workspaceRoot);

        // Use YOUR metadata structure
        const model = parsed.metadata.model || "gpt-4.1";

        const llmResponse = await sendStructuredToOpenAI(
          context,
          parsed.content,
          model,
        );
        const responsePath = editor.document.uri.fsPath.replace(
          "prompt.md",
          "response.md",
        );

        fs.writeFileSync(responsePath, llmResponse);

        const doc = await vscode.workspace.openTextDocument(responsePath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage("Response received from LLM.");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          error?.message || "PACT: Unknown error during LLM call.",
        );
      }
    }),
  );
}

export function deactivate() {}

async function ensureWorkspace() {
  if (!vscode.workspace.workspaceFolders) {
    throw new Error("Open a workspace folder first.");
  }

  const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const pactDir = path.join(root, ".pact3");

  if (!fs.existsSync(pactDir)) {
    fs.mkdirSync(pactDir);
  }

  const chatsDir = path.join(pactDir, "chats");
  if (!fs.existsSync(chatsDir)) {
    fs.mkdirSync(chatsDir);
  }
}

async function createNewChat(): Promise<string> {
  const root = vscode.workspace.workspaceFolders![0].uri.fsPath;
  const chatsDir = path.join(root, ".pact3", "chats");

  const existing = fs.readdirSync(chatsDir).length;
  const chatName = `chat-${String(existing + 1).padStart(3, "0")}`;
  const chatDir = path.join(chatsDir, chatName);

  fs.mkdirSync(chatDir);

  fs.writeFileSync(
    path.join(chatDir, "prompt.md"),
    `---
model: gpt-4.1
temperature: 0.2
overlay: none
---

`,
  );

  fs.writeFileSync(path.join(chatDir, "response.md"), "");

  return chatDir;
}
