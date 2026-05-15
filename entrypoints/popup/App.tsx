import { useEffect, useState } from "react";
import { type Settings, getSettings, setSettings } from "../../utils/storage";
import "./style.css";

function App() {
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setLocalSettings(s);
      // 如果存储中还是 localhost，静默更新为 127.0.0.1 提高兼容性
      if (s.ollamaUrl === "http://localhost:11434") {
        handleUpdate({ ollamaUrl: "http://127.0.0.1:11434" });
      }
    });
  }, []);

  useEffect(() => {
    if (settings?.ollamaUrl) {
      fetchModels();
    }
  }, [settings?.ollamaUrl]);

  const fetchModels = async () => {
    console.log("fetchModels called in popup");
    setLoadingModels(true);
    setFetchError(null);
    try {
      const response = await browser.runtime.sendMessage({
        type: "FETCH_MODELS",
      });
      if (response?.error) {
        setFetchError(response.error);
        setModels([]);
      } else if (response?.models) {
        setModels(response.models);
      }
    } catch (error: unknown) {
      console.error("Popup: Failed to fetch models", error);
      const message = error instanceof Error ? error.message : String(error);
      setFetchError(message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleUpdate = async (update: Partial<Settings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...update };
    setLocalSettings(newSettings);
    await setSettings(update);
  };

  if (!settings) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="w-[380px] bg-slate-900 text-slate-100 font-sans p-6 shadow-2xl border border-slate-800 rounded-lg">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Ollama 翻译
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
              本地 AI 沉浸式阅读
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.autoTranslate}
            onChange={(e) => handleUpdate({ autoTranslate: e.target.checked })}
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </header>

      <div className="space-y-6">
        {/* Ollama URL */}
        <div className="space-y-2">
          <label htmlFor="ollama-url" className="text-sm font-semibold text-slate-400 ml-1">
            服务地址
          </label>
          <div className="relative">
            <input
              id="ollama-url"
              type="text"
              value={settings.ollamaUrl}
              onChange={(e) => handleUpdate({ ollamaUrl: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder-slate-600"
              placeholder="http://127.0.0.1:11434"
            />
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label htmlFor="model-select" className="text-sm font-semibold text-slate-400 ml-1">
            语言模型
          </label>
          <div className="relative">
            <select
              id="model-select"
              value={settings.model}
              onChange={(e) => handleUpdate({ model: e.target.value })}
              className="w-full appearance-none bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            >
              <option value="">选择模型...</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              {loadingModels ? (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          </div>
          {(fetchError || (models.length === 0 && !loadingModels)) && (
            <div className="mt-2 space-y-2">
              <p className="text-[10px] text-amber-500 ml-1 flex items-start gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mt-0.5 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {fetchError ? `连接失败: ${fetchError}` : "未检测到本地模型，请确保 Ollama 已运行并下载了模型"}
                </span>
              </p>
              {fetchError && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[9px] text-amber-200/80 leading-relaxed">
                  提示: 如果 Ollama 已运行但仍报错，请尝试设置环境变量 
                  <code className="bg-slate-800 px-1 rounded text-white mx-1">OLLAMA_ORIGINS="*"</code> 
                  并重启 Ollama。
                </div>
              )}
            </div>
          )}
        </div>

        {/* Target Language */}
        <div className="space-y-2">
          <label htmlFor="target-lang" className="text-sm font-semibold text-slate-400 ml-1">
            目标语言
          </label>
          <input
            id="target-lang"
            type="text"
            value={settings.targetLanguage}
            onChange={(e) => handleUpdate({ targetLanguage: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="例如：中文, English, 日本語"
          />
        </div>
      </div>

      <footer className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500 font-medium">
        <span>Powered by Ollama</span>
        <button
          type="button"
          onClick={fetchModels}
          className="hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 ${loadingModels ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          刷新状态
        </button>
      </footer>
    </div>
  );
}

export default App;
