/**
 * 翻译结果缓存模块
 *
 * 使用 LRU 策略管理内存缓存，并可选持久化到 storage.local。
 */

import { getSettings, setSettings } from "./storage";

const MAX_CACHE_ITEMS = 500;
const CACHE_KEY_PREFIX = "translation_cache_v1_";

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
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的（第一个）
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

  get size(): number {
    return this.cache.size;
  }
}

/** 全局 LRU 缓存实例 */
export const translationCache = new LRUCache();

/**
 * 简单但可靠的字符串哈希（djb2 变体）
 * 对整个文本内容做哈希，避免"长度+前缀"方案的碰撞
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
 * 写入翻译结果到缓存
 */
export function setCachedTranslation(text: string, model: string, result: string): void {
  const key = getCacheKey(text, model);
  translationCache.set(key, result);
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
