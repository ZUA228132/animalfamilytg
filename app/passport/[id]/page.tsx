'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';

type Passport = {
  id: string;
  owner_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age_years: number | null;
  vaccinations: string | null;
  allergies: string | null;
  pet_photo_url: string | null;
};

export default function PassportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const user = useTelegramUser();

  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
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
        const p = data as any as Passport;
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
    } else {
      setMessage('Изменения сохранены.');
    }
  }

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
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {passport.pet_photo_url ? (
                  <img
                    src={passport.pet_photo_url}
                    alt={passport.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffe2cf] text-lg font-semibold text-[#ff7a59]">
                    {passport.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-base font-semibold text-slate-900">
                    {passport.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {passport.species || 'Вид не указан'}
                    {passport.breed ? ` • ${passport.breed}` : ''}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {passport.age_years != null
                      ? `${passport.age_years} лет`
                      : 'Возраст не указан'}
                  </div>
                </div>
              </div>
            </div>

            <form
              className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
              onSubmit={handleSave}
            >
              <h2 className="text-sm font-semibold text-slate-900">
                Редактировать данные
              </h2>
              <div>
                <label className="text-xs font-medium text-slate-700">Имя питомца</label>
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
                  <label className="text-xs font-medium text-slate-700">Возраст (лет)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Прививки</label>
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
                <p className="text-xs text-slate-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Сохраняем…' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
