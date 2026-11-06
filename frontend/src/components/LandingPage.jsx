
function LandingPage({ onLogin, onSignUp }) {
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <h1 className="text-2xl font-bold tracking-tight">
          Docu<span className="text-indigo-600">Mind</span>
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Login
          </button>

          <button
            onClick={onSignUp}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-28 text-center">
        <div className="mb-6 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          Your documents. One intelligent workspace.
        </div>

        <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Understand your PDFs.
          <span className="block text-indigo-600">
            Just ask.
          </span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
          Upload your documents, ask questions in natural language,
          and get intelligent answers grounded in your own files.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={onSignUp}
            className="rounded-xl bg-indigo-600 px-7 py-3.5 font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Get Started
          </button>

          <button
            onClick={onLogin}
            className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            I already have an account
          </button>
        </div>

        {/* Feature highlights */}
        <div className="mt-24 grid w-full gap-6 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">Multiple PDFs</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Bring multiple documents into one conversation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">Intelligent Search</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Find relevant information using semantic search.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">Source Citations</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              See which document pages support your answers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
