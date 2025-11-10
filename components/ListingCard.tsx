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

export function ListingCard({ listing }: { listing: Listing }) {
  const createdDate = new Date(listing.created_at);
  const formattedDate = createdDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short'
  });

  const tgLink = listing.contact_tg_username
    ? `https://t.me/${listing.contact_tg_username}`
    : null;

  return (
    <article className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f3e8ff]">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Фото
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {listing.title}
          </h3>
          <span className="whitespace-nowrap text-[11px] text-slate-500">
            {formattedDate}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-600">
          {listing.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {listing.price != null && (
                <span className="text-sm font-semibold text-[#ff7a59]">
                  {listing.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
              {listing.type && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  {listing.type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {listing.city && <span>{listing.city}</span>}
              {listing.owner?.badge && (
                <span className="rounded-full bg-[#ffe2cf] px-2 py-0.5 text-[10px] font-semibold text-[#c95b3d]">
                  {listing.owner.badge}
                </span>
              )}
            </div>
          </div>
          {tgLink && (
            <a
              href={tgLink}
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white"
            >
              Написать в Telegram
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
