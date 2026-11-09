
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateEmbeddings(texts) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: texts.map((text) => ({
      parts: [{ text }],
    })),
  });

  if (result.embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, received ${result.embeddings.length}`
    );
  }

  return result.embeddings.map((item) => item.values);
}

module.exports = generateEmbeddings;


