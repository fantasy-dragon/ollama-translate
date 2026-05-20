/**
 * 指数退避重试工具
 */

export interface RetryOptions {
  /** 最大重试次数（默认 2） */
  maxRetries?: number;
  /** 初始延迟（毫秒，默认 1000） */
  baseDelayMs?: number;
  /** 最大延迟（毫秒，默认 10000） */
  maxDelayMs?: number;
  /** 退避倍数（默认 2） */
  backoffFactor?: number;
  /** 判断错误是否可重试（默认所有错误都可重试） */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  shouldRetry: () => true,
};

/**
 * 带指数退避的异步重试函数
 *
 * @example
 * const result = await withRetry(() => fetchData());
 * const result = await withRetry(() => fetchData(), { maxRetries: 3 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // 最后一次尝试失败后不再等待，直接抛出
      if (attempt >= opts.maxRetries) break;

      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // 计算延迟时间（指数退避 + 少量随机抖动）
      const delay = Math.min(
        opts.baseDelayMs * opts.backoffFactor ** attempt,
        opts.maxDelayMs,
      );
      const jitter = Math.random() * 200; // 0-200ms 随机抖动

      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
