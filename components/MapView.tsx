'use client';

import { useEffect, useState } from 'react';

type MapViewProps = {
  onLocationChange?: (lat: number, lng: number) => void;
};

export function MapView({ onLocationChange }: MapViewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        onLocationChange?.(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, [onLocationChange]);

  return (
    <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      {coords ? (
        <>
          <div className="mb-1 text-[11px] font-medium text-slate-700">
            Текущее местоположение
          </div>
          <div>
            Широта: {coords.lat.toFixed(5)} / Долгота: {coords.lng.toFixed(5)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Координаты будут сохранены в объявлении.
          </div>
        </>
      ) : (
        <div>Определяем местоположение…</div>
      )}
    </div>
  );
}
