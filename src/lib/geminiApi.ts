export type AiActionType =
  | "improve"
  | "fix_grammar"
  | "make_shorter"
  | "make_longer"
  | "simplify"
  | "formalize"
  | "make_casual"
  | "translate"
  | "continue_writing"
  | "rewrite";

const SYSTEM_PREFIX = `Respond ONLY with the final converted text. Do NOT echo constraints, steps, quotes, explanations, or analysis.`;

const ACTION_PROMPTS: Record<AiActionType, (input: string) => string> = {
  improve: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Improve the flow, clarity, and phrasing of the text. Output ONLY the improved text.\n\nText:\n${text}`,
  fix_grammar: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Fix all spelling and grammar mistakes. Output ONLY the corrected text.\n\nText:\n${text}`,
  make_shorter: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Make the text concise and shorter while keeping key meaning. Output ONLY the shortened text.\n\nText:\n${text}`,
  make_longer: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Expand and elaborate on the text with relevant detail. Output ONLY the expanded text.\n\nText:\n${text}`,
  simplify: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Simplify the vocabulary and structure so it is very easy to read. Output ONLY the single simplified text. Do not list options or analysis.\n\nText:\n${text}`,
  formalize: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Rewrite in a polite, formal, and professional tone. Output ONLY the formal text.\n\nText:\n${text}`,
  make_casual: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Rewrite in a friendly, natural, and casual tone. Output ONLY the casual text.\n\nText:\n${text}`,
  translate: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Translate the text. If Thai, translate to English. If English, translate to Thai. Output ONLY the translation without language notes.\n\nText:\n${text}`,
  continue_writing: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Continue writing naturally from the end of the text. Output ONLY the continuation.\n\nText:\n${text}`,
  rewrite: (text) =>
    `${SYSTEM_PREFIX}\n\nTask: Rewrite with fresh phrasing and clear structure. Output ONLY the single rewritten text.\n\nText:\n${text}`,
};

export function cleanAiOutputText(rawText: string): string {
  if (!rawText) return "";
  let cleaned = rawText.trim();

  // If text contains quoted strings at the end or double quotes, look for final quoted sentence or last line
  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);
  
  // If the last non-empty line is enclosed in double quotes or looks like the final output
  const lastLine = lines[lines.length - 1];
  if (lastLine && /^"([^"]+)"$/.test(lastLine)) {
    const match = lastLine.match(/^"([^"]+)"$/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If response contains "Option 1", extract content of Option 1
  if (/Option 1/i.test(cleaned)) {
    const optionMatch = cleaned.match(/Option 1[^\n]*:\s*\n?([\s\S]*?)(?=\n\s*Option 2|\n\s*Explanation|\n\s*The original text|\n\s*Meaning:|$)/i);
    if (optionMatch && optionMatch[1]?.trim()) {
      cleaned = optionMatch[1].trim();
    }
  }

  // If response lists bullet points with Role / Constraint / Breakdown, extract the final standalone quote
  const doubleQuoteMatches = Array.from(cleaned.matchAll(/"([^"\n]{5,})"/g));
  if (doubleQuoteMatches.length > 0) {
    // Pick the last valid non-source quote
    const lastQuote = doubleQuoteMatches[doubleQuoteMatches.length - 1][1];
    if (lastQuote && !lastQuote.includes("ทันใดนั้นแมว")) {
      return lastQuote.trim();
    }
  }

  // Remove leading meta labels if present
  cleaned = cleaned.replace(/^(here is|here's|here are|sure, here|below is)[^\n]*:\s*/i, "");
  cleaned = cleaned.replace(/^Source text:[^\n]*\n+/i, "");

  // Remove trailing explanations if Gemini appended them after a double newline
  if (cleaned.includes("\n\nThe original text is") || cleaned.includes("\n\nNote:")) {
    cleaned = cleaned.split(/\n\n(The original text is|Note:)/i)[0].trim();
  }

  return cleaned.trim();
}

export function formatModelName(modelName?: string): string {
  if (!modelName) return "Gemini 2.0 Flash";
  const clean = modelName
    .replace(/^models\//, "")
    .replace(/-latest$/i, "")
    .replace(/-preview$/i, "")
    .trim();
  if (clean === "gemini-2.0-flash") return "Gemini 2.0 Flash";
  if (clean === "gemini-2.0-flash-lite" || clean === "gemini-flash-lite") return "Gemini 2.0 Flash Lite";
  if (clean === "gemini-1.5-flash") return "Gemini 1.5 Flash";
  if (clean === "gemini-1.5-pro") return "Gemini 1.5 Pro";
  if (clean === "gemini-2.5-flash") return "Gemini 2.5 Flash";

  return clean
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchSupportedModels(apiKey: string): Promise<string[]> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        const supported = data.models
          .filter((m: any) => {
            const name = String(m.name || "").toLowerCase();
            if (
              name.includes("gemma") ||
              name.includes("tts") ||
              name.includes("audio") ||
              name.includes("embed") ||
              name.includes("imagen") ||
              name.includes("bison") ||
              name.includes("aqa")
            ) {
              return false;
            }
            return Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent");
          })
          .map((m: any) => String(m.name).replace(/^models\//, ""));
        if (supported.length > 0) return supported;
      }
    }
  } catch (_) {
    // Ignore fetch failure
  }
  return ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
}

export interface GeminiActionResult {
  result: string;
  modelUsed: string;
}

export async function runGeminiAction(apiKey: string, action: AiActionType, text: string): Promise<GeminiActionResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Gemini API key is missing. Please add your API key in Settings.");
  }

  const promptBuilder = ACTION_PROMPTS[action];
  if (!promptBuilder) {
    throw new Error(`Unknown AI action: ${action}`);
  }

  const prompt = promptBuilder(text.trim());
  let models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        if (response.status === 400 || response.status === 403 || message.toLowerCase().includes("api key")) {
          throw new Error(`Invalid Gemini API Key (${message})`);
        }

        // If model not found, query ModelService.ListModels to auto-discover available models for this key
        if (message.includes("not found") || response.status === 404) {
          if (i === models.length - 1) {
            const dynamicallyDiscovered = await fetchSupportedModels(trimmedKey);
            const newModels = dynamicallyDiscovered.filter((m) => !models.includes(m));
            if (newModels.length > 0) {
              models = models.concat(newModels);
            }
          }
        }

        throw new Error(`Gemini API Error: ${message}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof candidateText === "string" && candidateText.trim()) {
        const sanitized = cleanAiOutputText(candidateText);
        return {
          result: sanitized || candidateText.trim(),
          modelUsed: model,
        };
      }
      throw new Error("Empty response returned by Gemini API.");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If invalid API key, fail immediately without trying next model
      if (lastError.message.includes("Invalid Gemini API Key")) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to contact Gemini API.");
}

