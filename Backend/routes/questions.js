const express = require("express");
const generateEmbedding = require("../utils/generateEmbedding");
const pool = require("../db/pool");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const router = express.Router();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const searchChunksQuery = fs.readFileSync(
  path.join(__dirname, "../queries/searchChunks.sql"),
  "utf8",
);

router.post("/", async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        error: "Please provide a document ID",
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please provide a question",
      });
    }

    const embedding = await generateEmbedding(question);

    const result = await pool.query(searchChunksQuery, [
      JSON.stringify(embedding),
      documentId,
    ]);

    const context = result.rows
      .map((row, index) => `Source ${index + 1}:\n${row.chunk_text}`)
      .join("\n\n");

    if (!context) {
      return res.status(404).json({
        error: "No relevant document chunks found.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `
You are DocuMind, an assistant that answers questions using the provided document context.

Rules:
- Answer using the context provided below.
- If the context does not contain the answer, say you couldn't find the answer in the uploaded document.
- Do not invent facts.
- Be clear and concise.

Document context:
${context}

User question:
${question}
`,
    });

    const answer = response.text;

    res.json({
      question,
      answer,
      sources: result.rows.map((row) => ({
        id: row.id,
        documentId: row.document_id,
        documentName: row.document_name,
        pageNumber: row.page_number,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        distance: row.distance,
      })),
    });
  } catch (error) {
    console.error("Question embedding failed:", error.message);

    res.status(500).json({
      error: "Failed to generate question embedding",
    });
  }
});

module.exports = router;
