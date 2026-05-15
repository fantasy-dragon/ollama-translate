import { getSettings } from "../utils/storage";

export interface TranslateRequest {
  type: "TRANSLATE";
  texts: string[];
}

export interface TranslateResponse {
  translations: string[];
}

export interface FetchModelsRequest {
  type: "FETCH_MODELS";
}

export interface FetchModelsResponse {
  models: string[];
  error?: string;
}

export default defineBackground(() => {


  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {


    if (message.type === "TRANSLATE" && message.texts) {
      handleTranslate(message.texts).then(sendResponse);
      return true; // 保持通道开放以进行异步响应
    }

    if (message.type === "FETCH_MODELS") {

      handleFetchModels().then((response) => {

        sendResponse(response);
      });
      return true; // 保持通道开放
    }
  });
});

async function handleTranslate(texts: string[]): Promise<TranslateResponse> {
  const settings = await getSettings();
  if (!settings.model) {
    return { translations: texts.map(() => "翻译失败: 未选择模型") };
  }

  const translations: string[] = [];
  const baseUrl = settings.ollamaUrl.replace(/\/$/, "");

  // 逐条翻译，不再合并请求
  for (const text of texts) {
    const prompt = `You are a professional translator. Translate the following text into ${settings.targetLanguage}.
CRITICAL REQUIREMENTS:
- If the target language is "中文" or "Chinese", you MUST use Simplified Chinese (简体中文). Do NOT use Traditional Chinese (繁体中文).
- Return ONLY the final translated text. No explanations, no quotes, no conversational filler.
Text: ${text}`;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        body: JSON.stringify({
          model: settings.model,
          prompt: prompt,
          stream: false,
          // 彻底去掉 format: "json"，让模型直接返回纯文本
        }),
      });

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(`Ollama 错误 (${response.status}): ${errorMsg}`);
      }

      const data = await response.json();
      // 直接使用返回的 response 字符串，不再尝试解析 JSON
      translations.push(data.response.trim());
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      translations.push(`翻译失败 (网络或服务错误: ${errorMessage})`);
    }
  }

  return { translations };
}

async function handleFetchModels(): Promise<FetchModelsResponse> {
  try {
    const settings = await getSettings();
    const baseUrl = settings.ollamaUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error(
        `Ollama 响应异常: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    const models = (data.models || []).map((m: { name: string }) => m.name);
    return { models };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return { models: [], error: errorMessage };
  }
}
