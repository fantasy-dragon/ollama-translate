import { List, Shield } from "lucide-react";
import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";
import type { ListMode } from "../../../utils/storage";

const LIST_MODE_LABELS: Record<ListMode, { label: string; desc: string }> = {
  whitelist: { label: "白名单", desc: "仅翻译列表中的网站" },
  blacklist: { label: "黑名单", desc: "不翻译列表中的网站" },
};

function ModeToggle() {
  const { data: settings } = useSnapshot(settingsStore);
  if (!settings) return null;

  const mode = settings.listMode;
  const { label, desc } = LIST_MODE_LABELS[mode];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative w-3.5 h-3.5 text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <List className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground/70" />
        </div>
        <div className="space-y-0.5">
          <span className="text-xs font-semibold">列表模式</span>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={settingsActions.toggleListMode}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          mode === "blacklist" ? "bg-destructive" : "bg-primary"
        }`}
        title={`当前: ${label}，点击切换`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
            mode === "blacklist" ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function MainControls() {
  const { data: settings, currentHostname, isCurrentSiteEnabled, isCurrentSiteInList } =
    useSnapshot(settingsStore);

  const mode = settings?.listMode ?? "whitelist";

  return (
    <div className="space-y-4">
      {/* 列表模式切换 */}
      <ModeToggle />

      {/* 当前网站操作 */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="site-translate-toggle"
          className="text-xs font-semibold leading-none cursor-pointer"
        >
          当前网站
        </label>
        <button
          id="site-translate-toggle"
          type="button"
          onClick={settingsActions.toggleCurrentSite}
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
  );
}
