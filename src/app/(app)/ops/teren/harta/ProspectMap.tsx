"use client";

// Prospect map (add-on 2 §3.5). Leaflet + OpenStreetMap tiles: no API key, no
// account, no per-view billing. Pins are coloured by status and the route's
// parking point is marked, so a morning can be planned from the car.

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export interface MapPin {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: string;
  statusLabel: string;
  href: string;
}

export interface MapPark {
  label: string;
  lat: number;
  lng: number;
}

const PIN_COLOR: Record<string, string> = {
  de_vizitat: "#9A9488",
  vizitat: "#2E6B4F",
  contactat: "#2E6B4F",
  oferta_trimisa: "#7C5A17",
  castigat: "#1F4A37",
  pierdut: "#9C3B25",
};

export function ProspectMap({ pins, parks }: { pins: MapPin[]; parks: MapPark[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current || mapRef.current) return;

      const center: [number, number] =
        pins[0] ? [pins[0].lat, pins[0].lng] : parks[0] ? [parks[0].lat, parks[0].lng] : [45.7108, 21.2372];

      const map = L.map(ref.current).setView(center, 14);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      for (const p of parks) {
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:#1E1B15;color:#F7F5F0;font:600 10px/1.6 system-ui;padding:2px 6px;border-radius:9px;white-space:nowrap">P ${p.label}</div>`,
            iconSize: [0, 0],
          }),
        }).addTo(map);
      }

      const bounds: [number, number][] = [];
      for (const pin of pins) {
        bounds.push([pin.lat, pin.lng]);
        L.circleMarker([pin.lat, pin.lng], {
          radius: 8,
          color: "#FFFFFF",
          weight: 2,
          fillColor: PIN_COLOR[pin.status] ?? "#6B665A",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${pin.label}</strong><br>${pin.statusLabel}<br><a href="${pin.href}">Deschide</a>`
          );
      }
      for (const p of parks) bounds.push([p.lat, p.lng]);
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [pins, parks]);

  return (
    <>
      {/* Leaflet's stylesheet, inlined so the build stays hermetic. */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={ref} className="h-[70dvh] w-full rounded-xl border border-line" />
    </>
  );
}
