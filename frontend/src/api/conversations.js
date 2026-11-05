
const API_URL = "http://localhost:3000/api";

// Create a new conversation
export async function createConversation() {
  const response = await fetch(`${API_URL}/conversations`, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create conversation");
  }

  return data.conversation;
}

// Fetch all conversations
export async function getConversations() {
  const response = await fetch(`${API_URL}/conversations`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch conversations");
  }

  return data.conversations;
}

// Fetch messages for a conversation
export async function getConversationMessages(conversationId) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/messages`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch messages");
  }

  return data.messages;
}

// Fetch PDFs attached to a conversation
export async function getConversationDocuments(conversationId) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/documents`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch attached documents");
  }

  return data.documents;
}

// Attach multiple PDFs to a conversation
export async function attachDocuments(conversationId, documentIds) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documentIds }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to attach documents");
  }

  return data;
}

// Detach a PDF from a conversation
export async function detachDocument(conversationId, documentId) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to detach document");
  }

  return data;
}

// Delete a conversation
export async function deleteConversation(conversationId) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete conversation");
  }

  return data;
}
