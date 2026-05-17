"use client";

import { useEffect, useRef, useState } from "react";

import PingChart from "./PingChart";
import TracerouteMap from "./TracerouteMap";
import DnsBenchmark from "./DnsBenchmark";
import NetworkTopology from "./NetworkTopology";
import IssuePanel from "./IssuePanel";
import SpeedTestPanel from "./SpeedTestPanel";
import TracerouteExplainer from "./TracerouteExplainer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface DashboardProps {
  target: string;
  onComplete: () => void;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export default function Dashboard({ target, onComplete }: DashboardProps) {
  const [pingData, setPingData] = useState<any>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [dnsData, setDnsData] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const [pingPackets, setPingPackets] = useState<any[]>([]);
  const [traceHops, setTraceHops] = useState<any[]>([]);

  const [traceStatus, setTraceStatus] = useState<
    "idle" | "initializing" | "tracing" | "complete"
  >("idle");

  const [clientIP, setClientIP] = useState("");
  
  // Speed Test State
  const [speedProgress, setSpeedProgress] = useState<any>(null);
  const [speedData, setSpeedData] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // RESET STATE
  useEffect(() => {
    setPingPackets([]);
    setTraceHops([]);
    setPingData(null);
    setTraceData(null);
    setDnsData(null);
    setDiagnosis(null);
    setClientIP("");
    setTraceStatus("initializing");
    setSpeedProgress(null);
    setSpeedData(null);
  }, [target]);

  // WEBSOCKET
  useEffect(() => {
    const wsUrl = API_URL.replace(/^http/, "ws") + "/ws";

    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
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
          setTraceStatus("tracing");

          setTraceHops((prev) => {
            // dedupe by ttl+ip
            const exists = prev.some(
              (h) => h.ttl === msg.data.ttl && h.ip === msg.data.ip
            );

            if (exists) return prev;

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

        case "speedtest_progress":
          setSpeedProgress(msg.data);
          break;

        case "speedtest_complete":
          setSpeedData(msg.data);
          setSpeedProgress(null); // Clear progress when complete
          break;

        case "diagnosis":
          setDiagnosis(msg.data);
          onComplete();
          break;
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
    };

    return () => {
      ws.close();
    };
  }, [target, onComplete]);

  // START DIAGNOSIS
  useEffect(() => {
    async function run() {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");

        const ipData = await ipRes.json();

        await fetch(`${API_URL}/api/diagnose`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target,
            client_ip: ipData.ip,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    run();
  }, [target]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {clientIP && (
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
          <span className="text-gray-400">Approximate route from probe near</span>
          <span className="text-emerald-400 ml-2 font-semibold">{clientIP}</span>
          <span className="text-gray-500 mx-2">→</span>
          <span className="text-emerald-400 font-semibold">{target}</span>
        </div>
      )}

      {traceStatus === "initializing" && (
        <div className="lg:col-span-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-blue-300 text-sm">
              Locating nearest Globalping probe...
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Ping</h2>
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
        <TracerouteExplainer />
      </div>
      

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Network Topology
        </h2>
        <NetworkTopology hops={traceHops} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Throughput Speed
        </h2>
        <SpeedTestPanel progress={speedProgress} result={speedData} />
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Diagnosis
        </h2>
        <IssuePanel diagnosis={diagnosis} />
      </div>
    </div>
  );
}