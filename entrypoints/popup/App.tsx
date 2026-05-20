import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function useSettings() {
  const [settings, setLocalSettings] = useState<Settings | null>(null);

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

  const handleUpdate = useCallback(async (update: Partial<Settings>) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newSettings = { ...prev, ...update };
      setSettings(update);
      return newSettings;
    });
  }, []);

  return { settings, handleUpdate };
}

function useTranslationStatus() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const listener = (message: TranslationStatusMessage) => {
      if (message.type === MessageType.TRANSLATION_STATUS) {
        setIsTranslating(message.status === "translating");
        if (message.latency) setLatency(message.latency);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  return { isTranslating, latency };
}

function useCurrentHostname() {
  const [currentHostname, setCurrentHostname] = useState("");

  useEffect(() => {
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
  }, []);

  return currentHostname;
}

function useModels(ollamaUrl: string | undefined) {
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (ollamaUrl) fetchModels();
  }, [ollamaUrl, fetchModels]);

  return { models, loadingModels, fetchError, fetchModels };
}

function useSiteToggle(
  settings: Settings | null,
  currentHostname: string,
  onUpdateSettings: (update: Partial<Settings>) => void,
) {
  const isCurrentSiteEnabled = useMemo(
    () =>
      settings
        ? settings.enabledDomains.some(
            (d) => currentHostname === d || currentHostname.endsWith(`.${d}`),
          )
        : false,
    [settings, currentHostname],
  );

  const toggleCurrentSite = useCallback(() => {
    if (!settings || !currentHostname) return;
    if (isCurrentSiteEnabled) {
      onUpdateSettings({
        enabledDomains: settings.enabledDomains.filter(
          (d) => !(currentHostname === d || currentHostname.endsWith(`.${d}`)),
        ),
      });
    } else {
      onUpdateSettings({
        enabledDomains: [...settings.enabledDomains, currentHostname],
      });
    }
  }, [settings, currentHostname, isCurrentSiteEnabled, onUpdateSettings]);

  return { isCurrentSiteEnabled, toggleCurrentSite };
}

function App() {
  const { settings, handleUpdate } = useSettings();
  const { isTranslating, latency } = useTranslationStatus();
  const currentHostname = useCurrentHostname();
  const { models, loadingModels, fetchError, fetchModels } = useModels(
    settings?.ollamaUrl,
  );
  const { isCurrentSiteEnabled, toggleCurrentSite } = useSiteToggle(
    settings,
    currentHostname,
    handleUpdate,
  );

  if (!settings) {
    return (
      <div className="w-[320px] h-[400px] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[320px] min-h-[400px] bg-background text-foreground font-sans p-3 overflow-x-hidden">
      <div className="bg-card rounded-2xl p-4 space-y-5 shadow-xl border-none">
        <Header
          isTranslating={isTranslating}
          loadingModels={loadingModels}
          onFetchModels={fetchModels}
        />

        <div className="h-[1px] w-full bg-secondary" />

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
          latency={latency}
          onUpdateSettings={handleUpdate}
        />
      </div>

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
