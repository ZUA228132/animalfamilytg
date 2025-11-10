'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

type Profile = {
  id: string;
  tg_id: number;
  tg_username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  about: string | null;
  badge: string | null;
  role: string | null;
  is_premium: boolean | null;
  is_business: boolean | null;
  business_name: string | null;
  business_description: string | null;
  business_services: string | null;
  business_contacts: string | null;
};

export default function ProfilePage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [premiumMessage, setPremiumMessage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [premiumTapCount, setPremiumTapCount] = useState(0);

  const isAdminCandidate =
    profile && (profile.tg_id === 1046439138 || profile.tg_id === 7086128174);

  function handlePremiumTap() {
    hapticImpact('light');
    if (!isAdminCandidate) {
      return;
    }
    setPremiumTapCount((prev) => {
      const next = prev + 1;
      if (next >= 10) {
        setPremiumTapCount(0);
        router.push('/admin');
      } else {
        // через 3 секунды без нажатий счётчик обнуляем
        setTimeout(() => {
          setPremiumTapCount(0);
        }, 3000);
      }
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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

  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/u/${profile.id}`);
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    hapticImpact('medium');

    const { error } = await supabase
      .from('profiles')
      .update({
        phone: profile.phone,
        city: profile.city,
        about: profile.about,
        business_name: profile.business_name,
        business_description: profile.business_description,
        business_services: profile.business_services,
        business_contacts: profile.business_contacts
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage('Не удалось сохранить профиль.');
      hapticError();
    } else {
      setMessage('Профиль обновлён.');
      hapticSuccess();
    }
  }

  
  async function handleBuyPremium() {
    if (!profile) return;
    hapticImpact('medium');
    setPremiumMessage(null);

    const url = 'https://pay.cloudtips.ru/p/da9ad578';

    try {
      if (
        typeof window !== 'undefined' &&
        (window as any).Telegram &&
        (window as any).Telegram.WebApp &&
        typeof (window as any).Telegram.WebApp.openLink === 'function'
      ) {
        (window as any).Telegram.WebApp.openLink(url);
      } else if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }

      setPremiumMessage(
        'После оплаты премиума отправьте чек админу @aries_nik, и он вручную активирует подписку.'
      );
      hapticSuccess();
    } catch (error) {
      console.error(error);
      setPremiumMessage('Не удалось открыть платёжную страницу. Попробуйте позже.');
      hapticError();
    }
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
          <h1 className="text-lg font-semibold text-slate-900">Профиль</h1>
          <div className="w-16" />
        </div>

        {loading && <p className="text-xs text-slate-500">Загрузка…</p>}

        {!loading && !user && (
          <p className="text-xs text-slate-500">
            Telegram-пользователь не найден. Откройте приложение из Telegram.
          </p>
        )}

        {!loading && user && (
          <form
            className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
            onSubmit={handleSave}
          >
            <div className="flex items-center gap-3">
              {profile?.avatar_url || user.photo_url ? (
                <img
                  src={profile?.avatar_url || user.photo_url!}
                  alt="avatar"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe2cf] text-sm font-semibold text-[#ff7a59]">
                  {user.first_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  {profile?.full_name || `${user.first_name} ${user.last_name || ''}`}
                </span>
                {user.username && (
                  <span className="text-xs text-slate-500">@{user.username}</span>
                )}
                {profile?.badge && (
                  <span className="mt-1 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {profile.badge}
                  </span>
                )}
                {profile?.is_premium && (
                  <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[#e0ecff] px-2 py-0.5 text-[10px] font-medium text-[#2257c4]">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#3182f6] text-[9px] text-white">
                      ✓
                    </span>
                    Premium
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Телефон</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                placeholder="+7..."
                value={profile?.phone || ''}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, phone: e.target.value } : p))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Город</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                placeholder="Москва"
                value={profile?.city || ''}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, city: e.target.value } : p))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">О себе</label>
              <textarea
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                rows={3}
                placeholder="Коротко о себе и питомцах."
                value={profile?.about || ''}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, about: e.target.value } : p))
                }
              />
            </div>

            {profile?.is_business && (
              <div className="mt-2 rounded-3xl bg-slate-50 p-3">
                <h2 className="text-xs font-semibold text-slate-900">
                  Настройки бизнес-профиля
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Эти данные будут отображаться на отдельной странице вашего бизнеса и в объявлениях.
                </p>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Название бизнеса
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                      value={profile?.business_name || ''}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, business_name: e.target.value } : p
                        )
                      }
                      placeholder="Например, «Счастливый хвост», груминг-салон"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Описание
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                      rows={3}
                      value={profile?.business_description || ''}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, business_description: e.target.value } : p
                        )
                      }
                      placeholder="Кратко расскажите о бизнесе, специализации и преимуществах."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Услуги и цены
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                      rows={3}
                      value={profile?.business_services || ''}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, business_services: e.target.value } : p
                        )
                      }
                      placeholder="Перечислите основные услуги и примерные цены."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Контакты бизнеса
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                      rows={2}
                      value={profile?.business_contacts || ''}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, business_contacts: e.target.value } : p
                        )
                      }
                      placeholder="Телефон, адрес, сайт, график работы."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Блок премиум-подписки */}
            <div onClick={handlePremiumTap} className="rounded-3xl bg-gradient-to-r from-[#e0ecff] via-[#ffd1e3] to-[#ffe2cf] p-4 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-lg">
                  🐾
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Премиум-доступ к ИИ ветеринару Степану
                    </h2>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                      299 ₽ / месяц
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px]">
                    <li>• Чат с ИИ-ветеринаром Степаном внутри Animal Family</li>
                    <li>• Возможность размещать объявления о продаже и услугах</li>
                    <li>• Приоритетная поддержка и развитие профиля</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-slate-600">
                    Важно: ответы Степана носят рекомендательный характер и не заменяют очный приём
                    у ветеринарного врача.
                  </p>
                  {premiumMessage && (
                    <p className="mt-1 text-[11px] text-slate-700">{premiumMessage}</p>
                  )}
                  <div className="mt-3">
                    {profile?.is_premium ? (
                      <div className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white">
                        Премиум активен
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBuyPremium}
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-medium text-white"
                      >
                        Купить премиум за 299 ₽
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Блок про верификацию питомцев */}
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
              <div className="mb-1 font-semibold text-slate-900">
                Верификация питомцев
              </div>
              <p className="mb-1">
                Чтобы получить синюю галочку в паспорте питомца, свяжитесь с админом и
                отправьте подтверждающие документы.
              </p>
              <a
                href="https://t.me/aries_nik"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white"
              >
                Написать админу @aries_nik
              </a>
            </div>

                        {shareUrl && (
              <div className="mt-3 rounded-3xl bg-slate-50 p-3 text-xs">
                <h2 className="text-xs font-semibold text-slate-900">
                  Публичный профиль
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Этой ссылкой можно делиться — на ней отображается ваш открытый профиль и отзывы.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none"
                    value={shareUrl}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(shareUrl);
                        }
                        hapticSuccess();
                        setMessage('Ссылка на профиль скопирована.');
                      } catch (e) {
                        console.error(e);
                        hapticError();
                      }
                    }}
                    className="inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-[11px] font-medium text-white"
                  >
                    Копировать
                  </button>
                </div>
              </div>
            )}

            {message && (
              <p className="text-xs text-slate-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
