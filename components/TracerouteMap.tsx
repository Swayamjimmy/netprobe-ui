"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Hop {
  ttl: number;
  ip: string;
  host?: string;
  latency_ms: number;
  mappable?: boolean;
  is_origin?: boolean;
  geo?: {
    lat: number;
    lon: number;
    city: string;
    country: string;
    isp: string;
  };
}

export default function TracerouteMap({ hops }: { hops: Hop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const markersRef = useRef<maplibregl.Marker[]>([]);

  // MAP INIT
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [78.9629, 22.5937],
      zoom: 2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      console.log("Map loaded");
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ROUTE UPDATE
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Filter valid hops
    const validHops = hops
      .filter(
        (hop) =>
          hop.geo &&
          typeof hop.geo.lat === "number" &&
          typeof hop.geo.lon === "number" &&
          !Number.isNaN(hop.geo.lat) &&
          !Number.isNaN(hop.geo.lon)
      )
      .sort((a, b) => a.ttl - b.ttl);

    if (validHops.length === 0) {
      console.log("No valid hops");
      return;
    }

    // Create route coordinates
    const coordinates: [number, number][] = validHops.map((hop) => [
      hop.geo!.lon,
      hop.geo!.lat,
    ]);

    // Remove old route layer safely
    if (map.getLayer("route-line")) {
      map.removeLayer("route-line");
    }

    if (map.getSource("route-source")) {
      map.removeSource("route-source");
    }

    // Add route source
    map.addSource("route-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    });

    // Add route line
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route-source",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#10b981",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });

    // Add markers
    validHops.forEach((hop) => {
      const markerEl = document.createElement("div");

      markerEl.style.width = hop.is_origin ? "16px" : "12px";
      markerEl.style.height = hop.is_origin ? "16px" : "12px";
      markerEl.style.borderRadius = "9999px";

      markerEl.style.backgroundColor = hop.is_origin
        ? "#3b82f6"
        : hop.latency_ms > 100
        ? "#ef4444"
        : "#10b981";

      markerEl.style.border = "2px solid white";

      markerEl.style.boxShadow =
        "0 0 12px rgba(16, 185, 129, 0.8)";

      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
      }).setHTML(`
        <div style="color:black; min-width:180px">
          <div style="font-weight:bold; margin-bottom:6px">
            ${
              hop.is_origin
                ? "Client Origin"
                : `Hop ${hop.ttl}`
            }
          </div>

          <div>${hop.ip}</div>

          <div>
            ${hop.geo?.city || "Unknown"},
            ${hop.geo?.country || ""}
          </div>

          <div style="margin-top:4px">
            ${hop.latency_ms.toFixed(1)} ms
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({
        element: markerEl,
      })
        .setLngLat([hop.geo!.lon, hop.geo!.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (coordinates.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();

      coordinates.forEach((coord) => {
        bounds.extend(coord);
      });

      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 4,
        duration: 1500,
      });
    } else {
      map.flyTo({
        center: coordinates[0],
        zoom: 4,
      });
    }
  }, [hops]);

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-xl overflow-hidden"
      style={{
        height: "500px",
      }}
    />
  );
}