const express = require("express");
const multer = require("multer");
const pool = require("../db/pool");
const { performance } = require("node:perf_hooks");
const { PDFParse } = require("pdf-parse");
const chunkText = require("../utils/chunkText");
const generateEmbeddings = require("../utils/generateEmbedding");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});

router.post("/", upload.single("document"), async (req, res) => {
  console.log("Received file:", req.file);
  if (!req.file) {
    return res.status(400).json({
      error: "Please upload a document",
    });
  }

  const parser = new PDFParse({
    data: req.file.buffer,
  });

  try {
    const start = performance.now();
    //Update extraction by pages
    const result = await parser.getText();
    const pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));

    const extractionTime = performance.now() - start;
    console.log(extractionTime, "ms to extract text from PDF");
    const documentResult = await pool.query(
      `INSERT INTO documents (filename, user_id)
   VALUES ($1, $2)
   RETURNING id`,
      [req.file.originalname, req.session.userId],
    );

    const documentId = documentResult.rows[0].id;

    const chunkEmbeddings = [];

    // Step 1: Collect chunks and preserve metadata
    for (const page of pages) {
      const chunks = chunkText(page.text);

      for (const [index, chunk] of chunks.entries()) {
        chunkEmbeddings.push({
          text: chunk,
          pageNumber: page.pageNumber,
          chunkIndex: index,
        });
      }
    }

    // Step 2: Generate embeddings in batches
    const BATCH_SIZE = 16;
    const embeddingStart = performance.now();

    for (let i = 0; i < chunkEmbeddings.length; i += BATCH_SIZE) {
      const batch = chunkEmbeddings.slice(i, i + BATCH_SIZE);

      const embeddings = await generateEmbeddings(
        batch.map((item) => item.text),
      );

      // Associate each vector with its original chunk
      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = embeddings[j];
      }

      console.log(
        `Embedded ${Math.min(i + batch.length, chunkEmbeddings.length)} / ${chunkEmbeddings.length} chunks`,
      );
    }

    const embeddingTime = performance.now() - embeddingStart;

    console.log(embeddingTime, "ms to generate embeddings for PDF chunks");

    // Step 3: Insert each batch into PostgreSQL
    const dbInsertStart = performance.now();

    for (let i = 0; i < chunkEmbeddings.length; i += BATCH_SIZE) {
      const batch = chunkEmbeddings.slice(i, i + BATCH_SIZE);

      const values = [];

      const placeholders = batch.map((item, index) => {
        const offset = index * 5;

        values.push(
          documentId,
          item.pageNumber,
          item.chunkIndex,
          item.text,
          JSON.stringify(item.embedding),
        );

        return `(
      $${offset + 1},
      $${offset + 2},
      $${offset + 3},
      $${offset + 4},
      $${offset + 5}::halfvec
    )`;
      });

      await pool.query(
        `INSERT INTO document_chunks
      (document_id, page_number, chunk_index, chunk_text, embedding)
     VALUES ${placeholders.join(", ")}`,
        values,
      );
    }

    const dbInsertTime = performance.now() - dbInsertStart;

    console.log(dbInsertTime, "ms to insert chunks into PostgreSQL");

    //

    res.status(200).json({
      message: "PDF text extracted successfully!",
      filename: req.file.originalname,
      totalChunks: chunkEmbeddings.length,
      chunks: chunkEmbeddings.map((item) => ({
        text: item.text,
        pageNumber: item.pageNumber,
      })),
    });
  } catch (error) {
    console.error("PDF extraction failed:", error);

    res.status(500).json({
      error: "Could not extract PDF text",
    });
  } finally {
    await parser.destroy();
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
      id,
      filename,
      uploaded_at
   FROM documents
   WHERE user_id = $1
   ORDER BY uploaded_at DESC`,
      [req.session.userId],
    );

    res.status(200).json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error.message);

    res.status(500).json({
      error: "Failed to fetch documents",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM documents
   WHERE id = $1 AND user_id = $2
   RETURNING id, filename`,
      [id, req.session.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    res.status(200).json({
      message: "Document deleted successfully",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to delete document:", error.message);

    res.status(500).json({
      error: "Failed to delete document",
    });
  }
});

module.exports = router;
