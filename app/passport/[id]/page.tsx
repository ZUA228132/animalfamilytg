'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';
import { useTelegramUser } from '@/components/TelegramProvider';

type Passport = {
  id: string;
  owner_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  age_years: number | null;
  vaccinations: string | null;
  allergies: string | null;
  pet_photo_url: string | null;
  is_verified: boolean | null;
};

type OwnerProfile = {
  id: string;
  tg_id: number;
  tg_username: string | null;
  full_name: string | null;
};

type ViewMode = 'view' | 'edit';

function computeAgeLabel(birthDate: string | null, ageYearsFallback: number | null): string {
  if (birthDate) {
    const d = new Date(birthDate);
    if (!Number.isNaN(d.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - d.getFullYear();
      const mDiff = now.getMonth() - d.getMonth();
      if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) {
        years -= 1;
      }
      if (years < 0) years = 0;
      if (years === 0) {
        let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (now.getDate() < d.getDate()) months -= 1;
        if (months < 0) months = 0;
        if (months <= 1) return 'Меньше месяца';
        if (months < 12) return `${months} мес.`;
      }
      return `${years} лет`;
    }
  }
  if (ageYearsFallback != null) {
    return `${ageYearsFallback} лет`;
  }
  return 'Возраст не указан';
}

export default function PassportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const tgUser = useTelegramUser();

  const [passport, setPassport] = useState<Passport | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>('view');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [vaccinations, setVaccinations] = useState('');
  const [allergies, setAllergies] = useState('');

  const canEdit = useMemo(() => {
    if (!passport || !owner || !tgUser) return false;
    return owner.tg_id === tgUser.id;
  }, [passport, owner, tgUser]);

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
        setBirthDate(p.birth_date || '');
        setVaccinations(p.vaccinations || '');
        setAllergies(p.allergies || '');

        if (p.owner_id) {
          const { data: ownerRow, error: ownerError } = await supabase
            .from('profiles')
            .select('id, tg_id, tg_username, full_name')
            .eq('id', p.owner_id)
            .maybeSingle();

          if (ownerError) {
            console.error(ownerError);
          } else if (ownerRow) {
            setOwner(ownerRow as any);
          }
        }
      }
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!passport || !canEdit) return;
    setSaving(true);
    setMessage(null);
    hapticImpact('medium');

    let ageYears: number | null = null;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!Number.isNaN(d.getTime())) {
        const now = new Date();
        ageYears = now.getFullYear() - d.getFullYear();
        const mDiff = now.getMonth() - d.getMonth();
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) {
          ageYears -= 1;
        }
        if (ageYears < 0) ageYears = 0;
      }
    }

    const { error } = await supabase
      .from('pet_passports')
      .update({
        name,
        species,
        breed,
        birth_date: birthDate || null,
        age_years: ageYears,
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
              birth_date: birthDate || null,
              age_years: ageYears,
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
    const ownerPart = owner?.tg_username ? `\nВладелец: @${owner.tg_username}` : '';
    const text = `Паспорт питомца ${passport.name}${ownerPart}`;

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

  const ageLabel = computeAgeLabel(passport?.birth_date || null, passport?.age_years ?? null);

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
                      {passport.is_verified && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3182f6] text-[10px] font-bold text-white">
                          ✓
                        </span>
                      )}
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
                        {ageLabel}
                      </span>
                    </div>
                    {owner && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
                        <span className="text-slate-600">Владелец:</span>
                        {owner.tg_username ? (
                          <a
                            href={`https://t.me/${owner.tg_username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 font-medium text-slate-800"
                          >
                            @{owner.tg_username}
                          </a>
                        ) : (
                          <span className="rounded-full bg-white/70 px-2 py-0.5">
                            {owner.full_name || 'Профиль владельца'}
                          </span>
                        )}
                      </div>
                    )}
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
              {passport.is_verified && (
                <p className="relative mt-3 text-[11px] text-slate-700">
                  Владелец подтвердил данные паспорта документами. Информация носит
                  ознакомительный характер и не заменяет консультацию ветеринара.
                </p>
              )}
              <div className="relative mt-4 flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 font-medium text-white"
                >
                  Поделиться паспортом
                </button>
                {canEdit && (
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
                )}
              </div>
            </section>

            {canEdit && mode === 'edit' ? (
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
                      Дата рождения
                    </label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
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
                      Возраст
                    </div>
                    <div className="mt-0.5 text-sm text-slate-900">
                      {ageLabel}
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
                {owner && (
                  <div className="mt-1 text-[11px] text-slate-600">
                    Владелец:{' '}
                    {owner.tg_username ? (
                      <a
                        href={`https://t.me/${owner.tg_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-slate-900"
                      >
                        @{owner.tg_username}
                      </a>
                    ) : (
                      owner.full_name || 'Профиль владельца'
                    )}
                  </div>
                )}
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
