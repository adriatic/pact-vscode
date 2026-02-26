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
exports.parsePrompt = parsePrompt;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parsePrompt(raw, workspaceRoot) {
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
function parseYaml(yaml) {
    const result = {};
    yaml.split("\n").forEach(line => {
        const [key, ...rest] = line.split(":");
        if (!key)
            return;
        result[key.trim()] = rest.join(":").trim();
    });
    return result;
}
function parseMarkdown(markdown, workspaceRoot) {
    const blocks = [];
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
//# sourceMappingURL=promptParser.js.map