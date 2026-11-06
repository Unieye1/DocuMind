import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useState, useEffect } from "react";
import { getDocuments, uploadDocument, deleteDocument } from "./api/documents";
import { getCurrentUser } from "./api/auth";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import { logoutUser } from "./api/auth";
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [attachedDocuments, setAttachedDocuments] = useState([]);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  async function checkAuthentication() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      return;
    } finally {
      setAuthLoading(false);
    }

    await Promise.all([fetchDocuments(), fetchConversations()]);
  }

  useEffect(() => {
    checkAuthentication();
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

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await logoutUser();

      setUser(null);
      setDocuments([]);
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setAttachedDocuments([]);
      setShowAuthModal(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLogoutLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FC]">
        <p className="text-slate-500">Loading DocuMind...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          onLogin={() => {
            setAuthMode("login");
            setShowAuthModal(true);
          }}
          onSignUp={() => {
            setAuthMode("register");
            setShowAuthModal(true);
          }}
        />

        {showAuthModal && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={async (authenticatedUser) => {
              setUser(authenticatedUser);

              await Promise.all([fetchDocuments(), fetchConversations()]);
            }}
          />
        )}
      </>
    );
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
          user={user}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
      </main>
    </div>
  );
}

export default App;
