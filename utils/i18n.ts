export const translations = {
  en: {
    title: "Ollama Translate",
    subtitle: "Modern, minimalist translation powered by AI.",
    statusOnline: "Online",
    autoMode: "Auto Mode",
    aiModel: "AI Model",
    selectModel: "Select...",
    targetLanguage: "Target Language",
    targetLanguagePlaceholder: "e.g. Chinese",
    serviceEndpoint: "Service Endpoint",
    serviceEndpointPlaceholder: "http://localhost:11434",
    syncStatus: "Sync Status",
    syncing: "Syncing...",
    noModelsFound: "No models found. Check Ollama.",
    language: "Language",
    zh: "Chinese",
    en: "English",
  },
  zh: {
    title: "Ollama 翻译",
    subtitle: "基于 AI 的现代极简翻译工具。",
    statusOnline: "在线",
    autoMode: "自动模式",
    aiModel: "AI 模型",
    selectModel: "选择模型...",
    targetLanguage: "目标语言",
    targetLanguagePlaceholder: "例如：中文",
    serviceEndpoint: "服务地址",
    serviceEndpointPlaceholder: "http://localhost:11434",
    syncStatus: "同步状态",
    syncing: "同步中...",
    noModelsFound: "未找到模型，请检查 Ollama 是否启动。",
    language: "界面语言",
    zh: "中文",
    en: "英文",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof translations["en"];

export const getTranslation = (lang: Language) => {
  return translations[lang] || translations.en;
};
