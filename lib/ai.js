// AI protein estimation. Currently a stub so the rest of the app works end to end.
//
// TODO: call the Gemini API (free tier) using process.env.GEMINI_API_KEY.
//   - Send `text` and/or `image` ({ mimeType, data: base64 }) as parts of one request.
//   - Ask for JSON back: { protein_g: number, description: string, breakdown: string }.
//   - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent

/**
 * @param {{ text?: string, image?: { mimeType: string, data: string } }} input
 * @returns {Promise<{ protein_g: number, description: string, breakdown: string }>}
 */
export async function estimateProtein({ text, image }) {
  if (!text && !image) {
    throw new Error('Provide a text description or an image.');
  }

  return {
    protein_g: 0,
    description: text || 'Photo meal',
    breakdown: 'AI not connected yet (stub). Enter the protein amount manually.',
  };
}
