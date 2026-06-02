import { useState } from "react";
import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";
import { MessageType, type TestConnectionResponse, sendExtensionMessage } from "../../../utils/messaging";

export function AISettings() {
  const { data: settings } = useSnapshot(settingsStore);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendExtensionMessage(MessageType.TEST_CONNECTION, {});
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: "无法连接到后台服务" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 模型名称 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="model-name"
            className="text-xs font-medium text-muted-foreground"
          >
            AI 模型
          </label>
          {settings?.model && (
            <span className="text-[9px] font-bold text-green-500 uppercase">
              已就绪
            </span>
          )}
        </div>
        <input
          id="model-name"
          type="text"
          value={settings?.model ?? ""}
          onChange={(e) => settingsActions.updateSettings({ model: e.target.value })}
          className="w-full px-3 py-2 bg-secondary border-none rounded-lg text-xs hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="输入模型名称，如 qwen2.5:7b"
        />
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
              <span className="font-semibold">✗ 连接失败</span>: {testResult.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
