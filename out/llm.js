"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStructuredToOpenAI = sendStructuredToOpenAI;
const openai_1 = __importDefault(require("openai"));
async function sendStructuredToOpenAI(context, content, model) {
    //const config = vscode.workspace.getConfiguration("pact");
    const apiKey = (await context.secrets.get("pact.openaiApiKey"))?.trim();
    if (!apiKey) {
        throw new Error("PACT: OpenAI API key is not configured. Run 'PACT3: Set API Key'.");
    }
    const client = new openai_1.default({ apiKey });
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
//# sourceMappingURL=llm.js.map