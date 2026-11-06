const express = require('express');
const app = express();
const cors = require("cors");
app.use(express.json());
require("dotenv").config();
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const pool = require("./db/pool");
const {GoogleGenAI} = require('@google/genai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const port = 3000;
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(
  session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//Router for handling document uploads
const documentsRouter = require("./routes/documents");
app.use("/api/documents", documentsRouter);

//Router for handling question embeddings
const questionsRouter = require("./routes/questions");
app.use("/api/questions", questionsRouter);

// Router for handling conversations
const conversationsRouter = require("./routes/conversations");
app.use("/api/conversations", conversationsRouter);

// Router for authentication
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})