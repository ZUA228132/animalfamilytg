// app/feed/page.tsx

import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import ListingCard, { ListingCardListing } from '@/components/ListingCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ListingRow = ListingCardListing;

async function getListings(): Promise<ListingRow[]> {
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
      created_at,
      status,
      contact_tg_username,
      image_url,
      pet_passport ( name ),
      owner:profiles ( badge )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading listings:', error);
    return [];
  }

  return (data ?? []) as ListingRow[];
}

export default async function FeedPage() {
  const listings = await getListings();

  return (
    <main className="min-h-screen bg-slate-50 pb-6">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        <Header title="Лента объявлений" />

        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                Объявления рядом с вами
              </h1>
              <p className="text-[11px] text-slate-500">
                Найдите новых хозяев, услуги и всё для питомцев
              </p>
            </div>
            <Link
              href="/listings/new"
              className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-600"
            >
              + Создать
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="mt-2 rounded-2xl bg-white p-4 text-center text-[12px] text-slate-500 shadow-sm ring-1 ring-slate-100">
            Пока нет ни одного объявления.
            <br />
            Будьте первым — создайте объявление о питомце или услуге.
          </div>
        ) : (
          <div className="mt-1 space-y-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="mt-2 text-center text-[11px] text-slate-400">
          AnimalFamily • Telegram WebApp
        </div>
      </div>
    </main>
  );
}
