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
  
  // New state to manage the Globalping delay
  const [traceStatus, setTraceStatus] = useState<"idle" | "initializing" | "tracing" | "complete">("idle");

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
          setTraceStatus("tracing"); // Update status once data starts flowing
          setTraceHops((prev) => {
            // Prevent duplicate hops (Next.js Strict Mode safety)
            if (prev.find((h) => h.ttl === msg.data.ttl)) return prev;
            return [...prev, msg.data].sort((a, b) => a.ttl - b.ttl);
          });
          break;

        case "traceroute_complete":
          setTraceStatus("complete");
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
    setTraceStatus("initializing"); // Immediately show loading state when target changes

    fetch(`${API_URL}/api/diagnose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target }),
    }).catch((err) => {
      console.error("Diagnosis request failed:", err);
      setTraceStatus("idle");
    });
  }, [target]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Updated IP Info Banner */}
      {clientIP && (
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300">
          Tracing from edge probe near your IP:
          <span className="text-emerald-400 font-medium ml-1">
            {clientIP}
          </span>
          {" → "}
          <span className="text-emerald-400 font-medium">
            {target}
          </span>
        </div>
      )}

      {/* New Loading Banner for Globalping Initializing Phase */}
      {traceStatus === "initializing" && (
        <div className="lg:col-span-2 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 text-sm text-blue-300 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>
            <strong className="text-blue-400 font-semibold">Locating nearest edge probe...</strong> This usually takes 2-4 seconds.
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
        <h2 className="text-xl font-semibold mb-4 text-emerald-400 flex items-center gap-2">
          Traceroute Map 
          {traceStatus === "tracing" && <span className="text-sm text-gray-400 font-normal animate-pulse">(Routing...)</span>}
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