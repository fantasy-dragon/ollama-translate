import "@/assets/content.css";
import { MessageType, sendExtensionMessage } from "../utils/messaging";
import { type Settings, getSettings } from "../utils/storage";

const TRANSLATION_CLASS = "ollama-translation-wrap";
const TRANSLATING_CLASS = "ollama-translating";
const MUTATION_DEBOUNCE_MS = 500;
const LINK_DENSITY_THRESHOLD = 50;

/** 队列处理 debounce 时间（毫秒） */
const QUEUE_DEBOUNCE_MS = 300;
/** 每批翻译的最大文本数 */
const CHUNK_SIZE = 5;

const translatedMap = new WeakMap<HTMLElement, boolean>();

// ── 内容级去重：跨 DOM 替换的翻译记录 ──────────────
// 使用文本内容哈希，避免同一段文字因 DOM 替换/克隆被重复翻译
const MAX_DEDUP_SIZE = 1000;
const translatedTextSet = new Set<string>();

function hashText(text: string): string {
  // 简单哈希：取前 80 字符 + 长度，足够区分不同文本
  const normalized = text.replace(/\s+/g, " ").trim();
  return `${normalized.length}::${normalized.slice(0, 80)}`;
}

function isTextAlreadyTranslated(text: string): boolean {
  if (translatedTextSet.size === 0) return false;
  return translatedTextSet.has(hashText(text));
}

function markTextTranslated(text: string): void {
  if (translatedTextSet.size >= MAX_DEDUP_SIZE) {
    // LRU 清理：删除最早的一半
    const entries = [...translatedTextSet];
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    for (const entry of toRemove) {
      translatedTextSet.delete(entry);
    }
  }
  translatedTextSet.add(hashText(text));
}

// ── CJK 字符检测：避免翻译已含中文的内容 ──────────

/** 如果文本中 CJK 字符占比超过此阈值，视为已翻译 */
const CJK_RATIO_THRESHOLD = 0.3;

function getCJKRatio(text: string): number {
  let cjkCount = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (
      code !== undefined &&
      // CJK 统一表意文字 + 扩展区
      ((code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x20000 && code <= 0x2a6df) ||
      // CJK 标点符号
      (code >= 0x3000 && code <= 0x303f) ||
      (code >= 0xff00 && code <= 0xffef) ||
      // 平假名/片假名（日文也算已翻译）
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      // 韩文
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x1100 && code <= 0x11ff))
    ) {
      cjkCount++;
    }
  }
  return text.length > 0 ? cjkCount / text.length : 0;
}

function isTranslated(el: HTMLElement): boolean {
  return (
    translatedMap.has(el) ||
    // 标记属性更可靠（在某些 DOM 变化下 WeakMap 可能失效）
    (el.dataset && el.dataset.ollamaTranslated === "1") ||
    el.classList.contains(TRANSLATING_CLASS) ||
    el.querySelector(`.${TRANSLATION_CLASS}`) !== null
  );
}

/**
 * 从 settings 构建排除标签 Set
 */
function buildExcludedTags(settings: Settings): Set<string> {
  return new Set(
    settings.excludedTags
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean),
  );
}

function shouldTranslate(el: HTMLElement, settings: Settings): boolean {
  // 正在翻译中或已翻译的元素，跳过
  if (el.classList.contains(TRANSLATING_CLASS)) return false;
  if (isTranslated(el)) return false;

  const text = el.innerText.trim();
  if (text.length < settings.minTextLength) return false;

  // 内容级去重：同一段文字已翻译过，跳过
  if (isTextAlreadyTranslated(text)) return false;

  // CJK 字符占比过高，说明内容已含中文翻译，跳过
  if (getCJKRatio(text) > CJK_RATIO_THRESHOLD) return false;

  const excludedTags = buildExcludedTags(settings);
  if (excludedTags.has(el.tagName)) return false;

  const links = el.querySelectorAll("a");
  if (links.length > 3 && text.length / links.length < LINK_DENSITY_THRESHOLD) {
    return false;
  }

  // 如果元素包含其他也匹配选择器的子元素，跳过（避免父子双重翻译）
  if (el.querySelector(settings.textSelector)) {
    return false;
  }

  return true;
}

