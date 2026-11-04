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


//Router for handling document uploads
const documentsRouter = require("./routes/documents");
app.use("/api/documents", documentsRouter);

//Router for handling question embeddings
const questionsRouter = require("./routes/questions");
app.use("/api/questions", questionsRouter);

// Router for handling conversations
const conversationsRouter = require("./routes/conversations");
app.use("/api/conversations", conversationsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})