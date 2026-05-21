import { useSnapshot } from "valtio";
import { settingsStore, settingsActions } from "../store/settings-store";

export function AISettings() {
  const { data: settings } = useSnapshot(settingsStore);

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
    </div>
  );
}
