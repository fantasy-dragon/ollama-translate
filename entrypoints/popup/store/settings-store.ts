/**
 * 设置 & 标签页 Store
 *
 * 管理：
 * - 用户设置（ollamaUrl, model, textSelector 等）
 * - 当前标签页 hostname
 * - 派生：当前站点是否在白名单中（启用自动翻译）
 */
import { proxy } from "valtio";
import { type Settings, getSettings, setSettings } from "../../../utils/storage";

// ── 辅助函数 ──

/** 判断 hostname 是否匹配列表中的某个域名（支持子域名匹配） */
function matchDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/** 判断站点是否在白名单中 */
function isSiteInWhitelist(
  hostname: string,
  domainList: readonly string[],
): boolean {
  return domainList.some((d) => matchDomain(hostname, d));
}

// ── State ──
interface SettingsStore {
  data: Settings | null;
  currentHostname: string;
  /** 当前站点是否在白名单中（启用自动翻译） */
  isCurrentSiteEnabled: boolean;
  /** 当前站点是否在 domainList 中 */
  isCurrentSiteInList: boolean;
}

export const settingsStore = proxy<SettingsStore>({
  data: null,
  currentHostname: "",
  get isCurrentSiteEnabled() {
    if (!this.data || !this.currentHostname) return false;
    return isSiteInWhitelist(
      this.currentHostname,
      this.data.domainList,
    );
  },
  get isCurrentSiteInList() {
    if (!this.data || !this.currentHostname) return false;
    return this.data.domainList.some((d: string) =>
      matchDomain(this.currentHostname, d),
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
    const newSettings = { ...settingsStore.data, ...update };
    settingsStore.data = newSettings as Settings;
    await setSettings(update);
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

  /** 将当前站点加入或移出白名单/黑名单（仅影响当前网站） */
  toggleCurrentSite: () => {
    if (!settingsStore.data || !settingsStore.currentHostname) return;
    const { domainList } = settingsStore.data;
    const { currentHostname } = settingsStore;
    const inList = domainList.some((d) => matchDomain(currentHostname, d));

    const newList = inList
      ? domainList.filter((d) => !matchDomain(currentHostname, d))
      : [...domainList, currentHostname];

    settingsActions.updateSettings({ domainList: newList });
  },

  /** 从域名列表中移除指定域名 */
  removeDomain: (domain: string) => {
    if (!settingsStore.data) return;
    const newList = settingsStore.data.domainList.filter(
      (d) => d !== domain,
    );
    settingsActions.updateSettings({ domainList: newList });
  },

  /** 添加域名到列表 */
  addDomain: (domain: string) => {
    if (!settingsStore.data) return;
    const normalized = domain.toLowerCase().trim();
    if (!normalized) return;
    if (settingsStore.data.domainList.includes(normalized)) return;
    settingsActions.updateSettings({
      domainList: [...settingsStore.data.domainList, normalized],
    });
  },
};
