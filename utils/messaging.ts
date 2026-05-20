export enum MessageType {
  TRANSLATE = "TRANSLATE",
  FETCH_MODELS = "FETCH_MODELS",
  TRANSLATION_STATUS = "TRANSLATION_STATUS",
}

/** 翻译请求 */
export interface TranslateRequest {
  type: MessageType.TRANSLATE;
  texts: string[];
}

/** 翻译响应 */
export interface TranslateResponse {
  translations: string[];
}

/** 获取模型列表请求 */
export interface FetchModelsRequest {
  type: MessageType.FETCH_MODELS;
}

/** 获取模型列表响应 */
export interface FetchModelsResponse {
  models: string[];
  error?: string;
}

/** 翻译状态消息（background → popup） */
export interface TranslationStatusMessage {
  type: MessageType.TRANSLATION_STATUS;
  status: "translating" | "idle";
  latency?: number;
}

/** 所有可能的消息类型联合 */
export type ExtensionMessage =
  | TranslateRequest
  | FetchModelsRequest
  | TranslationStatusMessage;

/**
 * 运行时消息发送的响应类型映射
 * 用于类型安全的 browser.runtime.sendMessage
 */
export interface MessageResponseMap {
  [MessageType.TRANSLATE]: TranslateResponse;
  [MessageType.FETCH_MODELS]: FetchModelsResponse;
  [MessageType.TRANSLATION_STATUS]: undefined;
}

/**
 * 类型安全的 sendMessage 封装
 */
export async function sendExtensionMessage<T extends MessageType>(
  type: T,
  payload?: Omit<
    Extract<ExtensionMessage, { type: T }>,
    "type"
  >,
): Promise<MessageResponseMap[T]> {
  return browser.runtime.sendMessage({ type, ...payload });
}
