# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev mode (Chrome, watch rebuild on .output/)
pnpm dev:firefox      # Dev mode (Firefox)
pnpm build            # Production build
pnpm build:firefox    # Production build (Firefox)
pnpm compile          # TypeScript type-check (tsc --noEmit)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome
pnpm check            # Lint + format + fix with Biome
```

The built extension is loaded as an unpacked extension from `.output/<browser>-mv3/`.

## Architecture

This is a browser extension built on [WXT](https://wxt.dev) (v0.20). It has three entrypoints that communicate via `browser.runtime.sendMessage`:

### `entrypoints/background.ts` — Service Worker
The central translation engine. Responsibilities:
- Receives `TRANSLATE` requests from the content script, calls Ollama `/api/generate` for each text in parallel, returns translations
- Handles `TEST_CONNECTION` requests (queries `/api/tags` to list available models)
- Manages keyboard shortcut commands: `toggle-translation` (Ctrl+Shift+T) and `cycle-display-mode` (Ctrl+Shift+Y)
- Language detection (CJK ratio check) to skip pages that are already in Chinese/Japanese/Korean
- Manages domain whitelist matching (exact + subdomain via `endsWith`)

### `entrypoints/content.ts` — Content Script
Injected into matched pages (`<all_urls>`). Responsibilities:
- Uses an `IntersectionObserver` to detect when translatable text elements become visible
- Uses a `TranslationQueue` class with debouncing — collects elements for 300ms, then sends in batches of 5 (`CHUNK_SIZE`) to the background service worker
- Injects translations as sibling `<div>`/`<span>` elements with class `ollama-translation-wrap`
- Filters out already-translated text via: WeakMap per generation, content-hash dedup set (max 1000 entries), CJK ratio check, excluded tags, link-density heuristic
- On model change (detected via `storage.onChanged`), clears all translations and re-observes
- Handles display mode: `bilingual` (show translations) vs `original-only` (hide them via `display:none`)
- MutationObserver watches for new DOM content, debounces 500ms, then re-scans

### `entrypoints/popup/` — Extension Popup (React 19)
A 320px-wide popup with three sections:
- **MainControls** — toggle for enabling/disabling translation on the current site
- **AISettings** — model selector (dropdown populated from Ollama `/api/tags`), connection test button, custom model input fallback
- **AdvancedSettings** — Ollama URL, min text length, CSS selector, excluded tags, domain whitelist manager, latency display

State management uses [Valtio](https://valtio.dev) proxies with three domain stores under `entrypoints/popup/store/`:
- `settings-store.ts` — mirrors `browser.storage.local` settings, with derived properties `isCurrentSiteEnabled`/`isCurrentSiteInList`
- `translation-store.ts` — listens for `TRANSLATION_STATUS` messages from background to show real-time translation state
- `popup-store.ts` — re-exports and provides `initApp()` which loads settings, queries the current tab, and sets up the translation status listener

### `utils/` — Shared Modules

| File | Purpose |
|------|---------|
| `messaging.ts` | Typed message envelope: `MessageType` enum, request/response interfaces, `MessageResponseMap`, and a generic `sendExtensionMessage<T>()` wrapper |
| `cache.ts` | In-memory LRU cache (max 500 entries, keyed by `model::hash(text)`) + async persistence to `browser.storage.local` with 1s debounce. `filterCached()` splits texts into cached/uncached sets |
| `storage.ts` | `Settings` interface with defaults (`DEFAULT_SETTINGS`), `getSettings()` (merges stored with defaults, migrates legacy `enabledDomains` → `domainList`), `setSettings()` with 300ms debounce |
| `prompts.ts` | LLM system prompt template for translation, `buildTranslatePrompt()` merges context snippets (up to 3 neighboring texts, 300 chars each) |
| `retry.ts` | Exponential backoff retry with jitter: `withRetry(fn, { maxRetries: 2, baseDelayMs: 1000 })` |

### Data Flow

```
Content Script                    Background SW                    Ollama
─────────────                    ─────────────                    ──────
IntersectionObserver
  → TranslationQueue.enqueue()
    → sendMessage(TRANSLATE)  ──→  handleTranslate()
                                    → filterCached() [cache]
                                    → Promise.all(translateOne())
                                      → ollamaFetch(/api/generate) ──→ Ollama
                                    ← setCachedTranslation()
                                  ← sendMessage(status) ──→ Popup (real-time)
    ← translations[]
    → injectTranslation(el)
```

### Key Design Decisions

- **Translation generation counter**: When the model changes, `clearAllTranslations()` increments a generation counter rather than trying to clear DOM references — `isTranslated()` checks `translatedMap.get(el) === translationGeneration`, so all old WeakMap entries become stale at once
- **Chunked progressive rendering**: Translations are sent in batches of 5 so the user sees results incrementally rather than waiting for all texts
- **CJK detection as first gate**: Before any translation logic runs, the content script checks if the page HTML `lang` attribute or sampled body text exceeds the CJK ratio threshold (0.4) — if so, the entire page is skipped
- **MutationObserver self-filtering**: The mutation observer checks whether mutations are caused by the translation injection itself (by checking for `ollama-translation-wrap` classes) to avoid feedback loops
- **Background is stateless between restarts**: The service worker can be terminated by the browser at any time; the persistent cache in `storage.local` and the debounced `setSettings` in storage ensure settings and translations survive
