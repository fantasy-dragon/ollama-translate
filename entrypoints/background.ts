import {
  type FetchModelsResponse,
  MessageType,
  sendExtensionMessage,
  type TranslateResponse,
} from "../utils/messaging";
import { buildBatchPrompt, parseBatchResponse } from "../utils/prompts";
import { withRetry } from "../utils/retry";
import {
  filterCached,
  setCachedTranslation,
  translationCache,
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

    if (message.type === MessageType.FETCH_MODELS) {
      handleFetchModels().then(sendResponse);
      return true;
    }
  });
});

async function handleTranslate(texts: string[]): Promise<TranslateResponse> {
  const settings = await getSettings();
  if (!settings.model) {
    return { translations: texts.map(() => "翻译失败: 未选择模型") };
  }

  const startTime = Date.now();
  sendStatus("translating");

  // 1. 检查缓存
  const { uncached, cachedTranslations } = filterCached(texts, settings.model);

  // 如果全部命中缓存，直接返回
  if (uncached.length === 0) {
    const translations = texts.map((_, i) => cachedTranslations.get(i) ?? "");
    sendStatus("idle", Date.now() - startTime);
    return { translations };
  }

  // 2. 批量翻译未缓存的文本
  let batchResults: string[];
  try {
    const prompt = buildBatchPrompt(uncached);
    const data = await ollamaFetch<{ response: string }>("/api/generate", {
      model: settings.model,
      prompt,
      stream: false,
    });
    batchResults = parseBatchResponse(data.response.trim(), uncached.length);
  } catch (error: unknown) {
    sendStatus("idle", Date.now() - startTime);
    return {
      translations: texts.map(
        () => `翻译失败 (网络或服务错误: ${getErrorMessage(error)})`,
      ),
    };
  }

  // 3. 写入缓存
  for (let i = 0; i < uncached.length; i++) {
    setCachedTranslation(uncached[i], settings.model, batchResults[i]);
  }

  // 4. 按原始顺序组装结果
  const translations: string[] = [];
  let uncachedIndex = 0;
  for (let i = 0; i < texts.length; i++) {
    const cached = cachedTranslations.get(i);
    if (cached !== undefined) {
      translations.push(cached);
    } else {
      translations.push(batchResults[uncachedIndex] ?? "");
      uncachedIndex++;
    }
  }

  sendStatus("idle", Date.now() - startTime);
  return { translations };
}

async function handleFetchModels(): Promise<FetchModelsResponse> {
  try {
    const data = await ollamaFetch<{ models: { name: string }[] }>("/api/tags");
    return { models: (data.models || []).map((m) => m.name) };
  } catch (error: unknown) {
    return { models: [], error: getErrorMessage(error) };
  }
}
