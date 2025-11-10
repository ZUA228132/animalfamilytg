type AdBannerProps = {
  title?: string | null;
  subtitle?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  bg_color?: string | null;
};

export function AdBanner({ title, subtitle, link_url, image_url, bg_color }: AdBannerProps) {
  if (!title && !subtitle) return null;

  const bg = bg_color || '#f5e9ff';

  return (
    <section
      className="mt-4 rounded-3xl p-4 shadow-sm"
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-700">
              {subtitle}
            </p>
          )}
          {link_url && (
            <a
              href={link_url}
              target="_blank"
              className="mt-2 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white"
            >
              Перейти
            </a>
          )}
        </div>
        {image_url && (
          <img
            src={image_url}
            alt="ad"
            className="h-16 w-16 rounded-2xl object-cover"
          />
        )}
      </div>
    </section>
  );
}
