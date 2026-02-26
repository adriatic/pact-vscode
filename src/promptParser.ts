import * as fs from "fs";
import * as path from "path";

export interface ParsedPrompt {
  metadata: Record<string, any>;
  content: any[];
}

export function parsePrompt(raw: string, workspaceRoot: string): ParsedPrompt {

  if (!raw.startsWith("---")) {
    throw new Error("Missing mandatory YAML frontmatter.");
  }

  const lines = raw.split("\n");
  let yamlEndIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      yamlEndIndex = i;
      break;
    }
  }

  if (yamlEndIndex === -1) {
    throw new Error("Invalid YAML frontmatter termination.");
  }

  const yamlBlock = lines.slice(1, yamlEndIndex).join("\n");
  const body = lines.slice(yamlEndIndex + 1).join("\n");

  const metadata = parseYaml(yamlBlock);
  const content = parseMarkdown(body, workspaceRoot);

  return { metadata, content };
}

function parseYaml(yaml: string): Record<string, any> {
  const result: Record<string, any> = {};

  yaml.split("\n").forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key) return;
    result[key.trim()] = rest.join(":").trim();
  });

  return result;
}

function parseMarkdown(markdown: string, workspaceRoot: string) {

  const blocks: any[] = [];
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {

    const textBefore = markdown.slice(lastIndex, match.index).trim();

    if (textBefore) {
      blocks.push({
        type: "input_text",
        text: textBefore
      });
    }

    const imagePath = match[2];
    const absolutePath = path.resolve(workspaceRoot, imagePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(absolutePath);
    const base64 = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).replace(".", "");

    blocks.push({
      type: "input_image",
      image_url: `data:image/${ext};base64,${base64}`
    });

    lastIndex = imageRegex.lastIndex;
  }

  const remainingText = markdown.slice(lastIndex).trim();

  if (remainingText) {
    blocks.push({
      type: "input_text",
      text: remainingText
    });
  }

  return blocks;
}