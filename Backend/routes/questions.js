const express = require("express");
const generateEmbedding = require("../utils/generateEmbedding");
const pool = require("../db/pool");
const fs = require("fs");
const path = require("path");
const { performance } = require("node:perf_hooks");
const { GoogleGenAI } = require("@google/genai");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();
router.use(requireAuth);
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const searchChunksQuery = fs.readFileSync(
  path.join(__dirname, "../queries/searchChunks.sql"),
  "utf8",
);

router.post("/", async (req, res) => {
  let currentStage = "initialization";
  let assistantMessageId;
  try {
    const start = performance.now();
    const { question, conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        error: "Please provide a conversation ID",
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please provide a question",
      });
    }

    // Verify that the conversation belongs to the logged-in user
    const conversationResult = await pool.query(
      `SELECT id
   FROM conversations
   WHERE id = $1 AND user_id = $2`,
      [conversationId, req.session.userId],
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }
   // Atomically insert both messages
const messageClient = await pool.connect();

try {
  await messageClient.query("BEGIN");

  // Insert user's message
  await messageClient.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)`,
    [conversationId, "user", question.trim()]
  );

  // Insert pending assistant message
  const assistantMessageResult = await messageClient.query(
    `INSERT INTO messages (conversation_id, role, content, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [conversationId, "assistant", "", "pending"]
  );

  const newAssistantMessageId = assistantMessageResult.rows[0].id;

  await messageClient.query("COMMIT");


  assistantMessageId = newAssistantMessageId;

} catch (error) {
  try {
    await messageClient.query("ROLLBACK");
  } catch (rollbackError) {
    console.error("Transaction rollback failed:", rollbackError);
  }

  throw error;

} finally {
  messageClient.release();
}
    await pool.query(
      `UPDATE conversations
   SET updated_at = NOW()
   WHERE id = $1 AND user_id = $2`,
      [conversationId, req.session.userId],
    );

    // Check whether this conversation has attached PDFs
    const attachedDocumentsResult = await pool.query(
      `SELECT EXISTS (
     SELECT 1
     FROM conversation_documents cd
     JOIN conversations c ON c.id = cd.conversation_id
     WHERE cd.conversation_id = $1
     AND c.user_id = $2
   ) AS has_documents`,
      [conversationId, req.session.userId],
    );

    // GENERAL CHAT: No PDFs attached
    if (!attachedDocumentsResult.rows[0].has_documents) {
      currentStage = "Gemini generation (general chat)";

      const llmStart = performance.now();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `
      You are DocuMind, a helpful AI assistant.

      Answer the user's question naturally and accurately.
      Be clear, concise, and helpful.

      User question:
      ${question}
    `,
      });

      const llmTime = performance.now() - llmStart;
      const answer = response.text;

      await pool.query(
        `UPDATE messages
       SET content = $1,
       status = $2
   WHERE id = $3
   AND conversation_id = $4`,
        [answer, "completed", assistantMessageId, conversationId],
      );

      const totalTime = performance.now() - start;

      return res.json({
        question,
        answer,
        sources: [],
        llmTime,
        totalTime,
      });
    }

    currentStage = "embedding";

    const embeddingStart = performance.now();
    const embedding = await generateEmbedding(question);
    const embeddingTime = performance.now() - embeddingStart;

    currentStage = "retrieval";
    const retrievalStart = performance.now();
    const result = await pool.query(searchChunksQuery, [
      JSON.stringify(embedding),
      conversationId,
      req.session.userId,
    ]);
    const retrievalTime = performance.now() - retrievalStart;

    currentStage = "context mapping";
    const mappingStart = performance.now();
    const context = result.rows
      .map((row, index) => `Source ${index + 1}:\n${row.chunk_text}`)
      .join("\n\n");
    const mappingTime = performance.now() - mappingStart;

    if (!context) {
      await pool.query(
        `UPDATE messages
   SET status = $1
   WHERE id = $2
   AND conversation_id = $3`,
        ["failed", assistantMessageId, conversationId],
      );

      return res.status(404).json({
        error: "No relevant document chunks found.",
      });
    }

    currentStage = "Gemini generation";
    const llmStart = performance.now();
    let response;
    let llmTime;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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
    } finally {
      llmTime = performance.now() - llmStart;
      console.log("Gemini time:", llmTime, "ms");
    }

    console.log("Gemini usage:", response.usageMetadata);
    const totalTime = performance.now() - start;

    const answer = response.text;

    const citationClient  = await pool.connect();

    try {
      await citationClient .query("BEGIN");

      // Save citations
      if (result.rows.length > 0) {
        const values = [];
        const placeholders = [];

        result.rows.forEach((row, index) => {
          const offset = index * 3;

          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);

          values.push(assistantMessageId, row.id, row.distance);
        });

        await citationClient .query(
          `INSERT INTO message_sources (message_id, chunk_id, distance)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (message_id, chunk_id) DO NOTHING`,
          values,
        );
      }

      // Save answer and mark assistant message completed
      await citationClient .query(
        `UPDATE messages
   SET content = $1,
       status = $2
   WHERE id = $3
   AND conversation_id = $4`,
        [answer, "completed", assistantMessageId, conversationId],
      );

      await citationClient .query("COMMIT");
    } catch (error) {
      try {
        await citationClient .query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }

      throw error;
    } finally {
      citationClient .release();
    }

    res.json({
      question,
      answer,
      embeddingTime,
      retrievalTime,
      mappingTime,
      llmTime,
      totalTime,

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
    if (assistantMessageId) {
      try {
        await pool.query(
          `UPDATE messages
   SET status = $1
   WHERE id = $2
   AND conversation_id = $3`,
          ["failed", assistantMessageId, conversationId],
        );
      } catch (updateError) {
        console.error(
          "Failed to update assistant message status:",
          updateError,
        );
      }
    }

    console.error(`Failed at stage: ${currentStage}`);
    console.error(error);

    res.status(500).json({
      error: "Failed to process question",
      stage: currentStage,
      details: error.message,
    });
  }
});

module.exports = router;
