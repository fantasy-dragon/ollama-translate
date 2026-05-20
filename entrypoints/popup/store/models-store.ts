/**
 * 模型列表 Store
 *
 * 管理：
 * - Ollama 可用模型列表
 * - 加载状态 & 错误信息
 */
import { proxy } from "valtio";
import { MessageType } from "../../../utils/messaging";

// ── State ──

interface ModelsStore {
  list: readonly string[];
  loading: boolean;
  error: string | null;
}

export const modelsStore = proxy<ModelsStore>({
  list: [],
  loading: false,
  error: null,
});

// ── Actions ──

export const modelsActions = {
  fetch: async () => {
    modelsStore.loading = true;
    modelsStore.error = null;
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.FETCH_MODELS,
      });
      if (response?.error) {
        modelsStore.error = response.error;
        modelsStore.list = [];
      } else if (response?.models) {
        modelsStore.list = response.models;
      }
    } catch (error: unknown) {
      modelsStore.error =
        error instanceof Error ? error.message : String(error);
    } finally {
      modelsStore.loading = false;
    }
  },
};
