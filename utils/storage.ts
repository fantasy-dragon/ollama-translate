export interface Settings {
  ollamaUrl: string;
  model: string;
  targetLanguage: string;
  autoTranslate: boolean;
  minTextLength: number;
  batchSize: number;
  language: "en" | "zh";
  translationStyle: "academic" | "casual" | "format";
  enabledDomains: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  model: "qwen2.5:7b",
  targetLanguage: "中文",
  autoTranslate: false,
  minTextLength: 20,
  batchSize: 1,
  language: "zh",
  translationStyle: "format",
  enabledDomains: [],
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get("settings");
  const settings = stored.settings || {};
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function setSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await browser.storage.local.set({
    settings: { ...current, ...settings },
  });
}
