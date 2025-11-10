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
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Header />
      {alerts && <AlertBar alerts={alerts as any} />}
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Добро пожаловать в <span className="text-[#ff7a59]">Animal Family</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Animal Family — уютное пространство для владельцев животных внутри Telegram.
            Создавайте объявления, делитесь историями и заботьтесь о своих хвостах вместе с сообществом.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
            >
              Открыть ленту объявлений
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex items-center rounded-full bg-[#ffe2cf] px-4 py-2 text-xs font-medium text-[#c95b3d]"
            >
              Создать объявление
            </Link>
            <Link
              href="/passport/new"
              className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-800"
            >
              Цифровой паспорт питомца
            </Link>
          </div>
        </section>

        <AdBanner {...(banner ?? {})} />

        <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Контакты</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>
              Официальный бот: <span className="font-medium">@AnimalFamilyBot</span>
            </li>
            <li>Поддержка: support@animal.family (пример)</li>
            <li>Сайт: animal.family</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
