const express = require("express");
const multer = require("multer");
const pool = require("../db/pool");
const { PDFParse } = require("pdf-parse");
const chunkText = require("../utils/chunkText");
const generateEmbedding = require("../utils/generateEmbedding");
const router = express.Router();

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
    // const text = result.text;
    //Update extraction by pages
    const result = await parser.getText();
    const pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));
    console.log("Extracted text from PDF:", pages);
    const documentResult = await pool.query(
      `INSERT INTO documents (filename)
   VALUES ($1)
   RETURNING id`,
      [req.file.originalname],
    );

    const documentId = documentResult.rows[0].id;
    const chunkEmbeddings = [];
    //const chunks = chunkText(text);
    for (const page of pages) {
      const chunks = chunkText(page.text);

      for (const [index, chunk] of chunks.entries()) {
        const embedding = await generateEmbedding(chunk);

        chunkEmbeddings.push({
          text: chunk,
          embedding,
          pageNumber: page.pageNumber,
          chunkIndex: index,
        });
      }
    }
    for (const item of chunkEmbeddings) {
      await pool.query(
        `INSERT INTO document_chunks
      (document_id, page_number, chunk_index, chunk_text, embedding)
     VALUES ($1, $2, $3, $4, $5::halfvec)`,
        [
          documentId,
          item.pageNumber,
          item.chunkIndex,
          item.text,
          JSON.stringify(item.embedding),
        ],
      );
    }

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
    const result = await pool.query(`
      SELECT
        id,
        filename,
        uploaded_at
      FROM documents
      ORDER BY uploaded_at DESC
    `);

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
       WHERE id = $1
       RETURNING id, filename`,
      [id]
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
