"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.getConversation = getConversation;
exports.addEntry = addEntry;
exports.attachResponse = attachResponse;
const uuid_1 = require("uuid");
let currentConversation = null;
function createConversation(workspace) {
    currentConversation = {
        id: (0, uuid_1.v4)(),
        workspace,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        entries: []
    };
    return currentConversation;
}
function getConversation() {
    return currentConversation;
}
function addEntry(markdown) {
    if (!currentConversation)
        throw new Error("No active conversation.");
    const entry = {
        id: (0, uuid_1.v4)(),
        created: new Date().toISOString(),
        prompt: {
            id: (0, uuid_1.v4)(),
            markdown,
            created: new Date().toISOString()
        }
    };
    currentConversation.entries.push(entry);
    currentConversation.updated = new Date().toISOString();
    return entry;
}
function attachResponse(entryId, responseMarkdown) {
    if (!currentConversation)
        return;
    const entry = currentConversation.entries.find(e => e.id === entryId);
    if (!entry)
        return;
    entry.response = {
        id: (0, uuid_1.v4)(),
        markdown: responseMarkdown,
        created: new Date().toISOString()
    };
    currentConversation.updated = new Date().toISOString();
}
//# sourceMappingURL=conversationStore.js.map