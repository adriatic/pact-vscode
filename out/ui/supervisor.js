"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supervisor = void 0;
class Supervisor {
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
exports.Supervisor = Supervisor;
//# sourceMappingURL=supervisor.js.map