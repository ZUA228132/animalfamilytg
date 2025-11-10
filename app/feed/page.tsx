import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const { data: listings } = await supabase
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

  const safeListings = listings ?? [];

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Лента объявлений</h1>
          <Link
            href="/listings/new"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
          >
            + Новое объявление
          </Link>
        </div>
        <div className="space-y-3">
          {safeListings.length === 0 && (
            <p className="text-xs text-slate-500">Пока нет одобренных объявлений.</p>
          )}
          {safeListings.map((l: any) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </main>
    </div>
  );
}
