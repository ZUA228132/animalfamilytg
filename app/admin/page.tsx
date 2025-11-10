'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

const ALLOWED_ADMIN_TG_IDS = [1046439138, 7086128174];

type Listing = {
  id: string;
  title: string;
  city: string | null;
  status: string;
};

type PetPassportRow = {
  id: string;
  name: string;
  is_verified: boolean | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  tg_id: number;
  tg_username: string | null;
};

type BusinessRequest = {
  id: string;
  profile_id: string;
  company_name: string | null;
  city: string | null;
  description: string | null;
  contacts: string | null;
  created_at: string;
  profile_username: string | null;
};

export default function AdminPage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [petPassports, setPetPassports] = useState<PetPassportRow[]>([]);
  const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerBody, setBannerBody] = useState('');
  const [chatUrl, setChatUrl] = useState('');
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
      const isAllowedAdmin = ALLOWED_ADMIN_TG_IDS.includes(profile.tg_id);

      setDebugInfo(
        `Найден профиль: id=${profile.id}, tg_id=${profile.tg_id}, username=${
          profile.tg_username || 'нет'
        }, role=${profile.role || 'null'}, isAllowedAdmin=${isAllowedAdmin}.`
      );

      if (!isAllowedAdmin) {
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

      const { data: passportsData } = await supabase
        .from('pet_passports')
        .select('id, name, is_verified')
        .order('created_at', { ascending: false });

      setPetPassports((passportsData as any) || []);

      const { data: banner } = await supabase
        .from('ad_banner')
        .select('id, title, body')
        .limit(1)
        .maybeSingle();

      if (banner) {
        setBannerTitle(banner.title ?? '');
        setBannerBody(banner.body ?? '');
      }

      const { data: chatSettings } = await supabase
        .from('pet_chat_settings')
        .select('id, chat_url')
        .limit(1)
        .maybeSingle();

      if (chatSettings) {
        setChatUrl((chatSettings as any).chat_url ?? '');
      }

      const { data: businessData } = await supabase
        .from('business_requests')
        .select('id, profile_id, company_name, city, description, contacts, created_at, profile:profile_id(tg_username)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (businessData) {
        const mapped: BusinessRequest[] = (businessData as any).map((row: any) => ({
          id: row.id,
          profile_id: row.profile_id,
          company_name: row.company_name,
          city: row.city,
          description: row.description,
          contacts: row.contacts,
          created_at: row.created_at,
          profile_username: row.profile?.tg_username ?? null,
        }));
        setBusinessRequests(mapped);
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
    setMessage('Статус объявления обновлён.');
    hapticSuccess();

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }

  async function togglePassportVerification(id: string, current: boolean | null) {
    const next = !current;
    const { error } = await supabase
      .from('pet_passports')
      .update({ is_verified: next })
      .eq('id', id);

    if (error) {
      console.error(error);
      setMessage('Не удалось изменить верификацию питомца.');
      hapticError();
      return;
    }
    setMessage(next ? 'Галочка верификации выдана.' : 'Галочка верификации снята.');
    hapticSuccess();

    setPetPassports((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_verified: next } : p))
    );
  }

  async function approveBusinessRequest(req: BusinessRequest) {
    setMessage(null);
    hapticImpact('medium');

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        is_business: true,
        business_name: req.company_name,
        business_description: req.description,
        city: req.city,
        business_contacts: req.contacts,
      })
      .eq('id', req.profile_id);

    const { error: deleteReqError } = await supabase
      .from('business_requests')
      .delete()
      .eq('id', req.id);

    if (updateProfileError || deleteReqError) {
      console.error(updateProfileError || deleteReqError);
      setMessage('Не удалось выдать бизнес-профиль.');
      hapticError();
      return;
    }

    setBusinessRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMessage('Бизнес-профиль выдан.');
    hapticSuccess();
  }

  async function rejectBusinessRequest(req: BusinessRequest) {
    setMessage(null);
    hapticImpact('light');

    const { error } = await supabase
      .from('business_requests')
      .delete()
      .eq('id', req.id);

    if (error) {
      console.error(error);
      setMessage('Не удалось отклонить заявку.');
      hapticError();
      return;
    }

    setBusinessRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMessage('Заявка отклонена.');
    hapticSuccess();
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
          body: bannerBody,
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

  async function saveChatSettings() {
    setMessage(null);
    hapticImpact('medium');
    const { error } = await supabase
      .from('pet_chat_settings')
      .upsert(
        {
          id: 1,
          chat_url: chatUrl,
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error(error);
      setMessage('Не удалось сохранить ссылку на чат.');
      hapticError();
      return;
    }

    setMessage('Ссылка на чат сохранена.');
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
            Админ-панель доступна только владельцам проекта. Если вы считаете, что это ошибка, свяжитесь с @aries_nik.
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

        <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Верификация питомцев
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Админ вручную подтверждает реальность питомцев. Пользователи присылают документы
            админу в Telegram, после чего здесь выдаётся галочка.
          </p>
          <div className="mt-2 space-y-2 text-xs">
            {petPassports.length === 0 && (
              <p className="text-slate-500">Паспортов пока нет.</p>
            )}
            {petPassports.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className="text-[11px] text-slate-500">
                    Статус: {p.is_verified ? 'верифицирован' : 'без галочки'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    hapticImpact('light');
                    togglePassportVerification(p.id, p.is_verified ?? false);
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                    p.is_verified
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {p.is_verified ? 'Снять галочку' : 'Выдать галочку'}
                </button>
              </div>
            ))}
          </div>
        </section>

        
        <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Заявки на бизнес-профиль
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Пользователи оставляют здесь заявки на подключение бизнес-профиля. После одобрения
            у них появится кабинет с настройками бизнеса и отдельная страница.
          </p>
          <div className="mt-2 space-y-2 text-xs">
            {businessRequests.length === 0 && (
              <p className="text-slate-500">Заявок пока нет.</p>
            )}
            {businessRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.company_name || 'Без названия'}
                      </p>
                      {req.city && (
                        <p className="text-[11px] text-slate-500">{req.city}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  {req.profile_username && (
                    <a
                      href={`https://t.me/${req.profile_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-[#ff7a59]"
                    >
                      Открыть Telegram пользователя
                    </a>
                  )}
                  {req.description && (
                    <p className="text-[11px] text-slate-700 whitespace-pre-line">
                      {req.description}
                    </p>
                  )}
                  {req.contacts && (
                    <p className="text-[11px] text-slate-500 whitespace-pre-line">
                      Контакты: {req.contacts}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => approveBusinessRequest(req)}
                      className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white"
                    >
                      Выдать бизнес-профиль
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectBusinessRequest(req)}
                      className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-800"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Рекламный баннер на главной
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Здесь редактируется баннер на главной странице Animal Family.
          </p>
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

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Чат питомцев</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Здесь настраивается ссылка на общий Telegram-чат владельцев. Кнопка «Чат питомцев» на главной будет использовать эту ссылку.
          </p>
          <div className="mt-2 space-y-2 text-xs">
            <div>
              <label className="text-xs font-medium text-slate-700">Ссылка на чат</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                placeholder="https://t.me/your_chat"
                value={chatUrl}
                onChange={(e) => setChatUrl(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={saveChatSettings}
              className="mt-1 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
            >
              Сохранить ссылку
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
