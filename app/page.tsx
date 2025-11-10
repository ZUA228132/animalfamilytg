import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { AlertBar } from '@/components/AlertBar';
import { AdBanner } from '@/components/AdBanner';
import Link from 'next/link';

export default async function HomePage() {
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, title, message')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: banner } = await supabase
    .from('ad_banner')
    .select('title, body, link_url, image_url, bg_color')
    .limit(1)
    .maybeSingle();

  const safeBanner = banner
    ? {
        title: banner.title,
        subtitle: banner.body,
        link_url: banner.link_url,
        image_url: banner.image_url,
        bg_color: banner.bg_color
      }
    : {};

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <AlertBar alerts={alerts || []} />

        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Animal Family
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Уютное пространство для владельцев животных внутри Telegram. Создавайте объявления,
            цифровые паспорта питомцев и находите друг друга по городу.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-[13px]">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 font-medium text-white"
            >
              Открыть ленту объявлений
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex items-center rounded-full bg-[#ffe2cf] px-4 py-2 font-medium text-slate-900"
            >
              Создать объявление
            </Link>
            <Link
              href="/passport/new"
              className="inline-flex items-center rounded-full bg-[#ffd1e3] px-4 py-2 font-medium text-slate-900"
            >
              Паспорт питомца
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-900"
            >
              Профиль
            </Link>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
          <div className="mb-1 text-sm font-semibold text-slate-900">
            Рекламное место свободно
          </div>
          <p>
            Здесь может быть ваша реклама или партнёрский проект. Настройка баннера доступна в админ-панели.
          </p>
        </section>

        <AdBanner {...safeBanner} />

        <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Контакты</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>
              Официальный бот: <span className="font-medium">@AnimalFamilyBot</span>
            </li>
            <li>Админ: @aries_nik (Telegram)</li>
            <li>Поддержка: support@animal.family (пример)</li>
            <li>Сайт: animal.family</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
