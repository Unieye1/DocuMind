SELECT
    id,
    document_name,
    chunk_text,
    embedding <=> $1::halfvec AS distance
FROM document_chunks
ORDER BY embedding <=> $1::halfvec
LIMIT 5;