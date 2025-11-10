'use client';

import { useRouter } from 'next/navigation';
import { hapticImpact } from '@/lib/telegram';

const TYPE_LABELS: Record<string, string> = {
  lost: 'Потерялся',
  found: 'Нашёлся',
  adoption: 'Ищет дом',
  service: 'Услуги',
  sale: 'Продажа'
};

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
  image_url?: string | null;
  pet_passport?: {
    name: string;
  } | null;
  owner?: {
    badge: string | null;
  } | null;
};

export function ListingCard({ listing }: { listing: Listing }) {
  const typeLabel = listing.type ? TYPE_LABELS[listing.type] ?? 'Объявление' : 'Объявление';
  const router = useRouter();

  function openDetail() {
    hapticImpact('light');
    router.push(`/listings/${listing.id}`);
  }

  return (
    <div
      className="flex cursor-pointer gap-3 rounded-3xl bg-white p-3 shadow-sm transition active:scale-[0.98]"
      onClick={openDetail}
    >
      {listing.image_url ? (
        <img
          src={listing.image_url}
          alt={listing.title}
          className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-[#ffe2cf] text-xs font-medium text-[#ff7a59]">
          Без фото
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            {listing.title}
          </span>
          {listing.price != null && (
            <span className="text-sm font-semibold text-slate-900">
              {listing.price.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <div className="mb-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            {typeLabel}
          </span>
          {listing.city && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {listing.city}
            </span>
          )}
        </div>
        {listing.description && (
          <p className="line-clamp-2 text-[11px] text-slate-600">
            {listing.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-[11px]">
          {listing.contact_tg_username && (
            <a
              href={`https://t.me/${listing.contact_tg_username}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.stopPropagation(); // чтобы не срабатывало открытие карточки вторично
                hapticImpact('light');
              }}
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 font-medium text-white"
            >
              Написать в Telegram
            </a>
          )}
          {listing.owner?.badge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
              {listing.owner.badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
