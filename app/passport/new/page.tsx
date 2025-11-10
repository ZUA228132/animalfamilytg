'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useTelegramUser } from '@/components/TelegramProvider';
import { hapticImpact, hapticSuccess, hapticError, hapticWarning } from '@/lib/telegram';

const SPECIES_OPTIONS = [
  'Собака',
  'Кошка',
  'Птица',
  'Грызун',
  'Рептилия',
  'Рыба',
  'Другое'
];

const VACCINATION_OPTIONS = [
  'Не указано',
  'Бешенство',
  'Комплексная вакцина',
  'Чумка / парвовирус',
  'Вакцина от клещей',
  'Другое'
];

const ALLERGY_OPTIONS = [
  'Нет аллергий',
  'Пыльца',
  'Пыль',
  'Курица',
  'Говядина',
  'Зерновые',
  'Молочные продукты',
  'Укусы насекомых',
  'Другое'
];

function getAgeYearsFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const mDiff = now.getMonth() - d.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) {
    years -= 1;
  }
  return years < 0 ? null : years;
}

export default function NewPassportPage() {
  const router = useRouter();
  const user = useTelegramUser();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [vaccinations, setVaccinations] = useState('');
  const [allergies, setAllergies] = useState('');
  const [phone, setPhone] = useState('+7');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    hapticImpact('medium');

    if (!user) {
      setMessage('Ошибка: Telegram-пользователь не определен.');
      hapticError();
      return;
    }
    if (!name) {
      setMessage('Укажите имя питомца.');
      hapticWarning();
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('tg_id', user.id)
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.error(profileError);
      setIsSubmitting(false);
      setMessage('Ошибка профиля пользователя.');
      hapticError();
      return;
    }

    const profile = profiles[0];
    let petPhotoUrl: string | null = null;

    if (photoFile) {
      try {
        const path = `pet-${profile.id}-${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('pets')
          .upload(path, photoFile);

        if (uploadError) {
          console.error('Upload error', uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from('pets')
            .getPublicUrl(path);
          petPhotoUrl = publicData.publicUrl;
        }
      } catch (err) {
        console.error('Unexpected upload error', err);
      }
    }

    const ageYears = getAgeYearsFromBirthDate(birthDate);

    const { error } = await supabase.from('pet_passports').insert({
      owner_id: profile.id,
      name,
      species,
      breed,
      birth_date: birthDate || null,
      age_years: ageYears,
      vaccinations,
      allergies,
      pet_photo_url: petPhotoUrl
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Ошибка при создании паспорта. Подробности в консоли браузера.');
      hapticError();
    } else {
      setMessage('Паспорт создан.');
      hapticSuccess();
      setTimeout(() => {
        router.push('/passport');
      }, 1200);
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
          <h1 className="text-lg font-semibold text-slate-900">
            Цифровой паспорт питомца
          </h1>
          <div className="w-16" />
        </div>
        <form
          className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-xs font-medium text-slate-700">Фото питомца</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full text-xs text-slate-600"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhotoFile(file);
                if (file) hapticImpact('light');
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Имя питомца</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Боня"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Вид</label>
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                <option value="">Выберите вид</option>
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Порода</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Французский бульдог"
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
              <p className="mt-1 text-[10px] text-slate-500">
                Возраст будет рассчитан автоматически на карточке паспорта.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Телефон владельца</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7..."
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Прививки</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
              value={vaccinations}
              onChange={(e) => setVaccinations(e.target.value)}
            >
              <option value="">Выберите основную прививку</option>
              {VACCINATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Аллергии</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            >
              <option value="">Выберите основную аллергию</option>
              {ALLERGY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p className="text-xs text-slate-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Сохраняем…' : 'Создать паспорт'}
          </button>
        </form>
      </main>
    </div>
  );
}
