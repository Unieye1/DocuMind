-- migrate:up

-- Remove existing test data
DELETE FROM conversations;
DELETE FROM documents;

-- Add ownership to documents
ALTER TABLE documents
ADD COLUMN user_id UUID NOT NULL
REFERENCES users(id)
ON DELETE CASCADE;

-- Add ownership to conversations
ALTER TABLE conversations
ADD COLUMN user_id UUID NOT NULL
REFERENCES users(id)
ON DELETE CASCADE;

-- Indexes for ownership queries
CREATE INDEX idx_documents_user_id
ON documents(user_id);

CREATE INDEX idx_conversations_user_id
ON conversations(user_id);


-- migrate:down

DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_documents_user_id;

ALTER TABLE conversations DROP COLUMN user_id;
ALTER TABLE documents DROP COLUMN user_id;