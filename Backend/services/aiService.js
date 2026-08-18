// services/aiService.js
const { GoogleGenAI } = require('@google/genai');

const analyzeNoteContent = async (title, content) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this note and provide:
1. A concise 2-sentence summary.
2. 2 to 4 relevant categorization tags.
3. A list of specific action items or tasks (empty array if none exist).

Note Title: ${title}
Note Content: ${content}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          summary: { type: 'STRING' },
          tags: { type: 'ARRAY', items: { type: 'STRING' } },
          actionItems: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['summary', 'tags', 'actionItems']
      }
    }
  });

  if (!response.text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return JSON.parse(response.text);
};

module.exports = { analyzeNoteContent };