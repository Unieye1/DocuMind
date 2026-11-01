import { useState } from "react";
import { Send, Paperclip, ChevronDown  } from "lucide-react";
import { askQuestion } from "../api/documents";
import ReactMarkdown from "react-markdown";

function ChatWindow({ documents, selectedDocumentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId,
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!question.trim() || !selectedDocumentId || loading) {
      return;
    }

    const currentQuestion = question.trim();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = await askQuestion(currentQuestion, selectedDocumentId);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Document Chat</h2>

          <p className="text-xs text-slate-400">
            {selectedDocument
              ? `Currently selected: ${selectedDocument.filename}`
              : "Select a document from the sidebar to get started"}
          </p>
        </div>
      </header>

      {/* Chat area */}
      <section className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center mt-24">
              <h2 className="text-2xl font-semibold">Welcome to DocuMind</h2>

              <p className="text-slate-500 mt-3">
                Upload a PDF and start asking questions.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <div className="text-sm leading-6">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === "assistant" &&
                  message.sources?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3">
                        Sources
                      </p>

                      <div className="space-y-3">
                        {message.sources.map((source) => (
                          <details
                            key={source.id}
                            className="bg-white border border-slate-200 rounded-lg group"
                          >
                            <summary className="flex items-center justify-between p-3 cursor-pointer list-none">
                              <div>
                                <p className="text-xs font-medium text-violet-700">
                                  Page {source.pageNumber} · Chunk{" "}
                                  {source.chunkIndex}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {source.documentName}
                                </p>
                              </div>

                              <ChevronDown
                                size={16}
                                className="text-slate-400 transition-transform group-open:rotate-180"
                              />
                            </summary>

                            <div className="px-3 pb-3">
                              <p className="text-xs text-slate-500 leading-5 border-t border-slate-100 pt-3">
                                {source.chunkText}
                              </p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl px-5 py-3 text-sm">
                DocuMind is thinking...
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Message input */}
      <div className="p-6 bg-white border-t border-slate-200">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
        >
          <Paperclip size={20} className="text-slate-400" />

          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={
              selectedDocument
                ? "Ask a question about your document..."
                : "Select a document first..."
            }
            disabled={!selectedDocument || loading}
            className="flex-1 outline-none text-sm disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!question.trim() || !selectedDocument || loading}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg"
          >
            {loading ? "..." : <Send size={18} />}
          </button>
        </form>

        {error && (
          <p className="max-w-3xl mx-auto mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}

export default ChatWindow;
