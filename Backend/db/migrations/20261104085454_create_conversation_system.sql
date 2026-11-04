-- migrate:up
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL DEFAULT 'New conversation',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_documents (
    conversation_id UUID NOT NULL,

    document_id UUID NOT NULL,

    attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (conversation_id, document_id),

    CONSTRAINT fk_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document
        FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL,

    role TEXT NOT NULL,

    content TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'completed',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT check_message_role
        CHECK (role IN ('user', 'assistant')),

    CONSTRAINT check_message_status
        CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE TABLE message_sources (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    message_id UUID NOT NULL,

    chunk_id BIGINT NOT NULL,

    distance DOUBLE PRECISION,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_source_message
        FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_source_chunk
        FOREIGN KEY (chunk_id)
        REFERENCES document_chunks(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_message_chunk
        UNIQUE (message_id, chunk_id)
);

CREATE INDEX idx_messages_conversation_created
ON messages (conversation_id, created_at, id);

CREATE INDEX idx_conversation_documents_document
ON conversation_documents (document_id);

CREATE INDEX idx_message_sources_chunk
ON message_sources (chunk_id);

-- migrate:down

DROP TABLE message_sources;

DROP TABLE messages;

DROP TABLE conversation_documents;

DROP TABLE conversations;