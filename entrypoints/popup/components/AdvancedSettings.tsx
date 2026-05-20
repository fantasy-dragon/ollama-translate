import { Settings2 } from "lucide-react";
import { useState } from "react";
import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";
import { translationStore } from "../store/translation-store";

export function AdvancedSettings() {
  const { data: settings } = useSnapshot(settingsStore);
  const { latency } = useSnapshot(translationStore);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const latencySeconds = latency != null ? (latency / 1000).toFixed(1) : null;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors py-1">
          <Settings2
            className={`w-3.5 h-3.5 transition-transform ${
              isAdvancedOpen ? "rotate-90" : ""
            }`}
          />
          高级设置
        </div>
        {latencySeconds && (
          <span className="text-[10px] text-muted-foreground/80">
            延迟: {latencySeconds}s
          </span>
        )}
      </button>

      {isAdvancedOpen && (
        <div className="p-3 bg-secondary/50 border-none rounded-lg space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* 服务地址 */}
          <div className="space-y-1">
            <label
              htmlFor="service-endpoint"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              服务地址
            </label>
            <input
              id="service-endpoint"
              type="text"
              value={settings?.ollamaUrl ?? ""}
              onChange={(e) => settingsActions.updateSettings({ ollamaUrl: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="http://127.0.0.1:11434"
            />
          </div>

          {/* 最小文本长度 */}
          <div className="space-y-1">
            <label
              htmlFor="min-text-length"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              最小文本长度
            </label>
            <input
              id="min-text-length"
              type="number"
              min={1}
              max={500}
              value={settings?.minTextLength ?? 20}
              onChange={(e) =>
                settingsActions.updateSettings({
                  minTextLength: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                })
              }
              className="w-full px-2.5 py-1.5 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* CSS 选择器 */}
          <div className="space-y-1">
            <label
              htmlFor="text-selector"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              元素选择器
            </label>
            <input
              id="text-selector"
              type="text"
              value={settings?.textSelector ?? ""}
              onChange={(e) =>
                settingsActions.updateSettings({ textSelector: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="p, h1, h2, h3, h4, h5, h6, li"
            />
          </div>

          {/* 排除标签 */}
          <div className="space-y-1">
            <label
              htmlFor="excluded-tags"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              排除标签（逗号分隔）
            </label>
            <input
              id="excluded-tags"
              type="text"
              value={settings?.excludedTags ?? ""}
              onChange={(e) =>
                settingsActions.updateSettings({ excludedTags: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="SCRIPT,STYLE,CODE"
            />
          </div>

          {/* 延迟信息 */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[10px] font-semibold text-muted-foreground">
              具体延迟
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {latency ? `${latency}ms` : "--"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
