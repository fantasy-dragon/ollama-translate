import { Globe, Plus, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";
import { translationStore } from "../store/translation-store";

function DomainListManager() {
  const { data: settings } = useSnapshot(settingsStore);
  const [newDomain, setNewDomain] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  if (!settings) return null;

  const domainList = settings.domainList;

  const handleAdd = () => {
    settingsActions.addDomain(newDomain);
    setNewDomain("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setShowInput(false);
      setNewDomain("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          白名单域名 ({domainList.length})
        </span>
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3 h-3" />
          添加
        </button>
      </div>

      {/* 添加域名输入框 */}
      {showInput && (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="example.com"
            className="flex-1 px-2 py-1 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="p-1 text-primary hover:text-primary/80 transition-colors"
            title="确认添加"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setNewDomain("");
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="取消"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 域名列表 */}
      {domainList.length > 0 ? (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {domainList.map((domain) => (
            <div
              key={domain}
              className="flex items-center justify-between px-2 py-1.5 bg-background rounded-md group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] truncate">{domain}</span>
              </div>
              <button
                type="button"
                onClick={() => settingsActions.removeDomain(domain)}
                className="p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                title="从白名单移除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">
          尚未添加任何域名，所有网站均不会自动翻译
        </p>
      )}
    </div>
  );
}

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

          {/* 域名列表管理 */}
          <div className="pt-2 border-t border-border/50">
            <DomainListManager />
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
