'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { hapticImpact } from '@/lib/telegram';

type BusinessProfile = {
  id: string;
  full_name: string | null;
  tg_username: string | null;
  avatar_url: string | null;
  city: string | null;
  is_business: boolean | null;
  business_name: string | null;
  business_description: string | null;
  business_services: string | null;
  business_contacts: string | null;
};

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const id = params?.id as string | undefined;
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, tg_username, avatar_url, city, is_business, business_name, business_description, business_services, business_contacts'
        )
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(error);
      } else if (data) {
        setProfile(data as any);
      }
      setLoading(false);
    }

    load();
  }, [params]);

  const displayName =
    profile?.business_name ||
    profile?.full_name ||
    (profile?.tg_username ? `@${profile.tg_username}` : 'Бизнес-профиль');

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

        {loading && <p className="text-xs text-slate-500">Загрузка…</p>}

        {!loading && !profile && (
          <p className="text-xs text-slate-500">Бизнес-профиль не найден.</p>
        )}

        {!loading && profile && (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe2cf] text-xl font-semibold text-[#ff7a59]">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-base font-semibold text-slate-900">
                    {displayName}
                  </h1>
                  {profile.city && (
                    <p className="text-xs text-slate-500">{profile.city}</p>
                  )}
                  {profile.tg_username && (
                    <a
                      href={`https://t.me/${profile.tg_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-[11px] font-medium text-[#ff7a59]"
                    >
                      Написать в Telegram
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              {profile.business_description && (
                <div className="sm:col-span-2">
                  <h2 className="text-xs font-semibold text-slate-900">
                    О бизнесе
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-slate-700">
                    {profile.business_description}
                  </p>
                </div>
              )}
              {profile.business_services && (
                <div>
                  <h2 className="text-xs font-semibold text-slate-900">
                    Услуги и цены
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-slate-700">
                    {profile.business_services}
                  </p>
                </div>
              )}
              {profile.business_contacts && (
                <div>
                  <h2 className="text-xs font-semibold text-slate-900">
                    Контакты
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-slate-700">
                    {profile.business_contacts}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
