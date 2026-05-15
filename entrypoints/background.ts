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
  console.log("Background script initialized");

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message);

    if (message.type === "TRANSLATE" && message.texts) {
      handleTranslate(message.texts).then(sendResponse);
      return true; // 保持通道开放以进行异步响应
    }

    if (message.type === "FETCH_MODELS") {
      console.log("Handling FETCH_MODELS...");
      handleFetchModels().then((response) => {
        console.log("Sending FETCH_MODELS response:", response);
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
    const prompt = `Translate the following text into ${settings.targetLanguage}. 
Return ONLY the translated text, no explanation, no quotes.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Translation fetch failed:", error);
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
    console.log(response, "response");
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
    console.error("Failed to fetch models:", error);
    return { models: [], error: errorMessage };
  }
}
