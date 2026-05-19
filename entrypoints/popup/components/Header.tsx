import { Languages, RefreshCw } from "lucide-react";

interface HeaderProps {
  t: Record<string, string>;
  isTranslating: boolean;
  loadingModels: boolean;
  onFetchModels: () => void;
}

export function Header({
  t,
  isTranslating,
  loadingModels,
  onFetchModels,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary rounded-lg text-primary-foreground shadow-sm">
          <Languages className="w-5 h-5" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight">{t.title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-[10px] font-medium border border-border mr-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTranslating ? "bg-primary animate-pulse" : "bg-green-500"
            }`}
          />
          <span className="opacity-70">
            {isTranslating ? t.statusTranslating : t.statusOnline}
          </span>
        </div>

        <button
          type="button"
          onClick={onFetchModels}
          className={`p-1.5 hover:bg-secondary rounded-md transition-colors ${
            loadingModels ? "animate-spin" : ""
          }`}
          title={t.syncStatus}
        >
          <RefreshCw className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </header>
  );
}
