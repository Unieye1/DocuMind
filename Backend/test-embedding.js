require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateEmbedding(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
  });

  return result.embeddings[0].values;
}

async function main() {
  try {
    const chunks = [
      "PostgreSQL stores data in tables.",
      "React builds user interfaces.",
      "Express handles HTTP requests.",
    ];
    const chunkEmbeddings = [];
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      chunkEmbeddings.push({
        text: chunk,
        embedding: embedding,
      });

      console.log(chunk);
      console.log(embedding.length);
    }
    console.log("All chunk embeddings:", chunkEmbeddings);
  } catch (error) {
    console.error("Embedding failed:", error.status, error.message);
  }
}

main();
