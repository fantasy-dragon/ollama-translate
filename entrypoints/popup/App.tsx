import { useEffect, useState } from "react";
import { type Settings, getSettings, setSettings } from "../../utils/storage";
import "./style.css";

function App() {
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s.ollamaUrl === "http://localhost:11434") {
        const updated = { ...s, ollamaUrl: "http://127.0.0.1:11434" };
        setLocalSettings(updated);
        setSettings({ ollamaUrl: "http://127.0.0.1:11434" });
      } else {
        setLocalSettings(s);
      }
    });
  }, []);

  useEffect(() => {
    if (settings?.ollamaUrl) {
      fetchModels();
    }
  }, [settings?.ollamaUrl]);

  const fetchModels = async () => {

    setLoadingModels(true);
    setFetchError(null);
    try {
      const response = await browser.runtime.sendMessage({
        type: "FETCH_MODELS",
      });
      if (response?.error) {
        setFetchError(response.error);
        setModels([]);
      } else if (response?.models) {
        setModels(response.models);
      }
    } catch (error: unknown) {

      const message = error instanceof Error ? error.message : String(error);
      setFetchError(message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleUpdate = async (update: Partial<Settings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...update };
    setLocalSettings(newSettings);
    await setSettings(update);
  };

  if (!settings) {
    return (
      <div className="w-[380px] h-[400px] bg-[#1C1C1E] flex flex-col items-center justify-center rounded-[32px]">
        <div className="w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#121214] p-4 font-sans text-zinc-100 selection:bg-cyan-500/30 overflow-hidden">
      <div className="grid grid-cols-2 gap-3 relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Bento Box 1: Logo & Title (1x1) */}
        <div className="col-span-1 h-[120px] bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/[0.05] rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-400/20 transition-all duration-500" />
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[14px] flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-950"
            >
              <path d="m5 8 6 6" />
              <path d="m4 14 6-6 2-3" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="m22 22-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
          </div>
          <div className="z-10">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Ollama
            </h1>
            <p className="text-[11px] text-cyan-400 font-semibold mt-1 uppercase tracking-widest">
              Translate
            </p>
          </div>
        </div>

        {/* Bento Box 2: Auto Translate Toggle (1x1) */}
        <div className="col-span-1 h-[120px] bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/[0.05] rounded-[24px] p-5 flex flex-col justify-between items-start shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group">
          <span className="text-[13px] font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors">
            Auto Mode
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.autoTranslate}
              onChange={(e) =>
                handleUpdate({ autoTranslate: e.target.checked })
              }
            />
            <div className="w-[52px] h-8 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 peer-checked:after:bg-cyan-400 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-400/10 peer-checked:border-cyan-400/50 border border-white/5 peer-checked:shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
          </label>
        </div>

        {/* Bento Box 3: Target Language (Full Width) */}
        <div className="col-span-2 bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/[0.05] rounded-[24px] p-4 flex items-center gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group transition-colors focus-within:border-cyan-400/30 focus-within:bg-[#1C1C1E]">
          <div className="w-11 h-11 rounded-[16px] bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-focus-within:border-cyan-400/30 group-focus-within:text-cyan-400 text-zinc-400 transition-colors">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8l6 6" />
              <path d="M4 14l6-6 2-3" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="M22 22l-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <label
              htmlFor="target-lang"
              className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5 opacity-80"
            >
              Target Lang
            </label>
            <input
              id="target-lang"
              type="text"
              value={settings.targetLanguage}
              onChange={(e) => handleUpdate({ targetLanguage: e.target.value })}
              className="w-full bg-transparent border-none p-0 text-[15px] font-medium text-white focus:outline-none focus:ring-0 placeholder-zinc-600 truncate"
              placeholder="e.g. 中文, English"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Bento Box 4: Service URL (Full Width) */}
        <div className="col-span-2 bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/[0.05] rounded-[24px] p-4 flex items-center gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group transition-colors focus-within:border-cyan-400/30 focus-within:bg-[#1C1C1E]">
          <div className="w-11 h-11 rounded-[16px] bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-focus-within:border-cyan-400/30 group-focus-within:text-cyan-400 text-zinc-400 transition-colors">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="16" height="16" x="4" y="4" rx="2" />
              <rect width="6" height="6" x="9" y="9" rx="1" />
              <path d="M15 2v2" />
              <path d="M15 20v2" />
              <path d="M2 15h2" />
              <path d="M2 9h2" />
              <path d="M20 15h2" />
              <path d="M20 9h2" />
              <path d="M9 2v2" />
              <path d="M9 20v2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <label
              htmlFor="ollama-url"
              className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5 opacity-80"
            >
              Endpoint URL
            </label>
            <input
              id="ollama-url"
              type="text"
              value={settings.ollamaUrl}
              onChange={(e) => handleUpdate({ ollamaUrl: e.target.value })}
              className="w-full bg-transparent border-none p-0 text-[15px] font-medium text-white focus:outline-none focus:ring-0 placeholder-zinc-600 truncate"
              placeholder="http://127.0.0.1:11434"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Bento Box 5: Model Selection (Full Width) */}
        <div className="col-span-2 bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/[0.05] rounded-[24px] p-4 flex flex-col justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-colors focus-within:border-cyan-400/30 focus-within:bg-[#1C1C1E]">
          <div className="flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-[16px] bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-focus-within:border-cyan-400/30 group-focus-within:text-cyan-400 text-zinc-400 transition-colors">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="flex-1 relative min-w-0">
              <label
                htmlFor="model-select"
                className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5 opacity-80"
              >
                AI Model
              </label>
              <select
                id="model-select"
                value={settings.model}
                onChange={(e) => handleUpdate({ model: e.target.value })}
                className="w-full appearance-none bg-transparent border-none p-0 text-[15px] font-medium text-white focus:outline-none focus:ring-0 cursor-pointer truncate"
              >
                <option value="" className="bg-zinc-900 text-zinc-100">
                  Select model...
                </option>
                {models.map((m) => (
                  <option
                    key={m}
                    value={m}
                    className="bg-zinc-900 text-zinc-100"
                  >
                    {m}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 pointer-events-none text-zinc-500">
                {loadingModels ? (
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                ) : (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {(fetchError || (models.length === 0 && !loadingModels)) && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 items-start backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-1 text-xs py-0.5">
                <p className="text-red-300 font-semibold tracking-wide">
                  {fetchError ? "Connection Failed" : "No Models Detected"}
                </p>
                <p className="text-red-300/70 leading-relaxed text-[11px]">
                  {fetchError
                    ? fetchError
                    : "Please ensure Ollama is running and models are downloaded."}
                  {fetchError && (
                    <span className="block mt-1 opacity-80">
                      Tip: Set{" "}
                      <code className="text-red-400 font-mono bg-red-500/10 px-1 rounded">
                        OLLAMA_ORIGINS="*"
                      </code>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="col-span-2 mt-1 flex justify-between items-center px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />
            </span>
            System Online
          </span>
          <button
            type="button"
            onClick={fetchModels}
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors active:scale-95 py-1"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loadingModels ? "animate-spin text-cyan-400" : ""}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Sync Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
