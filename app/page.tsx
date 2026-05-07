"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [target, setTarget] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTarget, setActiveTarget] = useState("");

  const handleRun = () => {
    if (!target.trim()) return;
    setActiveTarget(target.trim());
    setIsRunning(true);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">NetProbe</h1>
        <p className="text-gray-400">Internet Diagnostics Platform</p>
      </header>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRun()}
          placeholder="Enter target (e.g. google.com, discord.gg)"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
        >
          {isRunning ? "Running..." : "Diagnose"}
        </button>
      </div>

      {activeTarget && (
        <Dashboard target={activeTarget} onComplete={() => setIsRunning(false)} />
      )}
    </main>
  );
}