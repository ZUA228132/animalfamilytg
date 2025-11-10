'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Passport = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age_years: number | null;
  vaccinations: string | null;
  allergies: string | null;
  pet_photo_url: string | null;
};

export default function MyPassportsPage() {
  const user = useTelegramUser();
  const router = useRouter();
  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tg_id', user.id)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        console.error(profileError);
        setLoading(false);
        return;
      }

      const profile = profiles[0];

      const { data: passportsData, error } = await supabase
        .from('pet_passports')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setPassports((passportsData as any) || []);
      }
      setLoading(false);
    }

    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Паспорт питомца
          </h1>
          <Link
            href="/passport/new"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
          >
            + Новый
          </Link>
        </div>

        {loading && (
          <p className="text-xs text-slate-500">Загрузка…</p>
        )}

        {!loading && passports.length === 0 && (
          <p className="text-xs text-slate-500">
            У тебя пока нет паспортов. Создай первый!
          </p>
        )}

        <div className="mt-3 space-y-3">
          {passports.map((p) => (
            <Link
              key={p.id}
              href={`/passport/${p.id}`}
              className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm"
            >
              {p.pet_photo_url ? (
                <img
                  src={p.pet_photo_url}
                  alt={p.name}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe2cf] text-sm font-semibold text-[#ff7a59]">
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <div className="text-sm font-semibold text-slate-900">
                  {p.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {p.species || 'Вид не указан'}
                  {p.breed ? ` • ${p.breed}` : ''}
                </div>
                <div className="text-[11px] text-slate-400">
                  {p.age_years != null ? `${p.age_years} лет` : 'Возраст не указан'}
                </div>
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Открыть →
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
