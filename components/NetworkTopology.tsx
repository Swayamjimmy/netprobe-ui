"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Hop {
  ttl: number;
  ip: string;
  host: string;
  latency_ms: number;
  geo?: { city: string; country: string; isp: string };
}

export default function NetworkTopology({ hops }: { hops: Hop[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || hops.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 300;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);

    const nodes = hops.map((h, i) => ({
      id: h.ip || `hop-${h.ttl}`,
      label: h.host || h.ip || `*`,
      latency: h.latency_ms,
      ttl: h.ttl,
      type: i === 0 ? "source" : i === hops.length - 1 ? "destination" : "hop",
    }));

    const links = nodes.slice(0, -1).map((_, i) => ({
      source: nodes[i].id,
      target: nodes[i + 1].id,
      latency: nodes[i + 1].latency,
    }));

    const simulation = d3
      .forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.3));

    const link = svg
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 2);

    const node = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => (d.type === "source" || d.type === "destination" ? 10 : 7))
      .attr("fill", (d) => {
        if (d.type === "source") return "#10b981";
        if (d.type === "destination") return "#f59e0b";
        if (d.latency > 100) return "#ef4444";
        return "#6366f1";
      });

    const label = svg
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.label.substring(0, 15))
      .attr("font-size", "10px")
      .attr("fill", "#9ca3af")
      .attr("dx", 12)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });
  }, [hops]);

  if (hops.length === 0) {
    return <p className="text-gray-500">Waiting for traceroute data...</p>;
  }

  return <svg ref={svgRef} className="w-full" style={{ height: "300px" }} />;
}