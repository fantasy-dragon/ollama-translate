import {
  type FetchModelsResponse,
  MessageType,
  type TranslateResponse,
} from "../utils/messaging";
import { getSettings } from "../utils/storage";

function sendStatus(status: "translating" | "idle", latency?: number) {
  browser.runtime
    .sendMessage({ type: MessageType.TRANSLATION_STATUS, status, latency })
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

  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

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

const TRANSLATION_PROMPT = `
你是一位精通科技与通俗文学的顶级英中翻译专家。请将用户输入的英文文本翻译为地道、流畅的中文。
规则：

彻底摆脱"翻译腔"，禁止直译。请根据中文的表达习惯和语序进行润色和意译。

保持专业术语的准确性，科技/行业专有名词如无标准通用翻译，请保留原文或在括号中注明。

严格保留原文的 Markdown 格式、代码块及段落结构。

严禁输出任何多余的寒暄、解释或前言，直接输出翻译后的中文结果。
`;

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

  const translations: string[] = [];

  for (const text of texts) {
    try {
      const data = await ollamaFetch<{ response: string }>("/api/generate", {
        model: settings.model,
        prompt: `${TRANSLATION_PROMPT}\n文本内容: ${text}`,
        stream: false,
      });
      translations.push(data.response.trim());
    } catch (error: unknown) {
      translations.push(`翻译失败 (网络或服务错误: ${getErrorMessage(error)})`);
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
