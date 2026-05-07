"use client";

const categoryColors: Record<string, string> = {
  DNS: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Packet Loss": "text-red-400 bg-red-400/10 border-red-400/30",
  "Wi-Fi": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Routing: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  ISP: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Server-Side": "text-pink-400 bg-pink-400/10 border-pink-400/30",
  Healthy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Unknown: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};

interface IssuePanelProps {
  diagnosis: {
    category: string;
    confidence: number;
    explanation: string;
    details: Record<string, any>;
  } | null;
}

export default function IssuePanel({ diagnosis }: IssuePanelProps) {
  if (!diagnosis) {
    return <p className="text-gray-500">Running diagnostics...</p>;
  }

  const colors = categoryColors[diagnosis.category] || categoryColors.Unknown;

  return (
    <div className={`rounded-lg border p-4 ${colors}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{diagnosis.category}</span>
        <span className="text-sm opacity-70">
          {Math.round(diagnosis.confidence * 100)}% confidence
        </span>
      </div>
      <p className="text-sm opacity-90 mb-3">{diagnosis.explanation}</p>
      {diagnosis.details && (
        <div className="text-xs opacity-70 space-y-1">
          {Object.entries(diagnosis.details).map(([key, value]) => (
            <div key={key}>
              <span className="font-mono">{key}</span>: {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}