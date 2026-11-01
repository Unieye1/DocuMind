import { useRef } from "react";
import {
  BrainCircuit,
  Upload,
  FileText,
  Trash2,
  LoaderCircle,
} from "lucide-react";

function Sidebar({
  documents,
  onUpload,
  onDelete,
  uploading,
  error,
  selectedDocumentId,
  onSelectDocument,
}) {
  const fileInputRef = useRef(null);

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

        {/* Document list */}
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
            {documents.map((document) => (
              <div
                key={document.id}
                onClick={() => onSelectDocument(document.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDocumentId === document.id
                    ? "bg-violet-50 border-violet-300"
                    : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <FileText size={20} className="text-violet-600 shrink-0" />

                <p className="text-sm text-slate-700 truncate flex-1">
                  {document.filename}
                </p>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(document.id, document.filename);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete document"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
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
