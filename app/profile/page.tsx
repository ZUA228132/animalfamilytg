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
};

export default function ProfilePage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
        about: profile.about
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
            Telegram-пользователь не найден. Открой приложение из Telegram.
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
