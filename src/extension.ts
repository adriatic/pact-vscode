import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { parsePrompt } from "./promptParser";
import { sendStructuredToOpenAI } from "./llm";

export async function activate(context: vscode.ExtensionContext) {
  console.log("PACT3 activated (file-based mode)");

  context.subscriptions.push(
    vscode.commands.registerCommand("pact3.newChat", async () => {
      await ensureWorkspace();

      const chatDir = await createNewChat();
      const promptPath = path.join(chatDir, "prompt.md");

      const doc = await vscode.workspace.openTextDocument(promptPath);
      await vscode.window.showTextDocument(doc);

      vscode.window.showInformationMessage("New PACT3 chat created.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pact3.sendPrompt", async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active prompt file.");
        return;
      }

      const raw = editor.document.getText();

      try {
        const workspaceRoot =
          vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";

        const parsed = parsePrompt(raw, workspaceRoot);

        const model = parsed.metadata.model || "gpt-4.1";

        const responseText = await sendStructuredToOpenAI(
          context,
          parsed.content,
          model
        );

        const responsePath = editor.document.uri.fsPath.replace(
          "prompt.md",
          "response.md"
        );

        fs.writeFileSync(responsePath, responseText);

        const doc = await vscode.workspace.openTextDocument(responsePath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage("Response generated.");
      } catch (err: any) {
        vscode.window.showErrorMessage(err.message || "Unknown error.");
      }
    })
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

  fs.writeFileSync(path.join(chatDir, "prompt.md"), "# Prompt\n\n");
  fs.writeFileSync(path.join(chatDir, "response.md"), "");

  return chatDir;
}