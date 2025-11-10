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
    <div className="min-h-screen bg-[url('/fon.png')] bg-cover bg-center">
      <div className="min-h-screen bg-[#f9f4f0]/85">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <AlertBar alerts={alerts || []} />

        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Animal Family
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Уютное пространство для владельцев животных внутри Telegram. Объявления, цифровые паспорта
            и безопасная связь через Telegram.
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
              href="/passport"
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

        {/* Рекламный баннер с ИИ-ветеринаром Степаном */}
        <section className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#e0ecff] via-[#ffd1e3] to-[#ffe2cf] p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-3xl">
                🐶
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  ИИ-ветеринар Степан
                </h2>
                <p className="mt-1 text-[11px] text-slate-700">
                  Задавайте вопросы об уходе, питании и здоровье питомцев. Степан подскажет направление и
                  поможет сориентироваться.
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-start gap-2 sm:items-end">
              <Link
                href="/vet"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
              >
                Спросить Степана
              </Link>
              <p className="max-w-xs text-[10px] text-slate-600 text-left sm:text-right">
                Важно: ответы Степана носят рекомендательный характер и не заменяют очный приём
                у ветеринарного врача. Полный доступ к чату — по премиум-подписке.
              </p>
            </div>
          </div>
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
    </div>
  );
}
