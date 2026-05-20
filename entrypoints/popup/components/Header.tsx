import { Languages, RefreshCw } from "lucide-react";
import { useSnapshot } from "valtio";
import { popupStore, storeActions } from "../store/popup-store";

export function Header() {
  const { isTranslating, loadingModels } = useSnapshot(popupStore);

  return (
    <header className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary rounded-lg text-primary-foreground shadow-sm">
          <Languages className="w-5 h-5" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight">Ollama 翻译</h1>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-[10px] font-medium border border-border mr-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTranslating ? "bg-primary animate-pulse" : "bg-green-500"
            }`}
          />
          <span className="opacity-70">
            {isTranslating ? "翻译中" : "在线"}
          </span>
        </div>

        <button
          type="button"
          onClick={storeActions.fetchModels}
          className={`p-1.5 hover:bg-secondary rounded-md transition-colors ${
            loadingModels ? "animate-spin" : ""
          }`}
          title="同步状态"
        >
          <RefreshCw className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </header>
  );
}
