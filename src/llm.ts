import OpenAI from "openai";
import * as vscode from "vscode";

export async function sendStructuredToOpenAI(
  context: vscode.ExtensionContext,
  content: any[],
  model: string,
): Promise<string> {
  //const config = vscode.workspace.getConfiguration("pact");
  const apiKey = (await context.secrets.get("pact.openaiApiKey"))?.trim();
  if (!apiKey) {
    throw new Error(
      "PACT: OpenAI API key is not configured. Run 'PACT3: Set API Key'.",
    );
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "user",
        content: content, // ← use parser output directly
      },
    ],
  });

  if (!response.output_text) {
    throw new Error("PACT: LLM returned empty response.");
  }

  return response.output_text;
}
