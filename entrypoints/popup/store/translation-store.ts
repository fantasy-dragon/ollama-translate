/**
 * 翻译状态 Store
 *
 * 管理：
 * - 是否正在翻译
 * - 最新一次翻译延迟
 */
import { proxy } from "valtio";
import {
  MessageType,
  type TranslationStatusMessage,
} from "../../../utils/messaging";

// ── State ──

interface TranslationStore {
  isTranslating: boolean;
  latency: number | null;
}

export const translationStore = proxy<TranslationStore>({
  isTranslating: false,
  latency: null,
});

// ── Actions ──

export const translationActions = {
  listen: () => {
    const listener = (message: TranslationStatusMessage) => {
      if (message.type === MessageType.TRANSLATION_STATUS) {
        translationStore.isTranslating = message.status === "translating";
        if (message.latency !== undefined) {
          translationStore.latency = message.latency;
        }
      }
    };
    browser.runtime.onMessage.addListener(listener);
  },
};
