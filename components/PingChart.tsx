"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Change the interface
interface PingChartProps {
  packets: { seq: number; rtt_ms: number; ttl: number }[];
  result: any;
}



export default function PingChart({ packets, result }: PingChartProps) {
  if (packets.length === 0) {
    return <p className="text-gray-500">Waiting for ping data...</p>;
  }

  // Change the mapping
const chartData = packets.map((p) => ({
  seq: p.seq,
  rtt: Math.round(p.rtt_ms * 100) / 100,
}));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="seq" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" unit="ms" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
          />
          <Line type="monotone" dataKey="rtt" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      {result && (
        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-400">Avg</p>
            <p className="text-lg font-semibold">{result.avg_rtt_ms.toFixed(1)}ms</p>
          </div>
          <div>
            <p className="text-gray-400">Min</p>
            <p className="text-lg font-semibold">{result.min_rtt_ms.toFixed(1)}ms</p>
          </div>
          <div>
            <p className="text-gray-400">Max</p>
            <p className="text-lg font-semibold">{result.max_rtt_ms.toFixed(1)}ms</p>
          </div>
          <div>
            <p className="text-gray-400">Loss</p>
            <p className={`text-lg font-semibold ${result.packet_loss > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {result.packet_loss.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}