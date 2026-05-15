import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["storage"],
    host_permissions: [
      "<all_urls>",
      "http://localhost:11434/*",
      "http://127.0.0.1:11434/*",
    ],
    name: "Ollama 沉浸式翻译",
    description: "利用本地 Ollama 提供的 AI 能力实现网页双语翻译",
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
