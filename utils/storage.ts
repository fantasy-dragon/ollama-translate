export type DisplayMode = "bilingual" | "translation-only" | "original-only";

export const DISPLAY_MODES: readonly DisplayMode[] = [
  "bilingual",
  "translation-only",
  "original-only",
];

export interface Settings {
  ollamaUrl: string;
  model: string;
  minTextLength: number;
  /** 白名单域名列表：仅翻译列表中的域名 */
  domainList: readonly string[];
  /** 显示模式 */
  displayMode: DisplayMode;
  /** CSS 选择器，用于匹配需要翻译的文本元素 */
  textSelector: string;
  /** 需要排除的标签名（逗号分隔） */
  excludedTags: string;
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  model: "qwen2.5:7b",
  minTextLength: 20,
  domainList: [],
  displayMode: "bilingual",
  textSelector: "p, h1, h2, h3, h4, h5, h6, li, article div",
  excludedTags: "SCRIPT,STYLE,CODE,PRE,NAV,HEADER,FOOTER,BUTTON,INPUT",
};

const STORAGE_KEY = "settings";
const DEBOUNCE_MS = 300;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUpdate: Partial<Settings> | null = null;

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const settings = stored[STORAGE_KEY];
  if (settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    // 向后兼容：旧版本使用 enabledDomains，迁移到 domainList
    if (!merged.domainList || merged.domainList.length === 0) {
      const legacy = settings as { enabledDomains?: string[] };
      if (legacy.enabledDomains && legacy.enabledDomains.length > 0) {
        merged.domainList = [...legacy.enabledDomains];
      }
    }
    return merged;
  }
  return { ...DEFAULT_SETTINGS };
}

export async function setSettings(update: Partial<Settings>): Promise<void> {
  // 合并待写入的更新，debounce 避免高频写入
  pendingUpdate = { ...pendingUpdate, ...update };

  if (debounceTimer) return; // 已有定时器在等待，合并后由它统一写入

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      const merged = pendingUpdate ?? {};
      pendingUpdate = null;

      const current = await getSettings();
      await browser.storage.local.set({
        [STORAGE_KEY]: { ...current, ...merged },
      });
      resolve();
    }, DEBOUNCE_MS);
  });
}
