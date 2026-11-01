const express = require('express');
const app = express();
const cors = require("cors");
app.use(express.json());
require("dotenv").config();
const {GoogleGenAI} = require('@google/genai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const port = 3000;
app.use(cors({
  origin: "http://localhost:5173"
}));


app.get("/", async (req, res) => {
  try {
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: "Explain what RAG is in simple terms",
    });
   
    res.send(response.text);
  } catch (error) {
    console.error("Gemini error:", error.status, error.message);
    res.status(503).send("Gemini is temporarily unavailable. Try again.");
  }finally {
    console.timeEnd("Gemini response time");
  }
});
//Router for handling document uploads
const documentsRouter = require("./routes/documents");
app.use("/api/documents", documentsRouter);

//Router for handling question embeddings
const questionsRouter = require("./routes/questions");
app.use("/api/questions", questionsRouter);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})