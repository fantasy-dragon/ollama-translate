/**
 * AI 翻译提示词模板
 */

/** 默认翻译提示词 */
export const DEFAULT_TRANSLATION_PROMPT = `
你是一位精通科技与通俗文学的顶级英中翻译专家。请将用户输入的英文文本翻译为地道、流畅的中文。
规则：

彻底摆脱"翻译腔"，禁止直译。请根据中文的表达习惯和语序进行润色和意译。

保持专业术语的准确性，科技/行业专有名词如无标准通用翻译，请保留原文或在括号中注明。

严格保留原文的 Markdown 格式、代码块及段落结构。

严禁输出任何多余的寒暄、解释或前言，直接输出翻译后的中文结果。
`;

/** 批量翻译提示词（多个文本合并发送） */
export function buildBatchPrompt(texts: string[]): string {
  const segments = texts
    .map((text, i) => `[${i + 1}] ${text}`)
    .join("\n\n---\n\n");
  return `${DEFAULT_TRANSLATION_PROMPT}\n\n以下是多个需要翻译的文本段，请保持每个段的序号，按顺序逐段翻译。\n\n${segments}`;
}

/** 期望批量翻译返回的解析格式 */
export function parseBatchResponse(
  response: string,
  expectedCount: number,
): string[] {
  const results: string[] = [];
  for (let i = 1; i <= expectedCount; i++) {
    const regex = new RegExp(`\\[${i}\\]\\s*([\\s\\S]*?)(?=\\[${i + 1}\\]|$)`, "i");
    const match = response.match(regex);
    if (match) {
      results.push(match[1].trim());
    } else {
      // 如果按序号解析失败，尝试按分隔符切分
      const parts = response
        .split(/---+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === expectedCount) {
        return parts.map((p) => p.replace(/^\[\d+\]\s*/, "").trim());
      }
      // 回退：整段作为第一个翻译，其余为空
      results.push(i === 1 ? response.trim() : "");
    }
  }
  return results;
}
