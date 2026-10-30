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
    const result = await parser.getText();
    const text = result.text;

    const chunks = chunkText(text);
    const chunkEmbeddings = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);

      chunkEmbeddings.push({
        text: chunk,
        embedding,
      });
    }
    for (const item of chunkEmbeddings) {
  await pool.query(
    `INSERT INTO document_chunks
      (document_name, chunk_text, embedding)
     VALUES ($1, $2, $3::halfvec)`,
    [
      req.file.originalname,
      item.text,
      JSON.stringify(item.embedding),
    ]
  );
}

    res.status(200).json({
      message: "PDF text extracted successfully!",
      filename: req.file.originalname,
      totalChunks: chunks.length,
      chunks: chunks,
      chunkEmbeddings,
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

module.exports = router;
