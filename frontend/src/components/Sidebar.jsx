import { useRef, useState } from "react";
import {
  BrainCircuit,
  Upload,
  FileText,
  Trash2,
  LoaderCircle,
  Plus,
  MessageSquare,
} from "lucide-react";

function Sidebar({
  documents,
  conversations,
  activeConversationId,
  onCreateConversation,
  onSelectConversation,
  onUpload,
  onDelete,
  uploading,
  error,
  attachedDocuments,
  onAttachDocuments,
  onDetachDocument,
  onDeleteConversation,
}) {
  const fileInputRef = useRef(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  function toggleDocumentSelection(documentId) {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      onUpload(file);
    }

    // Allows selecting the same file again.
    event.target.value = "";
  }

  function handleDelete(documentId, filename) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"?`,
    );

    if (confirmed) {
      onDelete(documentId);
    }
  }

  return (
    <aside className="w-[290px] shrink-0 h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Branding */}
      <div className="h-[72px] px-6 flex items-center gap-3 border-b border-slate-100">
        <BrainCircuit size={27} className="text-violet-600" />

        <h1 className="text-xl font-bold tracking-tight">DocuMind</h1>
      </div>

      {/* Documents */}
      <div className="p-5 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Workspace
        </h2>

        {/* New conversation button */}
        <button
          type="button"
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white p-3 text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={18} />
          New conversation
        </button>

        {/* Conversation list */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Conversations
          </h2>

          {conversations.length === 0 ? (
            <p className="text-sm text-slate-400">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    activeConversationId === conversation.id
                      ? "bg-violet-50 border-violet-300"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <MessageSquare
                      size={18}
                      className="text-violet-600 shrink-0"
                    />
                    <span className="text-sm text-slate-700 truncate">
                      {conversation.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload area */}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="w-full rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-6 text-center hover:bg-violet-50 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <LoaderCircle
              size={24}
              className="mx-auto text-violet-600 animate-spin"
            />
          ) : (
            <Upload size={24} className="mx-auto text-violet-600" />
          )}

          <p className="text-sm font-medium text-violet-700 mt-3">
            {uploading ? "Processing PDF..." : "Upload your PDFs"}
          </p>

          <p className="text-xs text-slate-400 mt-2">PDF files up to 10 MB</p>
        </button>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        {/* Attached documents */}
        <div className="mt-8 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Attached to conversation
          </h2>
        </div>

        {!activeConversationId ? (
          <p className="text-sm text-slate-400">
            Create or select a conversation first.
          </p>
        ) : attachedDocuments.length === 0 ? (
          <p className="text-sm text-slate-400">
            No PDFs attached to this conversation.
          </p>
        ) : (
          <div className="space-y-2">
            {attachedDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-violet-200 bg-violet-50"
              >
                <FileText size={18} className="text-violet-600 shrink-0" />

                <p className="text-sm text-slate-700 truncate flex-1">
                  {document.filename}
                </p>

                <button
                  type="button"
                  onClick={() => onDetachDocument(document.id)}
                  className="text-slate-400 hover:text-red-500"
                  title="Detach document"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Document library */}
        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your documents
          </h2>

          <span className="text-xs text-slate-400">
            {documents.length} files
          </span>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => {
              const isAttached = attachedDocuments.some(
                (attached) => attached.id === document.id,
              );

              const isSelected = selectedDocumentIds.includes(document.id);

              return (
                <label
                  key={document.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isAttached
                      ? "border-slate-100 opacity-50"
                      : isSelected
                        ? "border-violet-300 bg-violet-50"
                        : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!activeConversationId || isAttached}
                    onChange={() => toggleDocumentSelection(document.id)}
                  />

                  <FileText size={18} className="text-violet-600 shrink-0" />

                  <span className="text-sm text-slate-700 truncate flex-1">
                    {document.filename}
                  </span>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleDelete(document.id, document.filename);
                    }}
                    className="text-slate-400 hover:text-red-500"
                    title="Delete permanently from library"
                  >
                    <Trash2 size={17} />
                  </button>
                </label>
              );
            })}
          </div>
        )}

        {/* Attach selected documents */}
        {selectedDocumentIds.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              await onAttachDocuments(selectedDocumentIds);
              setSelectedDocumentIds([]);
            }}
            disabled={!activeConversationId}
            className="w-full mt-4 rounded-lg bg-violet-600 text-white p-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            Attach {selectedDocumentIds.length} PDF(s)
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Powered by Gemini and PostgreSQL
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
