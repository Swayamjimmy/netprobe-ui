"use client";

import { useEffect, useRef, useState } from "react";
import PingChart from "./PingChart";
import TracerouteMap from "./TracerouteMap";
import DnsBenchmark from "./DnsBenchmark";
import NetworkTopology from "./NetworkTopology";
import IssuePanel from "./IssuePanel";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface DashboardProps {
  target: string;
  onComplete: () => void;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export default function Dashboard({
  target,
  onComplete,
}: DashboardProps) {
  const [pingData, setPingData] = useState<any>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [dnsData, setDnsData] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const [pingPackets, setPingPackets] = useState<any[]>([]);
  const [traceHops, setTraceHops] = useState<any[]>([]);

  const [clientIP, setClientIP] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = API_URL.replace(/^http/, "ws") + "/ws";

    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      const msg: WebSocketMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "client_info":
          setClientIP(msg.data.client_ip);
          break;

        case "ping_packet":
          setPingPackets((prev) => [...prev, msg.data]);
          break;

        case "ping_complete":
          setPingData(msg.data);
          break;

        case "traceroute_hop":
          setTraceHops((prev) => [...prev, msg.data]);
          break;

        case "traceroute_complete":
          setTraceData(msg.data);
          break;

        case "dns_complete":
          setDnsData(msg.data);
          break;

        case "diagnosis":
          setDiagnosis(msg.data);
          onComplete();
          break;

        default:
          console.warn("Unknown websocket message:", msg);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [target, onComplete]);

  useEffect(() => {
    setPingPackets([]);
    setTraceHops([]);
    setPingData(null);
    setTraceData(null);
    setDnsData(null);
    setDiagnosis(null);
    setClientIP("");

    fetch(`${API_URL}/api/diagnose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target }),
    }).catch((err) => {
      console.error("Diagnosis request failed:", err);
    });
  }, [target]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {clientIP && (
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300">
          Diagnosing from your IP:
          <span className="text-emerald-400 font-medium">
            {" "}
            {clientIP}
          </span>
          {" → "}EC2 Server{" → "}
          <span className="text-emerald-400 font-medium">
            {target}
          </span>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Ping
        </h2>

        <PingChart packets={pingPackets} result={pingData} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          DNS Benchmark
        </h2>

        <DnsBenchmark data={dnsData} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Traceroute Map
        </h2>

        <TracerouteMap hops={traceHops} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Network Topology
        </h2>

        <NetworkTopology hops={traceHops} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Diagnosis
        </h2>

        <IssuePanel diagnosis={diagnosis} />
      </div>
    </div>
  );
}