
-- migrate:up
CREATE TABLE document_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_name TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding HALFVEC(3072) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:down
DROP TABLE document_chunks;