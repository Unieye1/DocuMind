const API_URL = "http://localhost:3000/api";

export async function getDocuments() {
  const response = await fetch(`${API_URL}/documents`);

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const data = await response.json();
  return data.documents;
}


export async function uploadDocument(file) {
  const formData = new FormData();

  formData.append("document", file);

  const response = await fetch(`${API_URL}/documents`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload document");
  }

  return data;
}


export async function deleteDocument(documentId) {
  const response = await fetch(
    `http://localhost:3000/api/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete document");
  }

  return data;
}

export async function askQuestion(question, documentId) {
  const response = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      documentId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get an answer");
  }

  return data;
}