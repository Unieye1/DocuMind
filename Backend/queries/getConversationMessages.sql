SELECT
    m.id,
    m.role,
    m.content,
    m.status,
    m.created_at,

    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', ms.id,
                'chunkId', dc.id,
                'documentId', dc.document_id,
                'pageNumber', dc.page_number,
                'chunkIndex', dc.chunk_index,
                'documentName', d.filename,
                'chunkText', dc.chunk_text,
                'distance', ms.distance
            )
        ) FILTER (WHERE ms.id IS NOT NULL),
        '[]'::jsonb
    ) AS sources

FROM messages m

LEFT JOIN message_sources ms
    ON ms.message_id = m.id

LEFT JOIN document_chunks dc
    ON dc.id = ms.chunk_id

LEFT JOIN documents d
    ON d.id = dc.document_id

WHERE m.conversation_id = $1

GROUP BY m.id

ORDER BY m.created_at ASC, m.id ASC;