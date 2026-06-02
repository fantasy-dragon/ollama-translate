/**
 * 翻译结果缓存模块
 *
 * 内存 LRU 缓存 + storage.local 持久化，跨 Service Worker 生命周期保留翻译结果。
 */

const MAX_CACHE_ITEMS = 500;
const CACHE_STORAGE_KEY = "translation_cache";
const PERSIST_DEBOUNCE_MS = 1000;

interface CacheEntry {
  result: string;
  cachedAt: number;
}

/**
 * 轻量内存 LRU 缓存
 */
class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;

  constructor(maxSize: number = MAX_CACHE_ITEMS) {
    this.maxSize = maxSize;
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    // LRU: 删除后重新插入以提升优先级
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.result;
  }

  set(key: string, result: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { result, cachedAt: Date.now() });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /** 返回所有缓存的 [key, entry] 对，用于持久化 */
  entries(): Array<[string, CacheEntry]> {
    return [...this.cache.entries()];
  }

  get size(): number {
    return this.cache.size;
  }
}

/** 全局 LRU 缓存实例 */
export const translationCache = new LRUCache();

// ── 持久化 ────────────────────────────────────────────

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistCache, PERSIST_DEBOUNCE_MS);
}

async function persistCache(): Promise<void> {
  persistTimer = null;
  const data: Record<string, CacheEntry> = {};
  for (const [key, entry] of translationCache.entries()) {
    data[key] = entry;
  }
  try {
    await browser.storage.local.set({ [CACHE_STORAGE_KEY]: data });
  } catch {
    // storage 写入失败（如配额满）静默忽略，不影响运行时缓存
  }
}

/** 从 storage.local 恢复缓存到内存 LRU */
export async function loadPersistedCache(): Promise<void> {
  try {
    const stored = await browser.storage.local.get(CACHE_STORAGE_KEY);
    const data = stored[CACHE_STORAGE_KEY] as Record<string, CacheEntry> | undefined;
    if (data) {
      for (const [key, entry] of Object.entries(data)) {
        translationCache.set(key, entry.result);
      }
    }
  } catch {
    // 读取失败静默忽略，从空缓存开始
  }
}

// ── 哈希 ─────────────────────────────────────────────

/**
 * 简单但可靠的字符串哈希（djb2 变体）
 */
function hashString(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * 生成缓存的键
 */
export function getCacheKey(text: string, model: string): string {
  return `${model}::${hashString(text)}`;
}

/**
 * 从缓存获取翻译结果
 */
export function getCachedTranslation(text: string, model: string): string | undefined {
  const key = getCacheKey(text, model);
  return translationCache.get(key);
}

/**
 * 写入翻译结果到缓存（内存 + 触发异步持久化）
 */
export function setCachedTranslation(text: string, model: string, result: string): void {
  const key = getCacheKey(text, model);
  translationCache.set(key, result);
  schedulePersist();
}

/**
 * 检查一组文本中哪些已缓存，返回未缓存的文本和已缓存的翻译
 */
export function filterCached(
  texts: string[],
  model: string,
): { uncached: string[]; cachedTranslations: Map<number, string> } {
  const uncached: string[] = [];
  const cachedTranslations = new Map<number, string>();

  for (let i = 0; i < texts.length; i++) {
    const cached = getCachedTranslation(texts[i], model);
    if (cached !== undefined) {
      cachedTranslations.set(i, cached);
    } else {
      uncached.push(texts[i]);
    }
  }

  return { uncached, cachedTranslations };
}
