import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  MessageType,
  type TranslationStatusMessage,
} from "../../utils/messaging";
import { type Settings, getSettings, setSettings } from "../../utils/storage";
import { AISettings } from "./components/AISettings";
import { AdvancedSettings } from "./components/AdvancedSettings";
import { Header } from "./components/Header";
import { MainControls } from "./components/MainControls";
import "./style.css";

function App() {
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [currentHostname, setCurrentHostname] = useState("");

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
      <Header
        isTranslating={isTranslating}
        loadingModels={loadingModels}
        onFetchModels={fetchModels}
      />

      <MainControls
        settings={settings}
        currentHostname={currentHostname}
        isCurrentSiteEnabled={isCurrentSiteEnabled}
        onToggleCurrentSite={toggleCurrentSite}
        onUpdateSettings={handleUpdate}
      />

      <AISettings
        settings={settings}
        models={models}
        onUpdateSettings={handleUpdate}
      />

      <AdvancedSettings
        settings={settings}
        onUpdateSettings={handleUpdate}
      />

      <footer className="pt-2 border-t border-border flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">Latency</span>
          <span className="text-xs font-semibold">
            {latency ? `${latency}ms` : "--"}
          </span>
        </div>
      </footer>

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
