"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Hop {
  ttl: number;
  ip: string;
  latency_ms: number;
  geo?: { lat: number; lon: number; city: string; country: string; isp: string };
}

export default function TracerouteMap({ hops }: { hops: Hop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  // Store marker instances to properly remove them
  const markersRef = useRef<maplibregl.Marker[]>([]);

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

    // 1. Clean up old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 2. Filter hops that actually have valid coordinates
    const geoHops = hops.filter((h) => h.geo && h.geo.lat !== 0 && h.geo.lon !== 0);

    if (geoHops.length === 0) return;

    // 3. Draw new markers
    geoHops.forEach((hop) => {
      const el = document.createElement("div");
      el.className = "hop-marker";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = hop.latency_ms > 100 ? "#ef4444" : "#10b981";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 8px rgba(16, 185, 129, 0.6)";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hop.geo!.lon, hop.geo!.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 10 }).setHTML(
            `<div style="color:#000"><strong>Hop ${hop.ttl}</strong><br/>
            ${hop.geo!.city}, ${hop.geo!.country}<br/>
            ${hop.ip}<br/>
            Latency: ${hop.latency_ms.toFixed(1)}ms</div>`
          )
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // 4. Draw connecting line (only if style is loaded)
    if (geoHops.length >= 2 && map.current.isStyleLoaded()) {
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
          paint: { "line-color": "#10b981", "line-width": 3, "line-opacity": 0.6 },
        });
      }

      // 5. Adjust viewport, capping zoom to preserve map context
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((c) => bounds.extend(c));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      
    } else if (geoHops.length === 1 && map.current.isStyleLoaded()) {
      map.current.flyTo({ center: [geoHops[0].geo!.lon, geoHops[0].geo!.lat], zoom: 4 });
    }

  }, [hops]);

  return <div ref={mapContainer} style={{ height: "400px", width: "100%" }} />;
}