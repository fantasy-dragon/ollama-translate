import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { AISettings } from "./components/AISettings";
import { AdvancedSettings } from "./components/AdvancedSettings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { MainControls } from "./components/MainControls";
import { settingsStore, modelsStore, initApp } from "./store/popup-store";
import "./style.css";

function App() {
  const { data: settings } = useSnapshot(settingsStore);
  const { error: fetchError } = useSnapshot(modelsStore);

  useEffect(() => {
    initApp();
  }, []);

  if (!settings) {
    return (
      <div className="w-[320px] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary  animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-[320px]  bg-background text-foreground font-sans overflow-x-hidden">
        <div className="bg-card p-4 space-y-5 shadow-xl border-none">
          <Header />
          <div className="h-px w-full bg-secondary" />
          <MainControls />
          <AISettings />
          <AdvancedSettings />
        </div>

        {fetchError && (
          <div className="relative p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in slide-in-from-bottom-2">
            <div className="p-1 bg-destructive/20 rounded text-destructive mt-0.5">
              <AlertCircle className="w-3 h-3" strokeWidth={3} />
            </div>
            <p className="text-[10px] text-destructive font-medium leading-relaxed">
              {fetchError}
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
