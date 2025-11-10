// components/ListingCard.tsx
'use client';

import Link from 'next/link';

export type ListingCardListing = {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  price?: number | null;
  type?: string | null;
  created_at?: string;
  status?: string | null;
  contact_tg_username?: string | null;
  image_url?: string | null;
  pet_passport?: { name?: string | null } | null;
  owner?: { badge?: string | null } | null;
};

export type ListingCardProps = {
  listing: ListingCardListing;
};

const TYPE_LABELS: Record<string, string> = {
  sell: 'Продажа',
  buy: 'Куплю',
  service: 'Услуги',
  lost: 'Потерялся',
  found: 'Нашёлся',
};

function formatType(type?: string | null) {
  if (!type) return 'Объявление';
  return TYPE_LABELS[type] ?? type;
}

function formatPrice(price?: number | null) {
  if (price == null) return 'Цена не указана';
  if (price === 0) return 'Бесплатно';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
}

export function ListingCard({ listing }: ListingCardProps) {
  const {
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
    pet_passport,
    owner,
  } = listing;

  const showVerified = Boolean(pet_passport || owner?.badge);

  return (
    <Link
      href={`/listings/${id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:ring-slate-200"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
            Фото нет
          </div>
        )}

        {showVerified && (
          <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-[2px] text-[10px] font-medium text-sky-700">
            <span>✔</span>
            <span>Документы</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {city && <span className="truncate">{city}</span>}
              {city && <span className="text-slate-300">•</span>}
              <span className="truncate">{formatType(type)}</span>
            </div>
            <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-900">
              {title}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900">
              {formatPrice(price)}
            </div>
            {created_at && (
              <div className="text-[11px] text-slate-400">
                {formatDate(created_at)}
              </div>
            )}
          </div>
        </div>

        {description && (
          <p className="line-clamp-2 text-[11px] text-slate-500">
            {description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {status && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-[2px] text-[10px] font-medium text-slate-500">
              {status === 'active' ? 'Активно' : status}
            </span>
          )}
          {contact_tg_username && (
            <span className="inline-flex items-center rounded-full bg-[#e8f3ff] px-2 py-[2px] text-[10px] font-medium text-sky-700">
              @{contact_tg_username.replace(/^@/, '')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Есть и именованный, и default экспорт — чтобы всё работало везде
export default ListingCard;
