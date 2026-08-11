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

const ACTION_PROMPTS: Record<AiActionType, (input: string) => string> = {
  improve: (text) =>
    `You are an expert writing assistant. Improve the following text for better flow, clarity, and readability. Output ONLY the improved text without meta commentary or conversational filler.\n\nText:\n${text}`,
  fix_grammar: (text) =>
    `Fix all spelling, punctuation, and grammar mistakes in the following text. Do not alter the core meaning. Output ONLY the corrected text without any explanation.\n\nText:\n${text}`,
  make_shorter: (text) =>
    `Shorten the following text to make it more concise while retaining all key information. Output ONLY the shortened text.\n\nText:\n${text}`,
  make_longer: (text) =>
    `Expand and elaborate on the following text with additional details and context. Output ONLY the expanded text.\n\nText:\n${text}`,
  simplify: (text) =>
    `Simplify the following text so it is very easy to read and understand for anyone. Output ONLY the simplified text.\n\nText:\n${text}`,
  formalize: (text) =>
    `Rewrite the following text in a professional, polite, and formal tone. Output ONLY the formal text.\n\nText:\n${text}`,
  make_casual: (text) =>
    `Rewrite the following text in a friendly, conversational, and casual tone. Output ONLY the casual text.\n\nText:\n${text}`,
  translate: (text) =>
    `Translate the following text. If the text is in Thai, translate to natural English. If the text is in English or another language, translate to natural Thai. Output ONLY the translated text.\n\nText:\n${text}`,
  continue_writing: (text) =>
    `Continue writing naturally from the end of the following text, maintaining the same style, tone, and context. Output ONLY the continuation text.\n\nText:\n${text}`,
  rewrite: (text) =>
    `Rewrite the following text with fresh phrasing, strong vocabulary, and clear structure. Output ONLY the rewritten text.\n\nText:\n${text}`,
};

export async function runGeminiAction(apiKey: string, action: AiActionType, text: string): Promise<string> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Gemini API key is missing. Please add your API key in Settings.");
  }

  const promptBuilder = ACTION_PROMPTS[action];
  if (!promptBuilder) {
    throw new Error(`Unknown AI action: ${action}`);
  }

  const prompt = promptBuilder(text.trim());
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  let lastError: Error | null = null;

  for (const model of models) {
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
        throw new Error(`Gemini API Error: ${message}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof candidateText === "string" && candidateText.trim()) {
        return candidateText.trim();
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
