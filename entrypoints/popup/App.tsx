import reactLogo from "@/assets/react.svg";
import { useState } from "react";
import wxtLogo from "/wxt.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#242424] text-white flex flex-col items-center justify-center p-8 font-sans selection:bg-indigo-500/30">
      <div className="flex items-center justify-center gap-12 mb-12">
        <a
          href="https://wxt.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
          rel="noreferrer"
        >
          <img
            src={wxtLogo}
            className="h-32 w-32 drop-shadow-[0_0_2rem_#54bc4ae0] hover:drop-shadow-[0_0_3rem_#54bc4ae0] transition-all duration-300"
            alt="WXT logo"
          />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
          rel="noreferrer"
        >
          <img
            src={reactLogo}
            className="h-32 w-32 drop-shadow-[0_0_2rem_#61dafbaa] hover:drop-shadow-[0_0_3rem_#61dafbaa] transition-all duration-300 motion-safe:animate-[spin_20s_linear_infinite]"
            alt="React logo"
          />
        </a>
      </div>

      <h1 className="text-6xl font-black tracking-tight mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        WXT <span className="text-indigo-400">+</span> React
      </h1>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6 max-w-md w-full">
        <button
          type="button"
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is <span className="inline-block min-w-[1.5rem]">{count}</span>
        </button>

        <p className="text-gray-400 text-center leading-relaxed">
          Edit{" "}
          <code className="bg-black/40 px-2 py-1 rounded-md text-indigo-300 font-mono text-sm">
            src/App.tsx
          </code>{" "}
          and save to test HMR
        </p>
      </div>

      <p className="mt-12 text-gray-500 font-medium tracking-wide animate-pulse">
        Click on the logos to learn more
      </p>
    </div>
  );
}

export default App;
