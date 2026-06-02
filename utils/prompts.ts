/**
 * AI 翻译提示词模板
 */

/** 默认翻译提示词 */
export const DEFAULT_TRANSLATION_PROMPT = `
你是一位精通多语言翻译的顶级专家。请将用户输入的文本翻译为地道、流畅的中文。
规则：

自动检测源语言，支持英语、日语、韩语、法语、德语等主流语言。

彻底摆脱"翻译腔"，禁止直译。请根据中文的表达习惯和语序进行润色和意译。

保持专业术语的准确性，科技/行业专有名词如无标准通用翻译，请保留原文或在括号中注明。

严格保留原文的 Markdown 格式、代码块及段落结构。

严禁输出任何多余的寒暄、解释或前言，直接输出翻译后的中文结果。
`;

/** 为单段文本构建翻译 prompt */
export function buildTranslatePrompt(text: string, contextTexts?: string[]): string {
  const context = contextTexts
    ?.filter((t) => t !== text)
    .slice(0, 3)
    .map((t) => `参考上下文（无需翻译，仅用于理解语境）: ${t.slice(0, 300)}`)
    .join("\n");

  const ctxBlock = context ? `\n${context}` : "";
  return `${DEFAULT_TRANSLATION_PROMPT}${ctxBlock}\n文本内容: ${text}`;
}
