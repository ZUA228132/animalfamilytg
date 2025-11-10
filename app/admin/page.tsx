'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

type Listing = {
  id: string;
  title: string;
  city: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  role: string | null;
  tg_id: number;
  tg_username: string | null;
};

export default function AdminPage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerBody, setBannerBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!user) {
        setLoading(false);
        setDebugInfo('Telegram user не найден. Откройте приложение из Telegram.');
        return;
      }
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, tg_id, tg_username')
        .eq('tg_id', user.id)
        .limit(1);

      if (profileError) {
        console.error(profileError);
        setDebugInfo('Ошибка чтения профиля: ' + profileError.message);
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setIsAdmin(false);
        setDebugInfo(
          `Профиль не найден в таблице profiles. tg_id из Telegram: ${user.id}. Создайте запись в profiles с таким tg_id и role = 'admin'.`
        );
        setLoading(false);
        return;
      }

      const profile = profiles[0] as ProfileRow;
      const role = (profile.role || '').toLowerCase().trim();
      const isAdminRole = role === 'admin';

      setDebugInfo(
        `Найден профиль: id=${profile.id}, tg_id=${profile.tg_id}, username=${
          profile.tg_username || 'нет'
        }, role=${profile.role || 'null'}.`
      );

      if (!isAdminRole) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data: listData } = await supabase
        .from('listings')
        .select('id, title, city, status')
        .order('created_at', { ascending: false });

      setListings((listData as any) || []);

      const { data: banner } = await supabase
        .from('ad_banner')
        .select('id, title, body')
        .limit(1)
        .maybeSingle();

      if (banner) {
        setBannerTitle(banner.title ?? '');
        setBannerBody(banner.body ?? '');
      }

      setLoading(false);
    }

    init();
  }, [user]);

  async function updateListingStatus(id: string, status: string) {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error(error);
      setMessage('Не удалось обновить статус объявления.');
      hapticError();
      return;
    }
    setMessage('Статус обновлён.');
    hapticSuccess();

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }

  async function saveBanner() {
    setMessage(null);
    hapticImpact('medium');
    const { error } = await supabase
      .from('ad_banner')
      .upsert(
        {
          id: 1,
          title: bannerTitle,
          body: bannerBody
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error(error);
      setMessage('Не удалось сохранить баннер.');
      hapticError();
      return;
    }

    setMessage('Баннер сохранён.');
    hapticSuccess();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f4f0]">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
          <p className="text-xs text-slate-500">Загрузка…</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
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
          <p className="mb-2 text-xs text-slate-500">
            Вам недоступна админ-панель.
          </p>
          {debugInfo && (
            <p className="text-[11px] text-slate-500">
              {debugInfo}
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              hapticImpact('light');
              router.back();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Админ-панель</h1>
          <div className="w-16" />
        </div>

        {debugInfo && (
          <p className="mb-2 text-[11px] text-slate-500">
            {debugInfo}
          </p>
        )}

        {message && (
          <p className="mb-2 text-xs text-slate-700">{message}</p>
        )}

        <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Объявления на модерации
          </h2>
          <div className="mt-2 space-y-2 text-xs">
            {listings.length === 0 && (
              <p className="text-slate-500">Нет объявлений.</p>
            )}
            {listings.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{l.title}</span>
                  <span className="text-[11px] text-slate-500">
                    {l.city || 'Город не указан'} • Статус: {l.status}
                  </span>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      hapticImpact('light');
                      updateListingStatus(l.id, 'approved');
                    }}
                    className="rounded-full bg-emerald-500 px-3 py-1 font-medium text-white"
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      hapticImpact('light');
                      updateListingStatus(l.id, 'rejected');
                    }}
                    className="rounded-full bg-rose-500 px-3 py-1 font-medium text-white"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Рекламный баннер на главной
          </h2>
          <div className="mt-2 space-y-2 text-xs">
            <div>
              <label className="text-xs font-medium text-slate-700">Заголовок</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Текст</label>
              <textarea
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                rows={3}
                value={bannerBody}
                onChange={(e) => setBannerBody(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={saveBanner}
              className="mt-1 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
            >
              Сохранить баннер
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
