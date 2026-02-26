import { v4 as uuidv4 } from "uuid";

export interface PactPrompt {
  id: string;
  markdown: string;
  created: string;
}

export interface PactResponse {
  id: string;
  markdown: string;
  created: string;
}

export interface PactEntry {
  id: string;
  created: string;
  prompt: PactPrompt;
  response?: PactResponse;   // response added after LLM call
}

export interface PactConversation {
  id: string;
  workspace: string;
  created: string;
  updated: string;
  entries: PactEntry[];
}

let currentConversation: PactConversation | null = null;

export function createConversation(workspace: string): PactConversation {
  currentConversation = {
    id: uuidv4(),
    workspace,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    entries: []
  };
  return currentConversation;
}

export function getConversation(): PactConversation | null {
  return currentConversation;
}

export function addEntry(markdown: string): PactEntry {
  if (!currentConversation) throw new Error("No active conversation.");

  const entry: PactEntry = {
    id: uuidv4(),
    created: new Date().toISOString(),
    prompt: {
      id: uuidv4(),
      markdown,
      created: new Date().toISOString()
    }
  };

  currentConversation.entries.push(entry);
  currentConversation.updated = new Date().toISOString();

  return entry;
}

export function attachResponse(entryId: string, responseMarkdown: string) {
  if (!currentConversation) return;

  const entry = currentConversation.entries.find(e => e.id === entryId);
  if (!entry) return;

  entry.response = {
    id: uuidv4(),
    markdown: responseMarkdown,
    created: new Date().toISOString()
  };

  currentConversation.updated = new Date().toISOString();
}