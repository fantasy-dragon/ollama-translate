import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

function ModelSelector({
  models,
  selectedModel,
  onSelect,
}: {
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const modelButtonId = "model-select-button";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={modelButtonId}
          className="text-xs font-medium text-muted-foreground"
        >
          AI 模型
        </label>
        {selectedModel && (
          <span className="text-[9px] font-bold text-green-500 uppercase">
            已就绪
          </span>
        )}
      </div>
      <div className="relative">
        <button
          id={modelButtonId}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-secondary border-none rounded-lg text-xs hover:brightness-110 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span className="truncate max-w-[180px]">
            {selectedModel || "选择模型..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 opacity-40 transition-transform group-hover:opacity-100 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-secondary border-none rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
            {models.length > 0 ? (
              models.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onSelect(m);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-2 py-1.5 text-xs rounded-md transition-colors ${
                    selectedModel === m
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
  );
}

function LanguageSelector({
  targetLanguage,
  onSelect,
}: {
  targetLanguage: string;
  onSelect: (lang: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputId = "language-search-input";

  const filteredLangs = useMemo(
    () =>
      COMMON_LANGUAGES.filter((l) =>
        l.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setSearch("");
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 200);
  }, []);

  const handleSelect = useCallback(
    (lang: string) => {
      onSelect(lang);
      setIsFocused(false);
    },
    [onSelect],
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor={searchInputId}
        className="text-xs font-medium text-muted-foreground"
      >
        目标语言
      </label>
      <div className="relative group">
        <input
          id={searchInputId}
          type="text"
          value={isFocused ? search : targetLanguage}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full pl-3 pr-9 py-2 bg-secondary border-none rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="搜索语言..."
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity pointer-events-none">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        {isFocused && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-secondary border-none rounded-lg shadow-xl z-50 max-h-[160px] overflow-y-auto p-1">
            {filteredLangs.length > 0 ? (
              filteredLangs.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleSelect(l)}
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
  );
}

export function AISettings({
  settings,
  models,
  onUpdateSettings,
}: AISettingsProps) {
  return (
    <div className="space-y-4">
      <ModelSelector
        models={models}
        selectedModel={settings.model}
        onSelect={(model) => onUpdateSettings({ model })}
      />
      <LanguageSelector
        targetLanguage={settings.targetLanguage}
        onSelect={(lang) => onUpdateSettings({ targetLanguage: lang })}
      />
    </div>
  );
}
