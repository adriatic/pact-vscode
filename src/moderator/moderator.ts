export type ModerationDecision =
  | { action: "allow" }
  | { action: "block"; reason: string };

export function moderate(prompt: string): ModerationDecision {
  if (!prompt || !prompt.trim()) {
    return {
      action: "block",
      reason: "Empty prompt",
    };
  }

  // Phase 1: minimal enforcement.
  // LLM handles safety, refusals, and policy boundaries.

  return { action: "allow" };
}