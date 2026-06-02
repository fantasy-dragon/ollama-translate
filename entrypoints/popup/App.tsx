import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { AISettings } from "./components/AISettings";
import { AdvancedSettings } from "./components/AdvancedSettings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { MainControls } from "./components/MainControls";
import { settingsStore, initApp } from "./store/popup-store";
import "./style.css";

function App() {
  const { data: settings } = useSnapshot(settingsStore);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initApp().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cleanup?.();
    };
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
      <div className="w-[320px]  bg-background text-foreground font-sans overflow-hidden">
        <div className="bg-card p-4 space-y-5 shadow-xl border-none">
          <Header />
          <div className="h-px w-full bg-secondary" />
          <MainControls />
          <AISettings />
          <AdvancedSettings />
        </div>
      </div>
    </ErrorBoundary>
  );
}


export default App;
