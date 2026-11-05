import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useState, useEffect } from "react";
import { getDocuments, uploadDocument, deleteDocument } from "./api/documents";
import {
  createConversation,
  getConversations,
  getConversationMessages,
  getConversationDocuments,
  attachDocuments,
  detachDocument,
  deleteConversation,
} from "./api/conversations";

function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [attachedDocuments, setAttachedDocuments] = useState([]);

  async function fetchDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function fetchConversations() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleCreateConversation() {
    try {
      setError("");

      const conversation = await createConversation();

      setConversations((prev) => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setAttachedDocuments([]);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleSelectConversation(conversationId) {
    try {
      setError("");
      setActiveConversationId(conversationId);

      // Clear previous conversation data while loading
      setMessages([]);
      setAttachedDocuments([]);

      const [messagesData, documentsData] = await Promise.all([
        getConversationMessages(conversationId),
        getConversationDocuments(conversationId),
      ]);

      setMessages(messagesData);
      setAttachedDocuments(documentsData);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleAttachDocuments(documentIds) {
    if (!activeConversationId || documentIds.length === 0) return;

    try {
      setError("");

      const data = await attachDocuments(activeConversationId, documentIds);

      setAttachedDocuments(data.documents);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDetachDocument(documentId) {
    if (!activeConversationId) return;

    try {
      setError("");

      await detachDocument(activeConversationId, documentId);

      setAttachedDocuments((prev) =>
        prev.filter((document) => document.id !== documentId),
      );
    } catch (error) {
      setError(error.message);
    }
  }


  async function handleDeleteConversation(conversationId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this conversation? Its messages will also be deleted.",
  );

  if (!confirmed) return;

  try {
    setError("");

    await deleteConversation(conversationId);

    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== conversationId),
    );

    // If the deleted conversation was active, clear the workspace.
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setAttachedDocuments([]);
    }
  } catch (error) {
    setError(error.message);
  }
}

  useEffect(() => {
    fetchDocuments();
    fetchConversations();
  }, []);

  async function handleUpload(file) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      await uploadDocument(file);

      const updatedDocuments = await getDocuments();
      setDocuments(updatedDocuments);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId) {
    setError("");

    try {
      await deleteDocument(documentId);

      setDocuments((prevDocuments) =>
        prevDocuments.filter((document) => document.id !== documentId),
      );
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC] text-slate-800">
      <Sidebar
        documents={documents}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onCreateConversation={handleCreateConversation}
        onSelectConversation={handleSelectConversation}
        onUpload={handleUpload}
        onDelete={handleDelete}
        uploading={uploading}
        error={error}
        attachedDocuments={attachedDocuments}
        onAttachDocuments={handleAttachDocuments}
        onDetachDocument={handleDetachDocument}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 min-w-0">
        <ChatWindow
          conversationId={activeConversationId}
          messages={messages}
          setMessages={setMessages}
          attachedDocuments={attachedDocuments}
        />
      </main>
    </div>
  );
}

export default App;
