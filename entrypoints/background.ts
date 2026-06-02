import {
  type TranslateResponse,
  MessageType,
  sendExtensionMessage,
} from "../utils/messaging";
import { buildTranslatePrompt } from "../utils/prompts";
import { withRetry } from "../utils/retry";
import {
  filterCached,
  setCachedTranslation,
} from "../utils/cache";
import { getSettings } from "../utils/storage";

function sendStatus(status: "translating" | "idle", latency?: number) {
  sendExtensionMessage(MessageType.TRANSLATION_STATUS, { status, latency })
    .catch(() => {});    
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}


async function ollamaFetch<T>(path: string, body?: object): Promise<T> {
  const settings = await getSettings();
  const baseUrl = normalizeUrl(settings.ollamaUrl);
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
        // 网络错误（TypeError）或 5xx 服务端错误可重试
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

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MessageType.TRANSLATE && message.texts) {
      handleTranslate(message.texts).then(sendResponse);
      return true;
    }
  });
});

async function translateOne(text: string, model: string): Promise<string> {
  // 检查缓存
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
    return `翻译失败 (网络或服务错误: ${getErrorMessage(error)})`;
  }
}

async function handleTranslate(texts: string[]): Promise<TranslateResponse> {
  const settings = await getSettings();
  if (!settings.model) {
    return { translations: texts.map(() => "翻译失败: 未选择模型") };
  }

  const startTime = Date.now();
  sendStatus("translating");

  const translations = await Promise.all(
    texts.map((text) => translateOne(text, settings.model)),
  );

  sendStatus("idle", Date.now() - startTime);
  return { translations };
}
