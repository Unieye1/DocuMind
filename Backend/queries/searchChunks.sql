SELECT
    dc.id,
    d.filename AS document_name,
    dc.document_id,
    dc.page_number,
    dc.chunk_index,
    dc.chunk_text,
    dc.embedding <=> $1::halfvec AS distance
FROM document_chunks dc
JOIN documents d
    ON d.id = dc.document_id
WHERE dc.document_id = $2
ORDER BY dc.embedding <=> $1::halfvec
LIMIT 5;