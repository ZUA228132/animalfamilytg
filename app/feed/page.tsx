'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';

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
  pet_passport?: {
    name: string;
  } | null;
  owner?: {
    badge: string | null;
  } | null;
};

export default function FeedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Лента объявлений</h1>
          <Link
            href="/listings/new"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
          >
            + Новое объявление
          </Link>
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
          {!loading && !error && listings.length === 0 && (
            <p className="text-xs text-slate-500">Пока нет одобренных объявлений.</p>
          )}
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </main>
    </div>
  );
}
