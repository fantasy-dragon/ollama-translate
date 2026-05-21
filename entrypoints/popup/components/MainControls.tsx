import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";

export function MainControls() {
  const { data: settings, currentHostname, isCurrentSiteEnabled } =
    useSnapshot(settingsStore);

  return (
    <div className="space-y-4">
      {/* 翻译当前页面 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label
            htmlFor="site-translate-toggle"
            className="text-xs font-semibold leading-none cursor-pointer"
          >
            翻译当前页面
          </label>
          <p className="text-[10px] text-muted-foreground">
            {isCurrentSiteEnabled ? "已加入白名单，自动翻译" : "点击开启将加入白名单"}
          </p>
        </div>
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
