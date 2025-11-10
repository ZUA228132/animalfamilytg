// components/MapView.tsx
'use client';

import React from 'react';

export type MapViewProps = {
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: any; // на случай, если где-то прокидываются ещё пропсы
};

export function MapView(props: MapViewProps) {
  const lat =
    props.latitude ??
    props.lat ??
    null;
  const lng =
    props.longitude ??
    props.lng ??
    null;

  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  const yandexHref = hasCoords
    ? `https://yandex.ru/maps/?pt=${lng},${lat}&z=17&l=map`
    : null;

  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-900">
            Местоположение питомца
          </div>
          <div className="text-[11px] text-slate-500">
            Координаты берутся из формы ниже. Карта показана для наглядности.
          </div>
        </div>
        {hasCoords && yandexHref && (
          <a
            href={yandexHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600"
          >
            Открыть в Яндекс.Картах
          </a>
        )}
      </div>

      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-200 text-[11px] text-slate-600">
        {hasCoords ? (
          <div className="text-center">
            <div>Широта: {lat}</div>
            <div>Долгота: {lng}</div>
            <div className="mt-1 text-[10px] text-slate-500">
              Точный вид карты можно открыть в Яндекс.Картах.
            </div>
          </div>
        ) : (
          <div className="text-center">
            Координаты пока не указаны.
            <br />
            Заполните поля с широтой и долготой — здесь появится превью точки.
          </div>
        )}
      </div>
    </div>
  );
}

// <–– ВАЖНО: и именованный, и default экспорт ––>
export default MapView;
