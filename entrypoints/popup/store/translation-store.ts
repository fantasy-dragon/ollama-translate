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
  progress: string | null;
}

export const translationStore = proxy<TranslationStore>({
  isTranslating: false,
  latency: null,
  progress: null,
});


// ── Actions ──
export const translationActions = {
  listen: (): (() => void) => {
    const listener = (message: TranslationStatusMessage) => {
      if (message.type === MessageType.TRANSLATION_STATUS) {
        translationStore.isTranslating = message.status === "translating";
        if (message.latency !== undefined) {
          translationStore.latency = message.latency;
        }
        if (message.progress !== undefined) {
          translationStore.progress = message.progress;
        }
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  },
};