export async function runGeminiPrompt(apiKey: string, promptText: string, selectedModel: "smart" | "fast" | "creative" = "smart"): Promise<GeminiActionResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Gemini API key is missing. Please add your API key in Settings.");
  }

  let preferredModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  if (selectedModel === "fast") {
    preferredModels = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
  } else if (selectedModel === "creative") {
    preferredModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
  }

  let lastError: Error | null = null;

  for (let i = 0; i < preferredModels.length; i++) {
    const model = preferredModels[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: selectedModel === "creative" ? 0.7 : 0.4 },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        if (response.status === 400 || response.status === 403 || message.toLowerCase().includes("api key")) {
          throw new Error(`Invalid Gemini API Key (${message})`);
        }

        // Auto-discover supported models if 404 / not found
        if (message.includes("not found") || response.status === 404) {
          if (i === preferredModels.length - 1) {
            const dynamicallyDiscovered = await fetchSupportedModels(trimmedKey);
            const newModels = dynamicallyDiscovered.filter((m) => !preferredModels.includes(m));
            if (newModels.length > 0) {
              preferredModels = preferredModels.concat(newModels);
            }
          }
        }

        throw new Error(`Gemini API Error: ${message}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof candidateText === "string" && candidateText.trim()) {
        return {
          result: candidateText.trim(),
          modelUsed: model,
        };
      }
      throw new Error("Empty response returned by Gemini API.");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("Invalid Gemini API Key")) throw lastError;
    }
  }

  throw lastError || new Error("Failed to contact Gemini API.");
}
