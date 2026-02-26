# pact-vscode
PACT3 VSCode Extension — Phase 1 Summary
Overview

PACT3 is a structured prompt execution system implemented as a VSCode extension.

This phase establishes a secure, file-based LLM workflow using the OpenAI Responses API.

Architecture

PACT3 operates entirely through workspace files:

.pact3/
  chats/
    chat-001/
      prompt.md
      response.md
Workflow

User runs PACT3: New Chat

Extension creates a chat folder with:

prompt.md

response.md

User writes prompt in prompt.md

User runs PACT3: Send Prompt

Extension:

Parses YAML frontmatter

Converts markdown into structured content

Calls OpenAI Responses API

Writes output to response.md

Opens response.md

Prompt Format

Example prompt.md:

---
model: gpt-4.1
temperature: 0.2
overlay: none
---

Explain binary search in 3 sentences.

Frontmatter is mandatory.

Structured Content Parsing

The parser:

Enforces YAML frontmatter

Splits metadata from body

Converts markdown into:

input_text

input_image (base64 embedded)

This enables multimodal prompts.

API Integration

Uses:

client.responses.create()

With properly structured content blocks.

API key is stored securely using:

context.secrets.store("openaiApiKey")

Configured via VSCode settings.

Security Model

API key never stored in plain text

No webview required

No browser injection

Fully local file control

Deterministic workflow

Major Milestones Achieved

YAML frontmatter enforcement

Structured multimodal parsing

Secure API storage

Correct Responses API usage

Response extraction

File write pipeline

Removal of webview host panel

Clean compile

Git checkpoint created

Current State

Stable file-based LLM execution system.

Next phase: Moderator architecture.
