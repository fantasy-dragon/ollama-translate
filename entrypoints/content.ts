import "@/assets/content.css";
import { MessageType, sendExtensionMessage } from "../utils/messaging";
import { type Settings, getSettings } from "../utils/storage";
import { getCachedTranslation } from "../utils/cache";

const TRANSLATION_CLASS = "ollama-translation-wrap";
const TRANSLATING_CLASS = "ollama-translating";
const TEXT_ELEMENT_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, article div";
const EXCLUDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "NAV",
  "HEADER",
  "FOOTER",
  "BUTTON",
  "INPUT",
]);
const MUTATION_DEBOUNCE_MS = 500;
const MIN_TEXT_LENGTH = 20;
const LINK_DENSITY_THRESHOLD = 50;

/** 队列处理 debounce 时间（毫秒） */
const QUEUE_DEBOUNCE_MS = 300;

const translatedMap = new WeakMap<HTMLElement, boolean>();

function isTranslated(el: HTMLElement): boolean {
  return (
    translatedMap.has(el) || el.querySelector(`.${TRANSLATION_CLASS}`) !== null
  );
}

function shouldTranslate(el: HTMLElement): boolean {
  const text = el.innerText.trim();
  if (text.length < MIN_TEXT_LENGTH) return false;
  if (EXCLUDED_TAGS.has(el.tagName)) return false;

  const links = el.querySelectorAll("a");
  if (links.length > 3 && text.length / links.length < LINK_DENSITY_THRESHOLD) {
    return false;
  }

  return true;
}

function startObserving(observer: IntersectionObserver) {
  const elements = document.querySelectorAll(TEXT_ELEMENT_SELECTOR);
  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    if (shouldTranslate(htmlEl) && !isTranslated(htmlEl)) {
      observer.observe(htmlEl);
    }
  }
}

function setElementsClass(
  elements: HTMLElement[],
  className: string,
  add: boolean,
) {
  for (const el of elements) {
    el.classList.toggle(className, add);
  }
}

function setTranslationVisibility(visible: boolean) {
  const display = visible ? "block" : "none";
  for (const el of document.querySelectorAll(`.${TRANSLATION_CLASS}`)) {
    (el as HTMLElement).style.display = display;
  }
}

function injectTranslation(el: HTMLElement, translation: string) {
  if (el.querySelector(`.${TRANSLATION_CLASS}`)) return;

  const wrap = document.createElement("div");
  wrap.className = TRANSLATION_CLASS;
  wrap.innerText = translation;
  el.appendChild(wrap);
}

function isDomainEnabled(settings: Settings, hostname: string): boolean {
  return settings.enabledDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

// ── 翻译队列 ──────────────────────────────────────────────

/**
 * 带 debounce 的翻译队列
 * 在短时间内收集待翻译元素，统一批量发送
 */
class TranslationQueue {
  private queue: HTMLElement[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;
  private modelCache = new Map<string, string>();

  /** 更新模型缓存（从 background 获取的翻译结果） */
  updateModelCache(text: string, translation: string): void {
    this.modelCache.set(text, translation);
  }

  enqueue(elements: HTMLElement[]): void {
    // 去重：只添加未在队列中的元素
    for (const el of elements) {
      if (!this.queue.includes(el)) {
        this.queue.push(el);
      }
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), QUEUE_DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const batch = this.queue.splice(0);
    this.timer = null;

    // 先检查本地缓存
    const toTranslate: HTMLElement[] = [];
    const texts: string[] = [];
    const localResults = new Map<number, string>();

    for (let i = 0; i < batch.length; i++) {
      const el = batch[i];
      const text = el.innerText.trim();
      // 检查运行时的 modelCache
      const cached = this.modelCache.get(text);
      if (cached) {
        localResults.set(i, cached);
      } else {
        toTranslate.push(el);
        texts.push(text);
      }
    }

    // 应用本地缓存的结果
    for (const [idx, translation] of localResults) {
      const el = batch[idx];
      el.classList.remove(TRANSLATING_CLASS);
      injectTranslation(el, translation);
      translatedMap.set(el, true);
    }

    // 发送未缓存的到 background 翻译
    if (toTranslate.length > 0) {
      setElementsClass(toTranslate, TRANSLATING_CLASS, true);

      try {
        const response = await sendExtensionMessage(MessageType.TRANSLATE, {
          texts,
        });

        if (response?.translations) {
          for (let i = 0; i < toTranslate.length; i++) {
            const el = toTranslate[i];
            el.classList.remove(TRANSLATING_CLASS);
            const translation = response.translations[i];
            if (translation) {
              injectTranslation(el, translation);
              translatedMap.set(el, true);
              // 写本地缓存
              this.modelCache.set(texts[i], translation);
            }
          }
        }
      } catch {
        setElementsClass(toTranslate, TRANSLATING_CLASS, false);
      }
    }

    this.processing = false;

    // 如果队列中又有新元素，继续处理
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
    this.modelCache.clear();
  }
}

// ── 内容脚本主逻辑 ────────────────────────────────────────

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "manifest",
  async main() {
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let mutationTimeout: ReturnType<typeof setTimeout>;

    const hostname = window.location.hostname.toLowerCase();
    const translationQueue = new TranslationQueue();

    const start = () => {
      if (observer) return;

      observer = new IntersectionObserver(
        (entries) => {
          const toTranslate: HTMLElement[] = [];
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              if (shouldTranslate(el) && !isTranslated(el)) {
                toTranslate.push(el);
                observer?.unobserve(el);
              }
            }
          }
          if (toTranslate.length > 0) {
            translationQueue.enqueue(toTranslate);
          }
        },
        { threshold: 0.1 },
      );

      startObserving(observer);

      mutationObserver = new MutationObserver(() => {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
          if (observer) startObserving(observer);
        }, MUTATION_DEBOUNCE_MS);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTranslationVisibility(true);
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      mutationObserver?.disconnect();
      mutationObserver = null;
      translationQueue.destroy();
      setTranslationVisibility(false);
    };

    const checkAndRun = async () => {
      const settings = await getSettings();
      if (isDomainEnabled(settings, hostname)) {
        start();
      } else {
        stop();
      }
    };

    await checkAndRun();

    browser.storage.onChanged.addListener((changes) => {
      if (changes.settings) {
        checkAndRun();
      }
    });
  },
});
