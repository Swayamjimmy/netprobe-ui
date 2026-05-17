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
    <main className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-emerald-400 mb-4 tracking-tight">NetProbe</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          A production-grade diagnostic platform to visualize network routing, pinpoint ISP bottlenecks, and measure real-time latency.
        </p>
      </header>

      <div className="max-w-3xl mx-auto flex gap-3 mb-12">
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRun()}
          placeholder="Enter target (e.g. google.com, 1.1.1.1)"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-lg"
        />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
        >
          {isRunning ? "Running..." : "Diagnose"}
        </button>
      </div>

      {!activeTarget ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <div className="text-2xl mb-3">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Estimated Routing Analysis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Visualize the estimated geographic path your packets take using Globalping probes, featuring built-in physics checks to flag Geo-IP inaccuracies and administrative routing illusions.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Identify ISP Throttling</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Compare high-frequency ICMP ping latency against actual HTTP download throughput to spot artificial bottlenecks and server-side limits.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Heuristic Root Cause Analysis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Instead of guessing, the diagnostic engine evaluates packet loss, mid-path latency spikes, and DNS resolution times to provide a definitive verdict on your connection health.
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Dashboard target={activeTarget} onComplete={() => setIsRunning(false)} />
        </div>
      )}
    </main>
  );
}