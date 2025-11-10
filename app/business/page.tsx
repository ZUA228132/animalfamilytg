'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

type ProfileRow = {
  id: string;
  is_business: boolean | null;
  business_name: string | null;
};

export default function BusinessLandingPage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_business, business_name')
        .eq('tg_id', user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
      } else if (data) {
        setProfile(data as any);
      }
      setLoading(false);
    }

    load();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setMessage(null);
    hapticImpact('medium');

    const { error } = await supabase.from('business_requests').insert({
      profile_id: profile.id,
      company_name: companyName,
      city,
      description,
      contacts,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Не удалось отправить заявку. Попробуйте позже.');
      hapticError();
    } else {
      setMessage('Заявка отправлена. Админ свяжется с вами в Telegram после проверки.');
      hapticSuccess();
      setCompanyName('');
      setCity('');
      setDescription('');
      setContacts('');
    }
  }

  const isBusiness = !!profile?.is_business;

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <button
          type="button"
          onClick={() => {
            hapticImpact('light');
            router.back();
          }}
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
        >
          ← Назад
        </button>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Animal Family для бизнеса
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Подключите бизнес-профиль, чтобы красиво представить свои услуги для владельцев
            питомцев: салон, ветеринарная клиника, груминг, гостиница, приют, зоомагазин и другое.
          </p>

          <ul className="mt-3 space-y-1 text-xs text-slate-700">
            <li>• Личный кабинет с редактированием услуг, цен и фотографий.</li>
            <li>• Отзывы клиентов и персональный рейтинг вашего бизнеса.</li>
            <li>• Красивый бейдж в объявлениях и отдельная страница бизнес-профиля.</li>
            <li>• Удобная связь через Telegram — клиенты пишут прямо из Animal Family.</li>
          </ul>
        </section>

        {loading && (
          <p className="mt-4 text-xs text-slate-500">Загрузка…</p>
        )}

        {!loading && !user && (
          <p className="mt-4 text-xs text-slate-500">
            Чтобы подать заявку на бизнес-профиль, откройте Animal Family как WebApp из Telegram.
          </p>
        )}

        {!loading && user && isBusiness && profile && (
          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">У вас уже есть бизнес-профиль</h2>
            <p className="mt-1 text-xs text-slate-600">
              Бизнес «{profile.business_name || 'Без названия'}» уже подключён.
            </p>
            <button
              type="button"
              onClick={() => {
                hapticImpact('light');
                router.push(`/business/${profile.id}`);
              }}
              className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
            >
              Открыть страницу бизнеса
            </button>
          </section>
        )}

        {!loading && user && !isBusiness && (
          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Заявка на подключение бизнес-профиля
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Заполните данные о вашем бизнесе. После проверки админ выдаст вам бизнес-профиль.
            </p>

            <form onSubmit={handleSubmit} className="mt-3 space-y-2 text-xs">
              <div>
                <label className="text-xs font-medium text-slate-700">Название бизнеса</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Например, «Счастливый хвост», груминг-салон"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Город</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Описание</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Кратко опишите услуги, специализацию и преимущества."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Контакты</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                  rows={2}
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  placeholder="Телефон, сайт, адрес, график работы"
                />
              </div>

              {message && (
                <p className="text-[11px] text-slate-600">{message}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
