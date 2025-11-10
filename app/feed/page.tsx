'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';
import { hapticImpact } from '@/lib/telegram';

type Listing = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  type: string | null;
  created_at: string;
  status: string;
  contact_tg_username: string | null;
  image_url: string | null;
  pet_passport?: { name: string } | null;
  owner?: { badge: string | null } | null;
};

type SortBy = 'date_desc' | 'price_asc' | 'price_desc' | 'city' | 'type';

export default function FeedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          id,
          title,
          description,
          city,
          price,
          type,
          status,
          created_at,
          contact_tg_username,
          image_url,
          pet_passport:pet_passport_id(name),
          owner:owner_id(badge)
        `
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Feed load error', error);
        setError(error.message || 'Не удалось загрузить объявления.');
      } else {
        setListings((data as any) || []);
      }
      setLoading(false);
    }

    load();
  }, []);

  const sortedAndFiltered = useMemo(() => {
    let arr = [...listings];

    if (cityFilter.trim()) {
      arr = arr.filter((l) =>
        (l.city || '').toLowerCase().includes(cityFilter.trim().toLowerCase())
      );
    }

    arr.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case 'price_desc':
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        case 'city':
          return (a.city || '').localeCompare(b.city || '', 'ru');
        case 'type':
          return (a.type || '').localeCompare(b.type || '', 'ru');
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return arr;
  }, [listings, sortBy, cityFilter]);

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => hapticImpact('light')}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Лента объявлений</h1>
          <Link
            href="/listings/new"
            onClick={() => hapticImpact('light')}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
          >
            + Новое объявление
          </Link>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Сортировка:</span>
            <select
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs outline-none"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortBy);
                hapticImpact('light');
              }}
            >
              <option value="date_desc">По дате (новые)</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="city">По городу</option>
              <option value="type">По категории</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Город:</span>
            <input
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs outline-none"
              placeholder="Москва…"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <p className="text-xs text-slate-500">Загружаем объявления…</p>
        )}

        {error && !loading && (
          <p className="mb-2 text-xs text-rose-500">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {!loading && !error && sortedAndFiltered.length === 0 && (
            <p className="text-xs text-slate-500">
              Объявлений пока нет.
            </p>
          )}
          {sortedAndFiltered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </main>
    </div>
  );
}
