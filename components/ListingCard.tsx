'use client';

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
  owner_is_premium?: boolean | null;
  pet_passport?: { name: string } | null;
  owner?: { badge: string | null } | null;
};

type Props = {
  listing: Listing;
};

const TYPE_LABELS: Record<string, string> = {
  lost: 'Потерялся',
  found: 'Нашёлся',
  adoption: 'Ищет дом',
  sale: 'Продажа',
  service: 'Услуги'
};

export function ListingCard({ listing }: Props) {
  const typeLabel =
    (listing.type && TYPE_LABELS[listing.type]) || 'Объявление';

  const created = new Date(listing.created_at);
  const createdLabel = created.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const priceLabel =
    listing.price != null ? `${listing.price.toLocaleString('ru-RU')} ₽` : null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      onClick={() => hapticImpact('light')}
      className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm active:scale-[0.99]"
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

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                {listing.title}
              </div>
              {listing.owner_is_premium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0ecff] px-2 py-0.5 text-[10px] font-medium text-[#2257c4]">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#3182f6] text-[9px] text-white">
                    ✓
                  </span>
                  Premium
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
              {listing.city && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5">
                  {listing.city}
                </span>
              )}
              <span className="rounded-full bg-slate-50 px-2 py-0.5">
                {typeLabel}
              </span>
              {listing.pet_passport?.name && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5">
                  Питомец: {listing.pet_passport.name}
                </span>
              )}
            </div>
          </div>
          {listing.owner?.badge && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {listing.owner.badge}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{createdLabel}</span>
          <div className="flex items-center gap-2">
            {priceLabel && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-900">
                {priceLabel}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-500">
              Открыть →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
