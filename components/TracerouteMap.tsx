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

// Calculate straight-line distance between two coordinates in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [78.9629, 22.5937],
      zoom: 2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

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

    if (validHops.length === 0) return;

    // Identify the origin to calculate distances
    const originHop = validHops.find((h) => h.is_origin) || validHops[0];

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
      let isSuspicious = false;

      // Physics check: ~100km per 1ms of Round Trip Time in fiber.
      // If the theoretical minimum RTT based on distance is much higher than the actual latency, it's fake.
      if (originHop && originHop.geo && hop.geo && !hop.is_origin && hop.latency_ms > 0) {
        const distanceKm = getDistanceKm(
          originHop.geo.lat,
          originHop.geo.lon,
          hop.geo.lat,
          hop.geo.lon
        );

        // We use distance / 150 to be very conservative and avoid false positives
        const theoreticalMinLatency = distanceKm / 150; 
        
        if (distanceKm > 1000 && hop.latency_ms < theoreticalMinLatency) {
          isSuspicious = true;
        }
      }

      const markerEl = document.createElement("div");
      markerEl.style.width = hop.is_origin ? "16px" : "12px";
      markerEl.style.height = hop.is_origin ? "16px" : "12px";
      markerEl.style.borderRadius = "9999px";

      // Color coding: Blue for origin, Red for high latency OR suspicious routing, Green for healthy
      markerEl.style.backgroundColor = hop.is_origin
        ? "#3b82f6"
        : (hop.latency_ms > 100 || isSuspicious)
        ? "#ef4444"
        : "#10b981";

      markerEl.style.border = "2px solid white";
      markerEl.style.boxShadow = `0 0 12px ${isSuspicious ? "rgba(239, 68, 68, 0.8)" : "rgba(16, 185, 129, 0.8)"}`;

      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
      }).setHTML(`
        <div style="color:black; min-width:200px; font-family: system-ui, sans-serif;">
          <div style="font-weight:bold; margin-bottom:6px; font-size: 1.1em;">
            ${hop.is_origin ? "Client Origin" : `Hop ${hop.ttl}`}
          </div>
          <div style="color: #4b5563; font-size: 0.9em; margin-bottom: 2px;">
            ${hop.ip}
          </div>
          <div style="font-weight: 500;">
            ${hop.geo?.city || "Unknown"}, ${hop.geo?.country || ""}
          </div>
          <div style="margin-top:8px; font-size: 1.1em; font-weight: bold; color: ${isSuspicious ? '#ef4444' : '#10b981'};">
            ${hop.latency_ms.toFixed(1)} ms
          </div>
          ${isSuspicious ? `
            <div style="margin-top:8px; font-size: 0.85em; color: #991b1b; background: #fee2e2; padding: 6px; border-radius: 6px; border: 1px solid #fca5a5;">
              <strong>⚠️ Suspicious Route:</strong> The latency is physically too low to travel to this location and back. This router is likely local, but its IP is registered here.
            </div>
          ` : ""}
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
    } else if (coordinates.length === 1) {
      map.flyTo({
        center: coordinates[0],
        zoom: 4,
      });
    }
  }, [hops]);

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-xl overflow-hidden border border-gray-800"
      style={{
        height: "500px",
      }}
    />
  );
}