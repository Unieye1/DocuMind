import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useState, useEffect} from "react";
import { getDocuments, uploadDocument,deleteDocument } from "./api/documents";

function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function fetchDocuments() {
  try {
    const data = await getDocuments();
    setDocuments(data);
  } catch (error) {
    setError(error.message);
  }
}

useEffect(() => {
  fetchDocuments();
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
      prevDocuments.filter((document) => document.id !== documentId)
    );
  } catch (error) {
    setError(error.message);
  }
}

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC] text-slate-800">
      <Sidebar
        documents={documents}
        onUpload={handleUpload}
        onDelete={handleDelete}
        uploading={uploading}
        error={error}
      />

      <main className="flex-1 min-w-0">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
