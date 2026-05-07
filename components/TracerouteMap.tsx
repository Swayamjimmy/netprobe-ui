"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Hop {
  ttl: number;
  ip: string;
  host: string;
  latency_ms: number;
  geo?: { lat: number; lon: number; city: string; country: string; isp: string };
}

export default function TracerouteMap({ hops }: { hops: Hop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [0, 20],
      zoom: 1.5,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const geoHops = hops.filter((h) => h.geo && h.geo.lat !== 0);
    if (geoHops.length < 2) return;

    const existingMarkers = document.querySelectorAll(".hop-marker");
    existingMarkers.forEach((m) => m.remove());

    const coordinates: [number, number][] = geoHops.map((h) => [h.geo!.lon, h.geo!.lat]);

    if (map.current.getSource("route")) {
      (map.current.getSource("route") as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      });
    } else {
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        },
      });
      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#10b981", "line-width": 3, "line-opacity": 0.8 },
      });
    }

    geoHops.forEach((hop) => {
      const el = document.createElement("div");
      el.className = "hop-marker";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = hop.latency_ms > 100 ? "#ef4444" : "#10b981";
      el.style.border = "2px solid white";

      new maplibregl.Marker({ element: el })
        .setLngLat([hop.geo!.lon, hop.geo!.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 10 }).setHTML(
            `<div style="color:#000"><strong>Hop ${hop.ttl}</strong><br/>
            ${hop.geo!.city}, ${hop.geo!.country}<br/>
            ${hop.ip} (${hop.host})<br/>
            Latency: ${hop.latency_ms.toFixed(1)}ms<br/>
            ISP: ${hop.geo!.isp}</div>`
          )
        )
        .addTo(map.current!);
    });

    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach((c) => bounds.extend(c));
    map.current.fitBounds(bounds, { padding: 50 });
  }, [hops]);

  return <div ref={mapContainer} style={{ height: "400px", width: "100%" }} />;
}