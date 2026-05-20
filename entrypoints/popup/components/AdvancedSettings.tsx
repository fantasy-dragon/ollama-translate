import { Settings2 } from "lucide-react";
import { useState } from "react";
import type { Settings } from "../../../utils/storage";

interface AdvancedSettingsProps {
  settings: Settings;
  latency?: number | null;
  onUpdateSettings: (update: Partial<Settings>) => void;
}

export function AdvancedSettings({
  settings,
  latency,
  onUpdateSettings,
}: AdvancedSettingsProps) {
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
        <div className="p-3 bg-secondary/50 border-none rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
          <label
            htmlFor="service-endpoint"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            服务地址
          </label>
          <input
            id="service-endpoint"
            type="text"
            value={settings.ollamaUrl}
            onChange={(e) => onUpdateSettings({ ollamaUrl: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-background border-none rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
            placeholder="http://127.0.0.1:11434"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
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
