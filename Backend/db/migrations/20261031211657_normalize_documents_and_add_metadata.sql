-- migrate:up

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE document_chunks
ADD COLUMN document_id UUID NOT NULL,
ADD COLUMN page_number INTEGER NOT NULL,
ADD COLUMN chunk_index INTEGER NOT NULL;

ALTER TABLE document_chunks
ADD CONSTRAINT fk_document
FOREIGN KEY (document_id)
REFERENCES documents(id)
ON DELETE CASCADE;

ALTER TABLE document_chunks
DROP COLUMN document_name;


-- migrate:down

ALTER TABLE document_chunks
ADD COLUMN document_name TEXT;

ALTER TABLE document_chunks
DROP CONSTRAINT fk_document;

ALTER TABLE document_chunks
DROP COLUMN document_id,
DROP COLUMN page_number,
DROP COLUMN chunk_index;

DROP TABLE documents;