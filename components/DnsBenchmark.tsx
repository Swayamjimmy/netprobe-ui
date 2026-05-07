"use client";

interface DnsBenchmarkProps {
  data: {
    resolvers: { name: string; address: string; avg_ms: number; p95_ms: number; answers: string[] }[];
    fastest: string;
  } | null;
}

export default function DnsBenchmark({ data }: DnsBenchmarkProps) {
  if (!data) {
    return <p className="text-gray-500">Waiting for DNS benchmark...</p>;
  }

  const maxMs = Math.max(...data.resolvers.map((r) => r.avg_ms));

  return (
    <div className="space-y-3">
      {data.resolvers.map((resolver) => (
        <div key={resolver.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className={resolver.name === data.fastest ? "text-emerald-400 font-semibold" : ""}>
              {resolver.name} {resolver.name === data.fastest && "\u26A1"}
            </span>
            <span className="text-gray-400">{resolver.avg_ms.toFixed(1)}ms</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${resolver.name === data.fastest ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${(resolver.avg_ms / maxMs) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}