import "@/assets/content.css";
import { getSettings } from "../utils/storage";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "manifest",
  async main() {
    const settings = await getSettings();
    if (!settings.autoTranslate) return;



    const observer = new IntersectionObserver(
      (entries) => {
        const toTranslate: HTMLElement[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (shouldTranslate(el) && !isTranslated(el)) {
              toTranslate.push(el);
              observer.unobserve(el); // 触发一次后停止观察
            }
          }
        }
        if (toTranslate.length > 0) {
          translateElements(toTranslate);
        }
      },
      { threshold: 0.1 },
    );

    // 智能识别正文区域并开始观察
    startObserving(observer);

    // 处理动态加载的内容 (防抖处理以提升性能)
    let mutationTimeout: ReturnType<typeof setTimeout>;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(mutationTimeout);
      mutationTimeout = setTimeout(() => {
        startObserving(observer);
      }, 500);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  },
});

const translatedMap = new WeakMap<HTMLElement, boolean>();

function isTranslated(el: HTMLElement): boolean {
  return (
    translatedMap.has(el) ||
    el.querySelector(".ollama-translation-wrap") !== null
  );
}

function shouldTranslate(el: HTMLElement): boolean {
  // 启发式识别：长度足够，且是文本容器
  const text = el.innerText.trim();
  if (text.length < 20) return false;

  // 排除掉已经翻译的、代码块、导航栏等
  const tagsToExclude = [
    "SCRIPT",
    "STYLE",
    "CODE",
    "PRE",
    "NAV",
    "HEADER",
    "FOOTER",
    "BUTTON",
    "INPUT",
  ];
  if (tagsToExclude.includes(el.tagName)) return false;

  // 检查是否包含大量链接（可能是导航栏）
  const links = el.querySelectorAll("a");
  if (links.length > 3 && el.innerText.length / links.length < 50) return false;

  return true;
}

function startObserving(observer: IntersectionObserver) {
  // 查找可能的正文标签
  const elements = document.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, article div",
  );
  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    if (shouldTranslate(htmlEl) && !isTranslated(htmlEl)) {
      observer.observe(htmlEl);
    }
  }
}

async function translateElements(elements: HTMLElement[]) {
  const texts = elements.map((el) => el.innerText.trim());

  // 标记为翻译中
  for (const el of elements) {
    el.classList.add("ollama-translating");
  }

  try {
    const response = await browser.runtime.sendMessage({
      type: "TRANSLATE",
      texts: texts,
    });

    if (response?.translations) {
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const translation = response.translations[i];
        el.classList.remove("ollama-translating");
        injectTranslation(el, translation);
        translatedMap.set(el, true);
      }
    }
  } catch (error) {

    for (const el of elements) {
      el.classList.remove("ollama-translating");
    }
  }
}

function injectTranslation(el: HTMLElement, translation: string) {
  if (el.querySelector(".ollama-translation-wrap")) return;

  const wrap = document.createElement("div");
  wrap.className = "ollama-translation-wrap";
  wrap.innerText = translation;

  // 插入到元素末尾或作为兄弟节点
  // 如果是 P 标签，作为子节点插入末尾通常没问题
  el.appendChild(wrap);
}
