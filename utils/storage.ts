export interface Settings {
  ollamaUrl: string;
  model: string;
  targetLanguage: string;
  autoTranslate: boolean;
  minTextLength: number;
  batchSize: number;
  enabledDomains: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  model: "qwen2.5:7b",
  targetLanguage: "中文",
  autoTranslate: false,
  minTextLength: 20,
  batchSize: 1,
  enabledDomains: [],
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
