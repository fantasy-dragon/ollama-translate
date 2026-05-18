import {
  AlertCircle,
  ChevronDown,
  Languages,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTranslation } from "../../utils/i18n";
import {
  MessageType,
  type TranslationStatusMessage,
} from "../../utils/messaging";
import { type Settings, getSettings, setSettings } from "../../utils/storage";
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
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [currentHostname, setCurrentHostname] = useState("");

  const t = useMemo(() => {
    return getTranslation("zh");
  }, []);

  useEffect(() => {
    getSettings().then((s) => {
      // Fix potential localhost issue
      if (s.ollamaUrl === "http://localhost:11434") {
        const updated = { ...s, ollamaUrl: "http://127.0.0.1:11434" };
        setLocalSettings(updated);
        setSettings({ ollamaUrl: "http://127.0.0.1:11434" });
      } else {
        setLocalSettings(s);
      }
    });
    const listener = (message: TranslationStatusMessage) => {
      if (message.type === MessageType.TRANSLATION_STATUS) {
        setIsTranslating(message.status === "translating");
        if (message.latency) setLatency(message.latency);
      }
    };
    browser.runtime.onMessage.addListener(listener);

    // Get current tab hostname
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          setCurrentHostname(url.hostname.toLowerCase());
        } catch (e) {
          console.error("Invalid URL", e);
        }
      }
    });

    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    if (settings?.ollamaUrl) fetchModels();
  }, [settings?.ollamaUrl]);

  const fetchModels = async () => {
    setLoadingModels(true);
    setFetchError(null);
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.FETCH_MODELS,
      });
      if (response?.error) {
        setFetchError(response.error);
        setModels([]);
      } else if (response?.models) {
        setModels(response.models);
      }
    } catch (error: unknown) {
      setFetchError(error instanceof Error ? error.message : String(error));
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
    l.toLowerCase().includes(langSearch.toLowerCase()),
  );

  const isCurrentSiteEnabled = settings
    ? settings.enabledDomains.some(
        (d) => currentHostname === d || currentHostname.endsWith(`.${d}`),
      )
    : false;

  const toggleCurrentSite = () => {
    if (!settings || !currentHostname) return;
    if (isCurrentSiteEnabled) {
      // Disable: Remove from enabled
      handleUpdate({
        enabledDomains: settings.enabledDomains.filter(
          (d) => !(currentHostname === d || currentHostname.endsWith(`.${d}`)),
        ),
      });
    } else {
      // Enable: Add to enabled
      handleUpdate({
        enabledDomains: [...settings.enabledDomains, currentHostname],
      });
    }
  };

  if (!settings) {
    return (
      <div className="w-[320px] h-[400px] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[320px] min-h-[400px] bg-background text-foreground font-sans p-4 space-y-4 overflow-x-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg text-primary-foreground shadow-sm">
            <Languages className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight">{t.title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-[10px] font-medium border border-border mr-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isTranslating ? "bg-primary animate-pulse" : "bg-green-500"}`}
            />
            <span className="opacity-70">
              {isTranslating ? t.statusTranslating : t.statusOnline}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchModels}
            className={`p-1.5 hover:bg-secondary rounded-md transition-colors ${loadingModels ? "animate-spin" : ""}`}
            title={t.syncStatus}
          >
            <RefreshCw className="w-4 h-4 opacity-60" />
          </button>
        </div>
      </header>

      {/* ── Main Controls Card ── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] space-y-4">
        {/* Auto-Translate Functionality (Merged UI) */}
        <div className="space-y-4">
          {/* 1. Current Site Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="site-translate-toggle"
                className="text-xs font-semibold leading-none cursor-pointer"
              >
                {t.enableOnSite}
              </label>
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {currentHostname || "..."}
              </p>
            </div>
            <button
              id="site-translate-toggle"
              type="button"
              onClick={toggleCurrentSite}
              role="switch"
              aria-checked={isCurrentSiteEnabled}
              disabled={!currentHostname}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
                isCurrentSiteEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  isCurrentSiteEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Translation Style Segmented Control */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <span className="text-xs font-medium text-muted-foreground">
            {t.translationStyle}
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
            {(["academic", "casual", "format"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => handleUpdate({ translationStyle: style })}
                className={`text-[10px] font-medium py-1.5 rounded-md transition-all ${
                  settings.translationStyle === style
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {style === "academic"
                  ? t.styleAcademic
                  : style === "casual"
                    ? t.styleCasual
                    : t.styleFormat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Settings Card ── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="model-select-button"
              className="text-xs font-medium text-muted-foreground"
            >
              {t.aiModel}
            </label>
            {settings.model && (
              <span className="text-[9px] font-bold text-green-500 uppercase">
                Ready
              </span>
            )}
          </div>
          <div className="relative">
            <button
              id="model-select-button"
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-background border border-input rounded-lg text-xs hover:bg-accent transition-colors group"
            >
              <span className="truncate max-w-[180px]">
                {settings.model || t.selectModel}
              </span>
              <ChevronDown
                className={`w-4 h-4 opacity-40 transition-transform group-hover:opacity-100 ${isModelDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
                {models.length > 0 ? (
                  models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        handleUpdate({ model: m });
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center px-2 py-1.5 text-xs rounded-md transition-colors ${
                        settings.model === m
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      {m}
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground italic text-center">
                    {t.noModelsFound}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Target Language */}
        <div className="space-y-2">
          <label
            htmlFor="language-search-input"
            className="text-xs font-medium text-muted-foreground"
          >
            {t.targetLanguage}
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id="language-search-input"
              type="text"
              value={isLangFocus ? langSearch : settings.targetLanguage}
              onChange={(e) => setLangSearch(e.target.value)}
              onFocus={() => {
                setIsLangFocus(true);
                setLangSearch("");
              }}
              onBlur={() => setTimeout(() => setIsLangFocus(false), 200)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={t.targetLanguagePlaceholder}
            />
            {isLangFocus && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1">
                {filteredLangs.length > 0 ? (
                  filteredLangs.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        handleUpdate({ targetLanguage: l });
                        setIsLangFocus(false);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left"
                    >
                      {l}
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No results
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Advanced Settings ── */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 w-full text-left"
        >
          <Settings2
            className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? "rotate-90" : ""}`}
          />
          {t.advancedSettings}
        </button>

        {isAdvancedOpen && (
          <div className="p-3 bg-secondary/30 border border-border rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
            <label
              htmlFor="service-endpoint"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.serviceEndpoint}
            </label>
            <input
              id="service-endpoint"
              type="text"
              value={settings.ollamaUrl}
              onChange={(e) => handleUpdate({ ollamaUrl: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-[11px] focus:outline-none"
              placeholder="http://127.0.0.1:11434"
            />
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="pt-2 border-t border-border flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">Latency</span>
          <span className="text-xs font-semibold">
            {latency ? `${latency}ms` : "--"}
          </span>
        </div>
      </footer>

      {/* ── Error Banner ── */}
      {fetchError && (
        <div className="relative p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-1 bg-destructive/20 rounded text-destructive mt-0.5">
            <AlertCircle className="w-3 h-3" strokeWidth={3} />
          </div>
          <p className="text-[10px] text-destructive font-medium leading-relaxed">
            {fetchError}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
