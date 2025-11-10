'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

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

type ViewMode = 'view' | 'edit';

export default function PassportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>('view');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [vaccinations, setVaccinations] = useState('');
  const [allergies, setAllergies] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data, error } = await supabase
        .from('pet_passports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(error);
      } else if (data) {
        const p = data as Passport;
        setPassport(p);
        setName(p.name || '');
        setSpecies(p.species || '');
        setBreed(p.breed || '');
        setAge(p.age_years != null ? String(p.age_years) : '');
        setVaccinations(p.vaccinations || '');
        setAllergies(p.allergies || '');
      }
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!passport) return;
    setSaving(true);
    setMessage(null);
    hapticImpact('medium');

    const { error } = await supabase
      .from('pet_passports')
      .update({
        name,
        species,
        breed,
        age_years: age ? Number(age) : null,
        vaccinations,
        allergies
      })
      .eq('id', passport.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage('Не удалось сохранить изменения.');
      hapticError();
    } else {
      setMessage('Изменения сохранены.');
      hapticSuccess();
      setMode('view');
      setPassport((p) =>
        p
          ? {
              ...p,
              name,
              species,
              breed,
              age_years: age ? Number(age) : null,
              vaccinations,
              allergies
            }
          : p
      );
    }
  }

  async function handleShare() {
    if (!passport) return;
    hapticImpact('light');
    const url = window.location.href;
    const text = `Паспорт питомца ${passport.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text, url });
      } catch (e) {
        console.warn(e);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setMessage('Ссылка на паспорт скопирована.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
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
          <h1 className="text-lg font-semibold text-slate-900">
            Паспорт питомца
          </h1>
          <div className="w-16" />
        </div>

        {loading && (
          <p className="text-xs text-slate-500">Загрузка…</p>
        )}

        {!loading && !passport && (
          <p className="text-xs text-slate-500">
            Паспорт не найден.
          </p>
        )}

        {!loading && passport && (
          <div className="space-y-4">
            {/* Верхняя премиум-карточка */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ffe2cf] via-[#ffd1e3] to-[#e3f0ff] p-5 shadow-md">
              <div className="pointer-events-none absolute -right-10 top-[-40px] h-32 w-32 rounded-full bg-white/40 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 bottom-[-40px] h-32 w-32 rounded-full bg-white/30 blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  {passport.pet_photo_url ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#ffb899] to-[#ff7a59] opacity-60 blur-sm" />
                      <img
                        src={passport.pet_photo_url}
                        alt={passport.name}
                        className="relative h-24 w-24 rounded-3xl border border-white/80 object-cover shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 text-3xl font-semibold text-[#ff7a59] shadow-md">
                      {passport.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-base font-semibold text-slate-900">
                        {passport.name}
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        DIGITAL PASS
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">
                        {passport.species || 'Вид не указан'}
                      </span>
                      {passport.breed && (
                        <span className="rounded-full bg-white/70 px-2 py-1 text-slate-700">
                          {passport.breed}
                        </span>
                      )}
                      <span className="rounded-full bg-white/70 px-2 py-1 text-slate-700">
                        {passport.age_years != null
                          ? `${passport.age_years} лет`
                          : 'Возраст не указан'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 text-[11px] text-slate-700">
                  <div className="rounded-2xl bg-white/80 px-3 py-2">
                    <div className="font-semibold text-slate-900">Прививки</div>
                    <div className="mt-1 text-slate-700">
                      {passport.vaccinations || 'Не указано'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-2">
                    <div className="font-semibold text-slate-900">Аллергии</div>
                    <div className="mt-1 text-slate-700">
                      {passport.allergies || 'Нет данных'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 font-medium text-white"
                >
                  Поделиться паспортом
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticImpact('light');
                    setMode(mode === 'view' ? 'edit' : 'view');
                  }}
                  className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 font-medium text-slate-800"
                >
                  {mode === 'view' ? 'Редактировать данные' : 'Отменить редактирование'}
                </button>
              </div>
            </section>

            {/* Блок с подробными данными / редактированием */}
            {mode === 'edit' ? (
              <form
                className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
                onSubmit={handleSave}
              >
                <h2 className="text-sm font-semibold text-slate-900">
                  Редактировать данные
                </h2>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Имя питомца
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Вид</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Порода</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Возраст (лет)
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Прививки
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                      value={vaccinations}
                      onChange={(e) => setVaccinations(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Аллергии</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
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
                  {saving ? 'Сохраняем…' : 'Сохранить изменения'}
                </button>
              </form>
            ) : (
              <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm text-xs text-slate-700">
                <h2 className="text-sm font-semibold text-slate-900">
                  Подробная информация
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Имя питомца
                    </div>
                    <div className="mt-0.5 text-sm text-slate-900">{passport.name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Вид</div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {passport.species || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Порода</div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {passport.breed || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Возраст (лет)
                    </div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {passport.age_years != null
                        ? passport.age_years
                        : 'Не указано'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Прививки
                    </div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {passport.vaccinations || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Аллергии
                    </div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {passport.allergies || 'Нет данных'}
                    </div>
                  </div>
                </div>
                {message && (
                  <p className="mt-1 text-xs text-slate-700">{message}</p>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
