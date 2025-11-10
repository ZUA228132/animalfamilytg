// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

type MapViewProps = {
  onLocationChange?: (lat: number, lng: number) => void;
};

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationSelector({
  onLocationChange
}: {
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function MapView({ onLocationChange }: MapViewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function requestGeo() {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Геолокация недоступна в этом устройстве.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        onLocationChange?.(latitude, longitude);
      },
      (err) => {
        setGeoError('Не удалось получить геопозицию. Разрешите доступ к местоположению.');
        console.warn(err);
      },
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    setIsClient(true);
    // пробуем автоматически, но без ошибок, если не получилось
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          onLocationChange?.(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [onLocationChange]);

  if (!isClient) {
    return (
      <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Загрузка карты…
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium text-slate-700">
          Укажите точку на карте (место, связанное с объявлением).
        </div>
        <button
          type="button"
          onClick={requestGeo}
          className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm"
        >
          Определить местоположение
        </button>
      </div>
      <div className="h-56 overflow-hidden rounded-2xl">
        <MapContainer
          center={coords ? [coords.lat, coords.lng] : [55.751244, 37.618423]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationSelector
            onLocationChange={(lat, lng) => {
              setCoords({ lat, lng });
              onLocationChange?.(lat, lng);
            }}
          />
          {coords && (
            <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
          )}
        </MapContainer>
      </div>
      {coords && (
        <div className="mt-2 text-[11px] text-slate-500">
          Выбранные координаты: {coords.lat.toFixed(5)} / {coords.lng.toFixed(5)}
        </div>
      )}
      {geoError && (
        <div className="mt-1 text-[11px] text-rose-500">
          {geoError}
        </div>
      )}
    </div>
  );
}
