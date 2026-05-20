/**
 * Valtio 统一状态管理 Store
 *
 * 集中管理 popup 的所有状态和副作用，
 * 替代分散的 useState + useEffect 模式。
 */
import { proxy } from "valtio";
import {
  MessageType,
  type TranslationStatusMessage,
} from "../../../utils/messaging";
import { type Settings, getSettings, setSettings } from "../../../utils/storage";

interface PopupStore {
  // ── 设置 ──
  settings: Settings | null;

  // ── 翻译状态 ──
  isTranslating: boolean;
  latency: number | null;

  // ── 当前标签页 ──
  currentHostname: string;

  // ── 模型列表 ──
  models: string[];
  loadingModels: boolean;
  fetchError: string | null;

  // ── 派生的计算属性 ──
  /** 当前站点是否已启用自动翻译 */
  isCurrentSiteEnabled: boolean;
}

// ── Store 实例（先创建，actions 中引用） ──

export const popupStore = proxy<PopupStore>({
  settings: null,
  isTranslating: false,
  latency: null,
  currentHostname: "",
  models: [],
  loadingModels: false,
  fetchError: null,
  get isCurrentSiteEnabled() {
    if (!this.settings || !this.currentHostname) return false;
    return (this.settings.enabledDomains as string[]).some(
      (d: string) =>
        this.currentHostname === d ||
        this.currentHostname.endsWith(`.${d}`),
    );
  },
});

// ── Actions（操作 store 的函数集合） ──

export const storeActions = {
  init: async () => {
    await storeActions.loadSettings();
    await storeActions.queryCurrentTab();
    storeActions.listenTranslationStatus();
    if (popupStore.settings?.ollamaUrl) {
      await storeActions.fetchModels();
    }
  },

  loadSettings: async () => {
    const s = await getSettings();
    // 兼容旧的 localhost 配置
    if (s.ollamaUrl === "http://localhost:11434") {
      const updated = { ...s, ollamaUrl: "http://127.0.0.1:11434" };
      setSettings({ ollamaUrl: "http://127.0.0.1:11434" });
      popupStore.settings = updated;
    } else {
      popupStore.settings = s;
    }
  },

  queryCurrentTab: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        popupStore.currentHostname = new URL(tab.url).hostname.toLowerCase();
      }
    } catch (e) {
      console.error("获取当前标签页失败", e);
    }
  },

  listenTranslationStatus: () => {
    const listener = (message: TranslationStatusMessage) => {
      if (message.type === MessageType.TRANSLATION_STATUS) {
        popupStore.isTranslating = message.status === "translating";
        if (message.latency !== undefined) {
          popupStore.latency = message.latency;
        }
      }
    };
    browser.runtime.onMessage.addListener(listener);
  },

  updateSettings: async (update: Partial<Settings>) => {
    if (!popupStore.settings) return;
    const prevUrl = popupStore.settings.ollamaUrl;
    const newSettings = { ...popupStore.settings, ...update };
    popupStore.settings = newSettings as Settings;
    await setSettings(update);

    // 如果 Ollama 地址变了，重新拉取模型列表
    if (update.ollamaUrl && update.ollamaUrl !== prevUrl) {
      await storeActions.fetchModels();
    }
  },

  fetchModels: async () => {
    popupStore.loadingModels = true;
    popupStore.fetchError = null;
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.FETCH_MODELS,
      });
      if (response?.error) {
        popupStore.fetchError = response.error;
        popupStore.models = [];
      } else if (response?.models) {
        popupStore.models = response.models;
      }
    } catch (error: unknown) {
      popupStore.fetchError =
        error instanceof Error ? error.message : String(error);
    } finally {
      popupStore.loadingModels = false;
    }
  },

  toggleCurrentSite: () => {
    if (!popupStore.settings || !popupStore.currentHostname) return;
    const { enabledDomains } = popupStore.settings;
    const { currentHostname } = popupStore;
    const isEnabled = enabledDomains.some(
      (d: string) => currentHostname === d || currentHostname.endsWith(`.${d}`),
    );

    const newDomains = isEnabled
      ? enabledDomains.filter(
          (d: string) =>
            !(currentHostname === d || currentHostname.endsWith(`.${d}`)),
        )
      : [...enabledDomains, currentHostname];

    storeActions.updateSettings({ enabledDomains: newDomains });
  },
};
