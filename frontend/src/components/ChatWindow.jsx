
import { Send, Paperclip } from "lucide-react";

function ChatWindow() {
  return (
    <div className="h-screen flex flex-col">

      {/* Header */}
      <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">
            Document Chat
          </h2>

          <p className="text-xs text-slate-400">
            Ask questions about your documents
          </p>
        </div>
      </header>

      {/* Chat area */}
      <section className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto text-center mt-24">
          <h2 className="text-2xl font-semibold">
            Welcome to DocuMind
          </h2>

          <p className="text-slate-500 mt-3">
            Upload a PDF and start asking questions.
          </p>
        </div>
      </section>

      {/* Message input */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 shadow-sm">

          <Paperclip size={20} className="text-slate-400" />

          <input
            type="text"
            placeholder="Ask a question about your documents..."
            className="flex-1 outline-none text-sm"
          />

          <button className="bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg">
            <Send size={18} />
          </button>

        </div>
      </div>

    </div>
  );
}

export default ChatWindow;
