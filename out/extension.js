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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const promptParser_1 = require("./promptParser");
const llm_1 = require("./llm");
async function activate(context) {
    console.log("PACT3 activated (file-based mode)");
    context.subscriptions.push(vscode.commands.registerCommand("pact3.newChat", async () => {
        await ensureWorkspace();
        const chatDir = await createNewChat();
        const promptPath = path.join(chatDir, "prompt.md");
        const doc = await vscode.workspace.openTextDocument(promptPath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage("New PACT3 chat created.");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("pact3.sendPrompt", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active prompt file.");
            return;
        }
        const raw = editor.document.getText();
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
            const parsed = (0, promptParser_1.parsePrompt)(raw, workspaceRoot);
            const model = parsed.metadata.model || "gpt-4.1";
            const responseText = await (0, llm_1.sendStructuredToOpenAI)(context, parsed.content, model);
            const responsePath = editor.document.uri.fsPath.replace("prompt.md", "response.md");
            fs.writeFileSync(responsePath, responseText);
            const doc = await vscode.workspace.openTextDocument(responsePath);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage("Response generated.");
        }
        catch (err) {
            vscode.window.showErrorMessage(err.message || "Unknown error.");
        }
    }));
}
function deactivate() { }
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
async function createNewChat() {
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const chatsDir = path.join(root, ".pact3", "chats");
    const existing = fs.readdirSync(chatsDir).length;
    const chatName = `chat-${String(existing + 1).padStart(3, "0")}`;
    const chatDir = path.join(chatsDir, chatName);
    fs.mkdirSync(chatDir);
    fs.writeFileSync(path.join(chatDir, "prompt.md"), "# Prompt\n\n");
    fs.writeFileSync(path.join(chatDir, "response.md"), "");
    return chatDir;
}
//# sourceMappingURL=extension.js.map