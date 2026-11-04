const express = require("express");
const pool = require("../db/pool");
const fs = require("fs");
const path = require("path");

const getConversationMessagesQuery = fs.readFileSync(
  path.join(__dirname, "../queries/getConversationMessages.sql"),
  "utf8"
);

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO conversations (title)
       VALUES ($1)
       RETURNING *`,
      ["New conversation"]
    );

    res.status(201).json({
      conversation: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to create conversation:", error);

    res.status(500).json({
      error: "Failed to create conversation",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM conversations
       ORDER BY updated_at DESC`
    );

    res.json({
      conversations: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    res.status(500).json({
      error: "Failed to fetch conversations",
    });
  }
});

//attaching multiple PDFs to a conversation.
router.post("/:id/documents", async (req, res) => {
  const { id: conversationId } = req.params;
  const { documentIds } = req.body;

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      error: "Please provide an array of document IDs",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check whether the conversation exists.
    const conversationResult = await client.query(
      "SELECT id FROM conversations WHERE id = $1",
      [conversationId]
    );

    if (conversationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Check whether all requested documents exist.
    const documentsResult = await client.query(
      `SELECT id
       FROM documents
       WHERE id = ANY($1::uuid[])`,
      [documentIds]
    );

    if (documentsResult.rows.length !== new Set(documentIds).size) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "One or more documents were not found",
      });
    }

    // Attach documents to the conversation.
    await client.query(
      `INSERT INTO conversation_documents
       (conversation_id, document_id)
       SELECT $1, unnest($2::uuid[])
       ON CONFLICT (conversation_id, document_id) DO NOTHING`,
      [conversationId, [...new Set(documentIds)]]
    );

    // Retrieve all documents currently attached.
    const attachedDocuments = await client.query(
      `SELECT d.id, d.filename, cd.attached_at
       FROM conversation_documents cd
       JOIN documents d ON d.id = cd.document_id
       WHERE cd.conversation_id = $1
       ORDER BY cd.attached_at ASC`,
      [conversationId]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Documents attached successfully",
      documents: attachedDocuments.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Failed to attach documents:", error);

    res.status(500).json({
      error: "Failed to attach documents",
    });
  } finally {
    client.release();
  }
});

//the detach PDF endpoint
router.delete("/:id/documents/:documentId", async (req, res) => {
  const { id: conversationId, documentId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM conversation_documents
       WHERE conversation_id = $1
       AND document_id = $2
       RETURNING conversation_id, document_id`,
      [conversationId, documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Document attachment not found",
      });
    }

    res.json({
      message: "Document detached successfully",
      attachment: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to detach document:", error);

    res.status(500).json({
      error: "Failed to detach document",
    });
  }
});

//return the documents associated with that conversation 
router.get("/:id/documents", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.filename,
        d.uploaded_at,
        cd.attached_at
       FROM conversation_documents cd
       JOIN documents d ON d.id = cd.document_id
       WHERE cd.conversation_id = $1
       ORDER BY cd.attached_at DESC`,
      [id]
    );

    res.json({ documents: result.rows });
  } catch (error) {
    console.error("Failed to fetch conversation documents:", error);
    res.status(500).json({ error: "Failed to fetch conversation documents" });
  }
});

// Retrieve messages and their citations for a conversation
router.get("/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    // Check whether the conversation exists
    const conversationResult = await pool.query(
      "SELECT id FROM conversations WHERE id = $1",
      [id]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Retrieve messages and their sources
    const result = await pool.query(
      getConversationMessagesQuery,
      [id]
    );

    res.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch conversation messages:", error);

    res.status(500).json({
      error: "Failed to fetch conversation messages",
    });
  }
});

module.exports = router;