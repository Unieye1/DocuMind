const express = require("express");
const pool = require("../db/pool");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

const getConversationMessagesQuery = fs.readFileSync(
  path.join(__dirname, "../queries/getConversationMessages.sql"),
  "utf8",
);

router.post("/", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO conversations (title, user_id)
   VALUES ($1, $2)
   RETURNING *`,
      ["New conversation", req.session.userId],
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
   WHERE user_id = $1
   ORDER BY updated_at DESC`,
      [req.session.userId],
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
      `SELECT id
   FROM conversations
   WHERE id = $1 AND user_id = $2`,
      [conversationId, req.session.userId],
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
   WHERE id = ANY($1::uuid[])
   AND user_id = $2`,
      [[...new Set(documentIds)], req.session.userId],
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
      [conversationId, [...new Set(documentIds)]],
    );

    // Retrieve all documents currently attached.
    const attachedDocuments = await client.query(
      `SELECT d.id, d.filename, cd.attached_at
       FROM conversation_documents cd
       JOIN documents d ON d.id = cd.document_id
       WHERE cd.conversation_id = $1
       ORDER BY cd.attached_at ASC`,
      [conversationId],
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
  `DELETE FROM conversation_documents cd
   USING conversations c
   WHERE cd.conversation_id = c.id
   AND cd.conversation_id = $1
   AND cd.document_id = $2
   AND c.user_id = $3
   RETURNING cd.conversation_id, cd.document_id`,
  [conversationId, documentId, req.session.userId]
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
   JOIN conversations c ON c.id = cd.conversation_id
   WHERE cd.conversation_id = $1
   AND c.user_id = $2
   ORDER BY cd.attached_at DESC`,
  [id, req.session.userId]
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
  `SELECT id
   FROM conversations
   WHERE id = $1 AND user_id = $2`,
  [id, req.session.userId]
);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Retrieve messages and their sources
    const result = await pool.query(getConversationMessagesQuery, [id]);

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

// Delete a conversation
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
  `DELETE FROM conversations
   WHERE id = $1 AND user_id = $2
   RETURNING id`,
  [id, req.session.userId]
);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    res.json({
      message: "Conversation deleted successfully",
      conversationId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Failed to delete conversation:", error);

    res.status(500).json({
      error: "Failed to delete conversation",
    });
  }
});

module.exports = router;
