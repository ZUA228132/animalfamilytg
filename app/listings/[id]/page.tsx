'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { hapticImpact } from '@/lib/telegram';

type Listing = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  type: string | null;
  status: string;
  created_at: string;
  contact_tg_username: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
};

const TYPE_LABELS: Record<string, string> = {
  lost: 'Потерялся',
  found: 'Нашёлся',
  adoption: 'Ищет дом',
  service: 'Услуги',
  sale: 'Продажа'
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(error);
      } else if (data) {
        setListing(data as any);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  const typeLabel =
    listing?.type && TYPE_LABELS[listing.type] ? TYPE_LABELS[listing.type] : 'Объявление';

  const yandexHref =
    listing && listing.lat != null && listing.lng != null
      ? `https://yandex.ru/maps/?ll=${listing.lng}%2C${listing.lat}&z=16`
      : null;

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              hapticImpact('light');
              router.back();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Объявление
          </h1>
          <div className="w-16" />
        </div>

        {loading && (
          <p className="text-xs text-slate-500">Загрузка…</p>
        )}

        {!loading && !listing && (
          <p className="text-xs text-slate-500">Объявление не найдено.</p>
        )}

        {!loading && listing && (
          <article className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
            {listing.image_url && (
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="max-h-72 w-full object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {listing.title}
                </h2>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {typeLabel}
                  </span>
                  {listing.city && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {listing.city}
                    </span>
                  )}
                </div>
              </div>
              {listing.price != null && (
                <div className="rounded-2xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {listing.price.toLocaleString('ru-RU')} ₽
                </div>
              )}
            </div>

            {listing.description && (
              <section className="text-sm text-slate-700">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Описание
                </h3>
                <p className="whitespace-pre-line">{listing.description}</p>
              </section>
            )}

            {(listing.lat != null && listing.lng != null) && (
              <section className="text-xs text-slate-600">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Локация
                </h3>
                <p>
                  Координаты: {listing.lat.toFixed(5)} / {listing.lng.toFixed(5)}
                </p>
                {yandexHref && (
                  <a
                    href={yandexHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-[11px] font-medium text-[#ff7a59]"
                  >
                    Открыть в Яндекс.Картах
                  </a>
                )}
              </section>
            )}

            <section className="flex items-center justify-between text-[11px] text-slate-600">
              {listing.contact_tg_username && (
                <a
                  href={`https://t.me/${listing.contact_tg_username}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => hapticImpact('light')}
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
                >
                  Написать в Telegram
                </a>
              )}
              <span className="text-[10px] text-slate-400">
                Опубликовано: {new Date(listing.created_at).toLocaleString('ru-RU')}
              </span>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
