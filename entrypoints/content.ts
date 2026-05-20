import "@/assets/content.css";
import { MessageType } from "../utils/messaging";
import { type Settings, getSettings } from "../utils/storage";

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

async function translateElements(elements: HTMLElement[]) {
  const texts = elements.map((el) => el.innerText.trim());
  setElementsClass(elements, TRANSLATING_CLASS, true);

  try {
    const response = await browser.runtime.sendMessage({
      type: MessageType.TRANSLATE,
      texts,
    });

    if (response?.translations) {
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        el.classList.remove(TRANSLATING_CLASS);
        injectTranslation(el, response.translations[i]);
        translatedMap.set(el, true);
      }
    }
  } catch {
    setElementsClass(elements, TRANSLATING_CLASS, false);
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

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "manifest",
  async main() {
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let mutationTimeout: ReturnType<typeof setTimeout>;

    const hostname = window.location.hostname.toLowerCase();

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
            translateElements(toTranslate);
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
