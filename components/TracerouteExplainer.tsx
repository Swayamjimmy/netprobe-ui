"use client";

import { useState } from "react";

export default function TracerouteExplainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🤔</span>
          <h3 className="text-lg font-medium text-gray-200">
            Why does my route look strange? (Global Routing Quirks)
          </h3>
        </div>
        <span className="text-gray-500 text-2xl">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
          <p className="text-sm text-gray-400 mb-6">
            If your traffic appears to jump across oceans and back (e.g., India → US → Hong Kong), it is usually due to one of the following internet infrastructure behaviors:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Geo-IP Limitations */}
            <div className="space-y-2">
              <h4 className="text-emerald-400 font-semibold flex items-center gap-2">
                <span>📍</span> Geo-IP Inaccuracies
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Traceroute maps rely on Geo-IP databases to locate routers. Often, a transit router is physically located in your city, but its IP address is officially registered to the ISP's corporate headquarters in another country (like the US). If a "US" hop only adds 5ms of latency, the router is actually local; the map is just fooled by the IP registry.
              </p>
            </div>

            {/* BGP Economics */}
            <div className="space-y-2">
              <h4 className="text-blue-400 font-semibold flex items-center gap-2">
                <span>💸</span> BGP Routing Economics
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                The internet routes traffic based on business agreements, not physical distance. Sometimes it is cheaper for your local ISP to hand your data off to a global transit provider that hauls it across an underwater cable, rather than paying a premium to route it directly to a local competitor.
              </p>
            </div>

            {/* Anycast */}
            <div className="space-y-2">
              <h4 className="text-purple-400 font-semibold flex items-center gap-2">
                <span>🌍</span> Anycast Networks
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Massive services like Google or Cloudflare use Anycast, meaning thousands of servers worldwide share the exact same IP address. If a local data center is under maintenance or your ISP updates its routes, you might be seamlessly redirected to the next closest node, which could be on another continent.
              </p>
            </div>

            {/* VPNs and Tunnels */}
            <div className="space-y-2">
              <h4 className="text-orange-400 font-semibold flex items-center gap-2">
                <span>🛡️</span> VPNs & Corporate Tunnels
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                If you are connected to a corporate network, a university, or a VPN, your traffic might be tunneled to a central security gateway (often in Europe or the US) before it actually breaks out onto the public internet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}