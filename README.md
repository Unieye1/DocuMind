# DocuMind

**An AI-powered PDF question-answering application built with Retrieval-Augmented Generation (RAG).**

DocuMind allows users to upload PDF documents and interact with them through a conversational interface. It uses semantic search to retrieve relevant content from uploaded documents and generates context-aware answers using Google's Gemini models.

The application also supports general AI conversations when no documents are attached.

## Features

- **User Authentication** – Register and log in using email and password, with session-based authentication.
- **PDF Upload** – Upload and manage multiple PDF documents.
- **Page-wise Text Extraction** – Extract text while preserving page-level information.
- **Text Chunking** – Split extracted content into smaller overlapping chunks for retrieval.
- **Vector Embeddings** – Generate document embeddings using Google's Gemini embedding model.
- **Semantic Search** – Retrieve relevant document chunks using PostgreSQL and pgvector.
- **Context-aware Responses** – Generate answers using retrieved document content rather than relying solely on the LLM's general knowledge.
- **Source Citations** – Associate retrieved content with its original document and page number.
- **Conversation Management** – Create, access, and manage conversations independently.
- **Multi-document Conversations** – Attach multiple PDFs to a conversation and query them together.
- **Document Management** – Attach or detach PDFs from conversations and delete uploaded documents.
- **Persistent Chat History** – Store conversations, messages, and source references in PostgreSQL.
- **User Data Isolation** – Ensure users can access only their own documents and conversations.

## Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Vector Search | pgvector |
| AI Models | Google Gemini |
| Authentication | Express Session, bcrypt |
| PDF Processing | pdf-parse |
| File Uploads | Multer |
| API Testing | Postman |

## How It Works

DocuMind follows a Retrieval-Augmented Generation (RAG) pipeline.

### 1\. Document Ingestion

1. A user uploads a PDF.
2. The backend extracts text page by page.
3. Extracted text is divided into overlapping chunks.
4. Each chunk is converted into a vector embedding using Gemini.
5. Chunks, embeddings, page numbers, and document metadata are stored in PostgreSQL using pgvector.

### 2\. Question Answering

1. The user submits a question within a conversation.
2. The question is converted into a vector embedding.
3. PostgreSQL performs similarity search against the document chunks attached to that conversation.
4. The most relevant chunks are retrieved.
5. Retrieved content is passed to Gemini as context.
6. Gemini generates a response grounded in the retrieved content.
7. The response and its source references are persisted in the database.

When no PDFs are attached to a conversation, the application uses Gemini for general AI conversations instead.

## Architecture

``` text
React Frontend
      |
      | HTTP Requests
      v
Express.js Backend
      |
      |----------------------|
      |                      |
      v                      v
Authentication          RAG Pipeline
      |                      |
      v                      v
PostgreSQL             Gemini Embeddings
      |                      |
      |                      v
      |                pgvector Search
      |                      |
      |                      v
      |                Retrieved Chunks
      |                      |
      |                      v
      |                Gemini Generation
      |                      |
      |----------------------|
                 |
                 v
          PostgreSQL
    (Users, Documents, Conversations,
       Messages and Sources)
```

## Database Design

The application uses PostgreSQL to manage relational data and pgvector for vector similarity search.

Key tables include:

- `users` – User accounts and authentication data.
- `documents` – Uploaded document metadata and ownership.
- `document_chunks` – Extracted text chunks, embeddings, and page metadata.
- `conversations` – User conversations and metadata.
- `conversation_documents` – Many-to-many relationship between conversations and documents.
- `messages` – User questions and AI responses.
- `message_sources` – References connecting AI responses to retrieved document chunks.

## Authentication and Security

- Passwords are hashed using bcrypt before storage.
- Session-based authentication using Express Session.
- Sessions are persisted in PostgreSQL using `connect-pg-simple`.
- HTTP-only session cookies.
- Protected API routes using authentication middleware.
- User ownership checks on document and conversation operations.
- Parameterized SQL queries to prevent SQL injection.
- CORS configured to allow requests from the frontend application.

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL
- pgvector extension
- Google Gemini API key

### 1\. Clone the repository

``` bash
git clone https://github.com/unieye1/DocuMind.git
cd DocuMind
```

### 2\. Backend setup

``` bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` directory:

``` env
PORT=3000
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret
```

Run the database migrations using DBmate:

``` bash
dbmate up
```

Start the backend:

``` bash
node server.js
```

### 3\. Frontend setup

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

``` text
http://localhost:5173
```

## Environment Variables

| Variable         | Description |
| ---------------- | ----------- |
| `PORT`           | Backend server port |
| `DATABASE_URL`   | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SESSION_SECRET` | Secret used to sign session cookies |


## Future Improvements

- Google OAuth authentication.
- Production deployment and HTTPS configuration.
- Improved document processing for larger PDFs.
- Streaming AI responses.
- More advanced retrieval and ranking strategies.

## License

This project is currently available for personal and educational purposes. Add a license if you intend to specify formal reuse and distribution permissions.