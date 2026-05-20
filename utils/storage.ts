export interface Settings {
  ollamaUrl: string;
  model: string;
  autoTranslate: boolean;
  minTextLength: number;
  batchSize: number;
  enabledDomains: string[];
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
  enabledDomains: [],
  textSelector: "p, h1, h2, h3, h4, h5, h6, li, article div",
  excludedTags: "SCRIPT,STYLE,CODE,PRE,NAV,HEADER,FOOTER,BUTTON,INPUT",
};

const STORAGE_KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const settings = stored[STORAGE_KEY];
  return settings
    ? { ...DEFAULT_SETTINGS, ...settings }
    : { ...DEFAULT_SETTINGS };
}

export async function setSettings(update: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await browser.storage.local.set({
    [STORAGE_KEY]: { ...current, ...update },
  });
}
