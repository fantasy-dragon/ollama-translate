import { Settings2 } from "lucide-react";
import { useState } from "react";
import type { Settings } from "../../../utils/storage";

interface AdvancedSettingsProps {
  settings: Settings;
  onUpdateSettings: (update: Partial<Settings>) => void;
}

export function AdvancedSettings({
  settings,
  onUpdateSettings,
}: AdvancedSettingsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 w-full text-left"
      >
        <Settings2
          className={`w-3.5 h-3.5 transition-transform ${
            isAdvancedOpen ? "rotate-90" : ""
          }`}
        />
        高级设置
      </button>

      {isAdvancedOpen && (
        <div className="p-3 bg-secondary/30 border border-border rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
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
            className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-[11px] focus:outline-none"
            placeholder="http://127.0.0.1:11434"
          />
        </div>
      )}
    </div>
  );
}
