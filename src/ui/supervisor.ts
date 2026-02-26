export class Supervisor {

  static getState() {
    return {
      workspace: "pact-vscode",
      chatId: "chat-001",
      overlays: ["overlay-mode-bootstrap"],
      model: "gpt-4o",
      status: "Idle",
      user: "nik"
    };
  }
}
