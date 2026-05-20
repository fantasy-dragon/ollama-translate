export type ListMode = "whitelist" | "blacklist";

export interface Settings {
  ollamaUrl: string;
  model: string;
  autoTranslate: boolean;
  minTextLength: number;
  batchSize: number;
  /** 域名列表模式：whitelist（仅翻译列表中的域名）| blacklist（不翻译列表中的域名） */
  listMode: ListMode;
  /** 域名列表（根据 listMode 决定是白名单还是黑名单） */
  domainList: readonly string[];
  /** 已启用自动翻译的域名列表（兼容旧版，映射到 domainList） */
  enabledDomains: readonly string[];
  /** CSS 选择器，用于匹配需要翻译的文本元素 */
  textSelector: string;
  /** 需要排除的标签名（逗号分隔） */
  excludedTags: string;
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  model: "qwen2.5:7b",
  autoTranslate: false,
  minTextLength: 20,
  batchSize: 1,
  listMode: "whitelist",
  domainList: [],
  enabledDomains: [],
  textSelector: "p, h1, h2, h3, h4, h5, h6, li, article div",
  excludedTags: "SCRIPT,STYLE,CODE,PRE,NAV,HEADER,FOOTER,BUTTON,INPUT",
};

const STORAGE_KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const settings = stored[STORAGE_KEY];
  if (settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    // 向后兼容：旧版本只有 enabledDomains，同步到 domainList
    if (!merged.domainList || merged.domainList.length === 0) {
      if (merged.enabledDomains && merged.enabledDomains.length > 0) {
        merged.domainList = [...merged.enabledDomains];
      }
    }
    // 反过来：确保 enabledDomains 与 domainList 同步
    merged.enabledDomains = [...merged.domainList];
    return merged;
  }
  return { ...DEFAULT_SETTINGS };
}

export async function setSettings(update: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  // 如果更新了 domainList，同步到 enabledDomains
  if (update.domainList) {
    update.enabledDomains = [...update.domainList];
  }
  // 如果更新了 enabledDomains，同步到 domainList
  if (update.enabledDomains) {
    update.domainList = [...update.enabledDomains];
  }
  await browser.storage.local.set({
    [STORAGE_KEY]: { ...current, ...update },
  });
}
