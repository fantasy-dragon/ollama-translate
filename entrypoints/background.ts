import {
  type TestConnectionResponse,
  type TranslateResponse,
  MessageType,
  sendExtensionMessage,
} from "../utils/messaging";
import { buildTranslatePrompt } from "../utils/prompts";
import { withRetry } from "../utils/retry";
import {
  filterCached,
  loadPersistedCache,
  setCachedTranslation,
} from "../utils/cache";
import { type Settings, getSettings, setSettings } from "../utils/storage";

function sendStatus(
  status: "translating" | "idle",
  latency?: number,
  progress?: string,
) {
  sendExtensionMessage(MessageType.TRANSLATION_STATUS, {
    status,
    latency,
    progress,
  }).catch(() => {});
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

async function ollamaFetch<T>(
  path: string,
  body?: object,
  baseUrlOverride?: string,
): Promise<T> {
  let baseUrl: string;
  if (baseUrlOverride) {
    baseUrl = normalizeUrl(baseUrlOverride);
  } else {
    const settings = await getSettings();
    baseUrl = normalizeUrl(settings.ollamaUrl);
  }
  const url = `${baseUrl}${path}`;

  const response = await withRetry(
    () =>
      fetch(url, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    {
      maxRetries: 2,
      baseDelayMs: 1000,
      shouldRetry: (error) => {
        if (error instanceof TypeError) return true;
        if (error instanceof Response) {
          return error.status >= 500;
        }
        return true;
      },
    },
  );

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(`Ollama 错误 (${response.status}): ${errorMsg}`);
  }

  return response.json() as Promise<T>;
}

// ── 域名匹配 ──

function matchDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function isDomainEnabled(settings: Settings, hostname: string): boolean {
  return settings.domainList.some((d) => matchDomain(hostname, d));
}

// ── 翻译逻辑 ──

async function translateOne(text: string, model: string): Promise<string> {
  const cached = filterCached([text], model);
  if (cached.uncached.length === 0) {
    return cached.cachedTranslations.get(0) ?? "";
  }

  try {
    const prompt = buildTranslatePrompt(text);
    const data = await ollamaFetch<{ response: string }>("/api/generate", {
      model,
      prompt,
      stream: false,
    });
    const result = data.response.trim();
    setCachedTranslation(text, model, result);
    return result;
  } catch (error: unknown) {
    console.error(`[Ollama 翻译] 翻译失败: ${getErrorMessage(error)}`);
    return "";
  }
}

async function handleTranslate(texts: string[]): Promise<TranslateResponse> {
  const settings = await getSettings();
  if (!settings.model) {
    return { translations: texts.map(() => "") };
  }

  const startTime = Date.now();
  const batchLabel = `${texts.length}段`;
  sendStatus("translating", undefined, batchLabel);

  const translations = await Promise.all(
    texts.map((text) => translateOne(text, settings.model)),
  );

  sendStatus("idle", Date.now() - startTime);
  return { translations };
}

// ── 连接测试 ──

async function handleTestConnection(
  ollamaUrl?: string,
): Promise<TestConnectionResponse> {
  try {
    const data = await ollamaFetch<{ models?: { name: string }[] }>(
      "/api/tags",
      undefined,
      ollamaUrl,
    );
    const models = (data.models ?? []).map((m) => m.name);
    return { success: true, models };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ── 站点切换 ──

async function toggleCurrentSite(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const hostname = new URL(tab.url).hostname.toLowerCase();
  const settings = await getSettings();
  const inList = settings.domainList.some((d) => matchDomain(hostname, d));

  const newList = inList
    ? settings.domainList.filter((d) => !matchDomain(hostname, d))
    : [...settings.domainList, hostname];

  await setSettings({ domainList: newList });
}

// ── 入口 ──

export default defineBackground(() => {
  // 启动时从 storage 恢复持久化缓存
  loadPersistedCache();

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MessageType.TRANSLATE && message.texts) {
      handleTranslate(message.texts).then(sendResponse);
      return true;
    }
    if (message.type === MessageType.TEST_CONNECTION) {
      handleTestConnection().then(sendResponse);
      return true;
    }
  });

  browser.commands.onCommand.addListener((command) => {
    if (command === "toggle-translation") {
      toggleCurrentSite();
    }
  });
});
