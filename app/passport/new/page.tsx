'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useTelegramUser } from '@/components/TelegramProvider';

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

export default function NewPassportPage() {
  const router = useRouter();
  const user = useTelegramUser();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [vaccinations, setVaccinations] = useState('');
  const [allergies, setAllergies] = useState('');
  const [phone, setPhone] = useState('+7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMessage('Ошибка: Telegram-пользователь не определен.');
      return;
    }
    if (!name) {
      setMessage('Укажите имя питомца.');
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
      setIsSubmitting(false);
      setMessage('Ошибка профиля пользователя.');
      return;
    }

    const profile = profiles[0];

    const { error } = await supabase.from('pet_passports').insert({
      owner_id: profile.id,
      name,
      species,
      breed,
      age_years: age ? Number(age) : null,
      vaccinations,
      allergies, // телефон пока не сохраняем в таблицу, при желании можно добавить колонку owner_phone
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Ошибка при создании паспорта.');
    } else {
      setMessage('Паспорт создан.');
      setTimeout(() => {
        router.push('/feed');
      }, 1200);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <h1 className="mb-3 text-lg font-semibold text-slate-900">
          Цифровой паспорт питомца
        </h1>
        <form
          className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
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
