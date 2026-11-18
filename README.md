# DocuMind

**An AI-powered PDF question-answering application built with Retrieval-Augmented Generation (RAG).**

[**Live Demo →**](https://documind-943.pages.dev) · [GitHub Repository](https://github.com/unieye1/DocuMind)

DocuMind allows users to upload PDF documents and interact with them through a conversational interface. It uses semantic search to retrieve relevant content from uploaded documents and generates context-aware answers using Google's Gemini models.

The application also supports general AI conversations when no documents are attached.

## Features

### AI and RAG

- **PDF Upload** – Upload and manage multiple PDF documents.
- **Page-wise Text Extraction** – Extract text while preserving page-level information.
- **Text Chunking** – Split extracted content into smaller overlapping chunks for retrieval.
- **Vector Embeddings** – Generate document embeddings using Google's Gemini embedding model.
- **Semantic Search** – Retrieve relevant document chunks using PostgreSQL and pgvector.
- **Context-aware Responses** – Generate answers grounded in retrieved document content.
- **Source Citations** – Associate retrieved content with its original document and page number.
- **General AI Chat** – Support general conversations when no documents are attached.

### Conversation and Document Management

- **User Authentication** – Register and log in using email and password, with session-based authentication.
- **Conversation Management** – Create, access, and manage conversations independently.
- **Multi-document Conversations** – Attach multiple PDFs to a conversation and query them together.
- **Document Management** – Attach or detach PDFs from conversations and delete uploaded documents.
- **Persistent Chat History** – Store conversations, messages, and source references in PostgreSQL.
- **User Data Isolation** – Ensure users can access only their own documents and conversations.

### Performance and Reliability

- **Batched Embedding Generation** – Process multiple text chunks in a single embedding request to improve ingestion efficiency.
- **Rolling-window Rate Limiting** – Track embedding request consumption to stay within API rate limits.
- **Priority-based Embedding Queue** – Prioritize question embeddings over document ingestion jobs, allowing users to ask questions while large PDFs are still being processed.
- **Exponential Backoff** – Automatically retry embedding requests when Gemini returns rate-limit errors (HTTP 429), using progressively longer delays.
- **Concurrent Workload Handling** – Allow question answering to take priority over pending ingestion batches without interrupting an API request already in progress.

## Tech Stack

| Category         | Technologies                               |
| ---------------- | ------------------------------------------ |
| Frontend         | React, Vite, Tailwind CSS                  |
| Backend          | Node.js, Express.js                        |
| Database         | PostgreSQL                                 |
| Vector Search    | pgvector                                   |
| AI Models        | Google Gemini                              |
| Authentication   | Express Session, bcrypt, connect-pg-simple |
| PDF Processing   | pdf-parse                                  |
| File Uploads     | Multer                                     |
| Containerization | Docker, Docker Compose                     |
| CI               | GitHub Actions                             |
| Deployment       | Cloudflare Pages, Render, Neon PostgreSQL  |
| API Testing      | Postman                                    |

## How It Works

DocuMind follows a Retrieval-Augmented Generation (RAG) pipeline.

### 1. Document Ingestion

1. A user uploads a PDF.
2. The backend extracts text page by page.
3. Extracted text is divided into overlapping chunks.
4. Chunks are grouped into batches for embedding generation.
5. Each batch is submitted to Google's Gemini embedding model through a shared priority queue.
6. Generated embeddings, text chunks, page numbers, and document metadata are stored in PostgreSQL using pgvector.

### 2. Question Answering

1. The user submits a question within a conversation.
2. The question is converted into a vector embedding.
3. The question embedding enters the high-priority embedding queue.
4. PostgreSQL performs similarity search against the document chunks attached to that conversation.
5. The most relevant chunks are retrieved.
6. Retrieved content is passed to Gemini as context.
7. Gemini generates a response grounded in the retrieved content.
8. The response and its source references are persisted in the database.

When no PDFs are attached to a conversation, the application uses Gemini for general AI conversations instead.

### 3. Embedding Queue and Rate Limiting

Document ingestion and question answering share the same Gemini embedding API quota. Large PDF uploads can therefore consume quota needed for interactive questions.

To handle this, DocuMind implements an in-memory priority queue with two job categories:

- **Question queue:** Higher priority, processed before pending ingestion jobs.
- **Ingestion queue:** Lower priority, used for document embedding batches.

The queue also uses a rolling 60-second window to track embedding request consumption. Each job is assigned a cost based on the number of texts it contains, rather than counting every batch as a single quota unit.

Additional safeguards include:

- A global embedding limit with a safety buffer.
- A separate ingestion limit to reserve capacity for interactive questions.
- Exponential backoff for retrying temporary Gemini 429 errors.
- Re-queuing retries so they pass through the same rate limiter.

This allows users to continue asking questions while larger documents are being ingested.

## Architecture

```text
                    React Frontend
                          |
                          | HTTP Requests
                          v
                    Express Backend
                          |
             +------------+------------+
             |                         |
             v                         v
       Authentication              RAG Pipeline
             |                         |
             v                         v
        PostgreSQL              Embedding Queue
                                       |
                              +--------+--------+
                              |                 |
                              v                 v
                       Question Queue    Ingestion Queue
                              |                 |
                              +--------+--------+
                                       |
                                       v
                              Gemini Embeddings
                                       |
                                       v
                                pgvector Search
                                       |
                                       v
                                Retrieved Chunks
                                       |
                                       v
                               Gemini Generation
                                       |
                                       v
                                  PostgreSQL
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

Database schema changes are managed using DBmate migrations.

## Authentication and Security

- Passwords are hashed using bcrypt before storage.
- Session-based authentication using Express Session.
- Sessions are persisted in PostgreSQL using `connect-pg-simple`.
- HTTP-only session cookies.
- Protected API routes using authentication middleware.
- User ownership checks on document and conversation operations.
- Parameterized SQL queries to prevent SQL injection.
- CORS configured to allow requests from the frontend application.

## Docker

DocuMind uses Docker and Docker Compose to containerize the frontend, backend, and PostgreSQL database.

The development environment includes:

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with pgvector

### Run with Docker Compose

Clone the repository:

```bash
git clone https://github.com/unieye1/DocuMind.git
cd DocuMind
```

Configure the required environment variables in the Docker environment files.

Build and start the services:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs -f backend
```

Stop the services:

```bash
docker compose down
```

The PostgreSQL database uses a Docker volume to persist data between container restarts.

## CI

DocuMind uses GitHub Actions to automate checks on repository changes.

The CI workflow validates the application and builds the Docker images, helping catch build issues before deployment.

## Getting Started Without Docker

### Prerequisites

- Node.js
- PostgreSQL
- pgvector extension
- Google Gemini API key
- DBmate

### 1. Clone the repository

```bash
git clone https://github.com/unieye1/DocuMind.git
cd DocuMind
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` directory:

```env
PORT=3000
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret
```

Run database migrations from the project root:

```bash
npx dbmate --migrations-dir ./Backend/db/migrations up
```

Start the backend:

```bash
cd Backend
node server.js
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable         | Description                         |
| ---------------- | ----------------------------------- |
| `PORT`           | Backend server port                 |
| `DATABASE_URL`   | PostgreSQL connection string        |
| `GEMINI_API_KEY` | Google Gemini API key               |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `NODE_ENV`       | Application environment             |

## Deployment

DocuMind is deployed using separate services:

| Component           | Platform         |
| ------------------- | ---------------- |
| Frontend            | Cloudflare Pages |
| Backend API         | Render           |
| PostgreSQL Database | Neon             |

**Live application:** [https://documind-943.pages.dev](https://documind-943.pages.dev)

## Future Improvements

- Google OAuth authentication.
- Persistent background job processing using Redis and BullMQ.
- Distributed rate limiting for multiple backend instances.
- Streaming AI responses.
- Improved document processing for larger PDFs.
- More advanced retrieval and ranking strategies.
- Enhanced monitoring and observability.

## License

This project is currently available for personal and educational purposes. Add a license if you intend to specify formal reuse and distribution permissions.
