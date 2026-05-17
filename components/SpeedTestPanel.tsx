"use client";

interface SpeedTestPanelProps {
  progress: { percent: number; current_mbps: number } | null;
  result: { download_mbps: number; duration_ms: number; bytes_read: number } | null;
}

export default function SpeedTestPanel({ progress, result }: SpeedTestPanelProps) {
  if (!progress && !result) {
    return (
      <div className="flex items-center gap-3 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        <p>Testing download throughput...</p>
      </div>
    );
  }

  // Final Result State
  if (result) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-400">
            {result.download_mbps.toFixed(1)}
          </span>
          <span className="text-gray-400 font-semibold">Mbps</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Downloaded {(result.bytes_read / 1000000).toFixed(1)} MB in {(result.duration_ms / 1000).toFixed(1)}s
        </div>
      </div>
    );
  }

  // Progress State
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-blue-400">
            {progress?.current_mbps.toFixed(1)}
          </span>
          <span className="text-gray-400">Mbps</span>
        </div>
        <span className="text-sm text-gray-500">{progress?.percent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress?.percent}%` }}
        />
      </div>
    </div>
  );
}