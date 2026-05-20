/**
 * 设置 & 标签页 Store
 *
 * 管理：
 * - 用户设置（ollamaUrl, model, textSelector 等）
 * - 当前标签页 hostname
 * - 派生：当前站点是否启用自动翻译
 */
import { proxy } from "valtio";
import { type Settings, getSettings, setSettings } from "../../../utils/storage";
import { modelsActions } from "./models-store";

// ── State ──

interface SettingsStore {
  data: Settings | null;
  currentHostname: string;
  isCurrentSiteEnabled: boolean;
}

export const settingsStore = proxy<SettingsStore>({
  data: null,
  currentHostname: "",
  get isCurrentSiteEnabled() {
    if (!this.data || !this.currentHostname) return false;
    return (this.data.enabledDomains as readonly string[]).some(
      (d: string) =>
        this.currentHostname === d ||
        this.currentHostname.endsWith(`.${d}`),
    );
  },
});

// ── Actions ──

export const settingsActions = {
  loadSettings: async () => {
    const s = await getSettings();
    // 兼容旧的 localhost 配置
    if (s.ollamaUrl === "http://localhost:11434") {
      const updated = { ...s, ollamaUrl: "http://127.0.0.1:11434" };
      setSettings({ ollamaUrl: "http://127.0.0.1:11434" });
      settingsStore.data = updated;
    } else {
      settingsStore.data = s;
    }
  },

  updateSettings: async (update: Partial<Settings>) => {
    if (!settingsStore.data) return;
    const prevUrl = settingsStore.data.ollamaUrl;
    const newSettings = { ...settingsStore.data, ...update };
    settingsStore.data = newSettings as Settings;
    await setSettings(update);

    // Ollama 地址变化时重新拉取模型列表
    if (update.ollamaUrl && update.ollamaUrl !== prevUrl) {
      modelsActions.fetch();
    }
  },

  queryCurrentTab: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        settingsStore.currentHostname = new URL(
          tab.url,
        ).hostname.toLowerCase();
      }
    } catch (e) {
      console.error("获取当前标签页失败", e);
    }
  },

  toggleCurrentSite: () => {
    if (!settingsStore.data || !settingsStore.currentHostname) return;
    const { enabledDomains } = settingsStore.data;
    const { currentHostname } = settingsStore;
    const isEnabled = enabledDomains.some(
      (d: string) =>
        currentHostname === d || currentHostname.endsWith(`.${d}`),
    );

    const newDomains = isEnabled
      ? enabledDomains.filter(
          (d: string) =>
            !(currentHostname === d || currentHostname.endsWith(`.${d}`)),
        )
      : [...enabledDomains, currentHostname];

    settingsActions.updateSettings({ enabledDomains: newDomains });
  },
};
