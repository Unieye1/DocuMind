const enqueueEmbedding = require("./embeddingQueue");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function embedWithRetry(texts, priority, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await enqueueEmbedding(
        () =>
          ai.models.embedContent({
            model: "gemini-embedding-2",
            contents: texts.map((text) => ({
              parts: [{ text }],
            })),
          }),
        priority,
        texts.length
      );
    } catch (error) {
      const isRateLimit = error.status === 429;

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `Gemini rate limit reached. Retrying in ${delay / 1000}s...`
      );

      await sleep(delay);
    }
  }
}

async function generateEmbeddings(texts, priority = "ingestion") {
const result = await embedWithRetry(texts, priority);

  if (result.embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, received ${result.embeddings.length}`,
    );
  }

  return result.embeddings.map((item) => item.values);
}

module.exports = generateEmbeddings;
