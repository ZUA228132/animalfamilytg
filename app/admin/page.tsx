'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TelegramProvider } from '@/components/TelegramProvider';
import { Header } from '@/components/Header';

type Listing = {
  id: string;
  title: string;
  city: string | null;
  status: string;
};

export default function AdminPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerBg, setBannerBg] = useState('');
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  async function loadData(tgUser: any) {
    if (!tgUser) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check role
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('tg_id', tgUser.id)
      .limit(1);

    if (!profiles || profiles.length === 0 || profiles[0].role !== 'admin') {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, city, status')
      .order('created_at', { ascending: false })
      .limit(50);

    setListings((listingsData as any) || []);

    const { data: banner } = await supabase
      .from('ad_banner')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (banner) {
      setBannerTitle(banner.title || '');
      setBannerSubtitle(banner.subtitle || '');
      setBannerLink(banner.link_url || '');
      setBannerBg(banner.bg_color || '');
    }

    setLoading(false);
  }

  async function changeStatus(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
  }

  async function createAlert() {
    if (!alertTitle || !alertMessage) return;
    const { error } = await supabase.from('alerts').insert({
      title: alertTitle,
      message: alertMessage,
      is_active: true
    });
    if (!error) {
      setInfo('Алерт создан.');
      setAlertTitle('');
      setAlertMessage('');
    }
  }

  async function saveBanner() {
    const { error } = await supabase.from('ad_banner').upsert({
      id: 1,
      title: bannerTitle,
      subtitle: bannerSubtitle,
      link_url: bannerLink,
      bg_color: bannerBg
    });
    if (!error) {
      setInfo('Баннер сохранён.');
    }
  }

  return (
    <TelegramProvider>
      {(user) => {
        useEffect(() => {
          loadData(user);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [user]);

        return (
          <div className="min-h-screen bg-[#f9f4f0]">
            <Header user={user} />
            <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
              {loading && <p className="text-xs text-slate-500">Загрузка…</p>}
              {!loading && isAdmin === false && (
                <p className="text-xs text-slate-500">
                  Доступ только для администраторов.
                </p>
              )}
              {!loading && isAdmin && (
                <>
                  <h1 className="mb-3 text-lg font-semibold text-slate-900">
                    Админ-панель
                  </h1>

                  {info && (
                    <p className="mb-3 text-xs text-slate-700">
                      {info}
                    </p>
                  )}

                  <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Модерация объявлений
                    </h2>
                    <div className="mt-3 space-y-2 text-xs">
                      {listings.length === 0 && (
                        <p className="text-slate-500">Нет объявлений.</p>
                      )}
                      {listings.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {l.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {l.city || 'Город не указан'} • статус: {l.status}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => changeStatus(l.id, 'approved')}
                              className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white"
                            >
                              Одобрить
                            </button>
                            <button
                              onClick={() => changeStatus(l.id, 'rejected')}
                              className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-medium text-white"
                            >
                              Отклонить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Глобальные алерты
                    </h2>
                    <div className="mt-3 space-y-2 text-xs">
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Заголовок"
                        value={alertTitle}
                        onChange={(e) => setAlertTitle(e.target.value)}
                      />
                      <textarea
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Текст сообщения"
                        rows={2}
                        value={alertMessage}
                        onChange={(e) => setAlertMessage(e.target.value)}
                      />
                      <button
                        onClick={createAlert}
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
                      >
                        Создать алерт
                      </button>
                    </div>
                  </section>

                  <section className="rounded-3xl bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Рекламный баннер
                    </h2>
                    <div className="mt-3 space-y-2 text-xs">
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Заголовок"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                      />
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Подзаголовок"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                      />
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Ссылка"
                        value={bannerLink}
                        onChange={(e) => setBannerLink(e.target.value)}
                      />
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                        placeholder="Цвет фона (например #f5e9ff)"
                        value={bannerBg}
                        onChange={(e) => setBannerBg(e.target.value)}
                      />
                      <button
                        onClick={saveBanner}
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
                      >
                        Сохранить баннер
                      </button>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        );
      }}
    </TelegramProvider>
  );
}
