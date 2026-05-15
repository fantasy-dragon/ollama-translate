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
    <div className="w-[360px] bg-background p-4 font-sans text-foreground selection:bg-primary/20 overflow-hidden">
      <div className="flex flex-col gap-4">
        {/* Header Section (Minimalist shadcn style) */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
                aria-hidden="true"
              >
                <path d="m5 8 6 6" />
                <path d="m4 14 6-6 2-3" />
                <path d="M2 5h12" />
                <path d="M7 2h1" />
                <path d="m22 22-5-10-5 10" />
                <path d="M14 18h6" />
              </svg>
              Ollama Translate
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                Online
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Modern, minimalist translation powered by AI.
          </p>
        </div>

        <div className="h-[1px] bg-border mx-1" />

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Auto Mode Card */}
          <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-between items-start gap-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Auto Mode
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoTranslate}
                onChange={(e) =>
                  handleUpdate({ autoTranslate: e.target.checked })
                }
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* AI Model Card */}
          <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-between gap-2 hover:bg-accent/50 transition-colors">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AI Model
            </span>
            <div className="relative">
              <select
                id="model-select"
                value={settings.model}
                onChange={(e) => handleUpdate({ model: e.target.value })}
                className="w-full appearance-none bg-transparent border-none p-0 text-sm font-medium text-foreground focus:outline-none focus:ring-0 cursor-pointer truncate pr-5"
              >
                <option value="">Select...</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                {loadingModels ? (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inputs Stack */}
        <div className="flex flex-col gap-3">
          {/* Target Language */}
          <div className="space-y-1.5">
            <label
              htmlFor="target-lang"
              className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider"
            >
              Target Language
            </label>
            <div className="bg-card border border-border rounded-lg flex items-center px-3 focus-within:ring-1 focus-within:ring-ring transition-all">
              <input
                id="target-lang"
                type="text"
                value={settings.targetLanguage}
                onChange={(e) =>
                  handleUpdate({ targetLanguage: e.target.value })
                }
                className="w-full bg-transparent border-none py-2.5 text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="e.g. Chinese"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Endpoint URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="ollama-url"
              className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider"
            >
              Service Endpoint
            </label>
            <div className="bg-card border border-border rounded-lg flex items-center px-3 focus-within:ring-1 focus-within:ring-ring transition-all">
              <input
                id="ollama-url"
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => handleUpdate({ ollamaUrl: e.target.value })}
                className="w-full bg-transparent border-none py-2.5 text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/50 truncate"
                placeholder="http://localhost:11434"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Error Handling */}
        {(fetchError || (models.length === 0 && !loadingModels)) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex gap-2.5 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive shrink-0"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] text-destructive-foreground font-medium leading-tight">
              {fetchError || "No models found. Check Ollama."}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={fetchModels}
            disabled={loadingModels}
            className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-md shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loadingModels ? "animate-spin" : ""}
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            {loadingModels ? "Syncing..." : "Sync Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
