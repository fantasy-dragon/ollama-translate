export enum MessageType {
  TRANSLATE = "TRANSLATE",
  TRANSLATION_STATUS = "TRANSLATION_STATUS",
  TEST_CONNECTION = "TEST_CONNECTION",
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

/** 翻译状态消息（background → popup） */
export interface TranslationStatusMessage {
  type: MessageType.TRANSLATION_STATUS;
  status: "translating" | "idle";
  latency?: number;
  /** 正在翻译的文本数量（仅 translating 状态） */
  progress?: string;
}

/** 连接测试请求 */
export interface TestConnectionRequest {
  type: MessageType.TEST_CONNECTION;
}

/** 连接测试响应 */
export interface TestConnectionResponse {
  success: boolean;
  models?: string[];
  error?: string;
}

/** 所有可能的消息类型联合 */
export type ExtensionMessage =
  | TranslateRequest
  | TranslationStatusMessage
  | TestConnectionRequest;

/**
 * 运行时消息发送的响应类型映射
 * 用于类型安全的 browser.runtime.sendMessage
 */
export interface MessageResponseMap {
  [MessageType.TRANSLATE]: TranslateResponse;
  [MessageType.TRANSLATION_STATUS]: undefined;
  [MessageType.TEST_CONNECTION]: TestConnectionResponse;
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
