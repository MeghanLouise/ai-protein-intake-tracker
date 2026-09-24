// AI protein estimation via the Gemini API (free tier).

// Tried in order. Free-tier models are sometimes overloaded (503) or rate limited (429),
// so we fall back to the next one. Set GEMINI_MODEL in .env to pin a single model.
const MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.6-flash'];
const ROUNDS = 2;
const RETRY_DELAY_MS = 1500;
const endpoint = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROMPT = `You are a nutrition assistant. Estimate the total grams of protein in the meal described by the text and/or photo below.
- Make reasonable assumptions about portion size when it isn't stated, and say what you assumed.
- "description" is a short name for the meal (under 60 characters).
- "breakdown" is one or two sentences listing each item with its estimated protein.
- "protein_g" is the total for the whole meal, as a number rounded to the nearest gram.
- If the input doesn't contain food, return protein_g 0 and explain in "breakdown".`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    protein_g: { type: 'NUMBER' },
    description: { type: 'STRING' },
    breakdown: { type: 'STRING' },
  },
  required: ['protein_g', 'description', 'breakdown'],
};

// POST to Gemini, falling back across models and retrying when they are busy.
async function generate(payload) {
  let lastError;
  for (let round = 0; round < ROUNDS; round++) {
    if (round > 0) await sleep(RETRY_DELAY_MS);
    for (const model of MODELS) {
      const res = await fetch(endpoint(model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (res.ok) return body;
      lastError = body.error?.message || `status ${res.status}`;
      if (![429, 500, 503].includes(res.status) && !/no longer available/.test(lastError)) break;
    }
  }
  throw new Error(`Gemini request failed: ${lastError}`);
}

/**
 * @param {{ text?: string, image?: { mimeType: string, data: string } }} input
 * @returns {Promise<{ protein_g: number, description: string, breakdown: string }>}
 */
export async function estimateProtein({ text, image }) {
  if (!text && !image) {
    throw new Error('Provide a text description or an image.');
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env and restart the server.');
  }

  const parts = [{ text: PROMPT }];
  if (text) parts.push({ text: `Meal description: ${text}` });
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });

  const body = await generate({
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const raw = body.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!raw) {
    throw new Error('Gemini returned no answer (the request may have been blocked). Try rephrasing.');
  }

  const result = JSON.parse(raw);
  return {
    protein_g: Math.max(0, Math.round(Number(result.protein_g) || 0)),
    description: String(result.description),
    breakdown: String(result.breakdown),
  };
}
