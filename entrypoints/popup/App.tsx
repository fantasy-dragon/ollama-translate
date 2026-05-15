import { useEffect, useState, useMemo } from "react";
import { type Settings, getSettings, setSettings } from "../../utils/storage";
import { getTranslation } from "../../utils/i18n";
import "./style.css";

const COMMON_LANGUAGES = [
  "中文",
  "English",
  "日本語",
  "한국어",
  "Français",
  "Deutsch",
  "Español",
  "Русский",
];

function App() {
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [langSearch, setLangSearch] = useState("");
  const [isLangFocus, setIsLangFocus] = useState(false);

  const t = useMemo(() => {
    return getTranslation(settings?.language || "zh");
  }, [settings?.language]);

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

    // Listen for translation status
    const listener = (message: any) => {
      if (message.type === "TRANSLATION_STATUS") {
        setIsTranslating(message.status === "translating");
        if (message.latency) {
          setLatency(message.latency);
        }
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
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

  const filteredLangs = COMMON_LANGUAGES.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  if (!settings) {
    return (
      <div className="w-[360px] h-[480px] bg-[#09090b] flex flex-col items-center justify-center rounded-[32px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[360px] bg-background p-5 font-sans text-foreground selection:bg-primary/20 overflow-hidden relative">
      {/* Background Ollama Silhouette */}
      <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 8 6 6" />
                  <path d="m4 14 6-6 2-3" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="m22 22-5-10-5 10" />
                  <path d="M14 18h6" />
                </svg>
              </div>
              {t.title}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleUpdate({
                    language: settings.language === "zh" ? "en" : "zh",
                  })
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-secondary hover:bg-accent transition-all text-[10px] font-bold"
                title={t.language}
              >
                {settings.language === "zh" ? "EN" : "中"}
              </button>
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border transition-all ${
                  isTranslating ? "border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : ""
                }`}
              >
                <div className="relative">
                  <span
                    className={`block w-2 h-2 rounded-full bg-green-500 ${
                      isTranslating ? "animate-breathe" : ""
                    }`}
                  />
                  {isTranslating && (
                    <span className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  {isTranslating ? t.statusTranslating : t.statusOnline}
                  {!isTranslating && latency && (
                    <span className="ml-1 text-muted-foreground font-medium lowercase">
                      ({latency}ms)
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={fetchModels}
                  disabled={loadingModels}
                  className={`ml-1 text-muted-foreground hover:text-foreground transition-colors ${
                    loadingModels ? "animate-spin" : ""
                  }`}
                  title={t.syncStatus}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium px-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Auto Translate Toggle */}
          <div className="group relative bg-card border border-border rounded-2xl p-4 flex flex-col justify-between items-start gap-4 hover:border-primary/50 hover:bg-accent/30 transition-all duration-300">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="M20 12h2" />
                    <path d="m19.07 19.07-1.41-1.41" />
                    <path d="M12 20v2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="m7.76 7.76-1.41-1.41" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t.autoMode}
                </span>
              </div>
              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[10px] text-popover-foreground rounded-lg border border-border shadow-xl z-50">
                {t.autoModeTooltip}
              </div>
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
              <div className="w-10 h-5.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4.5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner" />
            </label>
          </div>

          {/* Translation Style */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-primary/50 hover:bg-accent/30 transition-all duration-300">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
                  <path d="M4.5 7L2 3" />
                  <path d="M4.5 7V3" />
                  <path d="M4.5 7H2" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t.translationStyle}
              </span>
            </div>
            <select
              value={settings.translationStyle}
              onChange={(e) =>
                handleUpdate({
                  translationStyle: e.target.value as any,
                })
              }
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="academic">{t.styleAcademic}</option>
              <option value="casual">{t.styleCasual}</option>
              <option value="format">{t.styleFormat}</option>
            </select>
          </div>

          {/* AI Model Card */}
          <div className="col-span-2 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/50 hover:bg-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t.aiModel}
                </span>
              </div>
              {settings.model && (
                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold border border-green-500/20">
                  DOWNLOADED
                </span>
              )}
            </div>
            <div className="relative">
              <select
                id="model-select"
                value={settings.model}
                onChange={(e) => handleUpdate({ model: e.target.value })}
                className="w-full appearance-none bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="">{t.selectModel}</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Target Language Card */}
          <div className="col-span-2 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/50 hover:bg-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t.targetLanguage}
                </span>
              </div>
              <span className="text-[9px] text-primary font-bold opacity-60">
                {t.fromAuto}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                value={isLangFocus ? langSearch : settings.targetLanguage}
                onChange={(e) => setLangSearch(e.target.value)}
                onFocus={() => {
                  setIsLangFocus(true);
                  setLangSearch("");
                }}
                onBlur={() => {
                  setTimeout(() => setIsLangFocus(false), 200);
                }}
                className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                placeholder={t.targetLanguagePlaceholder}
              />
              {isLangFocus && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto overflow-x-hidden p-1">
                  {filteredLangs.length > 0 ? (
                    filteredLangs.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          handleUpdate({ targetLanguage: l });
                          setIsLangFocus(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                      >
                        {l}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Settings Fold */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2 px-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${
                isAdvancedOpen ? "rotate-180" : ""
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            {t.advancedSettings}
          </button>

          {isAdvancedOpen && (
            <div className="bg-secondary/30 border border-border rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {t.serviceEndpoint}
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => handleUpdate({ ollamaUrl: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all truncate"
                  placeholder={t.serviceEndpointPlaceholder}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={() => window.close()}
          className="w-full h-12 bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {t.saveSettings}
        </button>

        {/* Error Message */}
        {fetchError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 items-center animate-in zoom-in-95 duration-300">
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
              className="text-destructive shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] text-destructive-foreground font-bold leading-tight">
              {fetchError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
