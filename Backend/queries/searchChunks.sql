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

JOIN conversation_documents cd
    ON cd.document_id = dc.document_id

JOIN conversations c
    ON c.id = cd.conversation_id

WHERE cd.conversation_id = $2
  AND c.user_id = $3
  AND d.user_id = $3

ORDER BY dc.embedding <=> $1::halfvec

LIMIT 5;