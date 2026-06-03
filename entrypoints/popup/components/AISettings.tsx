import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";
import {
  MessageType,
  type TestConnectionResponse,
  sendExtensionMessage,
} from "../../../utils/messaging";

export function AISettings() {
  const { data: settings } = useSnapshot(settingsStore);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(
    null,
  );
  const [models, setModels] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 弹出层打开时自动获取已安装模型
  useEffect(() => {
    fetchModels();
  }, [settings?.ollamaUrl]);

  const fetchModels = async () => {
    if (!settings?.ollamaUrl) return;
    try {
      const result = await sendExtensionMessage(
        MessageType.TEST_CONNECTION,
        {},
      );
      if (result.success && result.models) {
        setModels(result.models);
      }
    } catch {
      // 静默失败，用户可手动点测试连接
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendExtensionMessage(
        MessageType.TEST_CONNECTION,
        {},
      );
      setTestResult(result);
      if (result.success && result.models) {
        setModels(result.models);
      }
    } catch {
      setTestResult({ success: false, error: "无法连接到后台服务" });
    } finally {
      setTesting(false);
    }
  };

  // 当前配置的模型是否在已安装列表中
  const configuredModel = settings?.model ?? "";
  const modelExists =
    !configuredModel || models.includes(configuredModel);
  const shouldShowCustom =
    showCustomInput ||
    (!!configuredModel && !modelExists && models.length > 0);

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__custom__") {
      setShowCustomInput(true);
    } else {
      settingsActions.updateSettings({ model: value });
    }
  };

  return (
    <div className="space-y-4">
      {/* 模型选择 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="model-name"
            className="text-xs font-medium text-muted-foreground"
          >
            AI 模型
          </label>
          {settings?.model && modelExists && (
            <span className="text-[9px] font-bold text-green-500 uppercase">
              已就绪
            </span>
          )}
          {settings?.model && !modelExists && (
            <span className="text-[9px] font-bold text-yellow-500 uppercase">
              未找到
            </span>
          )}
        </div>

        {/* 下拉选择（有模型时） */}
        {models.length > 0 && !shouldShowCustom && (
          <select
            id="model-name"
            value={modelExists ? configuredModel : models[0]}
            onChange={handleModelSelect}
            className="w-full px-3 py-2 bg-secondary border-none rounded-lg text-xs hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="__custom__">其他模型...</option>
          </select>
        )}

        {/* 自定义输入（无模型 / 手动切换 / 配置的模型不在列表中） */}
        {(models.length === 0 || shouldShowCustom) && (
          <div className="space-y-1.5">
            {models.length === 0 && !shouldShowCustom && (
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 leading-relaxed">
                Ollama 中暂无模型，请先在终端运行：
                <code className="mx-0.5 px-1 py-0.5 bg-secondary rounded text-[10px] select-all">
                  ollama pull qwen2.5:7b
                </code>
                安装模型后再使用
              </p>
            )}
            <input
              id="model-name"
              type="text"
              value={configuredModel}
              onChange={(e) =>
                settingsActions.updateSettings({ model: e.target.value })
              }
              className="w-full px-3 py-2 bg-secondary border-none rounded-lg text-xs hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="输入模型名称，如 qwen2.5:7b"
            />
          </div>
        )}

        {/* 模型不在列表中的警告 */}
        {!!configuredModel && !modelExists && models.length > 0 && (
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
            ⚠ 此模型未在 Ollama 中找到，请确认已安装
          </p>
        )}
      </div>

      {/* 翻译风格 */}
      <div className="space-y-2">
        <label
          htmlFor="translation-style"
          className="text-xs font-medium text-muted-foreground"
        >
          翻译风格
        </label>
        <select
          id="translation-style"
          value={settings?.translationStyle ?? "standard"}
          onChange={(e) =>
            settingsActions.updateSettings({ translationStyle: e.target.value })
          }
          className="w-full px-3 py-2 bg-secondary border-none rounded-lg text-xs hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="standard">标准翻译</option>
          <option value="academic">学术正式</option>
          <option value="casual">口语自然</option>
          <option value="technical">技术文档</option>
          <option value="literary">文学优美</option>
        </select>
      </div>

      {/* 连接测试 */}
      <button
        type="button"
        onClick={handleTestConnection}
        disabled={testing || !settings?.ollamaUrl}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-secondary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <>
            <span className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            测试中...
          </>
        ) : (
          "测试连接"
        )}
      </button>

      {/* 测试结果 */}
      {testResult && (
        <div
          className={`p-2 rounded-md text-[10px] ${
            testResult.success
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {testResult.success ? (
            <div className="space-y-0.5">
              <p className="font-semibold">✓ 连接成功</p>
              {testResult.models && testResult.models.length > 0 && (
                <p>
                  可用模型: {testResult.models.slice(0, 5).join(", ")}
                  {testResult.models.length > 5
                    ? ` 等${testResult.models.length}个`
                    : ""}
                </p>
              )}
            </div>
          ) : (
            <p>
              <span className="font-semibold">✗ 连接失败</span>:{" "}
              {testResult.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
