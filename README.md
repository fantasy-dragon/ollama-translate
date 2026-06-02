# Ollama 沉浸式翻译

基于本地 [Ollama](https://ollama.com) 的浏览器双语翻译扩展。隐私优先，翻译数据不离开本机。

## 功能

- **双语对照翻译** — 网页原文下方自动追加中文译文
- **本地 AI 驱动** — 调用本地 Ollama 模型，无需联网，无 API 费用
- **白名单域名控制** — 仅对指定网站启用自动翻译
- **显示模式切换** — `Ctrl+Shift+Y` 在双语对照 / 仅原文之间切换
- **翻译缓存** — 内存 + 持久化双层缓存，避免重复翻译
- **智能过滤** — 自动跳过已含中文的内容、导航链接、代码块等
- **连接测试** — 一键验证 Ollama 服务可达性和可用模型
- **快捷键** — `Ctrl+Shift+T` 切换当前站点翻译

## 前置条件

1. 安装 [Ollama](https://ollama.com/download)
2. 拉取翻译模型：

```bash
ollama pull qwen2.5:7b
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式 (Chrome)
pnpm dev

# 开发模式 (Firefox)
pnpm dev:firefox

# 构建
pnpm build

# 类型检查
pnpm compile

# 代码检查
pnpm lint
```

## 技术栈

| 层面 | 技术 |
|------|------|
| 扩展框架 | [WXT](https://wxt.dev) |
| 前端 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 状态管理 | [Valtio](https://valtio.dev) |
| AI 后端 | Ollama HTTP API |

## 架构

```
entrypoints/
├── background.ts    # Service Worker — 翻译引擎、缓存管理、快捷键
├── content.ts       # Content Script — DOM 监听、翻译队列、结果注入
└── popup/           # 弹窗 UI — 设置管理、状态显示
```

## 许可

MIT
