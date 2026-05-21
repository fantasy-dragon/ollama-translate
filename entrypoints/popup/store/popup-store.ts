/**
 * Store 主入口
 *
 * 组合各领域 Store，提供应用初始化逻辑。
 * 各组件应直接按需导入具体的领域 Store。
 */
import { settingsStore, settingsActions } from "./settings-store";
import { translationActions } from "./translation-store";
import { modelsActions } from "./models-store";


// 重新导出，方便组件统一引入
export { settingsStore, settingsActions } from "./settings-store";
export { translationStore, translationActions } from "./translation-store";
export { modelsStore, modelsActions } from "./models-store";

/**
 * 应用初始化：加载设置 → 查询当前标签页 → 监听翻译状态 → 拉取模型
 */
export async function initApp(): Promise<void> {
  await settingsActions.loadSettings();
  await settingsActions.queryCurrentTab();
  translationActions.listen();

  if (settingsStore.data?.ollamaUrl) {
    await modelsActions.fetch();
  }
}
