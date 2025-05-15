"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Icon } from "leaflet";

// Fix for default marker icon in Leaflet with Next.js
const icon = new Icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

type FloodMapProps = {
  markers?: Array<{
    position: [number, number];
    name: string;
    type: "camp" | "alert" | "resource";
    details?: string;
  }>;
  center?: [number, number];
};

export default function FloodMap({ 
  markers = [], 
  center = [10.8505, 76.2711] 
}: FloodMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-full w-full">
      <MapContainer
        key={Math.random()} // Force new instance on remount
        center={center}
        zoom={8}
        className="w-full h-full rounded-lg"
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, idx) => (
          <Marker 
            key={`${marker.name}-${idx}`}
            position={marker.position}
            icon={icon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium">{marker.name}</h3>
                <p className="text-sm text-gray-600">{marker.details}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  marker.type === 'camp' ? 'bg-blue-100 text-blue-800' :
                  marker.type === 'alert' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {marker.type.toUpperCase()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 