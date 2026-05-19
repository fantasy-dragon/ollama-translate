import type { Settings } from "../../../utils/storage";

interface MainControlsProps {
  t: Record<string, string>;
  settings: Settings;
  currentHostname: string;
  isCurrentSiteEnabled: boolean;
  onToggleCurrentSite: () => void;
  onUpdateSettings: (update: Partial<Settings>) => void;
}

export function MainControls({
  t,
  settings,
  currentHostname,
  isCurrentSiteEnabled,
  onToggleCurrentSite,
  onUpdateSettings,
}: MainControlsProps) {
  return (
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
            onClick={onToggleCurrentSite}
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
              onClick={() => onUpdateSettings({ translationStyle: style })}
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
  );
}