function startObserving(observer: IntersectionObserver, settings: Settings) {
  const elements = document.querySelectorAll(settings.textSelector);
  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    if (shouldTranslate(htmlEl, settings) && !isTranslated(htmlEl)) {
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

function applyDisplayMode(mode: string): void {
  if (mode === "original-only") {
    setTranslationVisibility(false);
  } else {
    setTranslationVisibility(true);
  }
}

function injectTranslation(el: HTMLElement, translation: string) {
  if (el.querySelector(`.${TRANSLATION_CLASS}`) || (el.dataset && el.dataset.ollamaTranslated === "1")) return;

  const wrap = document.createElement("div");
  wrap.className = TRANSLATION_CLASS;
  wrap.innerText = translation;
  el.appendChild(wrap);
  // 标记已注入，防止在 DOM 变动或节点替换时被重复翻译
  try {
    if (el.dataset) el.dataset.ollamaTranslated = "1";
  } catch {
    // ignore
  }
}

function isDomainEnabled(settings: Settings, hostname: string): boolean {
  return settings.domainList.some(
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
    // 去重：跳过已在队列中、正在翻译或已翻译的元素
    for (const el of elements) {
      if (
        !this.queue.includes(el) &&
        !el.classList.contains(TRANSLATING_CLASS) &&
        !isTranslated(el)
      ) {
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
      markTextTranslated(el.innerText.trim());
      try {
        if (el.dataset) el.dataset.ollamaTranslated = "1";
      } catch {}
    }

    // 分批发送到 background 翻译（每批 CHUNK_SIZE 个，渐进渲染）
    if (toTranslate.length > 0) {
      setElementsClass(toTranslate, TRANSLATING_CLASS, true);

      for (let start = 0; start < toTranslate.length; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE, toTranslate.length);
        const chunkElements = toTranslate.slice(start, end);
        const chunkTexts = texts.slice(start, end);

        try {
          const response = await sendExtensionMessage(MessageType.TRANSLATE, {
            texts: chunkTexts,
          });

          if (response?.translations) {
            for (let i = 0; i < chunkElements.length; i++) {
              const el = chunkElements[i];
              el.classList.remove(TRANSLATING_CLASS);
              const translation = response.translations[i];
              if (translation) {
                injectTranslation(el, translation);
                translatedMap.set(el, true);
                markTextTranslated(chunkTexts[i]);
                try {
                  if (el.dataset) el.dataset.ollamaTranslated = "1";
                } catch {}
                this.modelCache.set(chunkTexts[i], translation);
              }
            }
          }
        } catch {
          // 单个 chunk 失败不阻塞后续 chunk
          setElementsClass(chunkElements, TRANSLATING_CLASS, false);
        }
      }
    }

    this.processing = false;

    // 如果队列中又有新元素，继续处理
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }

  /** 是否正在处理翻译请求 */
  isProcessing(): boolean {
    return this.processing;
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

    let currentSettings: Settings;

    const start = async () => {
      if (observer) return;

      currentSettings = await getSettings();

      observer = new IntersectionObserver(
        (entries) => {
          const toTranslate: HTMLElement[] = [];
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              if (shouldTranslate(el, currentSettings) && !isTranslated(el)) {
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

      startObserving(observer, currentSettings);

      mutationObserver = new MutationObserver((mutations) => {
        // 过滤掉仅由翻译注入产生的 DOM 变动，避免反馈循环
        const hasForeignMutation = mutations.some((m) => {
          // 检查新增的节点中是否有非翻译包装的元素
          for (const node of m.addedNodes) {
            const el = node as HTMLElement;
            if (el.nodeType === 1) {
              // 跳过翻译包装元素自身及其子树
              if (el.classList?.contains(TRANSLATION_CLASS)) continue;
              // 如果元素内部包含翻译包装（如父元素重新挂载），检查其是否只有翻译变动
              if (el.querySelector(`.${TRANSLATION_CLASS}`) && !el.innerText?.trim()) continue;
            }
            return true; // 有外部变动
          }
          // 检查移除的节点
          for (const node of m.removedNodes) {
            const el = node as HTMLElement;
            if (el.nodeType === 1 && el.classList?.contains(TRANSLATION_CLASS)) continue;
            return true; // 非翻译包装元素被移除
          }
          return false;
        });

        if (!hasForeignMutation) return; // 仅翻译注入变动，跳过

        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
          if (observer && !translationQueue.isProcessing()) {
            startObserving(observer, currentSettings);
          }
        }, MUTATION_DEBOUNCE_MS);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTranslationVisibility(true);
      applyDisplayMode(currentSettings.displayMode);
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

    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.settings) {
        const newSettings = changes.settings.newValue as Settings | undefined;
        // 显示模式变更：仅更新显示，不重启 observer
        if (newSettings && observer && newSettings.displayMode !== currentSettings?.displayMode) {
          currentSettings = newSettings;
          applyDisplayMode(newSettings.displayMode);
        } else {
          checkAndRun();
        }
      }
    });
  },
});
