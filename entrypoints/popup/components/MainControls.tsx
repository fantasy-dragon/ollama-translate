import type { Settings } from "../../../utils/storage";

interface MainControlsProps {
  settings: Settings;
  currentHostname: string;
  isCurrentSiteEnabled: boolean;
  onToggleCurrentSite: () => void;
  onUpdateSettings: (update: Partial<Settings>) => void;
}

export function MainControls({
  settings,
  currentHostname,
  isCurrentSiteEnabled,
  onToggleCurrentSite,
  onUpdateSettings,
}: MainControlsProps) {
  return (
    <div className="space-y-4">
      {/* Auto-Translate Functionality (Merged UI) */}
      <div className="space-y-4">
        {/* 1. Current Site Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label
              htmlFor="site-translate-toggle"
              className="text-xs font-semibold leading-none cursor-pointer"
            >
              当前网站自动翻译
            </label>
            <p className="text-[10px] text-muted-foreground truncate max-w-45">
              对 {currentHostname || "当前域名"} 启用
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
    </div>
  );
}
