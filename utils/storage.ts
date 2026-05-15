export interface Settings {
  ollamaUrl: string;
  model: string;
  targetLanguage: string;
  autoTranslate: boolean;
  minTextLength: number;
  batchSize: number;
  language: "en" | "zh";
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  model: "qwen2.5:3b",
  targetLanguage: "中文",
  autoTranslate: true,
  minTextLength: 20,
  batchSize: 1,
  language: "zh",
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
