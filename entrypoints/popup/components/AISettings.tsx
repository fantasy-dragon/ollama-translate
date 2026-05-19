import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import type { Settings } from "../../../utils/storage";

const COMMON_LANGUAGES = [
  "中文",
  "English",
  "日本語",
  "한국어",
  "Français",
  "Deutsch",
  "Español",
  "Русский",
];

interface AISettingsProps {
  settings: Settings;
  models: string[];
  onUpdateSettings: (update: Partial<Settings>) => void;
}

export function AISettings({
  settings,
  models,
  onUpdateSettings,
}: AISettingsProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangFocus, setIsLangFocus] = useState(false);
  const [langSearch, setLangSearch] = useState("");

  const filteredLangs = COMMON_LANGUAGES.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase()),
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] space-y-4">
      {/* Model Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="model-select-button"
            className="text-xs font-medium text-muted-foreground"
          >
            AI 模型
          </label>
          {settings.model && (
            <span className="text-[9px] font-bold text-green-500 uppercase">
              Ready
            </span>
          )}
        </div>
        <div className="relative">
          <button
            id="model-select-button"
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-background border border-input rounded-lg text-xs hover:bg-accent transition-colors group"
          >
            <span className="truncate max-w-[180px]">
              {settings.model || "选择模型..."}
            </span>
            <ChevronDown
              className={`w-4 h-4 opacity-40 transition-transform group-hover:opacity-100 ${
                isModelDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
              {models.length > 0 ? (
                models.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ model: m });
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-center px-2 py-1.5 text-xs rounded-md transition-colors ${
                      settings.model === m
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    {m}
                  </button>
                ))
              ) : (
                <div className="p-2 text-xs text-muted-foreground italic text-center">
                  未找到模型，请检查 Ollama 是否启动。
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target Language */}
      <div className="space-y-2">
        <label
          htmlFor="language-search-input"
          className="text-xs font-medium text-muted-foreground "
        >
          目标语言
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="language-search-input"
            type="text"
            value={isLangFocus ? langSearch : settings.targetLanguage}
            onChange={(e) => setLangSearch(e.target.value)}
            onFocus={() => {
              setIsLangFocus(true);
              setLangSearch("");
            }}
            onBlur={() => setTimeout(() => setIsLangFocus(false), 200)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="搜索语言..."
          />
          {isLangFocus && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1">
              {filteredLangs.length > 0 ? (
                filteredLangs.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ targetLanguage: l });
                      setIsLangFocus(false);
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left"
                  >
                    {l}
                  </button>
                ))
              ) : (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  无结果
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
