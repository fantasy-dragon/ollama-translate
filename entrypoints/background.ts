import {
  type FetchModelsResponse,
  MessageType,
  type TranslateResponse,
} from "../utils/messaging";
import { getSettings } from "../utils/storage";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageType.TRANSLATE && message.texts) {
      handleTranslate(message.texts).then(sendResponse);
      return true; // 保持通道开放以进行异步响应
    }

    if (message.type === MessageType.FETCH_MODELS) {
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

  const startTime = Date.now();
  // Notify popup that translation has started
  browser.runtime
    .sendMessage({
      type: MessageType.TRANSLATION_STATUS,
      status: "translating",
    })
    .catch(() => {});

  const translations: string[] = [];
  const baseUrl = settings.ollamaUrl.replace(/\/$/, "");

  for (const text of texts) {
    const prompt = `
    你是一位精通科技与通俗文学的顶级英中翻译专家。请将用户输入的英文文本翻译为地道、流畅的中文。
    规则：

    彻底摆脱“翻译腔”，禁止直译。请根据中文的表达习惯和语序进行润色和意译。

    保持专业术语的准确性，科技/行业专有名词如无标准通用翻译，请保留原文或在括号中注明。

    严格保留原文的 Markdown 格式、代码块及段落结构。

    严禁输出任何多余的寒暄、解释或前言，直接输出翻译后的中文结果。
    
    文本内容: ${text}`;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        body: JSON.stringify({
          model: settings.model,
          prompt: prompt,
          stream: false,
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
      translations.push(data.response.trim());
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      translations.push(`翻译失败 (网络或服务错误: ${errorMessage})`);
    }
  }

  // Notify popup that translation has finished with latency
  const duration = Date.now() - startTime;
  browser.runtime
    .sendMessage({
      type: MessageType.TRANSLATION_STATUS,
      status: "idle",
      latency: duration,
    })
    .catch(() => {});
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
