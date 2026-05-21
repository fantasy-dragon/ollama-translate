import { Languages } from "lucide-react";
import { useSnapshot } from "valtio";
import { translationStore } from "../store/translation-store";

export function Header() {
  const { isTranslating } = useSnapshot(translationStore);

  return (
    <header className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary rounded-lg text-primary-foreground shadow-sm">
          <Languages className="w-5 h-5" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight">Ollama 翻译</h1>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-[10px] font-medium border border-border">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTranslating ? "bg-primary animate-pulse" : "bg-green-500"
            }`}
          />
          <span className="opacity-70">
            {isTranslating ? "翻译中" : "在线"}
          </span>
        </div>
      </div>
    </header>
  );
}


